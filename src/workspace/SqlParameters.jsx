import React from "react";
import { Braces } from "lucide-react";

export default function SqlParameters({ names, fields, onChange }) {
  if (!names.length) return null;
  return (
    <section className="lab-sql-parameters" aria-label="Parámetros de SQLite">
      <header>
        <Braces size={16} aria-hidden="true" /> Parámetros
      </header>
      <div className="lab-sql-fields">
        {names.map((name) => (
          <label key={name}>
            <code>{name}</code>
            <input
              value={fields[name] ?? ""}
              placeholder="NULL"
              maxLength={2000}
              autoComplete="off"
              spellCheck={false}
              onChange={(event) => onChange(name, event.target.value)}
            />
          </label>
        ))}
      </div>
      <p>
        Deja vacío para NULL. Usa comillas dobles si un número debe ser texto.
      </p>
    </section>
  );
}
