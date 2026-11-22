import guides from "../data/lesson-index.json";
import { loadCompressedJson } from "./load-compressed-json";

const byLanguage = Map.groupBy(guides, ({ language }) => language);
for (const collection of byLanguage.values()) {
  collection.sort(
    (first, second) =>
      Number(first.title.startsWith("Proyecto:")) -
        Number(second.title.startsWith("Proyecto:")) ||
      first.number - second.number,
  );
}

export { guides };
export const courseGuides = (language) => byLanguage.get(language) || [];

const courseContent = new Map();

export async function loadGuide(language, number) {
  if (!courseGuides(language).some((guide) => guide.number === number))
    return null;
  if (!courseContent.has(language)) {
    const base = new URL(import.meta.env.BASE_URL, location.href);
    const pending = loadCompressedJson(
      `search-library/course-${language}.json.gz`,
      base,
    )
      .then((entries) => new Map(entries.map((entry) => [entry.number, entry])))
      .catch((error) => {
        courseContent.delete(language);
        throw error;
      });
    courseContent.set(language, pending);
  }
  return (await courseContent.get(language)).get(number) ?? null;
}
