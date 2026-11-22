import manifest from "../data/search-manifest.json";

export const knowledgeManifest = manifest;
export const knowledgeCount = Object.values(manifest).reduce(
  (total, { entries }) => total + entries,
  0,
);

export function knowledgeKey(language, kind, category = "all") {
  if (kind === "guide") return "guides";
  const scopes = manifest[language]?.scopes;
  return category !== "all" && scopes && Object.hasOwn(scopes, category)
    ? scopes[category]
    : language;
}
