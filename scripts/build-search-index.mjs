import fs from "node:fs";
import { gzipSync } from "node:zlib";
import {
  isJavaLibraryReferenceId,
  javaReferenceBucket,
} from "../src/docs/routes.js";
import { firstPageLimit, normalizeKnowledge } from "../src/lib/search.js";
import { writePhpReference } from "./build-php-reference.mjs";
import { restoreReferenceSnapshots } from "./reference-snapshots.mjs";

restoreReferenceSnapshots();
await Promise.all([
  import("./build-reference.mjs"),
  import("./build-quick-reference.mjs"),
]);

const read = (name) =>
  JSON.parse(
    fs.readFileSync(
      new URL(`../src/docs/data/${name}.json`, import.meta.url),
      "utf8",
    ),
  );
const references = read("html-reference");
const guides = read("guides");
const php = read("php-catalog");
const java = [...read("java-catalog"), ...read("java-syntax-catalog")];
const cpp = read("cpp20-catalog");
const standardIds = new Set([...java, ...cpp].map(({ id }) => id));
const native = ["java", "cpp"].flatMap((language) =>
  read(`web/${language}-standard`)
    .filter(({ id }) => !standardIds.has(id))
    .map((entry) => ({
      id: entry.id,
      title: entry.title,
      language,
      description: entry.description,
      group: entry.group,
      summary: entry.intro[0],
      source: entry.source,
      web: `${language}-standard`,
    })),
);
const web = [
  ...native,
  ...java,
  ...cpp,
  ...read("web-catalog"),
  ...read("framework-catalog"),
  ...read("sqlite-catalog"),
];
const webIds = new Set(web.map(({ id }) => id));
const symbols = [
  ...read("css-reference"),
  ...read("quick-reference"),
  ...read("standard-indexes"),
].filter((entry) => entry.language !== "php" && !webIds.has(entry.id));
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
          (attribute) => `${attribute.name} ${attribute.description || ""}`,
        ),
      ].join(" "),
    ),
  })),
  ...symbols.map((entry) => ({
    id: entry.id,
    title: entry.title,
    description: entry.description,
    summary: entry.detail || entry.summary || entry.syntax || entry.description,
    language: entry.language,
    kind: "reference",
    group: entry.group,
    href: `#symbol/${entry.id}`,
    text: normalizeKnowledge(
      [
        entry.title,
        entry.description,
        entry.detail,
        entry.summary,
        entry.example,
        entry.alias,
        ...(entry.appliesTo || []),
      ].join(" "),
    ),
  })),
  ...web.map(({ source, web: shard, ...entry }) => ({
    ...entry,
    kind: "reference",
    href: `#symbol/${entry.id}`,
  })),
  ...php.map((entry) => ({
    id: entry.id,
    title: entry.title,
    description:
      entry.label ||
      (entry.title.includes("::") ? "Método PHP" : "Función PHP"),
    summary: entry.summary,
    language: "php",
    kind: "reference",
    group: entry.group,
    href: `#symbol/${entry.id}`,
    module: entry.extension,
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
const write = (name, data) =>
  fs.writeFileSync(
    new URL(`../src/data/${name}.json`, import.meta.url),
    JSON.stringify(data, null, 2) + "\n",
  );
write("search-index", index);
write(
  "lesson-index",
  guides.map(({ id, language, number, title, level, minutes }) => ({
    id,
    language,
    number,
    title,
    level,
    minutes,
  })),
);
const referenceLessons = {};
for (const {
  language,
  number,
  title,
  level,
  minutes,
  relatedReferences,
} of guides) {
  for (const href of new Set(
    relatedReferences?.map((reference) => reference.href),
  )) {
    (referenceLessons[href] ??= []).push({
      language,
      number,
      title,
      level,
      minutes,
    });
  }
}
write("reference-lessons", referenceLessons);

const quickIds = [
  "tag-details",
  "css-properties-grid-template-columns",
  "javascript-api-fetch()",
  "react-api-useState",
  "php-function-session_status",
];
const quick = quickIds.map((id) => {
  const entry = index.find((item) => item.id === id);
  if (!entry) throw new Error(`Entrada de acceso rápido no encontrada: ${id}`);
  const { title, description, summary, language, kind, href } = entry;
  return { id, title, description, summary, language, kind, href };
});
write("search-quick", quick);

const courseFile = new URL("../src/data/languages.json", import.meta.url);
const courseDescriptions = JSON.parse(fs.readFileSync(courseFile, "utf8"));
write(
  "languages",
  courseDescriptions.map((course) => ({
    ...course,
    lessons: guides
      .filter(({ language }) => language === course.id)
      .map(({ id, title }) => ({ id, title })),
  })),
);

const searchDirectory = new URL("../public/search-library/", import.meta.url);
fs.mkdirSync(searchDirectory, { recursive: true });
const writeSearch = (name, items, options) =>
  fs.writeFileSync(
    new URL(`${name}.json.gz`, searchDirectory),
    gzipSync(JSON.stringify(items), options),
  );
for (const [language, entries] of Map.groupBy(
  guides,
  ({ language }) => language,
)) {
  writeSearch(`course-${language}`, entries);
}
const javaShards = new Set(java.map(({ web: shard }) => shard));
for (const shard of javaShards) {
  if (shard.startsWith("java-se-"))
    writeSearch(`reference-${shard}`, read(`web/${shard}`));
}
writeSearch("java-hierarchy", read("java-hierarchy"));
const writeFirstPages = (name, entries, references) => {
  writeSearch(`first-${name}-all`, entries.slice(0, firstPageLimit));
  writeSearch(`first-${name}-reference`, references.slice(0, firstPageLimit));
};
const byLanguage = Map.groupBy(index, ({ language }) => language);
const manifest = {};
writeSearch(
  "guides",
  index.filter(({ kind }) => kind === "guide"),
);
const orderedIndex = [...byLanguage.values()].flat();
writeFirstPages(
  "all",
  orderedIndex,
  orderedIndex.filter(({ kind }) => kind === "reference"),
);
for (const [language, entries] of byLanguage) {
  const references = entries.filter(({ kind }) => kind === "reference");
  const grouped = Map.groupBy(references, ({ group }) => group);
  const groups = Object.fromEntries(
    [...grouped].map(([group, results]) => [group, results.length]),
  );
  const scopes = {};
  if (references.length > 500) {
    const ordered = [...grouped].sort(([a], [b]) => a.localeCompare(b, "es"));
    for (const [index, [group, results]] of ordered.entries()) {
      const key = `${language}-category-${index}`;
      writeSearch(key, results);
      writeSearch(`first-${key}`, results.slice(0, firstPageLimit));
      scopes[group] = key;
    }
  }
  manifest[language] = {
    entries: entries.length,
    references: references.length,
    groups,
    scopes,
  };
  writeSearch(
    `entries-${language}`,
    entries.map(({ language: _, kind, href, ...entry }) => ({
      ...entry,
      ...(kind !== "reference" && { kind }),
      ...(href !== `#symbol/${entry.id}` && { href }),
    })),
    { level: 9 },
  );
  writeFirstPages(language, entries, references);
}
write("search-manifest", manifest);
writePhpReference(php, (extension) => read(`php/${extension}`), writeSearch);
const webLocations = {};
const javaLocations = new Map();
for (const { id, web: shard } of web) {
  if (!isJavaLibraryReferenceId(id)) {
    webLocations[id] = shard;
    continue;
  }
  const bucket = javaReferenceBucket(id);
  if (!javaLocations.has(bucket)) javaLocations.set(bucket, {});
  javaLocations.get(bucket)[id] = shard;
}
write("web-locator", webLocations);
fs.mkdirSync(new URL("../src/data/java-reference/", import.meta.url), {
  recursive: true,
});
for (const [bucket, locations] of javaLocations)
  write(`java-reference/${bucket}`, locations);
console.log(
  `Índice actualizado: ${references.length + symbols.length + web.length + php.length} referencias y ${guides.length} guías.`,
);
