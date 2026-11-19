import React, { useId, useRef, useState } from "react";
import { ArrowUpRight, BookOpen, ScanSearch } from "lucide-react";
import { courses } from "../../lib/catalog.js";
import { TechIcon } from "../../app/Brand.jsx";
import LanguageArtwork from "../scene/LanguageArtwork.jsx";

const descriptions = {
  html: [
    "Estructura y significado",
    "Elementos y atributos para estructurar documentos, formularios y contenido accesible.",
  ],
  css: [
    "Diseño y presentación",
    "Propiedades y reglas para definir tipografía, color, distribución y movimiento.",
  ],
  javascript: [
    "Lógica e interacción",
    "Funciones, eventos, datos y asincronía para dar comportamiento a una aplicación.",
  ],
  react: [
    "Interfaces por componentes",
    "Componentes, estado y hooks para construir y organizar interfaces.",
  ],
  php: [
    "Aplicaciones en el servidor",
    "Peticiones, formularios, sesiones y bases de datos en el servidor.",
  ],
  java: [
    "Programación orientada a objetos",
    "Tipos, clases, colecciones y concurrencia para construir aplicaciones.",
  ],
  sql: [
    "Consulta y gestión de datos",
    "Consultas, relaciones, transacciones e índices para trabajar con bases de datos.",
  ],
};

const context = {
  html: "Aprenderás a crear documentos accesibles, formularios con validación nativa e imágenes adaptables.",
  css: "Construye composiciones con Flexbox y Grid, organiza temas y controla el movimiento de forma accesible.",
  javascript:
    "Responde a eventos, transforma datos y conecta una página con servicios usando promesas, async y fetch.",
  react:
    "Compón piezas reutilizables, comparte datos y sincroniza efectos con el estado de la aplicación.",
  php: "Valida formularios, gestiona sesiones y trabaja con bases de datos mediante consultas preparadas.",
  java: "Organiza colecciones, controla errores y aprende a coordinar tareas concurrentes.",
  sql: "Combina tablas con JOIN, agrupa resultados y protege los cambios con transacciones.",
};
const topics = {
  html: [
    [3, "Semántica"],
    [6, "Formularios"],
    [7, "Accesibilidad"],
  ],
  css: [
    [4, "Flexbox"],
    [5, "Grid"],
    [10, "Container queries"],
  ],
  javascript: [
    [3, "Funciones"],
    [6, "DOM y eventos"],
    [7, "Asincronía"],
  ],
  react: [
    [1, "Componentes"],
    [4, "Estado"],
    [7, "Efectos"],
  ],
  php: [
    [5, "Formularios"],
    [7, "PDO"],
    [9, "Seguridad"],
  ],
  java: [
    [4, "Clases"],
    [6, "Colecciones"],
    [10, "Concurrencia"],
  ],
  sql: [
    [5, "JOIN"],
    [9, "Transacciones"],
    [11, "Índices"],
  ],
};

export default function LanguageExplorer({ paused = false }) {
  const [selected, setSelected] = useState("html");
  const [focused, setFocused] = useState("html");
  const id = useId(),
    tabs = useRef([]);
  const index = courses.findIndex((course) => course.id === selected);
  const course = courses[index];

  function navigate(event, index) {
    let next;
    if (event.key === "ArrowRight") next = (index + 1) % courses.length;
    if (event.key === "ArrowLeft")
      next = (index + courses.length - 1) % courses.length;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = courses.length - 1;
    if (next === undefined) return;
    event.preventDefault();
    setFocused(courses[next].id);
    tabs.current[next]?.focus({ preventScroll: true });
  }

  return (
    <section
      className="language-explorer"
      id="home-languages"
      aria-label="Explora los siete lenguajes"
    >
      <h2 className="sr-only">Siete lenguajes para explorar</h2>
      <div className="language-tabs" role="tablist" aria-label="Lenguajes">
        {courses.map((course, index) => (
          <button
            key={course.id}
            ref={(node) => {
              tabs.current[index] = node;
            }}
            role="tab"
            id={`${id}-${course.id}`}
            aria-selected={selected === course.id}
            aria-controls={`${id}-panel`}
            tabIndex={focused === course.id ? 0 : -1}
            onClick={() => {
              setSelected(course.id);
              setFocused(course.id);
            }}
            onKeyDown={(event) => navigate(event, index)}
          >
            <TechIcon id={course.id} />
            <span>{course.name}</span>
          </button>
        ))}
      </div>
      <div
        className="language-overview"
        role="tabpanel"
        id={`${id}-panel`}
        aria-labelledby={`${id}-${selected}`}
      >
        <div className="language-introduction">
          <LanguageArtwork course={course} paused={paused} />
          <h3 className="sr-only">{course.name}</h3>
          <p className="language-description">{descriptions[selected][1]}</p>
          <p className="language-context">{context[selected]}</p>
          <nav
            className="language-topics"
            aria-label={`Temas de ${course.name}`}
          >
            {topics[selected].map(([lesson, label]) => (
              <a key={lesson} href={`#lesson/${selected}/${lesson}`}>
                {label}
                <ArrowUpRight size={12} />
              </a>
            ))}
          </nav>
        </div>
        <div className="language-contents">
          <a className="language-entry" href={`#course/${selected}`}>
            <BookOpen size={19} strokeWidth={1.5} />
            <div>
              <span>APRENDER</span>
              <strong>Recorrer {course.name}</strong>
              <p>
                Desde los fundamentos hasta un proyecto, en{" "}
                {course.lessons.length} lecciones.
              </p>
            </div>
            <ArrowUpRight size={18} />
          </a>
          <a className="language-entry" href={`#docs/${selected}`}>
            <ScanSearch size={19} strokeWidth={1.5} />
            <div>
              <span>CONSULTAR</span>
              <strong>
                {selected === "html"
                  ? "Elementos, atributos y guías"
                  : "Buscar un concepto"}
              </strong>
              <p>
                {selected === "html"
                  ? "Referencia de etiquetas y acceso directo a los temas de HTML."
                  : `Encuentra un tema de ${course.name} y entra directamente en su explicación.`}
              </p>
            </div>
            <ArrowUpRight size={18} />
          </a>
        </div>
      </div>
    </section>
  );
}
