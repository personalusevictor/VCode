import React from "react";
import { ArrowLeft } from "lucide-react";
import DocumentationIndex from "./DocumentationIndex";
import DocumentationReader from "./DocumentationReader";
import { parseDocumentationRoute } from "./routes";
import { referenceById, guideByRoute } from "./catalog";
import "./documentation.css";

export default function Documentation({ route }) {
  const parsed = parseDocumentationRoute(route);
  if (parsed.type === "index") return <DocumentationIndex initial={parsed} />;
  const entry =
    parsed.type === "reference"
      ? referenceById(parsed.id)
      : guideByRoute(parsed.language, parsed.number);
  if (!entry)
    return (
      <section className="doc-not-found">
        <h1>No encontramos esta entrada</h1>
        <p>El enlace puede estar incompleto o haber cambiado.</p>
        <a className="button" href="#docs">
          <ArrowLeft size={16} /> Volver a la consulta
        </a>
      </section>
    );
  return (
    <DocumentationReader
      key={entry.id}
      entry={entry}
      isReference={parsed.type === "reference"}
      section={parsed.section}
    />
  );
}
