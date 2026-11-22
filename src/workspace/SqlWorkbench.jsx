import React from "react";
import { ChevronDown, Database, Download } from "lucide-react";
import { download } from "./archive";
import { sqlSeed } from "./formats";

const declarations = [
  ...sqlSeed.matchAll(/(CREATE TABLE (\w+)\s*\([\s\S]*?\);)/g),
];

export function SqlSchema() {
  return (
    <details className="lab-console-settings">
      <summary>
        <Database size={16} aria-hidden="true" />
        Base de datos de prueba
        <ChevronDown size={15} aria-hidden="true" />
      </summary>
      <div className="lab-sql-schema">
        <p>SQLite carga estas tablas al iniciar cada ejecución.</p>
        {declarations.map(([, definition, name]) => (
          <details key={name}>
            <summary>
              <code>{name}</code>
            </summary>
            <pre tabIndex={0} aria-label={`Esquema de ${name}`}>
              {definition}
            </pre>
          </details>
        ))}
      </div>
    </details>
  );
}

function csvValue(value) {
  if (value === null) return "";
  const cell = String(value);
  const safe =
    typeof value === "string" && /^(?:\s*[=+@-]|[\t\r\n])/.test(cell)
      ? "'" + cell
      : cell;
  return `"${safe.replaceAll('"', '""')}"`;
}

export function SqlOutput({ tables }) {
  if (!tables) return null;
  if (!tables.length)
    return (
      <p className="lab-sql-no-rows">
        La ejecución no produjo una tabla de resultados.
      </p>
    );
  return tables.map(({ columns, values, truncated }, index) => {
    const title =
      tables.length === 1
        ? "Resultados de la consulta"
        : `Resultado ${index + 1}`;
    return (
      <section className="lab-sql-result" key={index} aria-label={title}>
        <div className="lab-sql-result-head">
          <div>
            <strong>{title}</strong>
            <p>
              {values.length} {values.length === 1 ? "fila" : "filas"}
              {truncated ? " visibles" : ""} · {columns.length}{" "}
              {columns.length === 1 ? "columna" : "columnas"}
            </p>
          </div>
          <button
            className="work-secondary"
            type="button"
            aria-label={`Descargar CSV de ${title.toLowerCase()}`}
            onClick={() => {
              const csv = [columns, ...values]
                .map((row) => row.map(csvValue).join(","))
                .join("\r\n");
              download(
                `vcode-resultado-${index + 1}.csv`,
                "\uFEFF" + csv + "\r\n",
                "text/csv;charset=utf-8",
              );
            }}
          >
            <Download size={15} aria-hidden="true" /> CSV
          </button>
        </div>
        <div
          className="lab-table"
          tabIndex={0}
          role="region"
          aria-label={`Tabla de ${title.toLowerCase()}`}
        >
          <table>
            <thead>
              <tr>
                {columns.map((name, i) => (
                  <th key={i} scope="col">
                    {name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {values.map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) => (
                    <td key={j} data-null={cell === null || undefined}>
                      {cell === null ? "NULL" : String(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!values.length && (
          <p className="lab-sql-no-rows">La consulta no devolvió filas.</p>
        )}
      </section>
    );
  });
}
