import React, { useId, useState } from "react";
const sample = {
  html: '<button class="boton">Hola, VCode</button>',
  css: ".boton {\n  padding: 14px 24px;\n  border: 0;\n  border-radius: 16px;\n  background: #4b5bdb;\n  color: white;\n  font: 500 15px system-ui;\n}",
};
const preview = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'"><style>html,body{margin:0;height:100%}body{display:grid;place-items:center;overflow:hidden}*{box-sizing:border-box}${sample.css}</style></head><body>${sample.html}</body></html>`;
export default function CodeExhibition() {
  const id = useId();
  const [file, setFile] = useState("css");
  return (
    <div className="home-experiment is-exhibition">
      <div className="experiment-preview" aria-hidden="true">
        <iframe
          title="Muestra de un botón creado con HTML y CSS"
          sandbox=""
          tabIndex={-1}
          srcDoc={preview}
        />
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
