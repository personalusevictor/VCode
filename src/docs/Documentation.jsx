import React, { lazy } from "react";
import { isPhpReferenceId, parseDocumentationRoute } from "./routes";
import "./documentation.css";

const DocumentationIndex = lazy(() => import("./DocumentationIndex"));
const ReaderRoute = lazy(() => import("./ReaderRoute"));
const PhpReference = lazy(() => import("./PhpReference"));
const SymbolRoute = lazy(() => import("./SymbolRoute"));

export default function Documentation({ route }) {
  const parsed = parseDocumentationRoute(route);
  if (parsed.type === "index") return <DocumentationIndex initial={parsed} />;
  if (parsed.type === "symbol" && isPhpReferenceId(parsed.id))
    return <PhpReference id={parsed.id} section={parsed.section} />;
  if (parsed.type === "symbol")
    return <SymbolRoute id={parsed.id} section={parsed.section} />;
  return <ReaderRoute route={parsed} />;
}
