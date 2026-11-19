import RevealHeading from "../motion/RevealHeading";
import React, { useMemo, useState } from "react";
import { ArrowUpRight, Search, X } from "lucide-react";
import { courses } from "../../lib/catalog.js";
import { knowledgeIndex } from "../../lib/catalog.js";
import { searchKnowledge } from "../../lib/search.js";
import KnowledgeMark from "../components/KnowledgeMark.jsx";
export default function Library({ paused = false }) {
  const [query, setQuery] = useState("");
  const [language, setLanguage] = useState("all");
  const [kind, setKind] = useState("all");
  const matches = useMemo(
    () => searchKnowledge(knowledgeIndex, query, { language, kind }),
    [query, language, kind],
  );
  return (
    <section className="home-library" aria-labelledby="home-knowledge-title">
      <div className="library-emblem">
        <KnowledgeMark query={query} paused={paused} />
      </div>
      <div className="library-console">
        <RevealHeading id="home-knowledge-title">Busca en VCode</RevealHeading>
        <form
          role="search"
          aria-label="Consultar la biblioteca"
          onSubmit={(event) => {
            event.preventDefault();
            location.hash = `#docs/${language}/${encodeURIComponent(query.trim())}${kind === "all" ? "" : `/${kind}`}`;
          }}
        >
          <div className="library-searchbar">
            <Search size={22} strokeWidth={1.5} />
            <input
              type="search"
              aria-label="Buscar en guías y referencias"
              placeholder="¿Qué necesitas consultar?"
              autoComplete="off"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            {query && (
              <button
                type="button"
                aria-label="Limpiar consulta"
                onClick={() => setQuery("")}
              >
                <X size={17} />
              </button>
            )}
            <button
              type="submit"
              className="library-submit"
              aria-label="Ver todos los resultados"
            >
              <ArrowUpRight size={21} />
            </button>
          </div>
          <div className="library-refiners">
            <select
              aria-label="Lenguaje de consulta"
              value={language}
              onChange={(event) => setLanguage(event.target.value)}
            >
              <option value="all">Todos los lenguajes</option>
              {courses.map((course) => (
                <option
                  key={course.id}
                  value={course.id}
                  disabled={kind === "reference" && course.id !== "html"}
                >
                  {course.name}
                </option>
              ))}
            </select>
            <select
              aria-label="Tipo de consulta"
              value={kind}
              onChange={(event) => setKind(event.target.value)}
            >
              <option value="all">Guías y referencias</option>
              <option value="guide">Solo guías</option>
              <option
                value="reference"
                disabled={language !== "all" && language !== "html"}
              >
                Referencia HTML
              </option>
            </select>
          </div>
        </form>
        {query.trim() && (
          <div className="library-results">
            <p role="status">
              {matches.length}{" "}
              {matches.length === 1 ? "coincidencia" : "coincidencias"}
            </p>
            <ul>
              {matches.slice(0, 4).map((entry) => (
                <li key={entry.id}>
                  <a href={entry.href}>
                    <span>
                      <strong>{entry.title}</strong>
                      <small>
                        {entry.kind === "reference"
                          ? "Referencia HTML"
                          : `${entry.description} · Guía`}
                      </small>
                    </span>
                    <ArrowUpRight size={17} />
                  </a>
                </li>
              ))}
            </ul>
            {!matches.length && (
              <p>No hay coincidencias. Cambia la consulta o los filtros.</p>
            )}
          </div>
        )}
        <a className="library-index" href="#docs">
          Ver el índice completo
          <ArrowUpRight size={16} />
        </a>
      </div>
    </section>
  );
}
