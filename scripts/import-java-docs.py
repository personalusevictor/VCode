#!/usr/bin/env python3
"""Enrich Java SE 21 references using documentation from an OpenJDK 21 source archive."""

import argparse
from base64 import b64decode
from collections import Counter, defaultdict
from html import unescape
from html.parser import HTMLParser
import json
from pathlib import Path, PurePosixPath
import re
import subprocess
import tarfile
from tempfile import TemporaryDirectory
from zipfile import ZipFile

from java_reference_context import localized_context

DATA = Path(__file__).resolve().parents[1] / "src/docs/data"
TAGS = re.compile(
    r"^\s*@(param|return|throws|exception|deprecated|apiNote|implSpec|implNote|"
    r"see|since|author|serial\w*|hidden|provides|uses|version|spec)(?=\s|$)",
    re.MULTILINE,
)
INLINE = re.compile(r"\{@(\w+)(?:\s+([^{}]*))?\}")
SOURCE = "https://github.com/openjdk/jdk21/blob/jdk-21%2B35/src/"
API = "https://docs.oracle.com/en/java/javase/21/docs/api/"


class ParagraphText(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.parts = []

    def handle_starttag(self, tag, attrs):
        if tag in {"p", "br", "pre", "li", "tr", "blockquote", "h2", "h3", "h4"}:
            self.parts.append("\n\n")
        elif tag in {"td", "th"}:
            self.parts.append(" · ")

    def handle_endtag(self, tag):
        if tag in {"p", "pre", "li", "tr", "blockquote", "h2", "h3", "h4"}:
            self.parts.append("\n\n")

    def handle_data(self, text):
        self.parts.append(text)


def paragraphs(raw):
    def inline_text(match):
        kind, value = match[1], (match[2] or "").strip()
        if kind in {"link", "linkplain"}:
            identifier, _, label = value.partition(" ")
            return label.strip() or identifier.lstrip("#").replace("#", ".")
        if kind in {"code", "literal", "systemProperty", "index", "summary", "return"}:
            if kind == "return":
                value = "Returns " + value
            return value.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
        if kind == "value":
            return value.lstrip("#").replace("#", ".")
        return ""

    # Keep HTML tags as layout hints while escaping literal code in inline tags.
    while INLINE.search(raw):
        raw = INLINE.sub(inline_text, raw)
    parser = ParagraphText()
    parser.feed(raw)
    return [
        value
        for part in re.split(r"\n\s*\n", "".join(parser.parts))
        if (value := " ".join(unescape(part).split()).strip(" ·"))
        and re.search(r"[A-Za-z]{2}", value)
    ]


def fields(comment):
    markers = list(TAGS.finditer(comment))
    intro = paragraphs(comment[:markers[0].start()] if markers else comment)
    result = {}
    if intro:
        result["intro"] = intro[:1]
        if len(intro) > 1:
            result["body"] = intro[1:]
    for index, tag in enumerate(markers):
        end = markers[index + 1].start() if index + 1 < len(markers) else len(comment)
        value = comment[tag.end():end].strip()
        if tag[1] in {"return", "deprecated", "apiNote", "implSpec"}:
            text = paragraphs(value)
            if text:
                key = "returns" if tag[1] == "return" else "caveats"
                result.setdefault(key, []).extend(text)
        if tag[1] in {"param", "throws", "exception"}:
            parts = value.split(maxsplit=1)
            if len(parts) < 2:
                continue
            text = " ".join(paragraphs(parts[1]))
            if text:
                key = "parameters" if tag[1] == "param" else "exceptions"
                result.setdefault(key, []).append({"label": parts[0], "detail": text})
    return result


def normalized_types(text):
    text = re.sub(r"@[\w.]+(?:\([^)]*\))?\s*", "", text)
    text = re.sub(r"(?:[A-Za-z_]\w*\.)+([A-Za-z_]\w*)", r"\1", text)
    return re.sub(r"\s+", "", text).replace("...", "[]")


def signatures_by_type(entry):
    alias = entry["aliases"][0]
    name = alias.rsplit(".", 1)[-1]
    if not entry.get("owner"):
        yield (alias, "type", "", ""), None
        return
    owner = alias.rsplit(".", 1)[0]
    if not entry["title"].endswith("()"):
        yield (owner, "field", name, ""), None
        return
    for signature in entry.get("signatures", []):
        actual_name = owner.rsplit(".", 1)[-1] if name == "<init>" else name
        match = re.search(r"\b" + re.escape(actual_name) + r"\(([^()]*)\)", signature)
        if match:
            yield (owner, "call", name, normalized_types(match[1])), signature


def unambiguous_variants(entry):
    groups = defaultdict(list)
    for key, signature in signatures_by_type(entry):
        groups[key].append(signature)
    for key, signatures in groups.items():
        if len(signatures) == 1:
            yield key, signatures[0]
            continue
        arguments = {signature.partition("(")[2].partition(")")[0] for signature in signatures}
        if len(arguments) == 1:
            # javap includes bridge methods with the same arguments and a
            # wider return type. They implement one source-level operation.
            yield key, signatures[0]


def openjdk_sources(archive, directory):
    with tarfile.open(archive, "r:gz") as tar:
        for member in tar:
            path = PurePosixPath(member.name)
            parts = path.parts[1:]
            if (
                not member.isfile() or path.suffix != ".java"
                or len(parts) < 6 or parts[0] != "src"
                or parts[2:4] != ("share", "classes")
                or not parts[1].startswith("java.")
                or path.name in {"package-info.java", "module-info.java"}
            ):
                continue
            relative = Path(*parts[1:])
            dest = directory / relative
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_bytes(tar.extractfile(member).read())


def add_generated_sources(archive, directory):
    generated = {}
    with ZipFile(archive) as source:
        for original in source.namelist():
            module, _, file = original.partition("/")
            if not module.startswith("java.") or not file.endswith(".java"):
                continue
            relative = PurePosixPath(file)
            if len(relative.parts) < 2 or not all(
                re.fullmatch(r"[A-Za-z_][A-Za-z_0-9]*(?:\.java)?", piece)
                for piece in relative.parts
            ):
                continue
            path = directory / module / "share" / "classes" / file
            if path.exists():
                continue
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(source.read(original))
            generated[path.relative_to(directory).as_posix()] = module
    return generated


def load_docs(archive, java, generated_sources):
    with TemporaryDirectory() as temporary:
        directory = Path(temporary)
        openjdk_sources(archive, directory)
        if not any(directory.iterdir()):
            raise ValueError("OpenJDK archive did not contain public module sources")
        generated = add_generated_sources(generated_sources, directory) if generated_sources else {}
        command = [java, str(Path(__file__).with_name("ReadJavaDocs.java")), str(directory)]
        records = subprocess.check_output(command, text=True, encoding="utf-8")
    matches = defaultdict(list)
    for line in records.splitlines():
        owner, kind, name, types, file, doc = line.split("\t", 5)
        content = fields(b64decode(doc).decode("utf-8"))
        if content:
            if file in generated:
                package = file.split("/classes/", 1)[1].rsplit("/", 1)[0]
                class_name = owner.removeprefix(package.replace("/", ".") + ".")
                url = f"{API}{generated[file]}/{package}/{class_name}.html"
            else:
                url = SOURCE + file
            matches[owner, kind, name, normalized_types(types)].append((url, content))
    return {key: values[0] for key, values in matches.items() if len(values) == 1}


def write_json(path, entries):
    path.write_text(json.dumps(entries, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def inherited_docs(key, owner_id, parents, index, docs):
    _, kind, name, parameters = key
    if kind != "call" or name == "<init>":
        return None
    visited = {owner_id}
    frontier = set(parents.get(owner_id, []))
    while frontier:
        matches = []
        for parent in sorted(frontier - visited):
            qualified = index.get(parent, {}).get("aliases", [None])[0]
            documentation = docs.get((qualified, kind, name, parameters))
            if documentation:
                matches.append(documentation)
        if matches:
            return matches[0] if all(record == matches[0] for record in matches) else None
        visited.update(frontier)
        frontier = {
            ancestor
            for node in frontier
            for ancestor in parents.get(node, [])
            if ancestor not in visited
        }
    return None


def enum_documentation(item, parents):
    owner = item.get("owner")
    if not owner or "web-java-se-java.lang.Enum" not in parents.get(owner["id"], []):
        return None
    keys = {key[2:] for key, signature in signatures_by_type(item) if signature}
    if keys == {("values", "")}:
        return {
            "intro": [f"Devuelve las constantes de {owner['title']} en el orden en que se declararon."],
            "returns": [f"Un arreglo de {owner['title']} con todas las constantes."],
        }
    if keys == {("valueOf", "String")}:
        return {
            "intro": [f"Busca una constante de {owner['title']} a partir de su nombre exacto."],
            "parameters": [{"label": "name", "detail": "Nombre declarado de la constante. Distingue mayúsculas y minúsculas."}],
            "returns": [f"La constante correspondiente de {owner['title']}."],
            "exceptions": [
                {"label": "IllegalArgumentException", "detail": "No existe una constante con ese nombre."},
                {"label": "NullPointerException", "detail": "El nombre es null."},
            ],
        }
    return None


def update(docs):
    catalog = json.loads((DATA / "java-catalog.json").read_text())
    index = {item["id"]: item for item in catalog}
    parents = json.loads((DATA / "java-hierarchy.json").read_text())["parents"]
    totals = Counter()
    for path in sorted((DATA / "web").glob("java-se-*.json")):
        entries = json.loads(path.read_text())
        changed = False
        for item in entries:
            if any(item.get(key) for key in ("intro", "body", "parameters", "returns", "caveats", "exceptions", "overloads")):
                continue
            variants = list(unambiguous_variants(item))
            matches = [
                (signature, docs[key]) for key, signature in variants
                if key in docs
            ]
            kind = "source"
            if not matches and (details := enum_documentation(item, parents)):
                item.update(details)
                item["specification"] = "https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html#jls-8.9.3"
                index[item["id"]]["summary"] = details["intro"][0]
                totals["enum"] += 1
                changed = True
                continue
            if not matches and item.get("owner"):
                kind = "inherited"
                for key, signature in variants:
                    if not signature or " static " in signature:
                        continue
                    doc = inherited_docs(key, item["owner"]["id"], parents, index, docs)
                    if doc:
                        matches.append((signature, doc))
            if not matches:
                owner = item.get("owner", {}).get("title")
                if owner and item.get("aliases"):
                    name = item["aliases"][0].rsplit(".", 1)[-1]
                    context = localized_context(owner, name)
                    if context:
                        intro, body = context
                        item.update(intro=[intro], body=[body], locale="es")
                        index[item["id"]]["summary"] = intro
                        totals["es"] += 1
                        changed = True
                continue
            signature, (source, content) = matches[0]
            item["locale"] = "en-US"
            item["documentationSource"] = source
            if kind == "inherited":
                item["inheritedDocumentation"] = True
            if len(variants) > 1 and signature:
                item["overloads"] = [
                    {"signature": method, **fields} for method, (_, fields) in matches
                ]
                intros = {tuple(fields.get("intro", [])) for _, (_, fields) in matches}
                if len(intros) == 1 and len(matches) == len(variants):
                    item["intro"] = list(next(iter(intros)))
            else:
                item.update(content)
            if item.get("intro"):
                intro = item["intro"][0]
                first_sentence = re.match(r".{12,200}?[.!?](?=\s|$)", intro)
                index[item["id"]]["summary"] = (
                    first_sentence[0] if first_sentence else intro
                    if len(intro) <= 200 else intro[:197].rsplit(" ", 1)[0] + "…"
                )
            totals[kind] += 1
            changed = True
        if changed:
            write_json(path, entries)
    write_json(DATA / "java-catalog.json", catalog)
    print(f"Java SE 21: {sum(totals.values())} references enriched ({dict(totals)})")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("archive", type=Path)
    parser.add_argument("--java", default="java")
    parser.add_argument("--generated-sources", type=Path, help="src.zip from the matching JDK 21+35 distribution")
    args = parser.parse_args()
    update(load_docs(args.archive, args.java, args.generated_sources))


if __name__ == "__main__":
    main()
