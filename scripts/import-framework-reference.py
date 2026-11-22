"""Import React API references and the TypeScript language and compiler handbook."""

import argparse
import json
import re
import tarfile
from collections import defaultdict
from pathlib import Path
from urllib.parse import quote

from reference_markdown import FENCE, definitions, normalized, paragraphs, plain

DATA = Path(__file__).resolve().parents[1] / "src/docs/data"
REACT_GROUPS = {
    "react-dom": "React DOM",
    "react-dom/client": "React DOM",
    "react-dom/hooks": "Hooks",
    "react-dom/components": "Elementos DOM",
    "react-dom/server": "Renderizado en servidor",
    "react-dom/static": "Renderizado estático",
    "rsc": "Componentes de servidor",
    "eslint-plugin-react-hooks": "Reglas de ESLint",
    "eslint-plugin-react-hooks/lints": "Reglas de ESLint",
    "react-compiler": "React Compiler",
    "react-compiler/directives": "React Compiler",
    "rules": "Reglas de React",
    "dev-tools": "React DevTools",
}
REACT_HEADINGS = {
    "parameters": "parameters", "parametros": "parameters",
    "returns": "returns", "devuelve": "returns",
    "props": "props", "propiedades": "props",
    "caveats": "caveats", "advertencias": "caveats", "consideraciones": "caveats",
    "usage": "body", "uso": "body",
}
ANCHOR = re.compile(r"\{\/\*([\w-]+)\*\/\}")
MDX = re.compile(
    r"</?(?:Intro|Note|RSC|Canary|Experimental|Deprecated|Pitfall|"
    r"InlineToc|CodeStep|CodeStepBlock|DeepDive|LearnMore|Gotcha)\b[^>]*>"
)
TS_COMPONENT = re.compile(r"^\s*</?[A-Z]\w+\b[^>]*>\s*$")
TERM = re.compile(r"^\s*[-*]\s+`([^`]+)`:\s+(.*)")
TS_HEAD = re.compile(r"^##\s+`([A-Z]\w*(?:<.*>)?)`\s*$", re.M)
TS_INTRINSIC_HEAD = re.compile(r"^###\s+`([A-Z]\w*<StringType>)`\s*$", re.M)
TS_SCOPE = {
    "The Basics": "Fundamentos de TypeScript",
    "Type Declarations": "Declaraciones de tipos",
    "Creating Types from Types": "Derivar tipos",
    "Understanding Errors": "Interpretar errores de tipos",
    "Advanced Types": "Tipos avanzados",
    "Decorators": "Decoradores",
    "Namespaces and Modules": "Espacios de nombres y módulos",
    "Namespaces": "Espacios de nombres",
    "Symbols": "Símbolos",
    "Triple-Slash Directives": "Directivas de triple barra",
    "Variable Declaration": "Declaración de variables",
    "Keyof Type Operator": "keyof",
    "Typeof Type Operator": "typeof",
    "Indexed Access Types": "Tipos de acceso indexado",
    "Conditional Types": "Tipos condicionales",
    "Mapped Types": "Tipos mapeados",
    "Template Literal Types": "Tipos de plantilla literal",
    "Generics": "Genéricos",
    "Narrowing": "Estrechamiento de tipos",
    "Everyday Types": "Tipos habituales",
    "Object Types": "Tipos de objeto",
    "More on Functions": "Tipos de función",
    "Type Compatibility": "Compatibilidad de tipos",
    "Type Inference": "Inferencia de tipos",
    "Declaration Merging": "Fusión de declaraciones",
    "Modules": "Módulos",
    "Classes": "Clases",
}
REACT_TITLES = {
    "react-compiler/compiling-libraries": "Compilar bibliotecas",
    "react-compiler/configuration": "Configuración de React Compiler",
    "react-compiler/directives": "Directivas de React Compiler",
}
TS_SUBJECTS = {
    "types": "Tipos y declaraciones",
    "utility": "Tipos de utilidad",
    "compiler": "Opciones de TSConfig",
}


def read(name):
    return json.loads((DATA / f"{name}.json").read_text())


def write(path, data):
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n")


def frontmatter(content):
    match = re.match(r"^---\r?\n(.*?)\r?\n---\r?\n", content, re.S)
    if not match:
        return {}, content
    fields = dict(re.findall(r"^([\w-]+):\s+([^\n]+)", match[1], re.M))
    return {k: v.strip().strip('"').strip("'") for k, v in fields.items()}, content[match.end():]


def read_archive(filename, prefix):
    with tarfile.open(filename, "r|gz") as archive:
        for member in archive:
            path = member.name.partition("/")[2]
            if path.startswith(prefix) and member.isfile() and path.endswith(".md"):
                yield path.removeprefix(prefix), archive.extractfile(member).read().decode("utf-8")


def react_group(path, title):
    category = path.rsplit("/", 1)[0]
    if category == "react":
        if title.startswith("<"):
            return "Componentes"
        if title.startswith("use") and title != "use":
            return "Hooks"
        return "APIs de React"
    return REACT_GROUPS.get(category)


def react_prose(document):
    sections = defaultdict(list)
    section = "intro"
    fence = None
    usage = []
    current_code = None
    for line in document.splitlines():
        delimiter = FENCE.match(line)
        if fence:
            if delimiter and delimiter[1].startswith(fence) and not delimiter[2].strip():
                if current_code:
                    snippet = "\n".join(current_code).strip()
                    if snippet and len(snippet) <= 1000:
                        usage.append(snippet)
                fence = current_code = None
            elif current_code is not None:
                current_code.append(line)
            continue
        if delimiter:
            fence = delimiter[1]
            if section == "intro" and not usage:
                current_code = []
            continue
        heading = re.match(r"^(#{2,6})\s+(.+)", line)
        if heading:
            anchor = ANCHOR.search(heading[2])
            label = anchor[1] if anchor else normalized(plain(heading[2]))
            if len(heading[1]) == 2 and label != "usage":
                section = ""
            elif label in REACT_HEADINGS:
                section = REACT_HEADINGS[label]
            elif len(heading[1]) == 4:
                section = ""
            continue
        clean = MDX.sub("", line)
        if section and not TS_COMPONENT.match(clean) and not clean.startswith(("---", "<!--", "{/*")):
            sections[section].append(clean)
    data = {}
    for section in ("intro", "body", "returns", "caveats"):
        value = paragraphs(sections[section], 4 if section != "body" else 3)
        if value:
            data[section] = value
    if usage:
        data["usage"] = usage[0]
    for section in ("parameters", "props"):
        value = []
        for line in sections[section]:
            item = TERM.match(line)
            if item:
                value.append({"label": item[1], "detail": plain(item[2])})
        value = value or definitions(sections[section])
        if not value:
            value = [{"detail": text} for text in paragraphs(sections[section], 3)]
        if value:
            data[section] = value
    return data


def framework_paths(content):
    for path, markdown in content:
        stem = path.removesuffix(".md")
        if stem.endswith("/index") or stem.casefold().endswith("readme"):
            continue
        meta, document = frontmatter(markdown)
        title = meta.get("title")
        if not title:
            continue
        data = react_prose(document)
        if not data.get("intro"):
            continue
        yield stem, title, document, data


def react_reference(english, spanish):
    path = "src/content/reference/"
    localized = {item[0]: item for item in framework_paths(read_archive(spanish, path))}
    for stem, title, document, canonical in framework_paths(read_archive(english, path)):
        group = react_group(stem, title)
        if not group:
            continue
        translation = localized.get(stem)
        if translation and not (canonical.keys() & {"parameters", "props", "returns"}).issubset(translation[3]):
            translation = None
        actual = translation[3] if translation else canonical
        locale = "es" if translation else "en-US"
        domain = "es.react.dev" if translation else "react.dev"
        environment = None
        if stem.startswith(("rsc/", "react-dom/server/", "react-dom/static/")) or "<RSC>" in document:
            environment = "Servidor"
        elif stem.startswith("react-compiler/"):
            environment = "Compilación"
        yield "react", stem, REACT_TITLES.get(stem, title), group, locale, f"https://{domain}/reference/{stem}", {
            **actual,
            **({"usage": canonical["usage"]} if "usage" in canonical else {}),
            **({"environment": environment} if environment else {}),
        }


def ts_prose(document):
    lines = []
    fence = None
    for line in document.splitlines():
        delimiter = FENCE.match(line)
        if delimiter:
            if fence and delimiter[1].startswith(fence) and not delimiter[2].strip():
                fence = None
            elif not fence:
                fence = delimiter[1]
            continue
        if not fence and not TS_COMPONENT.match(line) and not line.startswith(("#", "<!--", "---")):
            lines.append(line)
    return paragraphs(lines, 6)


def ts_reference(archive):
    root = "https://www.typescriptlang.org"
    for path, markdown in read_archive(archive, "packages/"):
        if path.startswith("tsconfig-reference/copy/en/options/"):
            option = Path(path)
            name = option.stem
            key = name
            title = name
            anchor = name
            if option.parent.name == "typeAcquisition":
                title = f"typeAcquisition.{name}"
                anchor = f"type-{name}"
                if name in {"include", "exclude"}:
                    key = title
            _, document = frontmatter(markdown)
            intro = ts_prose(document)
            if not intro:
                continue
            yield "typescript", f"config-{key}", title, TS_SUBJECTS["compiler"], "en-US", f"{root}/tsconfig/#{anchor}", {
                "intro": intro[:2],
                "body": intro[2:],
                "environment": "Compilación",
            }
        if not path.startswith(("documentation/copy/en/handbook-v2/", "documentation/copy/en/reference/")):
            continue
        meta, document = frontmatter(markdown)
        title, route = meta.get("title"), meta.get("permalink")
        if not title or not route or not route.startswith("/docs/handbook/"):
            continue
        source = root + route
        utilities = path.endswith("/Utility Types.md")
        intrinsic = path.endswith("/Template Literal Types.md")
        if utilities or intrinsic:
            headings = list((TS_INTRINSIC_HEAD if intrinsic else TS_HEAD).finditer(document))
            for index, heading in enumerate(headings):
                end = headings[index + 1].start() if index + 1 < len(headings) else len(document)
                type_name = heading[1]
                slug = re.sub(r"[^a-z0-9 _-]+", "", type_name.lower()).replace(" ", "-")
                section = re.sub(r"<blockquote[^>]*>.*?</blockquote>", "", document[heading.end():end], flags=re.S)
                intro = ts_prose(section)
                if intro:
                    yield "typescript", f"utility-{type_name.split('<')[0]}", type_name, TS_SUBJECTS["utility"], "en-US", f"{source}#{slug}", {
                        "intro": intro[:2],
                        "body": intro[2:],
                        "usage": type_name,
                    }
            if utilities:
                continue
        intro = ts_prose(document.lstrip().split("\n## ", 1)[0]) or ts_prose(document)
        if not intro:
            continue
        slug = Path(route).stem
        yield "typescript", f"types-{slug}", TS_SCOPE.get(title, title), TS_SUBJECTS["types"], "en-US", source, {
            "intro": intro[:2],
            "body": intro[2:],
        }


def identity(title):
    return title.casefold().split("<", 1)[0] if "<" in title and not title.startswith("<") else title.casefold()


def work(args):
    existing = {
        (entry["language"], identity(entry["title"])): entry
        for entry in read("quick-reference")
    }
    explanations = read("framework-explanations")
    outputs = defaultdict(list)
    items = []
    claimed = set()
    example_ids = {entry["id"] for entry in read("web-examples") if entry["language"] in {"react", "typescript"}}
    for rows in (react_reference(args.react_english, args.react_spanish), ts_reference(args.typescript)):
        for language, key, title, group, locale, source, data in rows:
            previous = None if key.startswith("config-") else existing.get((language, identity(title)))
            item_id = previous["id"] if previous else f"web-{language}-{quote(key.replace('/', '-'), safe='-')}"
            if item_id in claimed:
                continue
            claimed.add(item_id)
            title = previous["title"] if previous else title
            shard = f"{language}-{key.split('/')[0]}" if language == "react" else f"{language}-{key.split('-')[0]}"
            metadata = {
                "id": item_id, "language": language, "title": title,
                "description": group, "group": group, "source": source,
            }
            details = {**data, **explanations.get(item_id, {})}
            outputs[shard].append({**metadata, "locale": locale, "provider": language, **details})
            items.append({
                **metadata, "summary": details["intro"][0], "web": shard,
                **({"aliases": details["aliases"]} if details.get("aliases") else {}),
            })

    missing = (example_ids | set(explanations)) - claimed
    if missing:
        raise SystemExit(f"Ejemplos sin entrada: {', '.join(sorted(missing))}")
    target = DATA / "web"
    target.mkdir(exist_ok=True)
    for generated in (*target.glob("react-*.json"), *target.glob("typescript-*.json")):
        if generated.stem not in outputs:
            generated.unlink()
    for shard, entries in outputs.items():
        write(target / f"{shard}.json", entries)
    write(DATA / "framework-catalog.json", items)
    print(f"{len(items)} fichas de React y TypeScript extraídas.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("react_english", type=Path)
    parser.add_argument("react_spanish", type=Path)
    parser.add_argument("typescript", type=Path)
    work(parser.parse_args())
