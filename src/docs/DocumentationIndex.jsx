import React, { useMemo, useState } from "react";
import {
  ArrowUpRight,
  Search,
  X,
  ArrowRight,
  SlidersHorizontal,
} from "lucide-react";
import { courses, knowledgeIndex } from "../lib/catalog";
import { TechIcon } from "../app/Brand";
import { searchKnowledge } from "../lib/search";
import { documentationUrl } from "./routes";
import { groups, groupLabel } from "./catalog";
import HighlightMatch from "./components/HighlightMatch";

export default function DocumentationIndex({ initial }) {
  const [filters, setFilters] = useState(initial);
  const [category, setCategory] = useState("all");
  const [limit, setLimit] = useState(24);
  const results = useMemo(
    () =>
      searchKnowledge(knowledgeIndex, filters.query, filters).filter(
        (entry) => category === "all" || entry.group === category,
      ),
    [filters, category],
  );
  const name = courses.find((course) => course.id === filters.language)?.name;
  const canReference = ["all", "html"].includes(filters.language);

  function update(patch) {
    const next = { ...filters, ...patch };
    setFilters(next);
    setCategory("all");
    setLimit(24);
    history.replaceState(null, "", documentationUrl(next));
  }
  function pickCategory(value) {
    const next = { ...filters, language: "html", kind: "reference" };
    setFilters(next);
    setCategory(value);
    setLimit(24);
    history.replaceState(null, "", documentationUrl(next));
  }

  return (
    <div className="docs-index">
      <nav className="doc-breadcrumb" aria-label="Ruta de navegación">
        <a href="#home">Inicio</a>
        <span>/</span>
        <span aria-current="page">Consultar</span>
      </nav>
      <div className="docs-index-intro">
        <div>
          <h1>Consulta</h1>
          <p>Guías de siete lenguajes y referencia de elementos HTML.</p>
        </div>
        <a className="docs-feature" href="#reference/tag-details">
          <span>
            HTML <ArrowUpRight size={18} />
          </span>
          <code>&lt;details&gt;</code>
          <strong>Contenido desplegable</strong>
          <small>Explora el elemento y prueba su comportamiento nativo.</small>
        </a>
      </div>
      <div className="docs-index-layout">
        <aside className="docs-index-sidebar">
          <h2>Lenguajes</h2>
          <div
            className="docs-language-navigation"
            role="group"
            aria-label="Lenguaje de consulta"
          >
            <button
              aria-pressed={filters.language === "all"}
              onClick={() => update({ language: "all" })}
            >
              <span>Todos los lenguajes</span>
              <small>{knowledgeIndex.length}</small>
            </button>
            {courses.map((course) => (
              <button
                key={course.id}
                aria-pressed={filters.language === course.id}
                disabled={filters.kind === "reference" && course.id !== "html"}
                onClick={() => update({ language: course.id })}
              >
                <TechIcon id={course.id} />
                <span>{course.name}</span>
                <small>
                  {
                    knowledgeIndex.filter(
                      (entry) => entry.language === course.id,
                    ).length
                  }
                </small>
              </button>
            ))}
          </div>
          {canReference && filters.kind !== "guide" && (
            <div className="docs-category-navigation">
              <h2>Elementos HTML</h2>
              {groups.map(([id, label]) => (
                <button
                  key={id}
                  aria-pressed={category === id}
                  onClick={() => pickCategory(category === id ? "all" : id)}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </aside>
        <section className="docs-results" aria-label="Índice de contenidos">
          <form
            className="docs-search"
            role="search"
            onSubmit={(event) => event.preventDefault()}
          >
            <Search size={21} strokeWidth={1.6} />
            <input
              aria-label="Buscar en el índice"
              value={filters.query}
              placeholder="¿Qué necesitas consultar?"
              onChange={(event) => update({ query: event.target.value })}
            />
            {filters.query && (
              <button
                type="button"
                aria-label="Limpiar búsqueda del índice"
                onClick={() => update({ query: "" })}
              >
                <X size={17} />
              </button>
            )}
          </form>
          <div className="docs-mobile-language">
            <SlidersHorizontal size={16} />
            <select
              aria-label="Filtrar por lenguaje"
              value={filters.language}
              onChange={(event) => update({ language: event.target.value })}
            >
              <option value="all">Todos los lenguajes</option>
              {courses.map((course) => (
                <option
                  key={course.id}
                  value={course.id}
                  disabled={
                    filters.kind === "reference" && course.id !== "html"
                  }
                >
                  {course.name}
                </option>
              ))}
            </select>
          </div>
          <div className="docs-results-toolbar">
            <div
              className="docs-kind-tabs"
              role="group"
              aria-label="Tipo de contenido"
            >
              {[
                ["all", "Todo"],
                ["reference", "Elementos HTML"],
                ["guide", "Guías"],
              ].map(([id, label]) => (
                <button
                  key={id}
                  aria-pressed={filters.kind === id}
                  disabled={id === "reference" && !canReference}
                  onClick={() => update({ kind: id })}
                >
                  {label}
                </button>
              ))}
            </div>
            <span role="status">
              {results.length} {results.length === 1 ? "entrada" : "entradas"}
            </span>
          </div>
          <div className="docs-list-heading">
            <h2>
              {category !== "all"
                ? groupLabel(category)
                : name || "Toda la biblioteca"}
            </h2>
            {category !== "all" && (
              <button onClick={() => setCategory("all")}>
                Quitar categoría <X size={13} />
              </button>
            )}
          </div>
          {results.length ? (
            <ul className="docs-entry-list">
              {results.slice(0, limit).map((entry) => (
                <li key={entry.id}>
                  <a href={entry.href}>
                    <span
                      className={`docs-entry-icon ${entry.kind === "reference" ? "is-element" : ""}`}
                    >
                      {entry.kind === "reference" ? (
                        <span aria-hidden="true">&lt;/&gt;</span>
                      ) : (
                        <TechIcon id={entry.language} />
                      )}
                    </span>
                    <span className="docs-entry-text">
                      <strong
                        className={entry.kind === "reference" ? "is-code" : ""}
                      >
                        <HighlightMatch
                          text={entry.title}
                          query={filters.query}
                        />
                      </strong>
                      <small>
                        {entry.kind === "reference"
                          ? entry.description
                          : entry.summary}
                      </small>
                    </span>
                    <span className="docs-entry-kind">
                      {entry.kind === "reference"
                        ? groupLabel(entry.group)
                        : `${entry.description} · Guía`}
                    </span>
                    <ArrowUpRight size={17} />
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <div className="docs-empty">
              <Search size={30} strokeWidth={1.3} />
              <h3>No encontramos esa entrada</h3>
              <p>Prueba otra consulta o amplía los filtros.</p>
              <button
                className="button secondary"
                onClick={() =>
                  update({ language: "all", query: "", kind: "all" })
                }
              >
                Ver toda la biblioteca <ArrowRight size={16} />
              </button>
            </div>
          )}
          {results.length > limit && (
            <button
              className="docs-load-more"
              onClick={() => setLimit((value) => value + 24)}
            >
              Mostrar más entradas{" "}
              <span>{results.length - limit} restantes</span>
              <ArrowRight size={17} />
            </button>
          )}
        </section>
      </div>
    </div>
  );
}
