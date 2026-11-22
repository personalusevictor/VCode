const languages = new Set([
  "all",
  "html",
  "css",
  "javascript",
  "react",
  "php",
  "java",
  "sql",
  "typescript",
  "cpp",
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
  const params = new URLSearchParams(parameters);
  const section = params.get("section") || "";
  const category = params.get("category");
  if (page === "reference" && language !== "all")
    return { type: "reference", id: language, section };
  if (page === "symbol")
    return { type: "symbol", id: language, ...(section && { section }) };
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
      ...(params.get("view") === "index" ? { browse: true } : {}),
      ...(category && category.length < 100 ? { category } : {}),
    };
  return null;
}

export function documentationUrl({
  language = "all",
  query = "",
  kind = "all",
  category = "all",
  browse = false,
} = {}) {
  const filters = [];
  if (category !== "all")
    filters.push(`category=${encodeURIComponent(category)}`);
  if (browse) filters.push("view=index");
  const search = filters.length ? `?${filters.join("&")}` : "";
  return `#docs/${language}/${encodeURIComponent(query.trim())}/${kind}${search}`;
}

export const isPhpReferenceId = (id) =>
  /^php-(?:function|method|api|class|constant|variable|construct)-/.test(
    id || "",
  );

export function phpReferenceBucket(id) {
  let hash = 2166136261;
  for (let index = 0; index < id.length; index += 1)
    hash = Math.imul(hash ^ id.charCodeAt(index), 16777619);
  return hash & 511;
}

export const isJavaLibraryReferenceId = (id) => id?.startsWith("web-java-se-");

export function javaReferenceBucket(id) {
  let hash = 0;
  for (let index = 0; index < id.length; index += 1)
    hash = Math.imul(hash, 31) + id.charCodeAt(index);
  return hash & 63;
}
