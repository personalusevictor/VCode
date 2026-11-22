"""Build authored language reference records with validated cross-links."""

from collections import defaultdict


def syntax_shards(topics, source_for, *, language, name, namespace, environment, references):
    ids = {topic["slug"]: f"web-{namespace}-syntax-{topic['slug']}" for topic in topics}
    if len(ids) != len(topics):
        raise ValueError(f"Duplicate {name} language topic slugs")
    titles = {topic["slug"]: topic["title"] for topic in topics}
    shards = defaultdict(list)
    for topic in topics:
        title = topic["title"]
        slug = topic["slug"]
        related = []
        for key in topic.get("related", []):
            if key in ids:
                related.append({"id": ids[key], "title": titles[key]})
            elif key in references:
                related.append({"id": references[key], "title": key})
            else:
                raise ValueError(f"Unknown reference related to {title}: {key}")
        shards[f"{namespace}-language-{topic['chapter']}"].append({
            "id": ids[slug],
            "language": language,
            "locale": "es",
            "environment": environment,
            "title": title,
            "source": source_for(topic),
            "description": f"Sintaxis de {name}",
            "group": topic["group"],
            "guide": topic["guide"],
            "intro": [topic["summary"]],
            "usage": topic["syntax"],
            "caveats": topic["notes"],
            "body": topic["body"],
            "aliases": topic["aliases"],
            "example": {"language": language, **topic["example"]},
            "related": related,
        })
    return shards
