import React, { useEffect, useMemo, useRef, useState } from "react";
import { Search, X, ArrowUpRight, ArrowRight, Trash2 } from "lucide-react";
import { courses } from "../lib/catalog";
import useKnowledge from "../lib/useKnowledge";
import useSettledQuery from "../lib/useSettledQuery";
import {
  readHistory,
  legacyHistoryIds,
  upgradeHistory,
  clearHistory,
} from "../lib/readingHistory";
import { documentationUrl } from "../docs/routes";
import HighlightMatch from "../docs/components/HighlightMatch";
import ChoiceMenu from "./ChoiceMenu";
import NativePointer from "../home/components/NativePointer";
import { TechIcon } from "./Brand";
const countFormat = new Intl.NumberFormat("es");
const label = {
  reference: "Referencia",
  guide: "Guía",
  course: "Curso",
};

export default function SearchDialog({ onClose }) {
  const dialog = useRef();
  const input = useRef();
  const [query, setQuery] = useState("");
  const [language, setLanguage] = useState("all");
  const [kind, setKind] = useState("all");
  const [selected, setSelected] = useState(0);
  const [pendingEnter, setPendingEnter] = useState(null);
  const [historyVersion, setHistoryVersion] = useState(0);
  const searchText = query.trim();
  const [settledQuery, settleQuery] = useSettledQuery(searchText);
  const browsingRecents = !searchText;
  const legacy = useMemo(legacyHistoryIds, [historyVersion]);
  const { data: recovered } = useKnowledge(
    { ids: legacy },
    browsingRecents && legacy.length > 0,
  );
  const { data, error, loading, previous, retry } = useKnowledge(
    { language, kind, query: settledQuery, limit: 12, includeCourses: true },
    !browsingRecents && Boolean(settledQuery),
  );
  const recent = useMemo(
    () => readHistory(recovered?.items),
    [recovered, historyVersion],
  );
  useEffect(() => {
    if (browsingRecents && recovered) upgradeHistory(recovered.items);
  }, [browsingRecents, recovered]);
  const updating = !browsingRecents && (searchText !== settledQuery || loading);
  const shown = data || (updating ? previous?.data : undefined);
  const displayedQuery = data ? settledQuery : previous?.query || "";
  const results = browsingRecents
    ? recent.filter(
        (entry) =>
          (language === "all" || language === entry.language) &&
          (kind === "all" || kind === entry.kind),
      )
    : shown?.items || [];
  const selection = Math.min(selected, Math.max(0, results.length - 1));
  const current = results[selection];
  const queryInIndex = documentationUrl({
    language,
    kind,
    query,
    browse: browsingRecents,
  });

  useEffect(() => {
    const node = dialog.current;
    const trigger = document.activeElement;
    const viewport = window.visualViewport;
    const resize = () => {
      const available = viewport?.height || window.innerHeight;
      node.style.setProperty("--search-available", `${available}px`);
      node.dataset.compact = String(available < 440);
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
  useEffect(() => {
    if (updating || !pendingEnter) return;
    setPendingEnter(null);
    if (
      data &&
      current &&
      pendingEnter.query === query &&
      pendingEnter.language === language &&
      pendingEnter.kind === kind
    ) {
      location.hash = current.href;
      onClose();
    }
  }, [data, current, pendingEnter, query, language, kind, updating, onClose]);
  useEffect(() => setSelected(0), [query, language, kind]);
  useEffect(() => {
    document
      .getElementById(`search-option-${current?.id}`)
      ?.scrollIntoView({ block: "nearest" });
  }, [current?.id]);

  function open(entry) {
    setPendingEnter(null);
    location.hash = entry.href;
    onClose();
  }
  function keyboard(event) {
    if (event.nativeEvent.isComposing) return;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!updating && results.length)
        setSelected(
          (selection + (event.key === "ArrowDown" ? 1 : -1) + results.length) %
            results.length,
        );
    }
    if (event.key === "Enter") {
      event.preventDefault();
      if (updating) {
        setPendingEnter({ query, language, kind });
        settleQuery(searchText);
      } else if (current) open(current);
    }
  }
  function clearQuery() {
    settleQuery("");
    setQuery("");
    setPendingEnter(null);
    input.current.focus();
  }
  function reset() {
    clearQuery();
    setLanguage("all");
    setKind("all");
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
      <NativePointer withinDialog />
      <h2 id="search-dialog-title" className="sr-only">
        Buscar en VCode
      </h2>
      <div className="search-panel-field">
        <Search size={22} strokeWidth={1.7} aria-hidden="true" />
        <input
          ref={input}
          role="combobox"
          aria-expanded={results.length > 0}
          aria-autocomplete="list"
          aria-controls="search-list"
          aria-activedescendant={
            current && !updating ? `search-option-${current.id}` : undefined
          }
          aria-label="Buscar en todo VCode"
          placeholder="Busca en VCode…"
          autoComplete="off"
          spellCheck={false}
          value={query}
          onChange={(event) => {
            setPendingEnter(null);
            const value = event.target.value;
            if (!value.trim()) settleQuery("");
            setQuery(value);
          }}
          onKeyDown={keyboard}
        />
        {query && (
          <button
            className="search-clear"
            type="button"
            aria-label="Limpiar consulta"
            onClick={clearQuery}
          >
            <X size={16} aria-hidden="true" />
          </button>
        )}
        <button
          className="search-close"
          type="button"
          aria-label="Cerrar búsqueda"
          onClick={onClose}
        >
          <X size={17} aria-hidden="true" />
        </button>
      </div>
      <div className="search-panel-filters">
        <ChoiceMenu
          label="Lenguaje de búsqueda"
          value={language}
          options={[
            ["all", "Todos los lenguajes"],
            ...courses.map(({ id, name }) => [id, name]),
          ]}
          onChange={(value) => {
            setPendingEnter(null);
            settleQuery(searchText);
            setLanguage(value);
          }}
        />
        <ChoiceMenu
          label="Tipo de resultado"
          value={kind}
          options={[
            ["all", "Todo el contenido"],
            ["reference", "Referencias"],
            ["guide", "Guías"],
          ]}
          onChange={(value) => {
            setPendingEnter(null);
            settleQuery(searchText);
            setKind(value);
          }}
        />
      </div>
      {(!browsingRecents || recent.length > 0) && (
        <div className="search-results-heading">
          <span>{browsingRecents ? "Recientes" : "Resultados"}</span>
          {browsingRecents && (
            <button
              className="search-clear-history"
              type="button"
              onClick={() => {
                clearHistory();
                setHistoryVersion((version) => version + 1);
                setSelected(0);
                input.current.focus();
              }}
            >
              <Trash2 size={13} aria-hidden="true" /> Borrar recientes
            </button>
          )}
          {!browsingRecents && (
            <span
              role="status"
              aria-busy={updating}
              data-updating={updating || undefined}
            >
              {shown && shown.total > 0
                ? `${countFormat.format(shown.total)} ${shown.total === 1 ? "coincidencia" : "coincidencias"}`
                : ""}
            </span>
          )}
        </div>
      )}
      <div
        className="search-results-area"
        data-empty={(browsingRecents && !recent.length) || undefined}
      >
        <div
          id="search-list"
          className="search-result-list"
          role="listbox"
          hidden={!results.length}
          aria-label={browsingRecents ? "Recientes" : "Resultados de búsqueda"}
          aria-busy={updating}
        >
          {results.map((entry, index) => (
            <button
              key={entry.id}
              id={`search-option-${entry.id}`}
              type="button"
              role="option"
              aria-selected={!updating && selection === index}
              data-highlighted={selection === index || undefined}
              tabIndex={-1}
              data-pointer-dot
              onPointerMove={(event) => {
                if (!updating && event.pointerType === "mouse")
                  setSelected(index);
              }}
              onClick={() => open(entry)}
            >
              <TechIcon id={entry.language} />
              <span className="search-result-copy">
                <strong className={entry.kind === "reference" ? "is-code" : ""}>
                  <HighlightMatch text={entry.title} query={displayedQuery} />
                </strong>
                {!browsingRecents && (
                  <small>{entry.summary || entry.description}</small>
                )}
              </span>
              <span className="search-result-kind">{label[entry.kind]}</span>
              <ArrowRight
                className="search-result-arrow"
                size={15}
                aria-hidden="true"
              />
            </button>
          ))}
        </div>
        {browsingRecents && recent.length > 0 && !results.length && (
          <div className="search-no-results">
            <p>No hay recientes con estos filtros.</p>
          </div>
        )}
        {!browsingRecents && !results.length && (
          <div className="search-no-results">
            <p role="status">
              {updating
                ? "Buscando…"
                : error
                  ? "No se pudo cargar el índice."
                  : "No hay coincidencias."}
            </p>
            {!updating && (error || data) && (
              <button type="button" onClick={error ? retry : reset}>
                {error ? "Volver a intentar" : "Limpiar la búsqueda"}{" "}
                <ArrowRight size={15} aria-hidden="true" />
              </button>
            )}
          </div>
        )}
      </div>
      <div className="search-panel-bottom">
        <a href={queryInIndex} onClick={onClose}>
          {query.trim() ? "Ver todos los resultados" : "Abrir el índice"}
          <ArrowUpRight size={14} aria-hidden="true" />
        </a>
      </div>
    </dialog>
  );
}
