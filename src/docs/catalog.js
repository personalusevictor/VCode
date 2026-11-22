import references from "./data/html-reference.json";
import { guides, loadGuide } from "../lib/curriculum";

export { references, guides };
export async function exampleById(id) {
  if (!id) return null;
  const html = referenceById(id);
  if (html) return { language: "html", code: html.code };
  const lesson = guides.find((guide) => guide.id === id);
  const guide = lesson && (await loadGuide(lesson.language, lesson.number));
  if (!guide) return null;
  if (guide.labCode)
    return {
      ...guide,
      code: guide.labCode,
      files: guide.labFiles,
      lessonLanguage: guide.language,
      language: guide.labLanguage ?? guide.language,
    };
  return guide;
}
export const referenceById = (id) =>
  references.find((entry) => entry.id === id);
