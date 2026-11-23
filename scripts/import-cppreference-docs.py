#!/usr/bin/env python3
"""Enrich C++20 members with applicable prose from the cppreference HTML book."""

import argparse
from collections import defaultdict
from html import unescape
import json
from pathlib import Path
import re
from zipfile import ZipFile

DATA = Path(__file__).resolve().parents[1] / "src/docs/data"
BOOK = "reference/en/cpp/"
TABLE = re.compile(r'<table class="(t-par-begin|t-dsc-begin)"[^>]*>((?:(?!<table\b).)*?)</table>', re.S)
ROW = re.compile(r'<tr class="(t-par|t-dsc|t-dsc-hitem)"[^>]*>(.*?)</tr>', re.S)
CELL = re.compile(r"<td\b[^>]*>(.*?)</td>", re.S)
ARTICLE = "https://en.cppreference.com/w/cpp/"
TITLE = re.compile(r"<title>(.*?) - cppreference\.com</title>", re.S)
BLOCK = re.compile(r"<(p|h[23])\b[^>]*>(.*?)</\1>", re.S)
MARKUP = re.compile(r"<[^>]+>")
NEWER = re.compile(r"(?:since|until)\s+C\+\+\s*(?:2[36]|29|[3-9]\d)", re.I)
SECTIONS = {
    "return value": "returns",
    "exceptions": "caveats",
    "complexity": "complexity",
    "notes": "body",
}


def normalized_title(value):
    # Templates are part of the class name on the book pages. An operator
    # can itself contain '<', so only strip template arguments in the owner.
    owner, delimiter, member = unescape(value).strip().rpartition("::")
    if not delimiter or not owner.startswith("std"):
        return None
    depth = 0
    name = []
    for character in owner:
        if character == "<":
            depth += 1
        elif character == ">" and depth:
            depth -= 1
        elif not depth:
            name.append(character)
    return "".join(name).replace(" ", "") + "::" + "".join(member.split())


def plain(markup):
    return " ".join(unescape(MARKUP.sub("", markup)).replace("\u200b", "").split())


def content_scope(html):
    start = html.find('<div class="mw-content-ltr mw-parser-output"')
    if start == -1:
        start = html.find('id="mw-content-text"')
    if start == -1:
        return ""
    end = html.find('class="printfooter"', start)
    return html[start:end] if end != -1 else html[start:]


def article_url(path):
    return ARTICLE + path[len(BOOK):-5]


def document(path, scope):
    declarations = scope.find('<table class="t-dcl-begin"')
    if declarations != -1:
        end = scope.find("</table>", declarations)
        if end != -1:
            scope = scope[end + len("</table>"):]
    section = "intro"
    result = defaultdict(list)
    for block, raw in BLOCK.findall(scope):
        content = plain(raw)
        if block != "p":
            title = re.sub(r"\[edit\]", "", content).strip().casefold()
            if title in {"example", "examples", "see also", "defect reports", "references"}:
                break
            section = SECTIONS.get(title)
            continue
        if (
            not section or not content or not re.search(r"\w{3}", content)
            or NEWER.search(content) or "t-mark-rev" in raw
            or re.match(r"^(?:\(?\d+\)?[.):]\s*|\(none\))", content)
        ):
            continue
        if content in result[section]:
            continue
        if section == "intro" and result["intro"]:
            section = "body"
        result[section].append(content)
    if not result["intro"]:
        return None
    for table_kind, table in TABLE.findall(scope):
        if table_kind != "t-par-begin":
            continue
        for _, row in ROW.findall(table):
            cells = CELL.findall(row)
            if len(cells) != 3 or NEWER.search(plain(row)) or "t-mark-rev" in row:
                continue
            label, _, detail = map(plain, cells)
            if label and detail and re.fullmatch(r"\w+(?:, \w+)*", label):
                result["parameters"].append({"label": label, "detail": detail})
    return dict(result, documentationSource=article_url(path))


def member_types(owner, path, scope):
    for table_kind, table in TABLE.findall(scope):
        if table_kind != "t-dsc-begin":
            continue
        rows = ROW.findall(table)
        if not rows or rows[0][0] != "t-dsc-hitem":
            continue
        headings = [plain(cell) for cell in CELL.findall(rows[0][1])]
        if headings not in (["Member type", "Definition"], ["Member name", "Type"]):
            continue
        for _, row in rows[1:]:
            cells = CELL.findall(row)
            if len(cells) != 2 or NEWER.search(plain(row)) or "t-mark-rev" in row:
                continue
            name, detail = map(plain, cells)
            if not re.fullmatch(r"\w+", name) or not detail:
                continue
            title = "Type" if headings[1] == "Type" else "Definition"
            yield f"{owner}::{name}", {
                "intro": [f"{title}: {detail}." if not detail.endswith(".") else f"{title}: {detail}"],
                "documentationSource": article_url(path),
            }


def sources(archive):
    sections = defaultdict(list)
    types = defaultdict(list)
    with ZipFile(archive) as book:
        for path in book.namelist():
            if not path.startswith(BOOK) or not path.endswith(".html"):
                continue
            markup = book.read(path).decode("utf-8")
            title = TITLE.search(markup)
            if not title:
                continue
            owners = re.split(r",\s+(?=std::)", unescape(title[1]))
            scope = content_scope(markup)
            keys = [normalized_title(name) for name in owners]
            members = [key for key in keys if key and key.count("::") >= 2]
            if members and (result := document(path, scope)):
                for key in set(members):
                    sections[key].append(result)
            if len(keys) == 1 and keys[0]:
                owner = keys[0]
                for key, result in member_types(owner, path, scope):
                    types[key].append(result)
    return {
        key: candidates[0]
        for key, candidates in {**types, **sections}.items()
        if len(candidates) == 1
    }


def write(path, data):
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def enrich(book):
    docs = sources(book)
    catalog_path = DATA / "cpp20-catalog.json"
    catalog = json.loads(catalog_path.read_text())
    index = {item["id"]: item for item in catalog}
    updated = 0
    for path in sorted((DATA / "web").glob("cpp20-*.json")):
        details = json.loads(path.read_text())
        changed = False
        for item in details:
            if (
                not item.get("owner")
                or any(item.get(key) for key in ("intro", "body", "parameters", "returns", "caveats", "example"))
            ):
                continue
            key = item["aliases"][0].replace(" ", "").removesuffix("()")
            if key not in docs:
                continue
            item.update(docs[key], locale="en-US")
            summary = item["intro"][0]
            if len(summary) > 220:
                summary = summary[:217].rsplit(" ", 1)[0] + "…"
            index[item["id"]]["summary"] = summary
            updated += 1
            changed = True
        if changed:
            write(path, details)
    write(catalog_path, catalog)
    print(f"C++20: {updated} members enriched from cppreference")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("archive", type=Path)
    enrich(parser.parse_args().archive)
