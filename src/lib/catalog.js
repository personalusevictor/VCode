import languages from "../data/languages.json";
import index from "../data/search-index.json";
export const courses = languages;
export const knowledgeIndex = index;
export const techIcon = (id) =>
  `${import.meta.env.BASE_URL}technologies/${id === "sql" ? "postgresql" : id}.svg`;
