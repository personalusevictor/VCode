export const normalizeKnowledge = (value) =>
  String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[<>]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export function searchKnowledge(
  index,
  query,
  { language = "all", kind = "all", limit = Infinity } = {},
) {
  const normalized = normalizeKnowledge(query),
    words = normalized.split(" ").filter(Boolean);
  return index
    .filter(
      (entry) =>
        (language === "all" || entry.language === language) &&
        (kind === "all" || entry.kind === kind) &&
        words.every((word) => entry.text.includes(word)),
    )
    .map((entry) => ({
      entry,
      score: normalized
        ? (normalizeKnowledge(entry.title) === normalized ? 100 : 0) +
          (normalizeKnowledge(entry.title).startsWith(normalized) ? 40 : 0) +
          words.filter((word) => normalizeKnowledge(entry.title).includes(word))
            .length *
            10 +
          (entry.kind === "reference" ? 2 : 0) +
          (entry.kind === "course" &&
          normalizeKnowledge(entry.title) === normalized &&
          !/[<>]/.test(query)
            ? 5
            : 0)
        : 0,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((result) => result.entry);
}

export function createGlobalSearchIndex(courses, knowledge) {
  return [
    ...courses.map((course) => ({
      id: `course-${course.id}`,
      title: course.name,
      summary: course.description,
      description: `${knowledge.filter((entry) => entry.language === course.id).length} entradas de consulta`,
      language: course.id,
      kind: "course",
      href: `#docs/${course.id}`,
      text: normalizeKnowledge(`${course.name} ${course.id}`),
    })),
    ...knowledge,
  ];
}
