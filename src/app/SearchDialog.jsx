import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  X,
  ArrowUpRight,
  ArrowUp,
  ArrowDown,
  CornerDownLeft,
  Clock3,
  ArrowRight,
  SlidersHorizontal,
  Trash2,
} from "lucide-react";
import { courses, knowledgeIndex } from "../lib/catalog";
import { createGlobalSearchIndex, searchKnowledge } from "../lib/search";
import { readHistory, clearHistory } from "../lib/readingHistory";
import { documentationUrl } from "../docs/routes";
import HighlightMatch from "../docs/components/HighlightMatch";
import { Mark, TechIcon } from "./Brand";

const featured = [
  "tag-details",
  "tag-form",
  "tag-input",
  "tag-img",
  "tag-button",
];
const label = {
  reference: "Referencia HTML",
  guide: "Guía",
  course: "Lenguaje",
};

export default function SearchDialog({ onClose }) {
  const dialog = useRef();
  const input = useRef();
  const [query, setQuery] = useState("");
  const [language, setLanguage] = useState("all");
  const [kind, setKind] = useState("all");
  const [selected, setSelected] = useState(0);
  const index = useMemo(
    () => createGlobalSearchIndex(courses, knowledgeIndex),
    [],
  );
  const [recent, setRecent] = useState(() => readHistory(index));
  const matches = useMemo(
    () => searchKnowledge(index, query, { language, kind }),
    [index, query, language, kind],
  );
  const isQuickAccess = !query.trim() && language === "all" && kind === "all";
  const results = useMemo(() => {
    if (!isQuickAccess) return matches.slice(0, 12);
    return [
      ...new Map(
        [
          ...recent,
          ...featured.map((id) => index.find((entry) => entry.id === id)),
        ]
          .filter(Boolean)
          .map((entry) => [entry.id, entry]),
      ).values(),
    ].slice(0, 8);
  }, [matches, isQuickAccess, recent, index]);
  const selection = Math.min(selected, Math.max(0, results.length - 1));
  const current = results[selection];

  useEffect(() => {
    const node = dialog.current;
    const trigger = document.activeElement;
    const viewport = window.visualViewport;
    const resize = () => {
      const available = viewport?.height || window.innerHeight;
      node.style.setProperty("--search-available", `${available}px`);
      node.dataset.compact = String(available < 500);
    };
    resize();
    viewport?.addEventListener("resize", resize);
    window.addEventListener("resize", resize);
    node.showModal();
    input.current.focus();
    return () => {
      viewport?.removeEventListener("resize", resize);
      window.removeEventListener("resize", resize);
      node.close();
      if (trigger?.isConnected && trigger instanceof HTMLElement)
        trigger.focus({ preventScroll: true });
    };
  }, []);
  useEffect(() => setSelected(0), [query, language, kind]);
  useEffect(() => {
    document
      .getElementById(`search-option-${current?.id}`)
      ?.scrollIntoView({ block: "nearest" });
  }, [current?.id]);

  function open(entry) {
    location.hash = entry.href;
    onClose();
  }
  function keyboard(event) {
    if (event.nativeEvent.isComposing) return;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (results.length)
        setSelected(
          (selection + (event.key === "ArrowDown" ? 1 : -1) + results.length) %
            results.length,
        );
    }
    if (event.key === "Enter" && current) {
      event.preventDefault();
      open(current);
    }
  }
  function reset() {
    setQuery("");
    setLanguage("all");
    setKind("all");
    input.current.focus();
  }

  return (
    <dialog
      ref={dialog}
      className="search-dialog"
      aria-labelledby="search-dialog-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="search-panel-top">
        <div>
          <Mark />
          <h2 id="search-dialog-title">Buscar en VCode</h2>
        </div>
        <button
          className="search-close"
          aria-label="Cerrar búsqueda"
          onClick={onClose}
        >
          <kbd>esc</kbd>
          <X size={17} />
        </button>
      </div>
      <div className="search-panel-field">
        <Search size={24} strokeWidth={1.5} />
        <input
          ref={input}
          role="combobox"
          aria-expanded="true"
          aria-autocomplete="list"
          aria-controls="search-list"
          aria-activedescendant={
            current ? `search-option-${current.id}` : undefined
          }
          aria-label="Buscar en todo VCode"
          placeholder="¿Qué necesitas encontrar?"
          autoComplete="off"
          spellCheck={false}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={keyboard}
        />
        {query && (
          <button
            aria-label="Limpiar consulta"
            onClick={() => {
              setQuery("");
              input.current.focus();
            }}
          >
            <X size={18} />
          </button>
        )}
      </div>
      <div className="search-panel-filters">
        <div
          className="search-language-pills"
          role="group"
          aria-label="Lenguaje de búsqueda"
        >
          <button
            aria-pressed={language === "all"}
            onClick={() => setLanguage("all")}
          >
            Todos
          </button>
          {courses.map((course) => (
            <button
              key={course.id}
              aria-pressed={language === course.id}
              disabled={kind === "reference" && course.id !== "html"}
              onClick={() => setLanguage(course.id)}
            >
              {course.name}
            </button>
          ))}
        </div>
        <label className="search-kind-filter">
          <SlidersHorizontal size={14} />
          <span className="sr-only">Tipo de resultado</span>
          <select
            aria-label="Tipo de resultado"
            value={kind}
            onChange={(event) => setKind(event.target.value)}
          >
            <option value="all">Todo el contenido</option>
            <option
              value="reference"
              disabled={!["all", "html"].includes(language)}
            >
              Elementos HTML
            </option>
            <option value="guide">Guías</option>
          </select>
        </label>
      </div>
      <div className="search-panel-body">
        <div className="search-results-column">
          <div className="search-results-heading">
            <span>{isQuickAccess ? "Acceso rápido" : "Resultados"}</span>
            <span role="status">
              {isQuickAccess
                ? ""
                : `${matches.length} ${matches.length === 1 ? "coincidencia" : "coincidencias"}`}
            </span>
          </div>
          <div
            id="search-list"
            className="search-result-list"
            role="listbox"
            aria-label="Resultados de búsqueda"
          >
            {results.map((entry, index) => (
              <button
                key={entry.id}
                id={`search-option-${entry.id}`}
                role="option"
                aria-selected={selection === index}
                tabIndex={-1}
                onPointerMove={() => setSelected(index)}
                onClick={() => open(entry)}
              >
                <span className="search-result-symbol">
                  <TechIcon id={entry.language} />
                </span>
                <span className="search-result-copy">
                  <strong
                    className={entry.kind === "reference" ? "is-code" : ""}
                  >
                    <HighlightMatch text={entry.title} query={query} />
                  </strong>
                  <small>
                    {entry.kind === "reference"
                      ? entry.description
                      : entry.kind === "guide"
                        ? `${entry.description} · Guía`
                        : entry.description}
                  </small>
                </span>
                {isQuickAccess &&
                recent.some((item) => item.id === entry.id) ? (
                  <Clock3 className="search-result-arrow" size={14} />
                ) : (
                  <ArrowUpRight className="search-result-arrow" size={16} />
                )}
              </button>
            ))}
            {!results.length && (
              <div className="search-no-results">
                <Search size={28} strokeWidth={1.3} />
                <h3>No hay coincidencias</h3>
                <p>Prueba otro término o amplía los filtros.</p>
                <button onClick={reset}>
                  Limpiar la búsqueda <ArrowRight size={15} />
                </button>
              </div>
            )}
          </div>
        </div>
        <div
          className="search-result-preview"
          aria-label="Vista previa del resultado seleccionado"
        >
          {current ? (
            <>
              <div className="search-preview-context">
                <TechIcon id={current.language} />
                <span>{label[current.kind]}</span>
              </div>
              <h3 className={current.kind === "reference" ? "is-code" : ""}>
                {current.title}
              </h3>
              <p>{current.summary || current.description}</p>
              <div className="search-preview-sections">
                <span>En esta entrada</span>
                <p>
                  {current.kind === "reference"
                    ? "Ejemplo · Atributos · Uso y accesibilidad"
                    : current.kind === "guide"
                      ? "Explicación · Código · Recomendaciones"
                      : "Índice de guías y referencias del lenguaje"}
                </p>
              </div>
              <button
                className="search-preview-open"
                onClick={() => open(current)}
              >
                Abrir{" "}
                {current.kind === "reference"
                  ? "referencia"
                  : current.kind === "guide"
                    ? "guía"
                    : "índice"}{" "}
                <ArrowUpRight size={17} />
              </button>
            </>
          ) : (
            <div className="search-preview-idle">
              <Mark />
              <p>
                Encuentra un concepto por su nombre o por lo que quieres hacer.
              </p>
            </div>
          )}
        </div>
      </div>
      <div className="search-panel-bottom">
        {isQuickAccess && recent.length > 0 && (
          <button
            className="search-clear-history"
            aria-label="Borrar recientes"
            onClick={() => {
              clearHistory();
              setRecent([]);
              setSelected(0);
              input.current.focus();
            }}
          >
            <Trash2 size={14} />
            <span>Borrar recientes</span>
          </button>
        )}
        <div className="search-keyboard">
          <span>
            <ArrowUp size={12} />
            <ArrowDown size={12} /> mover
          </span>
          <span>
            <CornerDownLeft size={12} /> abrir
          </span>
        </div>
        <a href={documentationUrl({ language, kind, query })} onClick={onClose}>
          {query.trim() ? "Ver búsqueda en el índice" : "Abrir el índice"}{" "}
          <ArrowUpRight size={14} />
        </a>
      </div>
    </dialog>
  );
}
