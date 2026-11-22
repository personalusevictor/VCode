"""Turn PHP's licensed DocBook sources into structured reference entries."""

import argparse
import hashlib
import html
import json
import re
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "src" / "docs" / "data"
BASE = "https://www.php.net/manual"
NS = {"d": "http://docbook.org/ns/docbook"}
XML_ID = "{http://www.w3.org/XML/1998/namespace}id"
ENTITY = re.compile(r"&([a-zA-Z][\w.-]*);")
CDATA = re.compile(r"(<!\[CDATA\[.*?\]\]>)", re.DOTALL)
DECLARATION = re.compile(r"""<!ENTITY\s+([\w.-]+)\s+(['"])(.*?)\2\s*>""", re.DOTALL)
XML_ENTITIES = {"amp", "lt", "gt", "apos", "quot"}
LITERAL_ENTITIES = {
    "true": "true", "false": "false", "null": "null", "array": "array",
    "object": "object", "string": "string", "integer": "int", "float": "float",
    "boolean": "bool", "resource": "resource", "mixed": "mixed",
    "void": "void", "nan": "NAN", "inf": "INF", "php.ini": "php.ini",
}
SECTION_ROLES = ("description", "parameters", "returnvalues", "errors", "notes", "changelog", "seealso")
GROUPS = {
    "session": "Sesiones", "array": "Arrays", "strings": "Cadenas",
    "mbstring": "Texto Unicode", "pcre": "Expresiones regulares", "json": "JSON",
    "filesystem": "Sistema de archivos", "stream": "Flujos", "datetime": "Fechas y horas",
    "math": "Matemáticas", "password": "Contraseñas", "filter": "Validación",
    "var": "Variables y tipos", "pdo": "PDO", "hash": "Hash",
    "network": "Red", "url": "URL", "errorfunc": "Errores",
    "outcontrol": "Salida", "functions": "Funciones", "random": "Aleatoriedad",
    "language": "Clases predefinidas", "language-variables": "Variables predefinidas",
    "language-constants": "Constantes del lenguaje",
}

def compact(value):
    return " ".join((value or "").split())

def local_name(node):
    return node.tag.rsplit("}", 1)[-1]

def xml_text(node):
    if node is None:
        return ""
    result = [node.text or ""]
    for child in node:
        item = xml_text(child)
        if local_name(child) == "parameter" and item and not item.startswith("$"):
            item = "$" + item
        if local_name(child) == "function" and item and not item.endswith("()"):
            item += "()"
        result.extend((item, child.tail or ""))
    return compact("".join(result))

def entity_map(root):
    definitions = {}
    for path in [*sorted((root / "entities").glob("*.ent")), root / "language-snippets.ent"]:
        if path.is_file():
            raw = path.read_text(encoding="utf-8", errors="replace")
            for name, _, value in DECLARATION.findall(raw):
                definitions[name] = value
    definitions.update(LITERAL_ENTITIES)
    return definitions

def parse_doc(path, entities):
    def substitute(match, stack):
        name = match[1]
        if name in XML_ENTITIES:
            return match[0]
        if name.startswith(("reftitle.", "example.")):
            return ""
        if name in entities and name not in stack and len(stack) < 8:
            return ENTITY.sub(lambda nested: substitute(nested, (*stack, name)), entities[name])
        return html.escape(html.unescape(match[0])) if html.unescape(match[0]) != match[0] else ""
    raw = path.read_text(encoding="utf-8", errors="replace")
    parts = CDATA.split(raw)
    converted = "".join(
        part if index % 2 else ENTITY.sub(lambda match: substitute(match, ()), part)
        for index, part in enumerate(parts)
    )
    return ET.fromstring(converted)

def section(node, role):
    return node.find(f"d:refsect1[@role='{role}']", NS)

def paragraphs(node, *, ignored=(), limit=8):
    if node is None:
        return []
    def fragments(element):
        tag = local_name(element)
        if tag in ignored:
            return
        if tag in {"para", "simpara", "entry"} and not any(
            local_name(child) in {"itemizedlist", "orderedlist", "variablelist", "informaltable", "example", "note", "warning"}
            for child in element
        ):
            text = xml_text(element)
            if text:
                yield text
            return
        if tag == "para" and compact(element.text):
            yield compact(element.text)
        for child in element:
            yield from fragments(child)
    return list(dict.fromkeys(fragments(node)))[:limit]

def render_type(node):
    if node is None:
        return ""
    children = node.findall("d:type", NS)
    kind = node.get("class")
    if not children:
        return xml_text(node)
    separator = "&" if kind == "intersection" else "|"
    def member(child):
        text = render_type(child)
        return f"({text})" if child.get("class") == "intersection" and kind != "intersection" else text
    return separator.join(filter(None, map(member, children)))

def parameters(method):
    result = []
    for param in method.findall("d:methodparam", NS):
        name_node = param.find("d:parameter", NS)
        name = xml_text(name_node).lstrip("$")
        if not name:
            continue
        default_node = param.find("d:initializer", NS)
        record = {
            "name": "$" + name,
            "type": render_type(param.find("d:type", NS)),
            "optional": param.get("choice") == "opt" or default_node is not None,
            "variadic": param.get("rep") == "repeat",
            "byReference": name_node.get("role") == "reference" or param.get("role") == "reference",
        }
        attributes = [xml_text(attribute) for attribute in param.findall("d:modifier[@role='attribute']", NS)]
        if attributes:
            record["attributes"] = attributes
        if default_node is not None:
            record["default"] = xml_text(default_node)
        result.append(record)
    return result

def signatures(document):
    description = section(document, "description")
    eligible = {"methodsynopsis", "constructorsynopsis", "destructorsynopsis"}
    methods = (
        (child for child in description.iter() if local_name(child) in eligible)
        if description is not None else []
    )
    result = []
    for method in methods:
        name = xml_text(method.find("d:methodname", NS)).rstrip("()")
        if not name:
            continue
        rows = parameters(method)
        rendered = []
        for row in rows:
            prefix = "&" if row["byReference"] else ""
            prefix += "..." if row["variadic"] else ""
            default = f" = {row['default']}" if row.get("default") else ""
            rendered.append(f"{' '.join(row.get('attributes', []))} {row['type']} {prefix}{row['name']}{default}".strip())
        return_type = render_type(method.find("d:type", NS))
        synopsis = f"{name}({', '.join(rendered)})"
        if return_type:
            synopsis += f": {return_type}"
        result.append({
            "code": synopsis, "parameters": rows, "returnType": return_type, "name": name,
            "modifiers": [
                xml_text(modifier) for modifier in method.findall("d:modifier", NS)
                if modifier.get("role") != "attribute"
            ],
        })
    return result

def parameter_notes(node):
    if node is None:
        return {}
    result = {}
    for entry in node.findall(".//d:varlistentry", NS):
        value = paragraphs(entry.find("d:listitem", NS), limit=5)
        for term in entry.findall("d:term", NS):
            key = xml_text(term).lstrip("$")
            if key:
                result["$" + key] = value
    return result

def status_rows(node):
    if node is None:
        return []
    result = []
    for item in node.findall(".//d:listitem", NS):
        constant = item.find(".//d:constant", NS)
        value = xml_text(item)
        if constant is not None:
            token = xml_text(constant)
            if value.startswith(token) and token.isupper():
                result.append({"value": token, "meaning": value[len(token):].strip(" .:—–")})
    return result

def examples(node):
    if node is None:
        return []
    records = []
    for example in node.iter():
        if local_name(example) not in {"example", "informalexample"}:
            continue
        listing = example.find(".//d:programlisting", NS)
        if listing is None or listing.get("role", "php") != "php":
            continue
        code = "".join(listing.itertext()).strip()
        if "<?php" not in code or len(code) > 5000:
            continue
        record = {"code": code}
        title = xml_text(example.find("d:title", NS))
        if title:
            record["title"] = title
        screen = example.find(".//d:screen", NS)
        if screen is not None:
            output = "".join(screen.itertext()).strip()
            if output and len(output) <= 2600:
                record["output"] = output
        records.append(record)
    return records[:3]

def versions(root):
    result = {}
    for path in sorted((root / "reference").glob("*/versions.xml")):
        try:
            node = ET.parse(path)
        except ET.ParseError:
            continue
        for child in node.iter("function"):
            if child.get("name"):
                result[child.get("name").lower()] = child.attrib
    return result

def entries_in(root):
    for path in sorted((root / "reference").glob("*/*/*.xml")):
        if path.parent.name == "functions" or "functions" in path.parts:
            yield path
    for path in sorted((root / "reference").glob("*/*/*.xml")):
        if path.parent.name in {"functions", "examples"} or path.name in {"versions.xml", "configure.xml", "constants.xml"}:
            continue
        yield path
    yield from sorted((root / "language" / "predefined").rglob("*.xml"))

def canonical_names(node):
    return [xml_text(name).rstrip("()") for name in node.findall("d:refnamediv/d:refname", NS)]

def manual_path(node):
    return node.get(XML_ID, "").strip()

def load_primary(root, entities):
    result = {}
    failures = []
    for path in entries_in(root):
        try:
            node = parse_doc(path, entities)
        except ET.ParseError:
            failures.append(path.relative_to(root).as_posix())
            continue
        if local_name(node) != "refentry" or not manual_path(node):
            continue
        names = canonical_names(node)
        methods = signatures(node)
        purpose = node.find("d:refnamediv/d:refpurpose", NS)
        alias_target = next(
            (xml_text(child).rstrip("()") for child in (purpose if purpose is not None else []) if local_name(child) in {"function", "methodname"}),
            "",
        )
        if not names or (not methods and not alias_target):
            continue
        name = names[0]
        if "::" in name and methods and "::" in methods[0]["name"]:
            first_name = methods[0]["name"]
            if first_name != name and first_name.split("::")[0] == name.split("::")[0]:
                for method in methods:
                    if method["name"] == first_name:
                        method["code"] = name + method["code"][len(first_name):]
                        method["name"] = name
        if not re.fullmatch(r"[A-Za-z_][A-Za-z0-9_\\]*(?:::[A-Za-z_][A-Za-z0-9_]*)?", name):
            continue
        if manual_path(node) in result:
            continue
        result[manual_path(node)] = (path, node, name, methods, alias_target if not methods else "")
    return result, failures

def serialize_entry(path, english, name, methods, alias, translated, version, custom, old_id):
    locale = "en"
    prose = english
    if translated is not None and manual_path(english) == manual_path(translated):
        es_signatures = signatures(translated)
        if [method["code"] for method in es_signatures] == [method["code"] for method in methods]:
            prose = translated
            locale = "es"
    sections = {role: section(prose, role) for role in SECTION_ROLES}
    purpose = xml_text(prose.find("d:refnamediv/d:refpurpose", NS))
    version_desc = version.get("from", "")
    note_lookup = parameter_notes(sections["parameters"])
    for method in methods:
        for param in method["parameters"]:
            param["notes"] = note_lookup.get(param["name"], [])
        del method["name"]

    description = paragraphs(sections["description"], ignored=("methodsynopsis", "programlisting", "example"), limit=7)
    returns = paragraphs(sections["returnvalues"], limit=12)
    values = status_rows(sections["returnvalues"])
    output_examples = examples(section(prose, "examples"))
    if custom:
        purpose = custom.get("summary", purpose)
        description = custom.get("description", description)
        returns = custom.get("returns", returns)
        values = custom.get("returnValues", values)
        output_examples = custom.get("examples", output_examples)
        locale = "es"
    if alias:
        purpose = f"Alias de {alias}()."
        description = []
        locale = "es"
    if not purpose:
        return None
    if not description and not alias:
        description = [purpose]

    extension = path.parts[1] if path.parts[0] == "reference" else "language"
    title = f"{name}()"
    id_value = old_id or ("php-function-" + name.lower() if "::" not in name else "php-method-" + manual_path(english))
    manual_id = manual_path(english)
    related = []
    if sections["seealso"] is not None:
        related = list(dict.fromkeys(
            xml_text(link).rstrip("()")
            for link in sections["seealso"].iter()
            if local_name(link) in {"function", "methodname", "classname", "interfacename"}

        ))[:12]
    return {
        "id": id_value,
        "title": title,
        "summary": purpose,
        "extension": extension,
        "group": GROUPS.get(extension, extension),
        "locale": locale,
        "source": f"{BASE}/{locale}/{manual_id}.php",
        "sourceId": manual_id,
        "version": version_desc,
        **({"alias": alias} if alias else {}),
        "signatures": methods,
        "description": description,
        "argumentNotes": paragraphs(sections["parameters"], ignored=("variablelist", "programlisting"), limit=5) if any(method["parameters"] for method in methods) else [],
        "returns": returns,
        "returnValues": values,
        "examples": output_examples,
        "notes": (custom or {}).get("notes", paragraphs(sections["notes"], limit=6)),
        "errors": paragraphs(sections["errors"], limit=6),
        "related": (custom or {}).get("related", related),
    }

def read_if_present(path, entities):
    if not path.is_file():
        return None
    try:
        return parse_doc(path, entities)
    except ET.ParseError:
        return None


def related_names(node, limit=12):
    if node is None:
        return []
    names = (
        xml_text(element).rstrip("()")
        for element in node.iter()
        if local_name(element) in {"function", "methodname", "classname", "interfacename", "constant"}
    )
    return list(dict.fromkeys(name for name in names if name))[:limit]


def subject_id(label, name):
    normalized = name.lstrip("$").casefold().replace("\\", "-").replace("::", ".")
    return f"php-{label}-{normalized}"


def subject_record(identifier, title, label, extension, locale, source, summary, details):
    return {
        "id": identifier,
        "title": title,
        "label": label,
        "summary": summary,
        "extension": extension,
        "group": GROUPS.get(extension, extension),
        "locale": locale,
        "source": source,
        "description": details,
        "examples": [],
        "notes": [],
        "related": [],
    }


def class_declaration(node):
    synopsis = node.find("./d:partintro/d:section/d:classsynopsis", NS)
    if synopsis is None:
        return None
    headers = [
        item for item in synopsis
        if local_name(item) in {"ooclass", "oointerface", "ooenum", "ootrait"}
    ]
    if not headers:
        return None
    def header_name(header):
        return next(
            (xml_text(child) for child in header
             if local_name(child) in {"classname", "interfacename", "enumname", "traitname"}),
            "",
        )

    name = xml_text(node.find("d:titleabbrev", NS)) or header_name(headers[0])
    if not re.fullmatch(r"[A-Za-z_][A-Za-z0-9_\\]*", name):
        return None
    kind = synopsis.get("class", "class")
    labels = {"class": "Clase PHP", "interface": "Interfaz PHP", "enum": "Enumeración PHP", "trait": "Trait PHP"}
    if kind not in labels:
        return None
    modifiers = []
    relationships = {"extends": [], "implements": []}
    for header in headers:
        inherited = header_name(header)
        declarations = [xml_text(item) for item in header.findall("d:modifier", NS)]
        if inherited.casefold() == name.casefold():
            modifiers.extend(item for item in declarations if item and item not in relationships)
            continue
        relation = next((item for item in declarations if item in relationships), None)
        if relation is None:
            relation = "implements" if kind == "class" and local_name(header) == "oointerface" else "extends"
        if inherited and inherited not in relationships[relation]:
            relationships[relation].append(inherited)
    main = " ".join([*dict.fromkeys(modifiers), kind, name])
    declaration = " ".join([
        main, *(f"{relation} {', '.join(names)}" for relation, names in relationships.items() if names),
    ])
    return name, labels[kind], declaration, [*relationships["extends"], *relationships["implements"]]


def class_entries(en, es, primary_entities, localized_entities, routines, overrides):
    path_list = [
        *sorted((en / "language" / "predefined").glob("*.xml")),
        *sorted((en / "reference").glob("*/*.xml")),
    ]
    members = {}
    for routine in routines:
        prefix, separator, _ = routine["title"].partition("::")
        if separator:
            members.setdefault(prefix.casefold(), []).append(routine["id"])
    for english_path in path_list:
        english = read_if_present(english_path, primary_entities)
        if english is None or local_name(english) != "reference" or not manual_path(english).startswith("class."):
            continue
        definition = class_declaration(english)
        if definition is None:
            continue
        name, label, declaration, relationships = definition
        path = english_path.relative_to(en)
        extension = path.parts[1] if path.parts[0] == "reference" else "language"
        translated = read_if_present(es / path, localized_entities)
        page = manual_path(english)
        prose = english
        locale = "en"
        if translated is not None and manual_path(translated) == page:
            translated_intro = next(
                (section for section in translated.findall("./d:partintro/d:section", NS)
                 if manual_path(section).endswith(".intro")),
                None,
            )
            if paragraphs(translated_intro):
                prose = translated
                locale = "es"
        intro = next(
            (section for section in prose.findall("./d:partintro/d:section", NS)
             if manual_path(section).endswith(".intro")),
            None,
        )
        contents = paragraphs(intro, ignored=("example", "programlisting"), limit=10)
        custom = overrides.get(name.casefold(), {})
        summary = custom.get("summary") or (contents[0] if contents else xml_text(prose.find("d:title", NS)))
        if not summary:
            continue
        record = subject_record(
            subject_id("class", name), name, label, extension, locale,
            f"{BASE}/{locale}/{page}.php", summary,
            custom.get("description", contents[1:]),
        )
        record.update({
            "declaration": declaration,
            "members": members.get(name.casefold(), []),
            "related": relationships,
            "examples": custom.get("examples", examples(intro)),
            "notes": custom.get("notes", []),
        })
        yield record


def variable_entries(en, es, primary_entities, localized_entities, overrides):
    for english_path in sorted((en / "language" / "predefined" / "variables").glob("*.xml")):
        english = read_if_present(english_path, primary_entities)
        if english is None or english.get("role") != "variable":
            continue
        names = canonical_names(english)
        if not names or not re.fullmatch(r"\$[A-Za-z_][A-Za-z0-9_]*", names[0]):
            continue
        name = names[0]
        path = english_path.relative_to(en)
        page = manual_path(english)
        translated = read_if_present(es / path, localized_entities)
        use_spanish = translated is not None and canonical_names(translated) == names
        locale = "es" if use_spanish else "en"
        prose = translated if use_spanish else english
        custom = overrides.get(name.casefold(), {})
        summary = custom.get("summary") or xml_text(prose.find("d:refnamediv/d:refpurpose", NS))
        if not summary:
            continue
        details = paragraphs(section(prose, "description"), ignored=("programlisting", "example"), limit=10)
        record = subject_record(
            subject_id("variable", name), name, "Variable PHP", "language-variables",
            locale, f"{BASE}/{locale}/{page}.php", summary,
            custom.get("description", details),
        )
        fields = parameter_notes(section(prose, "indices"))
        record.update({
            "fields": [
                {"name": field.removeprefix("$").strip("'\""), "notes": notes}
                for field, notes in fields.items() if notes
            ],
            "examples": custom.get("examples", examples(section(prose, "examples"))),
            "notes": custom.get("notes", paragraphs(section(prose, "notes"), limit=8)),
            "related": custom.get("related", related_names(section(prose, "seealso"))),
            **({"typeName": custom["typeName"]} if "typeName" in custom else {}),
        })
        yield record


CONSTANT_NAME = re.compile(r"[A-Za-z_][A-Za-z0-9_\\]*(?:::[A-Za-z_][A-Za-z0-9_]*)?")


def constants_in(node):
    if node is None:
        return {}
    records = {}
    for item in node.findall(".//d:varlistentry", NS):
        entry = item.find("d:listitem", NS)
        details = paragraphs(entry, ignored=("example", "programlisting", "warning", "note"), limit=6)
        if not details:
            continue
        extra_notes = []
        for warning in [*entry.findall("d:warning", NS), *entry.findall("d:note", NS)]:
            extra_notes.extend(paragraphs(warning, limit=3))
        for term in item.findall("d:term", NS):
            name = xml_text(term.find("d:constant", NS))
            if not CONSTANT_NAME.fullmatch(name) or name in records:
                continue
            records[name] = {
                "typeName": render_type(term.find("d:type", NS)),
                "details": details,
                "anchor": manual_path(item),
                "notes": extra_notes,
                "related": related_names(entry, limit=8),
                "examples": examples(entry),
            }

    for block in node.findall(".//d:section", NS):
        title = block.find("d:title", NS)
        match = re.fullmatch(r"([A-Za-z_][A-Za-z0-9_]*::[A-Za-z_][A-Za-z0-9_]*)\s*\(([^)]+)\)", xml_text(title))
        if match is None:
            continue
        name, type_name = match.groups()
        details = paragraphs(block, ignored=("informalexample", "example", "programlisting", "note", "warning"), limit=6)
        if not details:
            continue
        records.setdefault(name, {
            "typeName": type_name,
            "details": details,
            "anchor": manual_path(block),
            "notes": [],
            "related": related_names(block, limit=8),
            "examples": examples(block),
        })

    for row in node.findall(".//d:tbody/d:row", NS):
        cells = row.findall("d:entry", NS)
        if len(cells) < 2:
            continue
        name = xml_text(cells[0].find("d:constant", NS))
        if not CONSTANT_NAME.fullmatch(name) or name in records:
            continue
        details = [text for cell in cells[1:] for text in paragraphs(cell, limit=2)]
        if not any(any(char.isalpha() for char in detail) for detail in details):
            continue
        records[name] = {
            "typeName": render_type(cells[0].find("d:type", NS)),
            "details": details,
            "anchor": manual_path(row),
            "notes": [],
            "related": related_names(row, limit=8),
            "examples": [],
        }
    return records


def constant_entries(en, es, primary_entities, localized_entities, overrides):
    files = [(path, path.parent.name, "") for path in sorted((en / "reference").glob("*/constants*.xml"))]
    files.extend([
        (en / "appendices" / "reserved.constants.core.xml", "language-constants", "reserved.constants"),
        (en / "appendices" / "reserved.constants.standard.xml", "language-constants", "reserved.constants"),
        (en / "language" / "constants.xml", "language-constants", "language.constants.magic"),
    ])
    for english_path, extension, source_page in files:
        path = english_path.relative_to(en)
        english = read_if_present(english_path, primary_entities)
        if english is None:
            continue
        translated = read_if_present(es / path, localized_entities)
        magic = source_page == "language.constants.magic"
        if magic:
            selector = f"d:sect1[@xml:id='{source_page}']"
            namespaces = {**NS, "xml": "http://www.w3.org/XML/1998/namespace"}
            english = english.find(selector, namespaces)
            translated = translated.find(selector, namespaces) if translated is not None else None
            if english is None:
                continue
        page = source_page or manual_path(english)
        if not page or english.get("annotations") == "chunk:false":
            page = f"{extension}.constants"
        entries = constants_in(english)
        if not entries:
            continue
        spanish_entries = constants_in(translated)
        for name, original in entries.items():
            translated_item = spanish_entries.get(name)
            content = translated_item or original
            locale = "es" if translated_item else "en"
            anchor = content["anchor"] or original["anchor"]
            source = f"{BASE}/{locale}/{page}.php" + (f"#{anchor}" if anchor != page and anchor else "")
            custom = overrides.get(name.casefold(), {})
            record = subject_record(
                subject_id("constant", name), name, "Constante mágica" if magic else "Constante PHP",
                extension, locale, source, custom.get("summary", content["details"][0]),
                custom.get("description", content["details"][1:]),
            )
            record.update({
                "typeName": custom.get("typeName", original["typeName"]),
                "notes": custom.get("notes", content["notes"]),
                "related": custom.get("related", content["related"]),
                "examples": custom.get("examples", content["examples"]),
            })
            yield record


def language_entries(root, entities):
    documents = {}
    topics = json.loads((DATA / "php-language-topics.json").read_text())
    for topic in topics:
        path = topic["document"]
        if path not in documents:
            node = read_if_present(root / "language" / path, entities)
            if node is None:
                raise ValueError(f"Missing PHP language document: {path}")
            documents[path] = {element.get(XML_ID) for element in node.iter()}
        section = topic["section"]
        if section not in documents[path]:
            raise ValueError(f"Missing PHP language section: {path} · {section}")
        entry = subject_record(
            f"php-construct-{topic['slug']}", topic["title"], "Sintaxis PHP",
            "language-constructs", "es", f"{BASE}/es/{section}.php",
            topic["summary"], topic["description"],
        )
        entry.update(
            group=topic["group"], declaration=topic["syntax"],
            related=topic.get("related", []), notes=topic.get("notes", []),
            examples=topic.get("examples", []),
        )
        yield entry



def write_json(target, value):
    target.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("en", type=Path)
    parser.add_argument("es", type=Path)
    parser.add_argument("--en-archive", type=Path)
    parser.add_argument("--es-archive", type=Path)
    args = parser.parse_args()
    primary_entities = entity_map(args.en)
    localized_entities = {**primary_entities, **entity_map(args.es)}
    source_entries, failures = load_primary(args.en, primary_entities)
    release = versions(args.en)
    existing = {
        entry["title"].lower(): entry["id"]
        for filename in ["standard-indexes.json", "quick-reference.json"]
        for entry in json.loads((DATA / filename).read_text())
        if entry["language"] == "php"
    }
    overrides = json.loads((DATA / "php-explanations.json").read_text())
    index = []
    shards = {}
    known = set()

    def add_detail(detail):
        if detail is None:
            return
        if detail["id"] in known:
            if detail.get("label") == "Constante PHP":
                return
            raise RuntimeError(f"Duplicate PHP reference ID: {detail['id']}")
        known.add(detail["id"])
        extension = detail["extension"]
        shards.setdefault(extension, []).append(detail)
        index.append({
            "id": detail["id"], "title": detail["title"], "summary": detail["summary"],
            "extension": extension, "group": detail["group"], "locale": detail["locale"],
            **({"label": detail["label"]} if "label" in detail else {}),
        })

    for path, node, name, methods, alias in source_entries.values():
        relpath = path.relative_to(args.en)
        translated_path = args.es / relpath
        translated = None
        if translated_path.exists():
            try:
                translated = parse_doc(translated_path, localized_entities)
            except ET.ParseError:
                pass
        title = f"{name}()"
        detail = serialize_entry(relpath, node, name, methods, alias, translated, release.get(name.lower(), {}), overrides.get(name.lower()), existing.get(title.lower()))
        add_detail(detail)

    routines = [detail for entries in shards.values() for detail in entries]
    for entry in class_entries(args.en, args.es, primary_entities, localized_entities, routines, overrides):
        add_detail(entry)
    for entry in variable_entries(args.en, args.es, primary_entities, localized_entities, overrides):
        add_detail(entry)
    for entry in constant_entries(args.en, args.es, primary_entities, localized_entities, overrides):
        add_detail(entry)
    for entry in language_entries(args.en, primary_entities):
        add_detail(entry)


    if len(index) < 2500 or not any(entry["id"] == "php-function-session_status" for entry in index):
        raise RuntimeError(f"Unexpected PHP catalog: {len(index)} entries, {len(failures)} parse errors")
    index.sort(key=lambda entry: entry["title"].casefold())
    ids = [entry["id"] for entry in index]
    if len(ids) != len(set(ids)):
        raise RuntimeError("Duplicate PHP reference IDs")
    directory = DATA / "php"
    directory.mkdir(exist_ok=True)
    for group, entries in sorted(shards.items()):
        write_json(directory / f"{group}.json", sorted(entries, key=lambda item: item["title"].casefold()))
    for path in directory.glob("*.json"):
        if path.stem not in shards:
            path.unlink()
    write_json(DATA / "php-catalog.json", index)
    print(f"PHP: {len(index)} fichas en {len(shards)} módulos, {sum(item['locale'] == 'es' for item in index)} en español.")
    print(f"Documentos ingleses que no se pudieron interpretar: {len(failures)}")
    print("Primeras incidencias:", ", ".join(failures[:12]))
    for label, archive in [("en", args.en_archive), ("es", args.es_archive)]:
        if archive is not None:
            print(f"SHA-256 {label}: {hashlib.sha256(archive.read_bytes()).hexdigest()}")

if __name__ == "__main__":
    main()
