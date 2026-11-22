import languages from "../data/languages.json";
export const courses = languages;
export const techIcon = (id) =>
  `${import.meta.env.BASE_URL}technologies/${id}.svg`;
