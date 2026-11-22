"""Generate catalog metadata from downloaded WHATWG and PHP manual indexes."""
import argparse
import html
import json
import re
from pathlib import Path
from urllib.parse import quote, urljoin

DATA = Path(__file__).resolve().parent.parent / "src/docs/data"
HTML = "https://html.spec.whatwg.org/multipage/"
PHP = "https://www.php.net/manual/es/"
CORE_PREFIXES = (
    "array_", "str_", "mb_", "preg_", "json_", "password_", "filter_",
    "session_", "date_", "stream_", "hash_", "ctype_", "is_", "file_",
)
CORE_NAMES = set("""
abs ceil floor round min max intdiv pow sqrt random_int random_bytes time date gmdate
strtotime explode implode strlen strpos strrpos substr trim ltrim rtrim strtolower
strtoupper strcmp strcasecmp sprintf printf var_dump print_r count sizeof in_array
sort rsort asort arsort ksort krsort usort uasort uksort range compact extract
htmlspecialchars htmlentities html_entity_decode htmlspecialchars_decode http_build_query
parse_url rawurlencode urlencode urldecode rawurldecode nl2br addslashes stripslashes
basename dirname realpath mkdir rmdir glob rename unlink copy fopen fclose fread fwrite
feof filesize fgetc fgets fgetcsv fputcsv file readfile fopen fclose header http_response_code
setcookie setrawcookie ob_start ob_get_clean ob_end_clean define defined gettype settype
intval floatval strval boolval serialize unserialize class_exists interface_exists
trait_exists method_exists function_exists property_exists get_class get_object_vars
get_defined_vars getenv ini_get ini_set error_log trigger_error set_error_handler
set_exception_handler register_shutdown_function version_compare phpversion preg_match
""".split())
ATTRIBUTES = {
    "id": ("Identificador global único en el documento.", '<h2 id="temario">Temario</h2>'),
    "class": ("Lista de clases separadas por espacios. Permite reutilizar estilos o localizar grupos de elementos.", '<article class="tarjeta destacada">VCode</article>'),
    "lang": ("Idioma principal del contenido del elemento.", '<p lang="ja">こんにちは</p>'),
    "hidden": ("Indica que el elemento no debe presentarse en su estado actual.", '<p hidden>Mensaje pendiente</p>'),
    "inert": ("Retira el elemento y su subárbol de la interacción mientras permanezca activo.", '<section inert><button>Continuar</button></section>'),
    "tabindex": ("Controla la participación del elemento en la navegación por foco. Usa 0 o -1 para conservar el orden natural.", '<section tabindex="-1" id="resultado">Resultado</section>'),
    "popover": ("Identifica un panel que el navegador puede mostrar en la capa superior.", '<button popovertarget="ayuda">Ayuda</button><p id="ayuda" popover>Atajos de VCode</p>'),
    "data-*": ("Guarda datos propios como texto. JavaScript puede leer data-tema mediante dataset.tema.", '<li data-tema="html">HTML</li>'),
}

def plain(fragment):
    return " ".join(html.unescape(re.sub(r"<[^>]+>", "", fragment)).split())

def link_pairs(fragment):
    return [
        (html.unescape(a or b), plain(label))
        for a, b, label in re.findall(r'<a\b[^>]*href=(?:"([^"]+)"|([^\s>]+))[^>]*>(.*?)</a>', fragment, re.S)
    ]

def table_rows(index, caption):
    table = index.split(f"{caption}</caption>", 1)[1].split("</table>", 1)[0]
    return re.split(r"<tr(?:\s[^>]*)?>", table)


def read_elements(index):
    elements = {}
    for row in table_rows(index, "List of elements"):
        cells = re.split(r"<td\b[^>]*>", row)
        if len(cells) < 7 or not cells[0].startswith("<th>"):
            continue
        names = link_pairs(cells[0])
        if not names:
            continue
        attrs = [
            title for _, title in link_pairs(cells[5])
            if title != "globals"
        ]
        for href, name in names:
            if re.fullmatch(r"[a-z][a-z0-9-]*", name):
                elements["tag-" + name] = {
                    "attributes": list(dict.fromkeys(attrs)),
                    "source": urljoin(HTML, href),
                }
    return elements


EVENT_DETAILS = {
    "onbeforeinput": "Recibe un aviso antes de que el navegador aplique una edición en un campo o región editable.",
    "onchange": "Recibe el evento change cuando se confirma un cambio. En un campo de texto, puede ocurrir al perder el foco.",
    "onclick": "Responde al evento click. Un control nativo como button también puede generar este evento al activarse con el teclado.",
    "onerror": "Recibe el evento error. El significado depende del elemento o del contexto, como una imagen que no carga o un error comunicado a Window.",
    "onformdata": "Permite consultar o modificar los datos cuando se construye FormData a partir de un formulario.",
    "onhashchange": "Recibe un aviso cuando cambia el fragmento de la URL del documento.",
    "oninput": "Responde al evento input al editar un campo. Permite actualizar una vista mientras la persona escribe.",
    "oninvalid": "Recibe un aviso en un control cuyo valor no pasa la validación del formulario.",
    "onkeydown": "Recibe la pulsación de una tecla. Consulta la propiedad key del evento para interpretar la acción.",
    "onload": "Recibe la confirmación de que un recurso o documento ha terminado de cargarse, según el elemento.",
    "onmessage": "En body conecta el evento message de Window. Comprueba el origen cuando proceses mensajes de otra ventana.",
    "onpageshow": "Recibe el evento pageshow de Window al presentar la página. persisted permite identificar una restauración desde la caché de historial.",
    "onreset": "Recibe el evento reset de un formulario cuando va a restaurar sus valores iniciales.",
    "onscrollend": "Recibe el aviso de que terminó un desplazamiento. Comprueba la compatibilidad con tu navegador objetivo.",
    "onsubmit": "Recibe el evento submit del formulario cuando se solicita un envío y la validación lo permite.",
    "ontoggle": "Recibe el evento toggle cuando cambia el estado abierto o cerrado de un elemento que lo emite, como details.",
}


def read_attribute_rows(index, caption):
    for row in table_rows(index, caption):
        cells = re.split(r"<td\b[^>]*>", row)
        if len(cells) < 4:
            continue
        title = plain(cells[0])
        links = link_pairs(cells[1])
        if not title or not links:
            continue
        yield title, cells, links


def read_attributes(index):
    merged = {}
    tables = [
        ("html-attributes", "List of attributes (excluding event handler content attributes)"),
        ("html-events", "List of event handler content attributes"),
    ]
    for group, caption in tables:
        for title, cells, links in read_attribute_rows(index, caption):
            scope = list(dict.fromkeys(name for _, name in links if name))
            source = urljoin(HTML, links[0][0])
            context = {
                "elements": scope,
                "purpose": plain(cells[2]),
                "values": plain(cells[3]),
                "source": source,
            }
            is_event = group == "html-events"
            if is_event:
                event_link, name = link_pairs(cells[2])[0]
                window_event = "event handler for Window object" in context["purpose"]
                context["purpose"] = (
                    f"Maneja el evento {name} de Window."
                    if window_event else f"Maneja el evento {name}."
                )
                context["values"] = "Código JavaScript para el manejador."
                context["locale"] = "es"
                context["event"] = {
                    "name": name,
                    "href": urljoin(HTML + "indices.html", event_link),
                }
            if title in merged:
                entry = merged[title]
                entry["appliesTo"] = list(dict.fromkeys(entry["appliesTo"] + scope))
                entry["contexts"].append(context)
                continue
            entry = {
                "id": "html-attribute-" + quote(title, safe="*-"),
                "title": title,
                "language": "html",
                "description": "Atributo de evento HTML" if is_event else "Atributo HTML",
                "group": group,
                "appliesTo": scope,
                "summary": context["purpose"],
                "contexts": [context],
                "source": source,
            }
            if title in ATTRIBUTES:
                entry["detail"], entry["example"] = ATTRIBUTES[title]
            if is_event:
                entry["detail"] = EVENT_DETAILS.get(title, context["purpose"])
            merged[title] = entry
    return list(merged.values())


def read_functions(index):
    entries = []
    existing = {entry["title"] for entry in json.loads((DATA / "quick-reference.json").read_text()) if entry["language"] == "php"}
    for href, name in link_pairs(index):
        if not re.fullmatch(r"function\.[a-z0-9-]+\.php", href) or not re.fullmatch(r"[a-z_][a-z0-9_]*", name):
            continue
        title = name + "()"
        if title in existing or not (name in CORE_NAMES or name.startswith(CORE_PREFIXES)):
            continue
        existing.add(title)
        entries.append({
            "id": "php-function-" + name,
            "title": title,
            "language": "php",
            "description": "Función PHP",
            "group": "php-functions",
            "source": urljoin(PHP, href),
        })
    return entries

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("html_index", type=Path)
    parser.add_argument("php_index", type=Path, nargs="?")
    args = parser.parse_args()
    target = DATA / "standard-indexes.json"
    old = json.loads(target.read_text())
    index = args.html_index.read_text()
    elements = read_elements(index)
    documented = {entry["id"] for entry in json.loads((DATA / "html-reference.json").read_text())}
    missing = sorted(elements.keys() - documented)
    if missing:
        raise SystemExit(f"Agrega una ficha HTML para: {', '.join(missing)}")
    previous_php = [entry for entry in old if entry["language"] == "php"]
    attributes = read_attributes(index)
    entries = attributes + (read_functions(args.php_index.read_text()) if args.php_index else previous_php)
    target.write_text(json.dumps(entries, ensure_ascii=False, indent=2) + "\n")
    (DATA / "html-element-meta.json").write_text(json.dumps(elements, ensure_ascii=False, indent=2) + "\n")
    names = {entry["title"]: entry["id"] for entry in attributes}
    (DATA / "html-attribute-ids.json").write_text(json.dumps(names, ensure_ascii=False, indent=2) + "\n")
    briefs = {
        entry["title"]: {
            element: context["purpose"]
            for context in entry["contexts"]
            for element in context["elements"]
        }
        for entry in attributes
    }
    (DATA / "html-attribute-briefs.json").write_text(json.dumps(briefs, ensure_ascii=False, indent=2) + "\n")
    handlers = sum(entry["group"] == "html-events" for entry in attributes)
    print(f"{len(elements)} elementos y {len(attributes)} atributos cotejados, incluidos {handlers} manejadores de eventos.")

if __name__ == "__main__":
    main()
