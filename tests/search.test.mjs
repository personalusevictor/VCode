import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  normalizeKnowledge,
  createGlobalSearchIndex,
  searchKnowledge,
} from "../src/lib/search.js";
import {
  inheritedJavaMembers,
  isDeclaredJavaMember,
  javaMemberQuery,
} from "../src/lib/java-member-search.js";
const courses = JSON.parse(
  fs.readFileSync(new URL("../src/data/languages.json", import.meta.url)),
);
const index = JSON.parse(
  fs.readFileSync(new URL("../src/data/search-index.json", import.meta.url)),
);

test("el catálogo conserva nueve lenguajes y el índice no tiene destinos duplicados", () => {
  assert.deepEqual(
    courses.map(({ id }) => id),
    [
      "html",
      "css",
      "javascript",
      "typescript",
      "react",
      "php",
      "java",
      "cpp",
      "sql",
    ],
  );
  assert.ok(index.length > 2000);
  assert.equal(new Set(index.map(({ href }) => href)).size, index.length);
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
    index.filter(
      (entry) => entry.kind === "reference" && entry.language === "react",
    ).length,
  );
  assert.ok(
    searchKnowledge(index, "useEffectEvent", {
      language: "react",
      kind: "reference",
    }).length > 0,
  );
});

test("la búsqueda global abre primero el lenguaje y limita los resultados solicitados", () => {
  const global = createGlobalSearchIndex(courses, index);
  assert.equal(searchKnowledge(global, "HTML")[0].href, "#course/html");
  assert.equal(searchKnowledge(global, "<html>")[0].kind, "reference");
  assert.equal(searchKnowledge(global, "", { limit: 4 }).length, 4);
  assert.equal(searchKnowledge(global, "zzsincoincidencias").length, 0);
});

test("PHP devuelve la ficha exacta y permite compartir el filtro de sesiones", () => {
  const result = searchKnowledge(index, "session_status()", {
    language: "php",
    category: "Sesiones",
  });
  assert.equal(result[0]?.href, "#symbol/php-function-session_status");
  assert.ok(result.every(({ group }) => group === "Sesiones"));
});

test("la consulta encuentra APIs de JavaScript con y sin prototype", () => {
  for (const query of ["Array.prototype.at()", "Array.at()", "Array.at"]) {
    assert.equal(
      searchKnowledge(index, query, { language: "javascript" })[0]?.id,
      "web-javascript-global_objects-array-at",
    );
  }
  assert.equal(
    searchKnowledge(index, "box-sizing", {
      language: "css",
      category: "css-properties",
    })[0]?.id,
    "css-properties-box-sizing",
  );
});

test("React y TypeScript encuentran APIs y opciones por nombre exacto", () => {
  assert.equal(
    searchKnowledge(index, "useEffectEvent", {
      language: "react",
      category: "Hooks",
    })[0]?.id,
    "react-api-useEffectEvent",
  );
  assert.equal(
    searchKnowledge(index, "strict", {
      language: "typescript",
      category: "Opciones de TSConfig",
    })[0]?.id,
    "web-typescript-config-strict",
  );
});

test("TypeScript distingue exclude, Exclude y typeAcquisition.exclude", () => {
  for (const [query, id] of [
    ["exclude", "web-typescript-config-exclude"],
    ["Exclude<T, U>", "typescript-api-Exclude%3CT%2C%20U%3E"],
    [
      "typeAcquisition.exclude",
      "web-typescript-config-typeAcquisition.exclude",
    ],
  ]) {
    assert.equal(
      searchKnowledge(index, query, { language: "typescript" })[0]?.id,
      id,
    );
  }
});

test("la consulta escrita en palabras reconoce los nombres de las APIs", () => {
  for (const [query, language, title] of [
    ["¿Qué hace session_status()?", "php", "session_status()"],
    ["PHP session status", "all", "session_status()"],
    ["box sizing", "css", "box-sizing"],
    ["React use state", "all", "useState"],
    ["std vector push back", "cpp", "std::vector::push_back()"],
    ["string code point count", "java", "String.codePointCount()"],
  ]) {
    assert.equal(
      searchKnowledge(index, query, { language })[0]?.title,
      title,
      query,
    );
  }
});

test("el índice ampliado de Java ordena tipos homónimos y encuentra miembros por nombre de paquete", () => {
  const options = { language: "java", limit: 1 };
  assert.equal(searchKnowledge(index, "List", options)[0].id, "java-api-List");
  assert.equal(
    searchKnowledge(index, "java.awt.List", options)[0].id,
    "web-java-se-java.awt.List",
  );
  assert.equal(
    searchKnowledge(index, "java.io.BufferedReader.lines", options)[0].title,
    "BufferedReader.lines()",
  );
});

test("la consulta de Java sigue miembros heredados sin incluir estáticos de interfaces", () => {
  const graph = JSON.parse(
    fs.readFileSync(
      new URL("../src/docs/data/java-hierarchy.json", import.meta.url),
    ),
  );
  const java = index.filter(({ language }) => language === "java");
  const find = (query, category = "all") =>
    inheritedJavaMembers(java, graph, javaMemberQuery(query), category);
  assert.deepEqual(
    find("javax.swing.JButton.doClick()").map(({ title }) => title),
    ["AbstractButton.doClick()"],
  );
  assert.deepEqual(
    find("JButton#doClick", "Swing").map(({ title }) => title),
    ["AbstractButton.doClick()"],
  );
  assert.deepEqual(find("JButton.doClick", "Colecciones"), []);
  assert.deepEqual(find("java.util.HashSet.of()"), []);
  assert.deepEqual(
    find("java.util.HashSet.stream()").map(({ title }) => title),
    ["Collection.stream()"],
  );
  assert.deepEqual(
    find("Thread.wait()").map(({ title }) => title),
    ["Object.wait()"],
  );
  const query = javaMemberQuery("java.util.List.of()");
  assert.ok(java.some((entry) => isDeclaredJavaMember(entry, query)));
  assert.equal(javaMemberQuery("como inicializar var"), null);
});

test("JavaScript prioriza la coincidencia de mayúsculas en Set y set", () => {
  const options = { language: "javascript", kind: "reference" };
  assert.equal(
    searchKnowledge(index, "Set", options)[0].id,
    "javascript-api-Set",
  );
  assert.equal(
    searchKnowledge(index, "set", options)[0].id,
    "web-javascript-functions-set",
  );
});
