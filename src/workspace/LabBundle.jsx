import React, { useState } from "react";
import { Archive } from "lucide-react";
import { lessonAssetUrl } from "../docs/lesson-assets";
import { download } from "./archive";

export default function LabBundle({
  language,
  main,
  document,
  files,
  resources,
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    if (Object.hasOwn(files, main.name)) {
      setError(
        `Hay dos archivos con el nombre ${main.name}. Renombra uno antes de descargar.`,
      );
      return;
    }

    setBusy(true);
    setError("");
    try {
      const { zipSync, strToU8 } = await import("fflate");
      const program = Object.entries(files).map(([name, code]) => [
        name,
        strToU8(code),
      ]);
      program.push([main.name, strToU8(main.code)]);
      if (document !== undefined)
        program.push(["vista.html", strToU8(document)]);
      const media = await Promise.all(
        resources.map(async (name) => {
          const url = lessonAssetUrl(name);
          if (!url) throw new Error("No encontramos un archivo de la lección.");
          const response = await fetch(url);
          if (!response.ok) throw new Error("No se pudo descargar un recurso.");
          return [
            name,
            [new Uint8Array(await response.arrayBuffer()), { level: 0 }],
          ];
        }),
      );
      const bundle = zipSync(Object.fromEntries([...program, ...media]), {
        level: 3,
      });
      download(`vcode-${language}.zip`, bundle, "application/zip");
    } catch {
      setError("No se pudo preparar el ZIP. Vuelve a intentarlo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        className="work-secondary"
        title="Descargar todos los archivos en ZIP"
        aria-label="Descargar todos los archivos en ZIP"
        aria-busy={busy || undefined}
        disabled={busy}
        onClick={save}
      >
        <Archive size={16} /> {busy ? "Preparando…" : "ZIP"}
      </button>
      {error && (
        <p className="lab-bundle-error" role="alert">
          {error}
        </p>
      )}
    </>
  );
}
