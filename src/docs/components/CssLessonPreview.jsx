import React, { useMemo, useState } from "react";
import { previewDocument } from "../../workspace/preview";

export default function CssLessonPreview({ code, markup }) {
  const [narrow, setNarrow] = useState(false);
  const document = useMemo(
    () => previewDocument({ markup, css: code }),
    [markup, code],
  );
  return (
    <div className="reference-preview lesson-css-preview">
      <div className="preview-caption">
        <span>Vista previa</span>
        <div role="group" aria-label="Anchura de la vista previa">
          <button
            type="button"
            aria-pressed={!narrow}
            onClick={() => setNarrow(false)}
          >
            Ancho disponible
          </button>
          <button
            type="button"
            aria-pressed={narrow}
            onClick={() => setNarrow(true)}
          >
            320 px
          </button>
        </div>
      </div>
      <div
        className={narrow ? "lesson-css-frame is-narrow" : "lesson-css-frame"}
      >
        <iframe
          title="Resultado del ejemplo CSS"
          sandbox=""
          srcDoc={document}
        />
      </div>
    </div>
  );
}
