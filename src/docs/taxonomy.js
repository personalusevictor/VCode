import { courses } from "../lib/catalog";

export const groups = [
  ["documento", "Documento"],
  ["semantica", "Estructura y semántica"],
  ["texto", "Texto y enlaces"],
  ["multimedia", "Imágenes, vídeo y tablas"],
  ["formularios", "Formularios"],
  ["interaccion", "Interacción"],
];
export const groupLabel = (id) =>
  id === "html-attributes"
    ? "Atributo HTML"
    : id === "html-events"
      ? "Atributo de evento"
      : groups.find(([key]) => key === id)?.[1] || "Guía";
export const languageName = (id) =>
  courses.find((course) => course.id === id)?.name || id;
