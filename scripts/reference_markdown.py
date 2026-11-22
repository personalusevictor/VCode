"""Small text helpers for extracting structured references from Markdown."""

import re
import unicodedata

FENCE = re.compile(r"^\s*(`{3,}|~{3,})(.*)$")
HEADING = re.compile(r"^#{2,6}\s+(.+?)\s*$")
MACRO = re.compile(r"\{\{\s*([\w-]+)\s*(?:\((.*?)\))?\s*\}\}")
QUOTED = re.compile(r"""["']((?:\\.|[^"'\\])*)["']""")
LINK = re.compile(r"\[([^\[\]]+)\]\([^\s]+?\)")
DEFINITION = re.compile(r"^\s+-\s+:\s+(.*)$")
LIST_TERM = re.compile(r"^-\s+(.+)$")


def normalized(value):
    return "".join(
        ch for ch in unicodedata.normalize("NFD", value.lower())
        if not unicodedata.combining(ch)
    )


def plain(value):
    def macro(match):
        name, arguments = match.groups()
        args = QUOTED.findall(arguments or "")
        if not args or name.lower() not in {
            "cssxref", "jsxref", "domxref", "htmlelement", "htmlattrxref",
            "glossary", "rfc", "mathmlelement", "svgelement",
        }:
            return ""
        if name.lower() == "htmlelement":
            return f"<{args[0]}>"
        return args[1] if len(args) > 1 and args[1] else args[0].replace("/", ".")

    value = re.sub(r"!\[[^\]]*\]\([^)]*\)", "", value)
    value = LINK.sub(r"\1", MACRO.sub(macro, value))
    value = re.sub(r"</?(?:code|em|strong|p|span|br)\b[^>]*>", "", value)
    value = re.sub(r"^\s*>\s*(?:\[![A-Z]+\]\s*)?", "", value, flags=re.M)
    value = value.replace("**", "").replace("`", "")
    value = re.sub(r"(?<!\w)\*([^*\n]+)\*(?!\w)", r"\1", value)
    value = re.sub(r"(?<!\w)_([^_\n]+)_(?!\w)", r"\1", value)
    return " ".join(value.split()).strip()


def paragraphs(lines, limit):
    items = []
    for paragraph in re.split(r"\n\s*\n|\n(?=[-*] |\d+\. )", "\n".join(lines)):
        if len(items) == limit:
            break
        snippet = plain(paragraph.lstrip("-* "))
        if not snippet or snippet.startswith(("|", "<!--", ":::")):
            continue
        # A complete short paragraph is easier to use than a truncated sentence.
        if len(snippet) <= 1000:
            items.append(snippet)
        else:
            first_sentence = re.match(r".{75,400}?[.!?](?=\s|$)", snippet)
            if first_sentence:
                items.append(first_sentence.group())
    return items


def definitions(lines):
    items = []
    term = None
    explanation = []
    for line in [*lines, "- "]:
        candidate = LIST_TERM.match(line)
        definition = DEFINITION.match(line)
        if candidate or line == "- ":
            if term and explanation:
                detail = paragraphs(explanation, 2)
                if detail:
                    items.append({"label": term, "detail": " ".join(detail)})
            term = plain(candidate[1]) if candidate else None
            explanation = []
        elif term and definition:
            explanation.append(definition[1])
        elif term and explanation and line.startswith(" "):
            explanation.append(line.strip())
    return items
