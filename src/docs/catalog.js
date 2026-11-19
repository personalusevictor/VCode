import references from "./data/html-reference.json";
import guides from "./data/guides.json";
import { courses } from "../lib/catalog";

export const groups = [
  ["documento", "Documento"],
  ["semantica", "Estructura y semántica"],
  ["texto", "Texto y enlaces"],
  ["multimedia", "Imágenes, vídeo y tablas"],
  ["formularios", "Formularios"],
  ["interaccion", "Interacción"],
];
export { references, guides };
export const referenceById = (id) =>
  references.find((entry) => entry.id === id);
export const guideByRoute = (language, number) =>
  guides.find(
    (entry) => entry.language === language && entry.number === number,
  );
export const groupLabel = (id) =>
  groups.find(([key]) => key === id)?.[1] || "Guía";
export const languageName = (id) =>
  courses.find((course) => course.id === id)?.name || id;
