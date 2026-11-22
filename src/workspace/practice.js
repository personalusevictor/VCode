import exercises from "./practice.json" with { type: "json" };

const byId = new Map(exercises.map((exercise) => [exercise.id, exercise]));
const byLanguage = Map.groupBy(exercises, (exercise) => exercise.language);

export const practiceById = (id) => byId.get(id);
export const practiceForLanguage = (language) => byLanguage.get(language) ?? [];

export function practiceUrl({ id, language }, starter = true) {
  return `#playground?language=${language}&example=${id}${starter ? "&variant=starter" : ""}`;
}

export function practiceExample(id, variant) {
  const exercise = practiceById(id);
  if (!exercise) return null;
  const solution = variant !== "starter";
  return {
    practice: exercise,
    language: exercise.language,
    code: solution ? exercise.solution : exercise.starter,
    markup: exercise.markup,
    files: exercise.files,
    parameters: exercise.parameters,
    typeOptions: exercise.typeOptions,
    solution,
  };
}

export function practiceMatches(expected, logs, tables) {
  if (Array.isArray(expected))
    return (
      tables?.length === 1 &&
      !tables[0].truncated &&
      JSON.stringify(tables[0].values) === JSON.stringify(expected)
    );
  return (
    logs
      .filter(({ type }) => type === "log")
      .map(({ value }) => value.trimEnd())
      .join("\n")
      .trim() === expected.trim()
  );
}
