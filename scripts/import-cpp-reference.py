"""Build the VCode C++20 reference against WG21 N4861."""

import argparse
from collections import defaultdict
import json
from pathlib import Path
import re
from urllib.parse import quote

from cpp_reference_context import details_for
from reference_syntax import syntax_shards

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "src" / "docs" / "data"
SOURCE = "https://timsong-cpp.github.io/cppwp/std20/"
SECTION = re.compile(r"\\rSec\d+\[([^]]+)\]")
BLOCK = re.compile(r"\\begin\{codeblock\}(.*?)\\end\{codeblock\}", re.S)
ACCESS = re.compile(r"^\s*(public|private|protected):\s*$")
CLAUSE = re.compile(r"\\(?:i?ref|tref)\{([^}]+)\}")
FUNCTION = re.compile(
    r"(operator\s*(?:\[\]|\(\)|<=>|[-+/*%=<>!&|^~,]+|[\w:]+(?:\s+\w+)?)|[~\w]+)\s*\("
)
KEYWORDS = {"explicit", "decltype", "noexcept", "requires", "alignof", "sizeof", "consteval"}
SUPPLEMENTAL = {
    "std::basic_string": ("std::string",),
    "std::basic_string_view": ("std::string_view",),
    "std::basic_regex": ("std::regex",),
    "std::basic_istream": ("std::istream",),
    "std::basic_ostream": ("std::ostream",),
    "std::basic_ifstream": ("std::ifstream",),
    "std::basic_ofstream": ("std::ofstream",),
    "std::basic_stringstream": ("std::stringstream",),
    "std::mersenne_twister_engine": ("std::mt19937", "std::mt19937_64"),
    "std::counting_semaphore": ("std::binary_semaphore",),
    "std::basic_streambuf": ("std::streambuf",),
    "std::basic_iostream": ("std::iostream",),
    "std::basic_ios": ("std::ios",),
}


def read_json(path):
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path, data):
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def sections_in(text):
    sections = list(SECTION.finditer(text))
    return {
        match[1]: text[match.end():sections[index + 1].start() if index < len(sections) - 1 else len(text)]
        for index, match in enumerate(sections)
    }


def markup(match):
    annotation = match[1]
    if "\\impdef" in annotation or "\\impldef" in annotation:
        return "/* definido por la implementación */"
    if "\\seebelow" in annotation:
        return "/* ver especificación */"
    if re.fullmatch(r"\\unspec(?:nc)?(?:\{\})?;?", annotation):
        suffix = ";" if annotation.endswith(";") else ""
        return "/* valor no especificado */" + suffix
    tokens = re.findall(r"\{([^{}]+)\}", annotation)
    return tokens[-1] if tokens else ""


def clean(line):
    return re.sub(r"@([^@]+)@", markup, line).replace("\\&", "&")


def closing_brace(code, start):
    level = 0
    for index in range(start, len(code)):
        if code[index] == "{":
            level += 1
        elif code[index] == "}":
            level -= 1
            if level == 0:
                return index
    raise ValueError("Unclosed class synopsis")


def find_type(section, name):
    class_name = re.compile(
        rf"\b(class|struct)\s+{re.escape(name)}(?:<[^;{{}}\n]*>)?\s*(?:(?:final\s*)?:[^;{{}}]+)?\{{"
    )
    for block in BLOCK.findall(section):
        defined = class_name.search(block)
        if defined is None:
            continue
        preceding = block[:defined.start()]
        template = preceding.rfind("template<")
        prefix = preceding[template:].strip() if template >= 0 else ""
        if any(delimiter in prefix for delimiter in (";", "\nnamespace ")):
            prefix = ""
        header = "\n".join(filter(None, [prefix, defined[0].removesuffix("{").strip()]))
        end = closing_brace(block, defined.end() - 1)
        return clean(header), block[defined.end():end], defined[1] == "struct"
    raise ValueError(f"No public declaration of {name} in the expected synopsis")


def member_declarations(body, public, default_section):
    field = []
    selected_section = default_section
    parentheses = 0
    braces = 0
    inline_at = None
    for raw in body.splitlines():
        line, _, comment = raw.partition("//")
        access = ACCESS.fullmatch(line)
        if access:
            public = access[1] == "public"
            continue
        local_clause = CLAUSE.search(comment)
        if not line.strip() and comment:
            selected_section = local_clause[1] if local_clause else default_section
        line = clean(line)
        for char in line.rstrip() + "\n":
            if char == "(":
                parentheses += 1
            elif char == ")":
                parentheses -= 1
            elif char == "{":
                if braces == 0 and parentheses == 0:
                    inline_at = len(field)
                braces += 1
            elif char == "}":
                braces -= 1
                if braces == 0 and inline_at is not None:
                    declaration = "".join(field[:inline_at]).strip()
                    if public and declaration:
                        yield selected_section, declaration + ";"
                    field = []
                    inline_at = None
                    continue
            field.append(char)
            if char == ";" and parentheses == 0 and braces == 0:
                declaration = "".join(field).strip()
                if public and declaration != ";":
                    yield selected_section, declaration
                field = []


def member_type(declaration, name):
    value = " ".join(declaration.split())
    # Definitions of exposition-only symbols and nested implementation helpers.
    if re.match(r"^(?:friend|class|struct|enum)\b", value) or "exposition only" in value:
        return None

    alias = re.match(r"^using\s+([A-Za-z_]\w*)\s*=", value)
    if alias:
        return "Tipo miembro", alias[1], value

    constant = re.match(
        r"^static\s+constexpr\s+.*?\s([A-Za-z_]\w*)\s*=", value
    )
    if constant and "(" not in value[:constant.end()]:
        return "Constante", constant[1], value

    for match in FUNCTION.finditer(value):
        member = match[1]
        prefix = value[:match.start()]
        if member in KEYWORDS or prefix.count("(") != prefix.count(")"):
            continue
        if prefix.rstrip().endswith("friend"):
            return None
        if member == name:
            head = value.split(" : ", 1)[0]
            return "Constructor", member, head.rstrip(";") + ";"
        if member == f"~{name}":
            return "Destructor", member, value
        if member.startswith("operator"):
            operator = member.removeprefix("operator").strip()
            member = f"operator {operator}" if operator[:1].isalpha() else f"operator{operator}"
        return "Método", member, value

    field = re.fullmatch(r"[\w:,&*<>\[\] \t]+\s([A-Za-z_]\w*)\s*(?:=[^;]+)?;", value)
    if field and not value.startswith(("typedef ", "using ")):
        return "Campo", field[1], value
    return None


def symbol_id(name, title, legacy):
    return legacy.get(title) or f"web-cpp20-{quote(name, safe='-_.!~*')}"


def build_reference(source_dir, topics, functions, syntax, manual, legacy, explanations):
    by_chapter = {}
    for topic in [*topics, *functions, *syntax]:
        chapter = topic["chapter"]
        if chapter not in by_chapter:
            by_chapter[chapter] = sections_in((source_dir / f"{chapter}.tex").read_text(encoding="utf-8"))
    approved_clauses = {section for sections in by_chapter.values() for section in sections}
    shards = defaultdict(list)
    for topic in topics:
        name = topic["name"]
        title = f"{topic['namespace']}::{name}"
        anchor = topic["section"]
        scope = f"cpp20-{topic['chapter']}"
        declaration, body, public = find_type(by_chapter[topic["chapter"]][anchor], name)
        shown = f"#include <{topic['header']}>\n\n{declaration} {{ /* … */ }};"
        shared = {
            "language": "cpp", "group": topic["group"], "locale": "es",
            "environment": "C++20", "guide": topic["lesson"],
        }
        class_id = symbol_id(title, title, legacy)
        type_aliases = SUPPLEMENTAL.get(title, ())
        cls = {
            **shared, "id": class_id, "title": title, "source": SOURCE + anchor,
            "description": f"<{topic['header']}>", "intro": [topic["summary"]],
            "usage": shown, "members": [], "aliases": [name, *type_aliases],
            **({"example": topic["example"]} if "example" in topic else {}),
        }

        grouped = defaultdict(list)
        for local_anchor, decl in member_declarations(body, public, anchor):
            member = member_type(decl, name)
            if member:
                kind, member_name, signature = member
                grouped[(kind, member_name)].append((local_anchor, signature))
        if not grouped:
            raise ValueError(f"No public members found for {title}")

        for (kind, member), variants in sorted(grouped.items(), key=lambda item: item[0][1].casefold()):
            suffix = "()" if kind in {"Método", "Constructor", "Destructor"} else ""
            member_title = f"{title}::{member}{suffix}"
            member_qualified = f"{title}::{member}"
            alternative_names = [f"{alias}::{member}{suffix}" for alias in SUPPLEMENTAL.get(title, ())]
            legacy_title = next((candidate for candidate in [member_title, *alternative_names] if candidate in legacy), member_title)
            member_id = symbol_id(member_qualified, legacy_title, legacy)
            clause = variants[0][0] if variants[0][0] in approved_clauses else anchor
            detail = {
                **shared, "id": member_id, "title": legacy_title,
                "description": f"{kind} de {title}", "intro": [],
                "source": SOURCE + clause,
                "owner": {"id": class_id, "title": title},
                "signatures": list(dict.fromkeys(signature for _, signature in variants)),
                "aliases": list(dict.fromkeys([member_qualified, member_title, *alternative_names])),
            }
            if member_id in manual:
                detail.update(manual[member_id])
                detail["group"] = topic["group"]
                detail["description"] = f"{kind} de {title}"
            if legacy_title in explanations:
                detail.update(explanations[legacy_title])
            if not detail.get("intro"):
                context = details_for(title, member, detail["signatures"])
                if context:
                    detail.update(context)
            cls["members"].append({"id": member_id, "title": member, "kind": kind})
            shards[scope].append(detail)

        shards[scope].append(cls)
        for alias in type_aliases:
            if alias not in legacy:
                continue
            shards[scope].append({
                **cls,
                "id": legacy[alias],
                "title": alias,
                "intro": [f"{alias} es una especialización de {title}."],
                "usage": "",
                "aliases": [],
                "owner": {"id": class_id, "title": title},
            })

    for function in functions:
        title = function["title"]
        chapter = function["chapter"]
        anchor = function["section"]
        if anchor not in by_chapter[chapter]:
            raise ValueError(f"Unverified C++20 section for {title}: {anchor}")
        name = title.removesuffix("()")
        scope = f"cpp20-{chapter}"
        shards[scope].append({
            "language": "cpp",
            "locale": "es",
            "environment": "C++20",
            "id": symbol_id(name, title, legacy),
            "title": title,
            "source": SOURCE + anchor,
            "description": f"<{function['header']}>",
            "group": function["group"],
            "guide": function["guide"],
            "usage": f"#include <{function['header']}>\n\n{function['usage']}",
            "intro": [function["summary"]],
            "caveats": function["caveats"],
            "aliases": [name, *function.get("aliases", [])],
            **({"example": function["example"]} if "example" in function else {}),
        })

    known_titles = {
        item["title"]: item["id"]
        for details in shards.values()
        for item in details
    }
    reference_ids = {**legacy, **known_titles}
    related = {
        item["title"]: item["related"] for item in functions if item.get("related")
    } | {
        f"{item['namespace']}::{item['name']}": item["related"]
        for item in topics if item.get("related")
    }
    for details in shards.values():
        for item in details:
            if item["title"] in related:
                item["related"] = [
                    {"id": reference_ids[name], "title": name}
                    for name in related[item["title"]]
                ]

    def syntax_source(topic):
        chapter = topic["chapter"]
        anchor = topic["section"]
        if anchor not in by_chapter[chapter]:
            raise ValueError(f"Unverified C++20 section for {topic['title']}: {anchor}")
        return SOURCE + anchor

    shards.update(syntax_shards(
        syntax, syntax_source, language="cpp", name="C++", namespace="cpp20",
        environment="C++20", references=reference_ids,
    ))

    index = []
    ids = set()
    for scope, details in shards.items():
        for item in details:
            if item["id"] in ids:
                raise ValueError(f"Duplicate C++20 reference: {item['id']}")
            ids.add(item["id"])
            entry = {
                key: item[key] for key in ("id", "title", "language", "description", "group", "source", "aliases")
            }
            entry["summary"] = item["intro"][0] if item["intro"] else item["signatures"][0]
            entry["web"] = scope
            index.append(entry)
    return index, shards


def main():
    args = argparse.ArgumentParser(description=__doc__)
    args.add_argument("source", type=Path, help="Source directory of the cplusplus/draft n4861 tag")
    parsed = args.parse_args()
    topics = read_json(DATA / "cpp-topics.json")
    functions = read_json(DATA / "cpp-functions.json")
    manual = {entry["id"]: entry for entry in read_json(DATA / "web" / "cpp-standard.json")}
    quick = [entry for entry in read_json(DATA / "quick-reference.json") if entry["language"] == "cpp"]
    legacy = {entry["title"]: entry["id"] for entry in [*quick, *manual.values()]}
    explanations = read_json(DATA / "cpp-explanations.json")
    syntax = read_json(DATA / "cpp-language-topics.json")
    index, shards = build_reference(parsed.source, topics, functions, syntax, manual, legacy, explanations)
    for scope, details in shards.items():
        write_json(DATA / "web" / f"{scope}.json", details)
    write_json(DATA / "cpp20-catalog.json", sorted(index, key=lambda item: item["title"].casefold()))
    print(f"C++20: {len(topics)} tipos, {len(syntax)} temas de sintaxis y {len(index)} entradas en {len(shards)} módulos.")


if __name__ == "__main__":
    main()
