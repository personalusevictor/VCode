import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { gzipSync, gunzipSync } from "node:zlib";

const catalog = fileURLToPath(new URL("../src/docs/data/", import.meta.url));
const snapshots = fileURLToPath(
  new URL("../vendor/reference/", import.meta.url),
);
const groups = {
  php: ["php-catalog"],
  java: ["java-catalog", "java-hierarchy", "java-syntax-catalog"],
  cpp: ["cpp20-catalog"],
  framework: ["framework-catalog"],
  sql: ["sqlite-catalog"],
  web: ["web-catalog"],
};
const entriesIn = (folder) =>
  readdirSync(resolve(catalog, folder))
    .filter((file) => file.endsWith(".json"))
    .sort()
    .map((file) => `${folder}/${file}`);

function snapshotPath(group) {
  return resolve(snapshots, `${group}.json.gz`);
}

function filesFor(group) {
  const files = groups[group].map((name) => `${name}.json`);
  if (group === "php") return [...files, ...entriesIn("php")];
  const prefixes = {
    java: /^(?:java|java21)-/,
    cpp: /^(?:cpp|cpp20)-/,
    framework: /^(?:react|typescript)-/,
    sql: /^sql-/,
    web: /^(?:css|html|javascript)-/,
  };
  return [
    ...files,
    ...entriesIn("web").filter((name) =>
      prefixes[group].test(name.slice("web/".length)),
    ),
  ];
}

const translations = fileURLToPath(
  new URL("../src/docs/data/translations/", import.meta.url),
);
const translatedFields = [
  "intro",
  "body",
  "parameters",
  "returns",
  "exceptions",
  "caveats",
  "values",
  "usage",
];
// PHP shards follow the php.net layout instead of the web card layout.
const phpFields = [
  "summary",
  "description",
  "examples",
  "notes",
  "returnValues",
  "errors",
];
const fieldsFor = (file) =>
  file.startsWith("php/") ? phpFields : translatedFields;
// The PHP index repeats each summary, so it only takes that field.
const indexFields = { "php-catalog.json": ["summary"] };

// Spanish text kept outside the snapshots, so a new import never discards it.
function readTranslations(group) {
  const file = resolve(translations, `${group}.json`);
  return existsSync(file) ? readFileSync(file, "utf8") : "";
}

function applyOverload(overload, translation, fields) {
  if (!translation) return overload;
  const result = { ...overload };
  for (const field of fields)
    if (translation[field] !== undefined) result[field] = translation[field];
  return result;
}

export function applyTranslation(
  entry,
  translation,
  fields = translatedFields,
) {
  if (!translation) return entry;
  const result = { ...entry };
  for (const field of fields)
    if (translation[field] !== undefined) result[field] = translation[field];
  if (Array.isArray(translation.overloads) && Array.isArray(entry.overloads))
    result.overloads = entry.overloads.map((overload, index) =>
      applyOverload(overload, translation.overloads[index], fields),
    );
  result.locale = "es";
  delete result.introSpanish;
  return result;
}

function applyIndex(entry, translation, fields) {
  const result = { ...entry };
  let changed = false;
  for (const field of fields)
    if (translation[field] !== undefined) {
      result[field] = translation[field];
      changed = true;
    }
  return changed ? result : entry;
}

function translate(file, content, overlay) {
  if (!overlay) return content;
  const index = indexFields[file];
  if (!index && !/^(php|web)\//.test(file)) return content;
  const entries = JSON.parse(content);
  if (!Array.isArray(entries)) return content;
  let changed = false;
  const translated = entries.map((entry) => {
    const translation = entry && overlay[entry.id];
    if (!translation) return entry;
    changed = true;
    return index
      ? applyIndex(entry, translation, index)
      : applyTranslation(entry, translation, fieldsFor(file));
  });
  return changed ? JSON.stringify(translated) : content;
}

export function restoreReferenceSnapshots() {
  for (const group of Object.keys(groups)) {
    const archive = readFileSync(snapshotPath(group));
    const overlayText = readTranslations(group);
    const overlay = overlayText && JSON.parse(overlayText);
    const digest = createHash("sha256")
      .update(archive)
      .update(overlayText)
      .digest("hex");
    const stamp = resolve(catalog, `.snapshot-${group}.json`);
    const cached = existsSync(stamp) && JSON.parse(readFileSync(stamp, "utf8"));
    if (
      cached?.digest === digest &&
      cached.files.every((file) => existsSync(resolve(catalog, file)))
    )
      continue;

    const entries = JSON.parse(gunzipSync(archive));
    for (const [file, content] of Object.entries(entries)) {
      if (
        !groups[group].some((name) => file === `${name}.json`) &&
        !/^(php|web)\/[\p{L}\d_@+.,%()# -]+\.json$/u.test(file)
      )
        throw new Error(`Invalid reference snapshot path: ${file}`);
      const destination = resolve(catalog, file);
      mkdirSync(dirname(destination), { recursive: true });
      writeFileSync(destination, translate(file, content, overlay));
    }
    writeFileSync(
      stamp,
      JSON.stringify({ digest, files: Object.keys(entries) }),
    );
  }
}

function pack(group) {
  mkdirSync(snapshots, { recursive: true });
  const entries = Object.fromEntries(
    filesFor(group).map((file) => [
      file,
      readFileSync(resolve(catalog, file), "utf8"),
    ]),
  );
  writeFileSync(
    snapshotPath(group),
    gzipSync(JSON.stringify(entries), { level: 9 }),
  );
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const [command, group] = process.argv.slice(2);
  if (command === "restore" && !group) restoreReferenceSnapshots();
  else if (command === "pack" && Object.hasOwn(groups, group)) pack(group);
  else throw new Error("Usage: reference-snapshots.mjs restore | pack <group>");
}
