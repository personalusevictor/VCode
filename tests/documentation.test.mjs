import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  parseDocumentationRoute,
  documentationUrl,
} from "../src/docs/routes.js";
const read = (file) =>
  JSON.parse(fs.readFileSync(new URL(file, import.meta.url)));
const references = read("../src/docs/data/html-reference.json");
const guides = read("../src/docs/data/guides.json");
const index = read("../src/data/search-index.json");

test("los enlaces del índice y del buscador resuelven a contenido real", () => {
  for (const entry of index) {
    const route = parseDocumentationRoute(entry.href.slice(1));
    if (route.type === "reference")
      assert.ok(
        references.some(({ id }) => id === route.id),
        entry.href,
      );
    else
      assert.ok(
        guides.some(
          (guide) =>
            guide.language === route.language && guide.number === route.number,
        ),
        entry.href,
      );
  }
  assert.equal(references.length, 27);
  assert.equal(guides.length, 84);
});

test("cada referencia tiene un ejemplo, atributos, recomendaciones y enlaces válidos", () => {
  assert.equal(new Set(references.map(({ id }) => id)).size, references.length);
  for (const entry of references) {
    assert.ok(entry.code.trim().length > 20, entry.id);
    assert.ok(entry.attributes.length > 0, entry.id);
    assert.ok(entry.tips.length >= 2, entry.id);
    assert.ok(
      new URL(entry.source).hostname === "developer.mozilla.org",
      entry.id,
    );
    for (const id of entry.related)
      assert.ok(
        references.some((item) => item.id === id),
        `${entry.id} -> ${id}`,
      );
    assert.ok(
      guides.some(
        (guide) => guide.language === "html" && guide.number === entry.guide,
      ),
    );
    if (entry.preview) assert.doesNotMatch(entry.code, /<script|\bon\w+\s*=/i);
  }
});

test("las guías conservan texto, código y numeración sin huecos", () => {
  for (const language of [
    "html",
    "css",
    "javascript",
    "react",
    "php",
    "java",
    "sql",
  ]) {
    assert.deepEqual(
      guides
        .filter((guide) => guide.language === language)
        .map(({ number }) => number),
      Array.from({ length: 12 }, (_, i) => i + 1),
    );
  }
  for (const guide of guides) {
    assert.ok(
      guide.body.length >= 1 &&
        guide.body.every((paragraph) => typeof paragraph === "string"),
    );
    assert.equal(typeof guide.code, "string");
    assert.ok(guide.code.trim().length > 0);
  }
});

test("los filtros de enlaces heredados y los fragmentos mantienen su significado", () => {
  assert.deepEqual(
    parseDocumentationRoute("docs/html/%3Cdetails%3E/reference"),
    { type: "index", language: "html", query: "<details>", kind: "reference" },
  );
  assert.deepEqual(parseDocumentationRoute("docs/all//reference"), {
    type: "index",
    language: "all",
    query: "",
    kind: "reference",
  });
  assert.deepEqual(parseDocumentationRoute("reference"), {
    type: "index",
    language: "html",
    query: "",
    kind: "reference",
  });
  assert.deepEqual(
    parseDocumentationRoute("reference/tag-details?section=attributes"),
    { type: "reference", id: "tag-details", section: "attributes" },
  );
  assert.equal(parseDocumentationRoute("lesson/html/8").number, 8);
  assert.equal(parseDocumentationRoute("lesson/html/0").number, 0);
  assert.equal(parseDocumentationRoute("projects"), null);
});

test("una URL malformada no rompe la consulta y las búsquedas se pueden compartir", () => {
  assert.deepEqual(
    parseDocumentationRoute("docs/no-existe/%E0%A4%A/no-existe"),
    { type: "index", language: "all", query: "", kind: "all" },
  );
  const href = documentationUrl({
    language: "javascript",
    query: " async / await? ",
    kind: "guide",
  });
  const route = parseDocumentationRoute(href.slice(1));
  assert.equal(route.query, "async / await?");
  assert.equal(route.language, "javascript");
  assert.equal(route.kind, "guide");
});
