"""Publish original Java language references using the JLS 21 contents."""

import argparse
from html.parser import HTMLParser
import json
from pathlib import Path
import re

from reference_syntax import syntax_shards

DATA = Path(__file__).resolve().parent.parent / "src" / "docs" / "data"
SOURCE = "https://docs.oracle.com/javase/specs/jls/se21/html/"
SECTION = re.compile(r"jls-\d+\.html#jls-\d+(?:\.\d+)+")


class Sections(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links = set()

    def handle_starttag(self, tag, attributes):
        if tag != "a":
            return
        url = dict(attributes).get("href")
        if url and SECTION.fullmatch(url):
            self.links.add(url)


def read_json(path):
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path, data):
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("index", type=Path, help="Java SE 21 JLS index.html")
    args = parser.parse_args()
    index = Sections()
    index.feed(args.index.read_text(encoding="utf-8"))
    topics = read_json(DATA / "java-language-topics.json")
    api = read_json(DATA / "java-catalog.json")
    titles = {alias: item["id"] for item in api for alias in item["aliases"]}
    titles.update({item["title"]: item["id"] for item in api if item.get("featured")})

    def source_for(topic):
        chapter = topic["chapter"]
        target = f"jls-{chapter}.html#jls-{topic['section']}"
        if target not in index.links:
            raise ValueError(f"Unknown Java SE 21 section for {topic['title']}: {target}")
        return SOURCE + target

    shards = syntax_shards(
        topics, source_for, language="java", name="Java", namespace="java21",
        environment="Java SE 21", references=titles,
    )
    entries = []
    for scope, items in shards.items():
        write_json(DATA / "web" / f"{scope}.json", items)
        for item in items:
            entries.append({
                key: item[key]
                for key in ("id", "title", "language", "description", "group", "source", "aliases")
            } | {"summary": item["intro"][0], "web": scope})
    write_json(DATA / "java-syntax-catalog.json", sorted(entries, key=lambda item: item["title"].casefold()))
    print(f"Java SE 21: {len(entries)} temas de sintaxis en {len(shards)} módulos.")


if __name__ == "__main__":
    main()
