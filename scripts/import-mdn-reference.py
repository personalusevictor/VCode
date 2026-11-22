"""Import structured CSS, JavaScript and HTML attribute references from MDN."""

import argparse
import json
import re
import tarfile
from collections import defaultdict
from pathlib import Path

from reference_markdown import FENCE, HEADING, definitions, normalized, paragraphs, plain

DATA = Path(__file__).resolve().parents[1] / "src/docs/data"
GROUPS = {
    ("css", "properties"): ("css-properties", "Propiedad"),
    ("css", "selectors"): ("css-selectors", "Selector"),
    ("css", "at-rules"): ("css-atrules", "Regla @"),
    ("css", "values"): ("css-values", "Valor CSS"),
    ("html", "attributes"): ("html-attributes", "Atributo HTML"),
    ("html", "global_attributes"): ("html-attributes", "Atributo global HTML"),
    ("javascript", "global_objects"): ("js-builtins", "API de JavaScript"),
    ("javascript", "operators"): ("js-operators", "Operador"),
    ("javascript", "statements"): ("js-statements", "Sentencia"),
    ("javascript", "classes"): ("js-classes-functions", "Clases"),
    ("javascript", "functions"): ("js-classes-functions", "Funciones"),
    ("javascript", "regular_expressions"): ("js-regex", "Expresión regular"),
}
WEB_APIS = {
    "DOM": "document element htmlcollection htmlelement node nodelist domtokenlist domparser documentfragment shadowroot range selection",
    "Eventos web": "event eventtarget customevent keyboardevent mouseevent pointerevent inputevent focusevent submitEvent messageevent",
    "Red y peticiones": "fetch_api headers request response abortcontroller abortsignal url urlsearchparams websocket eventsource",
    "Archivos y datos": "file blob filelist filereader formdata filesystemhandle filesystemfilehandle filesystemdirectoryhandle textencoder textdecoder storage storageevent cache caches indexeddb idbrequest idbdatabase idbobjectstore idbindex idbtransaction idbcursor clipboard clipboarditem",
    "Formularios web": "formdataevent htmlformelement htmlinputelement htmlselectelement htmltextareaelement htmlbuttonelement htmlfieldsetelement htmloptionelement validitystate",
    "Flujos y compresión": "readablestream readablestreamdefaultreader readablestreamdefaultcontroller readablestreambyobreader readablestreambyobrequest readablebytestreamcontroller writablestream writablestreamdefaultwriter writablestreamdefaultcontroller transformstream transformstreamdefaultcontroller textencoderstream textdecoderstream compressionstream decompressionstream bytelengthqueuingstrategy countqueuingstrategy",
    "Ventana y navegación": "window navigator location history screen mediaquerylist performance visualviewport navigation urlpattern",
    "Observadores": "intersectionobserver intersectionobserverentry mutationobserver mutationrecord resizeobserver resizeobserverentry",
    "Procesos web": "worker workerglobalscope serviceworker serviceworkercontainer dedicatedworkerglobalscope broadcastchannel messagechannel messageport",
    "Dibujo y medios": "htmlcanvaselement canvasrenderingcontext2d offscreencanvas imagedata imagebitmap htmlmediaelement htmlvideoelement htmlaudioelement texttrack vttcue audiocontext",
    "Componentes web": "customelementregistry htmldialogelement htmldetailselement htmlslotelement htmltemplateelement elementinternals",
    "Tiempo y rendimiento": "performanceentry performanceobserver performancemeasure performancemark performancenavigationtiming performanceresourcetiming animation animationeffect keyframeeffect scrolltimeline viewtimeline",
}
API_GROUP = {
    family.lower(): group
    for group, families in WEB_APIS.items()
    for family in families.split()
}
LEGACY_DOM = {
    "window.fetch", "eventtarget.addeventlistener", "document.queryselector",
    "window.settimeout", "window.setinterval", "window.requestanimationframe",
}
API_TITLE = re.compile(r"^([^:]+):\s+(.+?)\s+(?:(?:static|instance) )?(method|property|event|constructor)$", re.I)
JS_CONCEPTS = {
    "execution_model", "iteration_protocols", "lexical_grammar",
    "strict_mode", "template_literals", "trailing_commas",
}
HEADINGS = {
    "syntax": "syntax", "sintaxis": "syntax",
    "parameters": "parameters", "parametros": "parameters",
    "return value": "returns", "valor de retorno": "returns",
    "valor devuelto": "returns", "valor de devolucion": "returns",
    "valor retornado": "returns", "valor que retorna": "returns",
    "valor retornado por la funcion": "returns",
    "values": "values", "valores": "values", "value": "values",
    "valor": "values", "exceptions": "exceptions", "excepciones": "exceptions",
    "description": "body", "descripcion": "body", "resumen": "intro",
    "sumario": "intro", "usage notes": "body", "notas de uso": "body",
    "accessibility": "accessibility", "accesibilidad": "accessibility",
}
SKIP_TYPES = {"listing", "landing-page"}


def read(name):
    return json.loads((DATA / f"{name}.json").read_text())


def write(path, data):
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n")


def parse(markdown):
    chunks = markdown.split("\n---", 1)
    if len(chunks) != 2 or not chunks[0].startswith("---\n"):
        return None
    front, document = chunks
    metadata = {}
    for line in front.splitlines()[1:]:
        key, sep, value = line.partition(": ")
        if sep:
            metadata[key] = value.strip().strip('"').strip("'")
    if "slug" not in metadata or metadata.get("page-type") in SKIP_TYPES:
        return None

    sections = defaultdict(list)
    syntax = []
    section = "intro"
    fence = None
    code = None
    for line in document.splitlines():
        delimiter = FENCE.match(line)
        if fence:
            if delimiter and delimiter[1].startswith(fence) and not delimiter[2].strip():
                if code is not None:
                    block = "\n".join(code).strip()
                    if block and len(block) <= 1800:
                        syntax.append(block)
                fence = code = None
            elif code is not None:
                code.append(line)
            continue
        if delimiter:
            fence = delimiter[1]
            if section == "syntax" and delimiter[2].strip().split("-")[0] in ("", "js", "javascript", "css", "html", "plain", "regex"):
                code = []
            continue
        heading = HEADING.match(line)
        if heading:
            section = HEADINGS.get(normalized(plain(heading[1])), "")
        elif section:
            sections[section].append(line)
    intro = paragraphs(sections["intro"], 2)
    if not intro:
        return None
    fields = {"intro": intro}
    signal = front + "\n" + document[:650]
    status = []
    for flag in ("experimental", "deprecated", "non-standard"):
        header = r"\{\{\s*" + flag + r"_header"
        metadata_status = re.search(rf"(?m)^status:[^\n]*(?:\n[ \t]+-[^\n]+)*", front)
        if re.search(header, signal, re.I) or (metadata_status and flag in metadata_status[0]):
            status.append(flag)
    if status:
        fields["status"] = status
    for section in ("returns", "body", "accessibility"):
        value = paragraphs(sections[section], 4)
        if value:
            fields[section] = value
    for section in ("parameters", "values", "exceptions"):
        value = definitions(sections[section])
        if value:
            fields[section] = value
        else:
            description = paragraphs(sections[section], 3)
            if description:
                fields[section] = [{"detail": paragraph} for paragraph in description]
    if syntax:
        fields["usage"] = "\n\n".join(syntax[:2])
    return metadata, fields


def documents(archive, locale):
    with tarfile.open(archive, "r|gz") as stream:
        for member in stream:
            parts = member.name.split("/")[2:]
            if len(parts) < 5 or parts[:2] != [locale, "web"]:
                continue
            if not member.isfile() or parts[-1] != "index.md":
                continue
            _, _, language, *path = parts
            if language == "api":
                family, *tail = path[:-1]
                if family not in API_GROUP or len(tail) > 1:
                    continue
                key = ("javascript", "web-api", family, *tail)
            else:
                if len(path) < 3:
                    continue
                reference, category, *tail = path
                if reference != "reference":
                    continue
                if (language, category) not in GROUPS:
                    if language != "javascript" or category not in JS_CONCEPTS:
                        continue
                key = (language, category, *tail[:-1])
            text = stream.extractfile(member).read().decode("utf-8")
            parsed = parse(text)
            if parsed:
                yield key, parsed



def known_entries():
    by_key = {}
    for filename in ("standard-indexes", "css-reference", "quick-reference"):
        for item in read(filename):
            title = item["title"].lower().removesuffix("()").replace(" · ", "/")
            key = (item["language"], item["group"], title)
            by_key.setdefault(key, item)
            if item["language"] == "javascript":
                by_key.setdefault(("javascript", "all", title), item)
    return by_key



ECMASCRIPT = "https://tc39.es/ecma262/2026/multipage/"


def language_topics(source):
    topics = {}
    pages = {}
    for topic in read("javascript-language-topics"):
        item_id = topic["id"]
        target = topic["clause"]
        page, anchor = target.split("#", 1)
        if source:
            if page not in pages:
                contents = (source / page).read_text(encoding="utf-8")
                pages[page] = set(re.findall(r'\bid="([^"]+)"', contents))
            if anchor not in pages[page]:
                raise ValueError(f"Unverified ECMAScript clause: {target}")
        topics[item_id] = {
            key: value for key, value in topic.items() if key not in {"id", "clause"}
        } | {
            "locale": "es", "provider": "ecmascript",
            "environment": "ECMAScript", "specification": ECMASCRIPT + target,
        }
    return topics

def work(args):
    known = known_entries()
    spanish = dict(documents(args.spanish, "es"))
    html_events = {entry["id"] for entry in read("standard-indexes") if entry["group"] == "html-events"}
    examples = {
        entry["id"] for entry in read("web-examples")
        if entry["language"] in {"html", "css", "javascript"} and entry["id"] not in html_events
    }
    overrides = {entry["id"]: entry for entry in read("web-explanations")}
    authored = language_topics(args.ecmascript)
    outputs = defaultdict(list)
    catalog = []
    seen = set()
    for path, (canonical, english) in documents(args.english, "en-us"):
        language, folder, *segments = path
        group, label = GROUPS.get((language, folder), ("js-concepts", "Concepto"))
        title = canonical.get("short-title") or canonical.get("title", "")
        if language == "javascript":
            title = canonical.get("title", "")
        if folder == "web-api":
            group, label = API_GROUP[segments[0]], "API web"
            match = API_TITLE.match(title)
            if match:
                owner, member, kind = match.groups()
                if kind == "constructor":
                    title = f"new {member}"
                elif kind == "event":
                    title = f"{owner}: {member}"
                else:
                    title = f"{owner}.{member}"
                label = {"method": "Método web", "property": "Propiedad web", "event": "Evento web", "constructor": "Constructor web"}[kind]
            elif segments == ["fetch_api"]:
                title = "Fetch API"
        title = plain(title)
        if not title:
            continue
        if language == "css":
            if folder == "at-rules" and len(segments) > 1:
                if segments[0] == "@media":
                    group, label = "css-media-features", "Característica de medios"
                else:
                    group, label = "css-descriptors", "Descriptor"
            elif folder == "values" and title.endswith("()"):
                group, label = "css-functions", "Función CSS"
        lookup = (language, group, title.lower().removesuffix("()"))
        if group == "css-descriptors":
            lookup = (language, group, f"{segments[0]}/{title.lower()}")
        existing = known.get(lookup)
        if language == "javascript":
            alias = lookup[-1]
            if folder == "web-api" and alias in LEGACY_DOM:
                alias = alias.rsplit(".", 1)[-1]
            existing = known.get((language, "all", alias))
            if (existing and existing["group"] != group
                    and existing["title"] != title
                    and existing["title"].casefold() == title.casefold()):
                existing = None
        suffix = "-".join([folder, *segments])
        item_id = existing["id"] if existing else f"web-{language}-{suffix}"
        if item_id in seen:
            continue
        seen.add(item_id)
        localized = spanish.get(path)
        # Use English when an older translation omits a core reference section.
        required = english.keys() & {"parameters", "returns"}
        if localized and not required.issubset(localized[1]):
            localized = None
        meta, fields = localized or (canonical, english)
        # Copy the canonical signatures. Translations can rename parameters or
        # predate a newer overload. Keep localized explanations where available.
        fields = dict(fields)
        if "usage" in english:
            fields["usage"] = english["usage"]
        locale = "es" if localized else "en-US"
        source = f"https://developer.mozilla.org/{locale}/docs/{meta['slug']}"
        shard = f"{language}-{folder}"
        if folder == "properties" and segments:
            shard = f"{shard}-{segments[0][0].lower()}"
        if folder in {"global_objects", "web-api"}:
            # A single built-in such as Array should never load all other APIs.
            shard = f"{shard}-{segments[0]}"
        item = {
            "id": item_id, "locale": locale, "source": source,
            "language": language,
            "title": title if not existing else existing["title"],
            "description": label if not existing else existing["description"],
            "group": group,
            **fields,
            **{key: value for key, value in overrides.get(item_id, {}).items() if key != "id"},
        }
        if item_id in authored:
            item = {
                key: item[key] for key in ("id", "source", "language", "title", "description", "group")
            } | {"status": item.get("status", [])} | authored[item_id]
        aliases = ([title] if existing and title != existing["title"] else []) + item.get("aliases", [])
        outputs[shard].append(item)
        catalog.append({
            "id": item_id,
            **({"aliases": list(dict.fromkeys(aliases))} if aliases else {}),
            "language": language,
            "title": title if not existing else existing["title"],
            "description": label if not existing else existing["description"],
            "group": group,
            "summary": item["intro"][0],
            "source": source,
            "web": shard,
            **({"status": item["status"]} if item.get("status") else {}),
        })

    expected = (examples | overrides.keys() | authored.keys()) - seen
    if expected:
        raise SystemExit(f"Ejemplos sin entrada: {', '.join(sorted(expected))}")
    target = DATA / "web"
    target.mkdir(exist_ok=True)
    for path in target.glob("*.json"):
        if path.stem.startswith(("html-", "css-", "javascript-")) and path.stem not in outputs:
            path.unlink()
    for shard, entries in outputs.items():
        write(target / f"{shard}.json", entries)
    write(DATA / "web-catalog.json", catalog)
    locales = defaultdict(int)
    for entries in outputs.values():
        for entry in entries:
            locales[entry["locale"]] += 1
    print(f"{len(catalog)} fichas en {len(outputs)} módulos. {dict(locales)}.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("english", type=Path, help="Archive of mdn/content")
    parser.add_argument("spanish", type=Path, help="Archive of mdn/translated-content")
    parser.add_argument("--ecmascript", type=Path, help="ECMAScript 2026 chapter HTML files")
    work(parser.parse_args())
