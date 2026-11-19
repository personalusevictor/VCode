import fs from "node:fs";
import { normalizeKnowledge } from "../src/lib/search.js";

const read = (name) =>
  JSON.parse(
    fs.readFileSync(
      new URL(`../src/docs/data/${name}.json`, import.meta.url),
      "utf8",
    ),
  );
const references = read("html-reference");
const guides = read("guides");
const index = [
  ...references.map((entry) => ({
    id: entry.id,
    title: entry.title,
    description: entry.description,
    summary: entry.detail,
    language: "html",
    kind: "reference",
    group: entry.group,
    href: `#reference/${entry.id}`,
    text: normalizeKnowledge(
      [
        entry.title,
        entry.description,
        entry.detail,
        entry.code,
        ...entry.tips,
        ...entry.attributes.map(
          (attribute) => `${attribute.name} ${attribute.description}`,
        ),
      ].join(" "),
    ),
  })),
  ...guides.map((entry) => ({
    id: entry.id,
    title: entry.title,
    description: entry.languageName,
    summary: entry.body[0],
    language: entry.language,
    kind: "guide",
    href: `#lesson/${entry.language}/${entry.number}`,
    text: normalizeKnowledge(
      [
        entry.languageName,
        entry.title,
        ...entry.body,
        entry.code,
        entry.note || "",
      ].join(" "),
    ),
  })),
];
fs.writeFileSync(
  new URL("../src/data/search-index.json", import.meta.url),
  JSON.stringify(index, null, 2) + "\n",
);
console.log(
  `Índice actualizado: ${references.length} referencias y ${guides.length} guías.`,
);
