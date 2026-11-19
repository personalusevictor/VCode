import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  normalizeKnowledge,
  createGlobalSearchIndex,
  searchKnowledge,
} from "../src/lib/search.js";
const courses = JSON.parse(
  fs.readFileSync(new URL("../src/data/languages.json", import.meta.url)),
);
const index = JSON.parse(
  fs.readFileSync(new URL("../src/data/search-index.json", import.meta.url)),
);

test("el catálogo conserva siete lenguajes y el índice no tiene destinos duplicados", () => {
  assert.deepEqual(
    courses.map(({ id }) => id),
    ["html", "css", "javascript", "react", "php", "java", "sql"],
  );
  assert.equal(index.length, 111);
  assert.equal(new Set(index.map(({ href }) => href)).size, 111);
});

test("la búsqueda normaliza acentos y prioriza la referencia de una etiqueta", () => {
  assert.equal(normalizeKnowledge("  <SEMÁNTICA>  "), "semantica");
  assert.equal(
    searchKnowledge(index, "<details>")[0].href,
    "#reference/tag-details",
  );
});

test("los filtros restringen los resultados sin cambiar el ámbito seleccionado", () => {
  assert.ok(searchKnowledge(index, "grid", { language: "css" }).length > 0);
  assert.ok(
    searchKnowledge(index, "grid", { language: "css" }).every(
      ({ language }) => language === "css",
    ),
  );
  assert.equal(
    searchKnowledge(index, "", { language: "react", kind: "reference" }).length,
    0,
  );
  assert.equal(searchKnowledge(index, "", { kind: "reference" }).length, 27);
});

test("la búsqueda global abre primero el lenguaje y limita los resultados solicitados", () => {
  const global = createGlobalSearchIndex(courses, index);
  assert.equal(searchKnowledge(global, "HTML")[0].href, "#docs/html");
  assert.equal(searchKnowledge(global, "<html>")[0].kind, "reference");
  assert.equal(searchKnowledge(global, "", { limit: 4 }).length, 4);
  assert.equal(searchKnowledge(global, "zzsincoincidencias").length, 0);
});
