export const firstPageLimit = 48;

export const normalizeKnowledge = (value) =>
  String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[<>]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const normalizedTitles = new WeakMap();
const normalizedTexts = new WeakMap();
const symbolTitles = new WeakMap();
const shortTitle = (title) =>
  title.replaceAll(".prototype.", ".").replace(/\(\)$/, "");
const symbolWords = (value) =>
  normalizeKnowledge(
    value.replace(/([a-z\d])([A-Z])/g, "$1 $2").replace(/[._:\\#()/-]/g, " "),
  );
function textOf(entry) {
  if (entry.text) return entry.text;
  if (!normalizedTexts.has(entry)) {
    normalizedTexts.set(
      entry,
      normalizeKnowledge(
        [
          entry.title,
          shortTitle(entry.title),
          entry.summary,
          entry.description,
          entry.group,
          ...(entry.aliases || []),
        ].join(" "),
      ),
    );
  }
  return normalizedTexts.get(entry);
}
const languageTerms = {
  cpp: ["c++", "cpp"],
  javascript: ["js", "javascript"],
  typescript: ["ts", "typescript"],
};
const relatedTerms = {
  cuadricula: "grid",
  rejilla: "grid",
  arreglo: "array",
  arreglos: "array",
  sesiones: "sesion",
  promesa: "promise",
  promesas: "promise",
};
const conversational = new Set([
  "a",
  "al",
  "como",
  "con",
  "cual",
  "de",
  "del",
  "el",
  "en",
  "es",
  "hace",
  "la",
  "las",
  "lo",
  "los",
  "me",
  "para",
  "puedo",
  "que",
  "se",
  "sirve",
  "un",
  "una",
  "usar",
  "utilizar",
  "y",
]);
const termsFor = (language) => languageTerms[language] || [language];

function matchesWord(entry, word) {
  const text = textOf(entry);
  return (
    text.includes(word) ||
    (entry.kind === "reference" &&
      word.endsWith("()") &&
      text.includes(word.slice(0, -2))) ||
    (Object.hasOwn(relatedTerms, word) && text.includes(relatedTerms[word])) ||
    termsFor(entry.language).includes(word)
  );
}
function titleOf(entry) {
  if (!normalizedTitles.has(entry))
    normalizedTitles.set(entry, normalizeKnowledge(entry.title));
  return normalizedTitles.get(entry);
}

function symbolsOf(entry) {
  if (!symbolTitles.has(entry)) {
    symbolTitles.set(
      entry,
      [entry.title, ...(entry.aliases || [])].map((value) =>
        symbolWords(shortTitle(value)),
      ),
    );
  }
  return symbolTitles.get(entry);
}

export function searchKnowledge(
  index,
  query,
  { language = "all", kind = "all", category = "all", limit = Infinity } = {},
) {
  const cleanQuery = query.trim().startsWith("¿")
    ? query.trim().replace(/^¿|\?$/g, "")
    : query;
  const literal = cleanQuery.trim();
  const normalized = normalizeKnowledge(literal);
  const tokens = normalized.split(" ").filter(Boolean);
  const significant = tokens.filter((word) => !conversational.has(word));
  const words = significant.length ? significant : tokens;
  const comparable = symbolWords(words.join(" "));
  const withoutLanguage = symbolWords(words.slice(1).join(" "));
  const angleQuery = /^<[^>]+>$/.test(query.trim());
  const results = [];
  for (const entry of index) {
    if (language !== "all" && entry.language !== language) continue;
    if (kind !== "all" && entry.kind !== kind) continue;
    if (category !== "all" && entry.group !== category) continue;
    if (!words.every((word) => matchesWord(entry, word))) continue;
    if (!normalized) {
      results.push({ entry, score: 0 });
      if (results.length >= limit) break;
      continue;
    }
    const title = titleOf(entry);
    const matchesAlias = entry.aliases?.some(
      (alias) =>
        shortTitle(normalizeKnowledge(alias)) === shortTitle(normalized),
    );
    const comparableName =
      words.length > 1 && termsFor(entry.language).includes(words[0])
        ? withoutLanguage
        : comparable;
    const matchesSpacedName =
      (words.length > 1 || comparableName !== shortTitle(normalized)) &&
      title !== normalized &&
      symbolsOf(entry).includes(comparableName);
    const score =
      (title === normalized ? 100 : 0) +
      (entry.title === literal ? 18 : 0) +
      (title === normalized && entry.kind === "course" && !angleQuery ? 5 : 0) +
      (entry.language === "html" &&
      entry.kind === "reference" &&
      angleQuery &&
      title === normalized
        ? 8
        : 0) +
      (title.startsWith(normalized)
        ? 40
        : title.includes(normalized)
          ? 22
          : 0) +
      (shortTitle(title) === shortTitle(normalized) ? 64 : 0) +
      (matchesAlias ? 100 : 0) -
      (entry.status?.includes("deprecated") ? 5 : 0) +
      (matchesSpacedName ? 110 : 0) +
      words.filter((word) => title.includes(word)).length * 10 +
      (entry.kind === "reference" ? 2 : 0) +
      (entry.featured && language === entry.language ? 6 : 0);
    results.push({ entry, score });
  }
  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ entry }) => entry);
}

export function createGlobalSearchIndex(courses, knowledge) {
  return [
    ...courses.map((course) => ({
      id: `course-${course.id}`,
      title: course.name,
      summary: course.description,
      description: `${course.lessons.length} lecciones · Ver el curso`,
      language: course.id,
      kind: "course",
      href: `#course/${course.id}`,
      text: normalizeKnowledge(
        `${course.name} ${course.id} ${course.id === "javascript" ? "js" : course.id === "typescript" ? "ts" : ""}`,
      ),
    })),
    ...knowledge,
  ];
}
