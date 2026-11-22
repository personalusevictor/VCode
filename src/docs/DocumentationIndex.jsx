import React, { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Search, X, ArrowRight, Layers2 } from "lucide-react";
import { courses } from "../lib/catalog";
import { knowledgeManifest } from "../lib/knowledge";
import useKnowledge from "../lib/useKnowledge";
import useSettledQuery from "../lib/useSettledQuery";
import ChoiceMenu from "../app/ChoiceMenu";
import { TechIcon } from "../app/Brand";
import { documentationUrl } from "./routes";
import { groups, groupLabel, languageName } from "./taxonomy";
import HighlightMatch from "./components/HighlightMatch";

const pageSize = 8;
const countFormat = new Intl.NumberFormat("es-ES");

const phpGroups = Object.entries(knowledgeManifest.php.groups).sort(
  ([a], [b]) => a.localeCompare(b, "es"),
);
const cssGroups = [
  ["css-properties", "Propiedades"],
  ["css-atrules", "Reglas @"],
  ["css-selectors", "Selectores"],
  ["css-functions", "Funciones"],
  ["css-descriptors", "Descriptores"],
  ["css-values", "Valores"],
  ["css-media-features", "Características de medios"],
];
const jsGroups = [
  ["js-builtins", "Objetos integrados"],
  ["js-operators", "Operadores"],
  ["js-statements", "Sentencias"],
  ["js-classes-functions", "Clases y funciones"],
  ["js-regex", "Expresiones regulares"],
  ["js-concepts", "Conceptos"],
  ["DOM", "DOM"],
  ["Eventos web", "Eventos web"],
  ["Red y peticiones", "Red y peticiones"],
  ["Archivos y datos", "Archivos y datos"],
  ["Formularios web", "Formularios web"],
  ["Flujos y compresión", "Flujos y compresión"],
  ["Ventana y navegación", "Ventana y navegación"],
  ["Observadores", "Observadores"],
  ["Procesos web", "Procesos web"],
  ["Dibujo y medios", "Dibujo y medios"],
  ["Componentes web", "Componentes web"],
  ["Tiempo y rendimiento", "Tiempo y rendimiento"],
];
const topicGroups = Object.fromEntries(
  ["react", "typescript", "sql", "java", "cpp"].map((language) => [
    language,
    Object.keys(knowledgeManifest[language].groups)
      .sort((a, b) => a.localeCompare(b, "es"))
      .map((label) => [label, label]),
  ]),
);
const htmlGroups = [
  ...groups,
  ["html-attributes", "Atributos HTML"],
  ["html-events", "Atributos de evento"],
];

export default function DocumentationIndex({ initial }) {
  const [filters, setFilters] = useState(initial);
  const [saved] = useState(() => history.state?.documentationIndex);
  const query = filters.query.trim();
  const [settledQuery, settleQuery] = useSettledQuery(query);
  const [page, setPage] = useState({ query, limit: saved?.limit ?? pageSize });
  const limit = page.query === settledQuery ? page.limit : pageSize;
  const restoreResult = useRef(saved?.focusedId);
  const resultList = useRef(null);
  const field = useRef(null);
  const openWhenReady = useRef(false);
  const name = courses.find((course) => course.id === filters.language)?.name;
  const php = filters.language === "php";
  const languageGroups = {
    all: htmlGroups,
    html: htmlGroups,
    css: cssGroups,
    javascript: jsGroups,
    ...topicGroups,
  };
  const categories = php
    ? phpGroups.map(([label]) => [label, label])
    : languageGroups[filters.language] || [];
  const category = categories.some(([id]) => filters.category === id)
    ? filters.category
    : "all";
  const canFilterGroups =
    filters.language !== "all" &&
    filters.kind !== "guide" &&
    categories.length > 0;
  const hasQuery = Boolean(settledQuery);
  const showResults = Boolean(
    filters.browse ||
    hasQuery ||
    filters.language !== "all" ||
    filters.kind !== "all",
  );
  const { data, error, retry, loading, previous } = useKnowledge(
    { ...filters, query: settledQuery, category, limit },
    showResults,
  );
  const updating = query !== settledQuery || loading;
  const shown = data || (updating ? previous?.data : undefined);
  const displayedQuery = data ? settledQuery : previous?.query || "";
  const results = shown?.items || [];
  const total = shown?.total || 0;
  const canReference =
    filters.language === "all" ||
    Boolean(knowledgeManifest[filters.language]?.references);

  useEffect(() => {
    if (!restoreResult.current || updating || !data) return;
    const id = restoreResult.current;
    restoreResult.current = null;
    const target = document.getElementById(`doc-result-${id}`);
    if (!target) return;
    target.focus({ preventScroll: true });
    target.scrollIntoView({ behavior: "instant", block: "center" });
  }, [data, updating]);

  useEffect(() => {
    if (updating || !openWhenReady.current) return;
    openWhenReady.current = false;
    if (data) resultList.current?.querySelector("a")?.click();
  }, [data, updating]);

  function savePosition(limit, focusedId) {
    history.replaceState(
      { ...history.state, documentationIndex: { limit, focusedId } },
      "",
    );
  }

  function showMore() {
    const next = limit + pageSize;
    setPage({ query: settledQuery, limit: next });
    savePosition(next);
  }

  function submit(event) {
    event.preventDefault();
    if (!query) return;
    if (updating) {
      openWhenReady.current = true;
      settleQuery(query);
      return;
    }
    resultList.current?.querySelector("a")?.click();
  }

  function update(patch) {
    const changedLanguage =
      patch.language && patch.language !== filters.language;
    const resetCategory = changedLanguage || patch.kind === "guide";
    const next = {
      ...filters,
      ...(resetCategory && { category: "all" }),
      ...patch,
    };
    setFilters(next);
    if (patch.query === undefined || !next.query.trim()) {
      const nextQuery = next.query.trim();
      settleQuery(nextQuery);
      setPage({ query: nextQuery, limit: pageSize });
    }
    restoreResult.current = null;
    openWhenReady.current = false;
    history.replaceState(
      { ...history.state, documentationIndex: null },
      "",
      documentationUrl(next),
    );
  }
  function pickCategory(value) {
    update({
      kind: "reference",
      category: value,
    });
  }

  return (
    <div className="docs-index">
      <header className="docs-index-intro">
        <h1>Buscar en VCode</h1>
        <form className="docs-search" role="search" onSubmit={submit}>
          <Search size={24} strokeWidth={1.65} aria-hidden="true" />
          <input
            ref={field}
            aria-label="Buscar en el índice"
            value={filters.query}
            placeholder="Busca una función, propiedad o guía…"
            onChange={(event) => update({ query: event.target.value })}
          />
          {filters.query && (
            <button
              type="button"
              aria-label="Limpiar búsqueda del índice"
              onClick={() => {
                update({ query: "" });
                field.current.focus();
              }}
            >
              <X size={17} />
            </button>
          )}
          <button
            type="submit"
            className="docs-query-submit"
            aria-label="Abrir primer resultado"
            disabled={!filters.query.trim()}
          >
            <ArrowRight size={19} />
          </button>
        </form>
        <div
          className="docs-language-picker"
          role="group"
          aria-label="Filtrar por lenguaje"
        >
          <button
            type="button"
            aria-pressed={filters.language === "all"}
            onClick={() => update({ language: "all" })}
          >
            <Layers2 size={27} strokeWidth={1.55} aria-hidden="true" />
            <span>Todos</span>
          </button>
          {courses.map(({ id, name }) => (
            <button
              key={id}
              type="button"
              aria-pressed={filters.language === id}
              onClick={() => update({ language: id })}
            >
              <TechIcon id={id} />
              <span>{name}</span>
            </button>
          ))}
        </div>
      </header>
      {showResults ? (
        <section className="docs-results" aria-label="Índice de contenidos">
          <div className="docs-filters">
            <div
              className="docs-kind-tabs"
              role="group"
              aria-label="Tipo de contenido"
            >
              {[
                ["all", "Todo"],
                ["reference", "Referencias"],
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
            <div className="docs-selects">
              {canFilterGroups && (
                <ChoiceMenu
                  label={
                    php ? "Filtrar por módulo PHP" : "Filtrar por categoría"
                  }
                  value={category}
                  options={
                    php
                      ? [
                          ["all", "Todos los módulos"],
                          ...phpGroups.map(([label, count]) => [
                            label,
                            `${label} · ${countFormat.format(count)}`,
                          ]),
                        ]
                      : [["all", "Todas las categorías"], ...categories]
                  }
                  onChange={(value) =>
                    value === "all"
                      ? update({ category: "all" })
                      : pickCategory(value)
                  }
                />
              )}
            </div>
          </div>
          <div className="docs-list-heading">
            <h2>
              {category !== "all"
                ? categories.find(([id]) => id === category)?.[1] ||
                  groupLabel(category)
                : name || "Toda la biblioteca"}
            </h2>
            <span
              role="status"
              aria-busy={updating}
              data-updating={updating || undefined}
            >
              {shown
                ? `${countFormat.format(total)} ${total === 1 ? "entrada" : "entradas"}`
                : error
                  ? "Índice no disponible"
                  : ""}
            </span>
          </div>
          {!shown ? (
            <div className="docs-empty">
              <p>
                {error
                  ? "No se pudo abrir el índice de este lenguaje."
                  : "Buscando…"}
              </p>
              {error && (
                <button className="button secondary" onClick={retry}>
                  Volver a intentar
                </button>
              )}
            </div>
          ) : results.length ? (
            <ul className="docs-entry-list" ref={resultList}>
              {results.map((entry) => (
                <li key={entry.id}>
                  <a
                    id={`doc-result-${entry.id}`}
                    href={entry.href}
                    onClick={(event) => {
                      if (
                        !event.metaKey &&
                        !event.ctrlKey &&
                        !event.shiftKey &&
                        !event.altKey
                      )
                        savePosition(limit, entry.id);
                    }}
                  >
                    <TechIcon id={entry.language} />
                    <span className="docs-entry-text">
                      <strong
                        className={entry.kind === "reference" ? "is-code" : ""}
                      >
                        <HighlightMatch
                          text={entry.title}
                          query={displayedQuery}
                        />
                      </strong>
                      {displayedQuery && (
                        <small>{entry.summary || entry.description}</small>
                      )}
                    </span>
                    <span className="docs-entry-kind">
                      {entry.kind === "reference"
                        ? entry.module
                          ? entry.group
                          : `${languageName(entry.language)} · ${entry.description}`
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
                  update({
                    language: "all",
                    query: "",
                    kind: "all",
                    category: "all",
                    browse: true,
                  })
                }
              >
                Ver toda la biblioteca <ArrowRight size={16} />
              </button>
            </div>
          )}
          {total > results.length && (
            <button
              className="docs-load-more"
              disabled={updating}
              onClick={showMore}
            >
              Mostrar más entradas
              <ArrowRight size={17} />
            </button>
          )}
        </section>
      ) : (
        <div className="docs-browse">
          <a href={documentationUrl({ browse: true })}>
            Explorar el índice completo{" "}
            <ArrowUpRight size={16} aria-hidden="true" />
          </a>
        </div>
      )}
    </div>
  );
}
