const languages = new Set([
  "all",
  "html",
  "css",
  "javascript",
  "react",
  "php",
  "java",
  "sql",
]);
const kinds = new Set(["all", "guide", "reference"]);
export const decodeQuery = (value = "") => {
  try {
    return decodeURIComponent(value);
  } catch {
    return "";
  }
};

export function parseDocumentationRoute(route) {
  const [path, parameters = ""] = route.split("?");
  const [page, language = "all", query = "", kind = "all"] = path.split("/");
  const section = new URLSearchParams(parameters).get("section") || "";
  if (page === "reference" && language !== "all")
    return { type: "reference", id: language, section };
  if (page === "lesson")
    return {
      type: "guide",
      language,
      number: /^[1-9]\d*$/.test(query) ? Number(query) : 0,
      section,
    };
  if (page === "docs" || page === "reference")
    return {
      type: "index",
      language:
        page === "reference"
          ? "html"
          : languages.has(language)
            ? language
            : "all",
      query: decodeQuery(query),
      kind: page === "reference" ? "reference" : kinds.has(kind) ? kind : "all",
    };
  return null;
}

export function documentationUrl({
  language = "all",
  query = "",
  kind = "all",
} = {}) {
  return `#docs/${language}/${encodeURIComponent(query.trim())}/${kind}`;
}
