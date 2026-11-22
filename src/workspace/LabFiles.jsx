import React, { useRef, useState } from "react";
import { FilePlus2, Trash2, Undo2, X } from "lucide-react";
import { auxiliaryTypes, validAuxiliaryName } from "./program-files";

export default function LabFiles({
  language,
  primary,
  documentTab,
  files,
  selected,
  onSelect,
  onChange,
  resetButton,
}) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [removed, setRemoved] = useState(null);
  const addButton = useRef(null);
  const hint = auxiliaryTypes[language].hint;

  function closeForm() {
    setAdding(false);
    setName("");
    setError("");
    addButton.current?.focus();
  }

  function submit(event) {
    event.preventDefault();
    const filename = name.trim();
    if (!validAuxiliaryName(language, filename)) {
      setError(`Usa un nombre de archivo como ${hint}, sin carpetas.`);
      return;
    }
    if (filename === primary || Object.hasOwn(files, filename)) {
      setError("Ya hay un archivo con ese nombre.");
      return;
    }
    if (removed?.name === filename) setRemoved(null);
    onChange({ ...files, [filename]: "" });
    onSelect(filename);
    closeForm();
  }

  function remove() {
    const { [selected]: content, ...remaining } = files;
    setRemoved({ name: selected, content });
    onChange(remaining);
    onSelect(null);
    addButton.current?.focus();
  }

  function restore() {
    onChange({ ...files, [removed.name]: removed.content });
    onSelect(removed.name);
    setRemoved(null);
    addButton.current?.focus();
  }

  return (
    <div className="lab-files">
      <div className="lab-files-row">
        <div
          className="lab-file-tabs"
          role="group"
          aria-label="Archivos del programa"
        >
          <button
            aria-pressed={!selected && !documentTab?.selected}
            title="Archivo principal"
            onClick={() => onSelect(null)}
          >
            {primary}
          </button>
          {documentTab && (
            <button
              aria-pressed={documentTab.selected}
              onClick={documentTab.select}
            >
              vista.html
            </button>
          )}
          {Object.keys(files).map((filename) => (
            <button
              key={filename}
              title={filename}
              aria-pressed={selected === filename}
              onClick={() => onSelect(filename)}
            >
              {filename}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="work-icon"
          ref={addButton}
          aria-expanded={adding}
          title="Añadir archivo"
          aria-label="Añadir archivo"
          onClick={() => (adding ? closeForm() : setAdding(true))}
        >
          <FilePlus2 size={16} />
        </button>
        {selected && (
          <button
            type="button"
            className="work-icon"
            title="Quitar archivo activo"
            aria-label="Quitar archivo activo"
            onClick={remove}
          >
            <Trash2 size={16} />
          </button>
        )}
        {resetButton}
      </div>
      {adding && (
        <form
          className="lab-file-form"
          onSubmit={submit}
          onKeyDown={(event) => {
            if (event.key === "Escape") closeForm();
          }}
        >
          <label htmlFor="lab-new-file">Nombre del archivo</label>
          <div className="lab-file-input">
            <input
              id="lab-new-file"
              value={name}
              placeholder={hint}
              onChange={(event) => {
                setName(event.target.value);
                setError("");
              }}
              autoFocus
              maxLength={160}
              autoCapitalize="none"
              spellCheck={false}
              aria-invalid={Boolean(error)}
            />
            <button className="work-secondary" type="submit">
              Crear
            </button>
            <button
              className="work-icon"
              type="button"
              title="Cancelar creación"
              aria-label="Cancelar creación"
              onClick={closeForm}
            >
              <X size={16} />
            </button>
          </div>
          {error && <p role="alert">{error}</p>}
        </form>
      )}
      {removed && (
        <div className="lab-file-removed">
          <span role="status">Se quitó {removed.name}.</span>
          {removed.name !== primary && (
            <button type="button" className="work-link" onClick={restore}>
              <Undo2 size={14} /> Deshacer
            </button>
          )}
        </div>
      )}
    </div>
  );
}
