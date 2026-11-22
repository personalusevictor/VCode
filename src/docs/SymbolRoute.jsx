import React from "react";
import { ArrowLeft } from "lucide-react";
import { usePageTitle } from "../app/pageTitle";
import SymbolReader from "./SymbolReader";
import { symbolById } from "./symbol-catalog";
import { hasWebReference } from "./web-reference";

export function MissingReference() {
  usePageTitle("Referencia no encontrada");
  return (
    <section className="doc-not-found">
      <h1>No encontramos esta entrada</h1>
      <p>El enlace puede estar incompleto o haber cambiado.</p>
      <a className="button" href="#docs">
        <ArrowLeft size={16} /> Volver a la búsqueda
      </a>
    </section>
  );
}

export default function SymbolRoute({ id, section }) {
  const original = symbolById(id);
  if (!original && !hasWebReference(id)) return <MissingReference />;
  return (
    <SymbolReader key={id} id={id} original={original} section={section} />
  );
}
