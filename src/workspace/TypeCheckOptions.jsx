import React from "react";
import { typeCheckOptions } from "./type-check-options";

export default function TypeCheckOptions({ selected, onChange }) {
  return (
    <details className="lab-type-options">
      <summary>Opciones de comprobación</summary>
      <p>
        El modo estricto está activo. Estos ajustes se aplican al comprobar los
        tipos.
      </p>
      <div className="lab-type-grid">
        {Object.entries(typeCheckOptions).map(([key, label]) => (
          <label key={key}>
            <input
              type="checkbox"
              checked={selected[key] === true}
              onChange={(event) => onChange(key, event.target.checked)}
            />
            <span>
              <code>{key}</code>
              <small>{label}</small>
            </span>
          </label>
        ))}
      </div>
    </details>
  );
}
