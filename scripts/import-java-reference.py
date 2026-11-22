"""Generate linked Java SE 21 API references from ct.sym and the official type index."""

import argparse
from collections import defaultdict
import json
from pathlib import Path
import re
import subprocess
import tempfile
from urllib.parse import quote
from zipfile import ZipFile

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "src" / "docs" / "data"
RELEASE = 21
RELEASE_TAG = "L"
SHARD_BYTES = 150 * 1024
CLASS_HEADER = re.compile(r"^(?:public |protected )[\w ]*(?:class|interface|enum) ([\w.$]+)(?:[ <]|$)")
SOURCE = f"https://docs.oracle.com/en/java/javase/{RELEASE}/docs/api"


PUBLIC_TYPE = re.compile(
    r'<div class="col-first [^"]*all-classes-table[^"]*"><a href="(java\.[^"]+\.html)"'
)
MODULE_GROUPS = {
    "java.compiler": "Compiladores y anotaciones",
    "java.datatransfer": "Escritorio",
    "java.desktop": "Escritorio",
    "java.instrument": "Instrumentación y gestión",
    "java.logging": "Registros",
    "java.management": "Instrumentación y gestión",
    "java.management.rmi": "Instrumentación y gestión",
    "java.naming": "Red y servicios",
    "java.net.http": "Red y HTTP",
    "java.prefs": "Archivos y preferencias",
    "java.rmi": "Red y servicios",
    "java.scripting": "Entornos de scripts",
    "java.security.jgss": "Seguridad",
    "java.security.sasl": "Seguridad",
    "java.smartcardio": "Seguridad",
    "java.sql": "JDBC",
    "java.sql.rowset": "JDBC",
    "java.transaction.xa": "JDBC",
    "java.xml": "XML",
    "java.xml.crypto": "XML",
}
PACKAGE_GROUPS = (
    ("javax.swing", "Swing"),
    ("javax.sound", "Sonido"),
    ("javax.imageio", "Imágenes"),
    ("java.awt.image", "Imágenes"),
    ("javax.print", "Impresión"),
    ("javax.accessibility", "Accesibilidad de escritorio"),
    ("java.awt", "AWT"),
    ("java.beans", "JavaBeans"),
    ("java.lang.reflect", "Reflexión y JVM"),
    ("java.time", "Tiempo"),
    ("java.util.concurrent", "Concurrencia"),
    ("java.util.stream", "Flujos"),
    ("java.util.function", "Funciones"),
    ("java.util.regex", "Texto y patrones"),
    ("java.util.zip", "Archivos y preferencias"),
    ("java.util.jar", "Archivos y preferencias"),
    ("java.lang.ref", "Reflexión y JVM"),
    ("java.lang.invoke", "Reflexión y JVM"),
    ("java.lang.module", "Reflexión y JVM"),
    ("java.lang.constant", "Reflexión y JVM"),
    ("java.io", "Archivos y flujos"),
    ("java.nio", "Archivos y flujos"),
    ("java.net", "Red y HTTP"),
    ("java.security", "Seguridad"),
    ("javax.crypto", "Seguridad"),
    ("javax.net", "Seguridad"),
    ("java.text", "Texto y patrones"),
    ("java.util", "Colecciones"),
)


def official_types(path):
    names = set()
    for href in PUBLIC_TYPE.findall(path.read_text(encoding="utf-8")):
        location = href.split("/", 1)[1].removesuffix(".html")
        package, _, name = location.rpartition("/")
        names.add(f"{package.replace('/', '.')}.{name.replace('.', '$')}")
    if len(names) < 3000:
        raise ValueError(f"Unexpected number of public Java 21 types: {len(names)}")
    return sorted(names)


def extra_topics(official, curated, modules):
    for qualified in official:
        if qualified in curated:
            continue
        package = qualified.rpartition(".")[0]
        group = next(
            (group for prefix, group in PACKAGE_GROUPS
             if package == prefix or package.startswith(f"{prefix}.")),
            MODULE_GROUPS.get(modules[qualified], "Tipos y números"),
        )
        yield {"name": qualified, "group": group}


def read_json(path):
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def read_api(jdk, selected):
    signatures = {}
    modules = {}
    with ZipFile(jdk / "lib" / "ct.sym") as archive, tempfile.TemporaryDirectory() as scratch:
        for path in archive.namelist():
            parts = path.split("/", 2)
            if len(parts) != 3 or RELEASE_TAG not in parts[0] or not path.endswith(".sig"):
                continue
            _, module, name = parts
            qualified = name.removesuffix(".sig").replace("/", ".")
            if qualified not in selected:
                continue
            if qualified in signatures:
                raise ValueError(f"Duplicate type in Java SE {RELEASE}: {qualified}")
            target = Path(scratch) / name.replace(".sig", ".class")
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(archive.read(path))
            signatures[qualified] = target
            modules[qualified] = module

        missing = selected - signatures.keys()
        if missing:
            raise ValueError(f"Missing Java SE {RELEASE} types in ct.sym: {', '.join(sorted(missing))}")
        paths = list(map(str, signatures.values()))
        listings = [
            subprocess.run(
                [str(jdk / "bin" / "javap"), "-public", "-constants", *paths[start:start + 128]],
                check=True, capture_output=True, text=True,
            ).stdout
            for start in range(0, len(paths), 128)
        ]

    types = {}
    qualified = None
    for line in "\n".join(listings).splitlines():
        header = CLASS_HEADER.match(line)
        if header:
            qualified = header[1]
            types[qualified] = {"declaration": line.removesuffix(" {"), "members": []}
        elif line == "}":
            qualified = None
        elif qualified and line.startswith("  public ") and line.endswith(";"):
            types[qualified]["members"].append(line.strip())
    if selected != types.keys():
        raise ValueError(f"Could not read public types: {', '.join(sorted(selected - types.keys()))}")
    return modules, types


def member_key(qualified, signature):
    declarator = signature.rstrip(";").split(" = ", 1)[0]
    declaration, opening, _ = declarator.partition("(")
    name = declaration.rsplit(None, 1)[-1]
    if not opening:
        return "Campo", name
    if name == qualified:
        return "Constructor", name.rsplit(".", 1)[-1].replace("$", ".")
    return "Método", name


def java_code(value, package):
    # Keep external packages in signatures and use conventional nested type notation.
    stripped = re.sub(r"(?<![\w.])java\.lang\.(?=[A-Z])", "", value)
    return re.sub(
        rf"(?<![\w.]){re.escape(package)}\.(?=[A-Z])", "", stripped,
    ).replace("$", ".")


def identifier(title, qualified, legacy):
    return legacy.get(title) or f"web-java-se-{quote(qualified, safe='-_.!~*')}"


def source_url(qualified, module):
    package, _, name = qualified.rpartition(".")
    return f"{SOURCE}/{module}/{package.replace('.', '/')}/{name.replace('$', '.')}.html"


def type_hierarchy(declaration, type_ids):
    outside_generics = []
    depth = 0
    for char in declaration:
        if char == "<":
            depth += 1
        elif char == ">":
            depth -= 1
        elif depth == 0:
            outside_generics.append(char)
    chunks = re.split(r"\s+(extends|implements)\s+", "".join(outside_generics))
    hierarchy = []
    for relation, names in zip(chunks[1::2], chunks[2::2]):
        links = [
            {"id": type_ids[name], "title": name.rsplit(".", 1)[-1].replace("$", ".")}
            for name in map(str.strip, names.split(","))
            if name in type_ids
        ]
        if links:
            hierarchy.append({"relation": "Extiende" if relation == "extends" else "Implementa", "types": links})
    return hierarchy



def partition_reference_shards(shards):
    partitioned = {}
    for scope, entries in shards.items():
        part = 1
        size = 2
        current = partitioned.setdefault(scope, [])
        same_type = []
        for entry in entries:
            same_type.append(entry)
            if "members" not in entry:
                continue
            type_size = sum(
                len(json.dumps(item, ensure_ascii=False, separators=(",", ":")).encode("utf-8")) + 1
                for item in same_type
            )
            if current and size + type_size > SHARD_BYTES:
                part += 1
                size = 2
                current = partitioned.setdefault(f"{scope}-{part}", [])
            current.extend(same_type)
            size += type_size
            same_type = []
        if same_type:
            raise ValueError(f"Missing type declaration in {scope}")
    return partitioned

def build_reference(topics, modules, types, manual, legacy, explanations):
    index = []
    shards = defaultdict(list)
    type_ids = {
        topic["name"]: identifier(
            topic["name"].rsplit(".", 1)[-1].replace("$", "."),
            topic["name"],
            legacy if "lesson" in topic else {},
        )
        for topic in topics
    }
    for topic in topics:
        qualified = topic["name"]
        package, _, name = qualified.rpartition(".")
        title = name.replace("$", ".")
        group = topic["group"]
        source = source_url(qualified, modules[qualified])
        curated = "lesson" in topic
        scope = f"java-se-{package}" if curated else f"java-se-{package}-{name[0].lower()}"
        raw = types[qualified]
        known_ids = legacy if curated else {}
        class_id = type_ids[qualified]
        shared = {
            "language": "java", "group": group, "locale": "es",
            "environment": f"Java SE {RELEASE}", "package": package,
            **({"guide": topic["lesson"], "featured": True} if curated else {}),
        }
        cls = {
            **shared, "id": class_id, "title": title, "source": source,
            "description": package, "intro": [topic["summary"]] if "summary" in topic else [],
            "usage": java_code(raw["declaration"], package),
            "aliases": [qualified.replace("$", ".")],
            "members": [],
        }
        hierarchy = type_hierarchy(raw["declaration"], type_ids)
        if hierarchy:
            cls["hierarchy"] = hierarchy
        member_groups = defaultdict(list)
        for line in raw["members"]:
            member_groups[member_key(qualified, line)].append(line)
        for (kind, member), lines in sorted(member_groups.items(), key=lambda item: item[0][1].casefold()):
            member_title = f"{title}.{member}()" if kind == "Método" else (
                f"{member}()" if kind == "Constructor" else f"{title}.{member}"
            )
            key = f"{qualified}.{member}" if kind != "Constructor" else f"{qualified}.<init>"
            member_id = identifier(member_title, key, known_ids)
            unique_signatures = list(dict.fromkeys(java_code(line, package) for line in lines))
            detail = {
                **shared,
                "id": member_id,
                "title": member_title,
                "description": f"{kind} de {title}",
                "intro": [],
                "source": source + ("#constructor-summary" if kind == "Constructor" else
                                    "#field-summary" if kind == "Campo" else "#method-summary"),
                "owner": {"id": class_id, "title": title},
                "signatures": unique_signatures,
                "aliases": [key.replace("$", ".")],
            }
            if kind == "Método":
                detail["aliases"].extend([
                    f"{title}#{member}", f"{qualified.replace('$', '.')}#{member}",
                ])
            if member_id in manual:
                detail.update(manual[member_id])
            if curated and member_title in explanations:
                detail.update(explanations[member_title])
            cls["members"].append({
                "id": member_id,
                "title": member if kind != "Constructor" else f"{member}()",
                "kind": kind,
            })
            shards[scope].append(detail)
        shards[scope].append(cls)

    shards = partition_reference_shards(shards)
    ids = set()
    for scope, details in shards.items():
        for item in details:
            if item["id"] in ids:
                raise ValueError(f"Duplicate Java reference: {item['id']}")
            ids.add(item["id"])
            entry = {
                name: item[name]
                for name in ("id", "title", "language", "description", "group", "source")
            }
            entry["summary"] = item["intro"][0] if item["intro"] else item.get("usage") or item["signatures"][0]
            entry["aliases"] = item.get("aliases", [])
            entry["web"] = scope
            if item.get("featured"):
                entry["featured"] = True
            index.append(entry)
    return index, shards



def inheritance_graph(shards):
    parents = {}
    static_interface_methods = []
    interfaces = []
    for entries in shards.values():
        by_id = {item["id"]: item for item in entries}
        for item in entries:
            if "members" not in item:
                continue
            links = [
                ref["id"]
                for group in item.get("hierarchy", [])
                for ref in group["types"]
            ]
            is_interface = bool(re.search(r"\binterface\s", item["usage"]))
            has_parent_class = any(group["relation"] == "Extiende" for group in item.get("hierarchy", []))
            if not is_interface and not has_parent_class and item["aliases"][0] != "java.lang.Object":
                links.append("web-java-se-java.lang.Object")
            parents[item["id"]] = links
            if is_interface:
                interfaces.append(item["id"])
                static_interface_methods.extend(
                    member["id"] for member in item["members"]
                    if member["kind"] == "Método"
                    and by_id[member["id"]]["signatures"]
                    and all(
                        re.match(r"(?:public )?static ", signature)
                        for signature in by_id[member["id"]]["signatures"]
                    )
                )
    return {
        "parents": parents,
        "interfaces": sorted(interfaces),
        "staticInterfaceMethods": sorted(set(static_interface_methods)),
    }

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("jdk", type=Path, help="OpenJDK home with javap and ct.sym")
    parser.add_argument("--api-index", type=Path, help="Official Java SE 21 allclasses-index.html snapshot")
    args = parser.parse_args()
    manifest = DATA / "java-se-types.json"
    official = official_types(args.api_index) if args.api_index else read_json(manifest)
    topics = read_json(DATA / "java-topics.json")
    manual = {
        entry["id"]: entry for entry in read_json(DATA / "web" / "java-standard.json")
    }
    quick = [
        entry for entry in read_json(DATA / "quick-reference.json")
        if entry["language"] == "java"
    ]
    legacy = {entry["title"]: entry["id"] for entry in [*quick, *manual.values()]}
    explanations = read_json(DATA / "java-explanations.json")
    curated = {topic["name"] for topic in topics}
    modules, types = read_api(args.jdk.resolve(), curated | set(official))
    topics.extend(extra_topics(official, curated, modules))
    index, shards = build_reference(topics, modules, types, manual, legacy, explanations)
    index.sort(key=lambda entry: entry["title"].casefold())
    for scope, entries in shards.items():
        write_json(DATA / "web" / f"{scope}.json", entries)
    write_json(DATA / "java-catalog.json", index)
    write_json(DATA / "java-hierarchy.json", inheritance_graph(shards))
    write_json(manifest, official)
    print(f"Java SE {RELEASE}: {len(types)} tipos y {len(index) - len(types)} miembros en {len(shards)} módulos de datos.")


if __name__ == "__main__":
    main()
