import React, { useState } from "react";
import { SqlOutput } from "./SqlWorkbench";
import {
  ArrowUp,
  ChevronDown,
  ListChecks,
  Maximize2,
  Minimize2,
  Terminal,
} from "lucide-react";

const comparisonMessages = {
  match: "La salida coincide para estos datos.",
  mismatch: "La salida difiere. Revisa qué se espera en este ejercicio.",
  parameters: "Usa los parámetros iniciales para comparar la salida.",
};

export default function LabOutput({
  language,
  mainFile,
  paneRef,
  onEdit,
  frame,
  iframe,
  web,
  showConsole,
  tables,
  phpResponse,
  logs,
  busy,
  status,
  expectedOutput,
  onDiagnostic,
  comparison,
}) {
  const [previewNarrow, setPreviewNarrow] = useState(false);
  const [expanded, setExpanded] = useState(false);

  return (
    <section
      className="lab-pane lab-output"
      aria-label="Resultado"
      ref={paneRef}
      tabIndex={-1}
    >
      <div className="lab-bar">
        <span>
          <Terminal size={16} />{" "}
          {web
            ? "Vista previa"
            : language === "sql"
              ? "Resultado SQLite"
              : "Consola"}
        </span>
        <div className="lab-result-controls">
          {language === "css" && (
            <div
              className="lab-view-width"
              role="group"
              aria-label="Ancho de vista previa"
            >
              <button
                aria-pressed={!previewNarrow}
                onClick={() => setPreviewNarrow(false)}
              >
                Disponible
              </button>
              <button
                aria-pressed={previewNarrow}
                onClick={() => setPreviewNarrow(true)}
              >
                320 px
              </button>
            </div>
          )}
          {web && frame && (
            <button
              type="button"
              className="work-icon"
              aria-label="Ampliar vista previa"
              aria-controls="lab-preview"
              aria-pressed={expanded}
              title={expanded ? "Reducir vista previa" : "Ampliar vista previa"}
              onClick={() => setExpanded((value) => !value)}
            >
              {expanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
          )}
        </div>
      </div>
      <div className="lab-return lab-mobile-jump">
        <button className="work-link" onClick={onEdit}>
          <ArrowUp size={14} /> Volver al editor
        </button>
      </div>
      {frame && (
        <iframe
          id={web ? "lab-preview" : undefined}
          ref={iframe}
          data-expanded={web && expanded}
          title={web ? "Vista previa" : "Motor de consola"}
          key={frame.token}
          className={
            language === "css" && previewNarrow
              ? "lab-preview-narrow"
              : undefined
          }
          sandbox={
            showConsole
              ? web
                ? "allow-scripts allow-forms"
                : "allow-scripts"
              : ""
          }
          srcDoc={frame.html}
          hidden={!web}
        />
      )}
      {phpResponse && (
        <section className="lab-php-response" aria-label="Respuesta HTTP">
          <strong data-rejected={phpResponse.status >= 400 || undefined}>
            HTTP {phpResponse.status}
          </strong>
          {phpResponse.headers.length > 0 && (
            <dl>
              {phpResponse.headers.map(([name, value]) => (
                <div key={name}>
                  <dt>{name}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          )}
        </section>
      )}
      {!frame && !tables && !logs.length && !phpResponse && (
        <div className="lab-empty">
          <Terminal size={30} strokeWidth={1.25} />
          <p>
            {busy
              ? "Preparando el resultado…"
              : "Ejecuta el código para ver el resultado."}
          </p>
        </div>
      )}
      <SqlOutput tables={tables} />
      {logs.length > 0 && (
        <div className="lab-console">
          {logs.map(
            (
              { type, value, file: filename, line, column, offset, length },
              index,
            ) => (
              <div key={index} className="lab-log">
                {line && (
                  <button
                    className="lab-diagnostic-location"
                    onClick={() => onDiagnostic(filename, offset, length)}
                    aria-label={`Ir a línea ${line}, columna ${column}${filename && filename !== mainFile ? ` en ${filename}` : ""}`}
                  >
                    {filename && filename !== mainFile && `${filename} · `}
                    Línea {line} · Columna {column}
                  </button>
                )}
                <pre data-level={type}>{value}</pre>
              </div>
            ),
          )}
        </div>
      )}
      {expectedOutput && (
        <details className="lab-expected">
          <summary>
            <ListChecks size={15} aria-hidden="true" />
            Salida esperada
            <ChevronDown size={15} aria-hidden="true" />
          </summary>
          <pre>{expectedOutput}</pre>
        </details>
      )}
      <p className="lab-status" role="status">
        {status}
      </p>
      {comparison && (
        <p
          className="practice-comparison"
          role="status"
          data-match={comparison === "match"}
        >
          {comparisonMessages[comparison]}
        </p>
      )}
    </section>
  );
}
