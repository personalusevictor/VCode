import RevealHeading from "../motion/RevealHeading";
import React, { useState } from "react";
import { ArrowUpRight, Search, X } from "lucide-react";
import { courses } from "../../lib/catalog.js";
import ChoiceMenu from "../../app/ChoiceMenu";
import useKnowledge from "../../lib/useKnowledge";
import KnowledgeMark from "../components/KnowledgeMark.jsx";
export default function Library({ paused = false }) {
  const [query, setQuery] = useState("");
  const [language, setLanguage] = useState("all");
  const [kind, setKind] = useState("all");
  const hasQuery = Boolean(query.trim());
  const { data: knowledgeIndex, error: loadError } = useKnowledge(
    { language, kind, query, limit: 4 },
    hasQuery,
  );
  const matches = knowledgeIndex?.items || [];
  const total = knowledgeIndex?.total || 0;
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
            <ChoiceMenu
              label="Lenguaje de consulta"
              value={language}
              options={[
                ["all", "Todos los lenguajes"],
                ...courses.map((course) => [course.id, course.name]),
              ]}
              onChange={setLanguage}
            />
            <ChoiceMenu
              label="Tipo de consulta"
              value={kind}
              options={[
                ["all", "Guías y referencias"],
                ["guide", "Solo guías"],
                ["reference", "Solo referencias"],
              ]}
              onChange={setKind}
            />
          </div>
        </form>
        {hasQuery && !knowledgeIndex && (
          <p className="work-muted" role="status">
            {loadError
              ? "Abre el índice para continuar la búsqueda."
              : "Cargando el índice…"}
          </p>
        )}
        {hasQuery && knowledgeIndex && (
          <div className="library-results">
            <p role="status">
              {total} {total === 1 ? "coincidencia" : "coincidencias"}
            </p>
            <ul>
              {matches.map((entry) => (
                <li key={entry.id}>
                  <a href={entry.href}>
                    <span>
                      <strong>{entry.title}</strong>
                      <small>
                        {entry.kind === "reference"
                          ? entry.description + " · Referencia"
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
        <a className="library-index" href="#docs?view=index">
          Ver el índice completo
          <ArrowUpRight size={16} />
        </a>
      </div>
    </section>
  );
}
