import React, { useId, useState } from "react";
const sample = {
  html: '<button class="boton">Hola, VCode</button>',
  css: ".boton {\n  padding: 14px 24px;\n  border: 0;\n  border-radius: 16px;\n  background: #4b5bdb;\n  color: white;\n  font: 500 15px system-ui;\n}",
};
export default function CodeExhibition() {
  const id = useId();
  const [file, setFile] = useState("css");
  return (
    <div className="home-experiment is-exhibition">
      <div className="experiment-preview" aria-hidden="true">
        <span>Hola, VCode</span>
      </div>
      <div className="experiment-editor">
        <div className="experiment-filebar">
          <div role="group" aria-label="Código de la muestra">
            {["html", "css"].map((name) => (
              <button
                key={name}
                type="button"
                aria-pressed={file === name}
                aria-controls={id}
                onClick={() => setFile(name)}
              >
                {name.toUpperCase()}
              </button>
            ))}
          </div>
          <span>Solo lectura</span>
        </div>
        <pre
          id={id}
          tabIndex={0}
          aria-label={`Muestra de código ${file.toUpperCase()}, solo lectura`}
        >
          <code>{sample[file]}</code>
        </pre>
      </div>
    </div>
  );
}
