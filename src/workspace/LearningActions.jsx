import React, { useState } from "react";
import { Bookmark, FlaskConical } from "lucide-react";
import { toggleArchive, useArchive } from "./archive";

export default function LearningActions({
  id,
  language,
  isGuide,
  canEdit,
  labLabel = "Abrir en el laboratorio",
  labHref,
}) {
  const archive = useArchive();
  const saved = archive.favorites.includes(id);
  const [error, setError] = useState(false);
  const bookmark = saved
    ? "Guardado"
    : isGuide
      ? "Guardar guía"
      : "Guardar referencia";
  return (
    <div className="learning-actions">
      {canEdit && (
        <a
          className="work-primary"
          href={
            labHref ||
            `#playground?language=${language}&example=${encodeURIComponent(id)}`
          }
        >
          <FlaskConical size={16} /> {labLabel}
        </a>
      )}
      <button
        className="work-secondary learning-bookmark"
        aria-label={bookmark}
        title={bookmark}
        aria-pressed={saved}
        onClick={() => setError(!toggleArchive("favorites", id))}
      >
        <Bookmark size={16} fill={saved ? "currentColor" : "none"} />
        <span>{bookmark}</span>
      </button>
      {error && (
        <p role="alert">No se pudo guardar el cambio en el navegador.</p>
      )}
    </div>
  );
}
