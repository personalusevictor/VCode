import React, { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { usePageTitle } from "../app/pageTitle";
import { loadGuide } from "../lib/curriculum";
import DocumentationReader from "./DocumentationReader";
import { referenceById } from "./catalog";

export default function ReaderRoute({ route }) {
  const isReference = route.type === "reference";
  const [guide, setGuide] = useState(undefined);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const entry = isReference ? (referenceById(route.id) ?? null) : guide;

  useEffect(() => {
    if (isReference) return;
    let active = true;
    loadGuide(route.language, route.number).then(
      (value) => {
        if (active) setGuide(value);
      },
      () => {
        if (active) setError(true);
      },
    );
    return () => {
      active = false;
    };
  }, [isReference, route.language, route.number, attempt]);

  usePageTitle(
    entry?.title ||
      (entry === null
        ? "Página no encontrada"
        : isReference
          ? "Referencia"
          : "Lección"),
  );

  if (entry === undefined)
    return (
      <section className="symbol-reader">
        {error ? (
          <div className="doc-note">
            <p role="alert">No se pudo abrir la lección.</p>
            <button
              className="work-secondary"
              onClick={() => {
                setError(false);
                setAttempt((value) => value + 1);
              }}
            >
              Volver a intentar
            </button>
          </div>
        ) : (
          <p role="status">Abriendo la lección…</p>
        )}
      </section>
    );

  if (!entry)
    return (
      <section className="doc-not-found">
        <h1>No encontramos esta entrada</h1>
        <p>El enlace puede estar incompleto o haber cambiado.</p>
        <a className="button" href="#docs">
          <ArrowLeft size={16} /> Volver a la búsqueda
        </a>
      </section>
    );

  return (
    <DocumentationReader
      key={entry.id}
      entry={entry}
      isReference={isReference}
      section={route.section}
    />
  );
}
