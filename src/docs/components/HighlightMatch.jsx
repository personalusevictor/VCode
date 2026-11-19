import React from "react";
import { normalizeKnowledge } from "../../lib/search";
export default function HighlightMatch({ text, query = "" }) {
  const needle = normalizeKnowledge(query);
  const normalized = String(text)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  const position = needle ? normalized.indexOf(needle) : -1;
  if (position < 0) return text;
  return (
    <>
      {text.slice(0, position)}
      <mark>{text.slice(position, position + needle.length)}</mark>
      {text.slice(position + needle.length)}
    </>
  );
}
