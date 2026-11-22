import { knowledgeKey, knowledgeManifest } from "./knowledge";
import {
  createGlobalSearchIndex,
  firstPageLimit,
  searchKnowledge,
} from "./search";
import { courses } from "./catalog";
import { loadCompressedJson } from "./load-compressed-json";
import {
  inheritedJavaMembers,
  isDeclaredJavaMember,
  javaMemberQuery,
} from "./java-member-search";

const catalogs = new Map();
const active = new Set();
let lastSearch;

function load(key, base) {
  if (!catalogs.has(key)) {
    const language = Object.hasOwn(knowledgeManifest, key);
    const file = language ? `entries-${key}` : key;
    const data = loadCompressedJson(`search-library/${file}.json.gz`, base)
      .then((entries) => {
        if (language) {
          for (const entry of entries) {
            entry.language = key;
            entry.kind ??= "reference";
            entry.href ??= `#symbol/${entry.id}`;
          }
        }
        return entries;
      })
      .catch((error) => {
        catalogs.delete(key);
        throw error;
      });
    catalogs.set(key, data);
  }
  return catalogs.get(key);
}

function countFor(language, kind, category) {
  const languages =
    language === "all"
      ? Object.values(knowledgeManifest)
      : [knowledgeManifest[language]];
  return languages.reduce(
    (count, item) =>
      count +
      (category !== "all"
        ? item.groups[category] || 0
        : kind === "reference"
          ? item.references
          : item.entries),
    0,
  );
}

function allEntries(base) {
  if (!catalogs.has("all")) {
    const data = Promise.all(
      Object.keys(knowledgeManifest).map((language) => load(language, base)),
    )
      .then((parts) => parts.flat())
      .catch((error) => {
        catalogs.delete("all");
        throw error;
      });
    catalogs.set("all", data);
  }
  return catalogs.get("all");
}

async function run(id, request, base) {
  if (request.ids) {
    const wanted = new Set(request.ids);
    const languages = new Set(
      request.ids.map((entryId) =>
        entryId.startsWith("tag-")
          ? "html"
          : /^(?:web-)?([a-z]+)\d*-/.exec(entryId)?.[1],
      ),
    );
    const index = [...languages].every((language) =>
      Object.hasOwn(knowledgeManifest, language),
    )
      ? (
          await Promise.all(
            [...languages].map((language) => load(language, base)),
          )
        ).flat()
      : await allEntries(base);
    if (!active.has(id)) return null;
    const selected = new Map(
      index
        .filter((entry) => wanted.has(entry.id))
        .map((entry) => [entry.id, entry]),
    );
    return {
      items: request.ids
        .map((entryId) => selected.get(entryId))
        .filter(Boolean),
    };
  }
  const { language, kind, category, query, limit, includeCourses } = request;
  const key = knowledgeKey(language, kind, category);
  if (
    !query.trim() &&
    !includeCourses &&
    kind !== "guide" &&
    (category === "all" || key !== language) &&
    limit <= firstPageLimit
  ) {
    const preview = key === language ? `first-${key}-${kind}` : `first-${key}`;
    const items = await load(preview, base);
    return {
      items: items.slice(0, limit),
      total: countFor(language, kind, category),
    };
  }

  const searchKey = JSON.stringify([
    language,
    kind,
    category,
    query,
    includeCourses,
  ]);
  if (lastSearch?.key === searchKey)
    return {
      items: lastSearch.matches.slice(0, limit),
      total: lastSearch.matches.length,
    };

  const index = key === "all" ? await allEntries(base) : await load(key, base);
  if (!active.has(id)) return null;
  const matches = searchKnowledge(
    includeCourses ? createGlobalSearchIndex(courses, index) : index,
    query,
    { language, kind, category },
  );
  const member =
    (language === "java" || language === "all") && kind !== "guide"
      ? javaMemberQuery(query)
      : null;
  if (member && !matches.some((entry) => isDeclaredJavaMember(entry, member))) {
    const graph = await load("java-hierarchy", base).catch(() => null);
    if (!active.has(id)) return null;
    if (graph) {
      const java = await load("java", base);
      const inherited = inheritedJavaMembers(java, graph, member, category);
      const seen = new Set(inherited.map(({ id }) => id));
      const combined = [
        ...inherited,
        ...matches.filter((entry) => !seen.has(entry.id)),
      ];
      lastSearch = { key: searchKey, matches: combined };
      return { items: combined.slice(0, limit), total: combined.length };
    }
  }
  lastSearch = { key: searchKey, matches };
  return { items: matches.slice(0, limit), total: matches.length };
}

self.onmessage = async ({ data }) => {
  if (data.cancel !== undefined) {
    active.delete(data.cancel);
    return;
  }
  const { id, request, base } = data;
  active.add(id);
  try {
    const result = await run(id, request, base);
    if (active.has(id) && result) self.postMessage({ id, result });
  } catch {
    if (active.has(id)) self.postMessage({ id, error: true });
  } finally {
    active.delete(id);
  }
};
