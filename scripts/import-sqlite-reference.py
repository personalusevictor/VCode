"""Build the SQL reference from the public-domain SQLite language pages."""

import argparse
import html
import json
import re
import subprocess
from collections import defaultdict
from pathlib import Path
from urllib.parse import quote

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "src/docs/data"
SQLITE = "https://www.sqlite.org/"
TABLES = {
    "lang_corefunc": ("scalar", "Funciones escalares"),
    "lang_aggfunc": ("aggregate", "Agregación"),
    "lang_mathfunc": ("math", "Matemáticas"),
    "windowfunctions": ("window", "Ventanas"),
}
STATEMENTS = {
    "lang_select": ("SELECT", "Consultas"),
    "lang_with": ("WITH", "Consultas"),
    "lang_insert": ("INSERT", "Escritura"),
    "lang_update": ("UPDATE", "Escritura"),
    "lang_delete": ("DELETE", "Escritura"),
    "lang_returning": ("RETURNING", "Escritura"),
    "lang_upsert": ("UPSERT", "Escritura"),
    "lang_conflict": ("ON CONFLICT", "Escritura"),
    "lang_createtable": ("CREATE TABLE", "Esquema"),
    "lang_altertable": ("ALTER TABLE", "Esquema"),
    "lang_createindex": ("CREATE INDEX", "Esquema"),
    "lang_createview": ("CREATE VIEW", "Esquema"),
    "lang_transaction": ("BEGIN", "Transacciones"),
    "lang_savepoint": ("SAVEPOINT", "Transacciones"),
}
DATE_INFO = {
    "date": "Devuelve la fecha como texto con el formato AAAA-MM-DD.",
    "time": "Devuelve la hora como texto. El modificador subsec añade una fracción de segundo.",
    "datetime": "Devuelve fecha y hora como texto, separadas por un espacio.",
    "julianday": "Devuelve un número real que representa el día juliano.",
    "unixepoch": "Devuelve los segundos transcurridos desde el inicio de 1970 en UTC. Con subsec puede devolver una fracción.",
    "strftime": "Devuelve la fecha y la hora como texto según los códigos de formato indicados.",
    "timediff": "Devuelve una duración legible que, aplicada al segundo valor, conduce al primero.",
}
SQLITE_RUNTIME_QUERY = """
import init from 'sql.js';
const { Database } = await init();
const db = new Database();
const query = (sql) => db.exec(sql)[0].values.map(([name]) => name);
process.stdout.write(JSON.stringify({
  version: query('SELECT sqlite_version()')[0],
  known: [...query('PRAGMA function_list'), ...query('PRAGMA module_list')]
}));
"""


def read(name):
    return json.loads((DATA / f"{name}.json").read_text())


def write(path, entries):
    path.write_text(json.dumps(entries, indent=2, ensure_ascii=False) + "\n")


def plain(fragment):
    return " ".join(html.unescape(re.sub(r"<[^>]*>", " ", fragment)).split())


def prose(fragment, limit=5):
    fragment = re.sub(r"<(svg|style|script|pre)\b.*?</\1>", "", fragment, flags=re.S | re.I)
    parts = re.split(r"</?(?:p|ul|ol|li|dl|dd|dt|h[1-6])\b[^>]*>", fragment)
    paragraphs = []
    for part in parts:
        text = plain(part)
        if len(text) < 24 or text.startswith(("See also", "This page was last", "Show ", "Hide ")):
            continue
        if len(text) > 950:
            first_sentence = re.match(r".{70,650}?[.!?](?=\s|$)", text)
            if not first_sentence:
                continue
            text = first_sentence.group()
        paragraphs.append(text)
        if len(paragraphs) == limit:
            break
    return paragraphs


def section_map(page):
    headings = list(re.finditer(r'<h[1-5]\s+id="([^"]+)"[^>]*>(.*?)</h[1-5]>', page, re.S))
    for index, heading in enumerate(headings):
        end = headings[index + 1].start() if index + 1 < len(headings) else len(page)
        yield heading[1], plain(heading[2]), page[heading.end():end]


def grouped_functions(pages):
    names = re.compile(r'<dt>(.*?)<dd>(.*?)(?=<dt>|</dl>)', re.S | re.I)
    for file, (category, group) in TABLES.items():
        page = pages[file]
        start = page.find("<dl>")
        previous = start
        for match in names.finditer(page, start):
            signatures = [plain(piece) for piece in re.split(r"<br\s*/?>", match[1])]
            signatures = [signature for signature in signatures if re.match(r"^[a-z][a-z0-9_]*\(", signature)]
            description = prose(match[2])
            if not signatures or not description:
                continue
            leading = re.findall(r'<a\s+name="([a-z0-9_]+)"', page[max(start, previous - 120):match.start()])
            previous = match.end()
            stem = signatures[0].split("(", 1)[0]
            anchor = leading[-1] if leading else "built_in_window_functions" if category == "window" else stem
            by_name = defaultdict(list)
            for signature in signatures:
                by_name[signature.split("(", 1)[0]].append(
                    signature.replace(",", ", ").replace("  ", " "),
                )
            for name, overloads in by_name.items():
                yield category, f"{name}()", group, f"{file}.html#{anchor}", {
                    "intro": description[:1],
                    "body": description[1:],
                    "usage": "\n".join(overloads),
                }


def json_functions(pages):
    for anchor, title, fragment in section_map(pages["json1"]):
        if not re.match(r"^4\.\d+\.\s", title):
            continue
        description = prose(fragment)
        if not description:
            continue
        names = re.findall(r"\b(json\w*)\(\)", title)
        if anchor == "array_and_object_aggregate_functions":
            names = ["json_group_array", "json_group_object", "jsonb_group_array", "jsonb_group_object"]
        for name in dict.fromkeys(names):
            yield "json", f"{name}()", "JSON", f"json1.html#{anchor}", {
                "intro": description[:1],
                "body": description[1:],
            }


def dates(pages):
    page = pages["lang_datefunc"]
    for name, summary in DATE_INFO.items():
        signature = re.search(fr"<li>\s*<b>{name}\(</b>(.*?)<b>\)</b>", page, re.S)
        usage = f"{name}({plain(signature[1])})" if signature else f"{name}()"
        yield "date", f"{name}()", "Fechas y horas", "lang_datefunc.html#overview", {
            "intro": [summary],
            "usage": usage,
            "body": [
                "SQLite admite fechas como texto ISO-8601, días julianos y marcas Unix según la función y los modificadores.",
                "Los modificadores se aplican en el orden indicado. Para obtener resultados reproducibles en ejercicios, indica una fecha de partida.",
            ],
            "locale": "es",
        }


def statements(pages):
    for page, (title, group) in STATEMENTS.items():
        sections = dict((anchor, fragment) for anchor, _, fragment in section_map(pages[page]))
        fragment = sections.get("description") or sections.get("details") or sections.get("overview")
        if not fragment:
            fragment = pages[page].split("</script>")[-1]
        description = prose(fragment)
        if description:
            yield "statement", title, group, f"{page}.html", {
                "intro": description[:1],
                "body": description[1:],
            }



def language_topics(pages):
    anchors = {
        name: set(re.findall(r'\b(?:id|name)="([^"]+)"', page))
        for name, page in pages.items()
    }
    for topic in read("sql-language-topics"):
        source = topic["source"]
        filename, _, anchor = source.partition("#")
        page = filename.removesuffix(".html")
        if page not in anchors or (anchor and anchor not in anchors[page]):
            raise ValueError(f"Unverified SQLite documentation target: {source}")
        yield f"language-{topic['area']}", topic["title"], topic["group"], source, {
            "locale": "es",
            "intro": [topic["summary"]],
            "usage": topic["syntax"],
            "body": topic["body"],
            "caveats": topic["notes"],
            "guide": topic["guide"],
            "aliases": topic["aliases"],
            **({"example": topic["example"]} if "example" in topic else {}),
            **({"related_titles": topic["related"]} if "related" in topic else {}),
        }

def build(folder):
    pages = {filename.stem: filename.read_text() for filename in folder.glob("*.html")}
    capabilities = json.loads(subprocess.run(
        ["node", "--input-type=module", "-e", SQLITE_RUNTIME_QUERY],
        check=True, cwd=ROOT, text=True, capture_output=True,
    ).stdout)
    available = set(capabilities["known"])
    legacy = {
        entry["title"].casefold().removesuffix("()"): entry
        for entry in read("quick-reference") if entry["language"] == "sql"
    }
    overrides = {entry["name"].casefold(): entry for entry in read("sql-explanations")}
    samples = {entry["id"] for entry in read("web-examples") if entry["language"] == "sql"}
    shards = defaultdict(list)
    catalog = []
    claimed = set()
    sources = (
        grouped_functions(pages), json_functions(pages), dates(pages),
        statements(pages), language_topics(pages),
    )
    for source_batch in sources:
        for topic, title, group, source, fields in source_batch:
            name = title.casefold().removesuffix("()")
            prior = legacy.get(name)
            prefix = "web-sql-syntax-" if topic.startswith("language-") else "web-sql-"
            item_id = prior["id"] if prior else prefix + quote(name, safe="-_")
            if item_id in claimed:
                if topic.startswith("language-"):
                    raise ValueError(f"Duplicate authored SQLite topic: {title}")
                continue
            claimed.add(item_id)
            localized = {
                key: value for key, value in overrides.get(name, {}).items()
                if key != "name"
            }
            data = {**fields, **localized}
            metadata = {
                "id": item_id,
                "language": "sql",
                "title": prior["title"] if prior else title,
                "description": group,
                "group": group,
                "source": SQLITE + source,
            }
            entry = {
                **metadata, "locale": "en-US", "provider": "sqlite", **data,
                "environment": f"SQLite {capabilities['version']}",
            }
            if topic in {"scalar", "aggregate", "math", "window", "json", "date"} and name not in available:
                entry["caveats"] = [
                    f"Esta función no está incluida en SQLite {capabilities['version']} del laboratorio.",
                    *entry.get("caveats", []),
                ]
            shard = "sql-" + topic
            shards[shard].append(entry)
            catalog.append({
                **metadata, "summary": data["intro"][0], "web": shard,
                **({"aliases": entry["aliases"]} if entry.get("aliases") else {}),
            })
    ids = {entry["title"].casefold(): entry["id"] for entry in catalog}
    for entries in shards.values():
        for entry in entries:
            related = entry.pop("related_titles", [])
            if related:
                entry["related"] = [{"id": ids[title.casefold()], "title": title} for title in related]
    if samples - claimed:
        raise SystemExit(f"Ejemplos sin entrada: {', '.join(sorted(samples - claimed))}")
    target = DATA / "web"
    target.mkdir(exist_ok=True)
    for shard, entries in shards.items():
        write(target / f"{shard}.json", entries)
    write(DATA / "sqlite-catalog.json", catalog)
    print(f"{len(catalog)} fichas de SQL; laboratorio SQLite {capabilities['version']}.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("pages", type=Path)
    build(parser.parse_args().pages)
