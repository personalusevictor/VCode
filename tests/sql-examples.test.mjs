import test from "node:test";
import assert from "node:assert/strict";
import initSqlJs from "sql.js";
import { sqlSeed } from "../src/workspace/formats.js";
import {
  bindSqlParameters,
  readSqlParameters,
  sqlParameterNames,
} from "../src/workspace/sql-parameters.js";
import examples from "../src/docs/data/web-examples.json" with { type: "json" };
import topics from "../src/docs/data/sql-language-topics.json" with { type: "json" };

function runWithParameters(database, code, parameters) {
  const result = [];
  const position = { anonymous: 0 };
  for (const statement of database.iterateStatements(code)) {
    const bindings = bindSqlParameters(
      statement.getSQL(),
      parameters,
      position,
    );
    if (bindings.length) statement.bind(bindings);
    if (!statement.getColumnNames().length) {
      while (statement.step()) {}
      continue;
    }
    const rows = [];
    while (statement.step()) rows.push(statement.get());
    result.push(rows);
  }
  return result;
}

test("las fichas de SQL reproducen sus resultados esperados en SQLite", async () => {
  const { Database } = await initSqlJs();
  const sqlExamples = [
    ...examples.filter(({ language }) => language === "sql"),
    ...topics
      .filter(({ example }) => example)
      .map(({ title, example }) => ({
        id: title,
        ...example,
      })),
  ];
  for (const example of sqlExamples) {
    const database = new Database();
    try {
      database.exec(sqlSeed);
      assert.deepEqual(
        example.parameters
          ? runWithParameters(database, example.code, example.parameters).at(-1)
          : database.exec(example.code).at(-1)?.values,
        example.expectedRows,
        example.id,
      );
    } finally {
      database.close();
    }
  }
});

test("SQLite vincula parámetros nombrados y posicionales sin incorporar texto al SQL", async () => {
  const { Database } = await initSqlJs();
  const db = new Database();
  try {
    const query = [
      "SELECT ':ignorado', ?4, :tema, :tema, ?, $plan::nivel(valor);",
      "SELECT NULLIF(@ausente, 'sin dato'), ?, typeof(?4);",
      "SELECT 1 AS apartado$interno, `?7` FROM (SELECT 8 AS `?7`);",
    ].join("\n");
    const inputs = {
      "?4": "25",
      ":tema": "O'Connor",
      "? · 1": '"080"',
      "$plan::nivel(valor)": "true",
      "@ausente": "sin dato",
      "? · 2": "14.5",
      ":ignorado": "no entra",
    };
    assert.deepEqual(sqlParameterNames(query), [
      "?4",
      ":tema",
      "? · 1",
      "$plan::nivel(valor)",
      "@ausente",
      "? · 2",
    ]);
    const parameters = readSqlParameters(query, inputs);
    assert.ok(!Object.hasOwn(parameters, ":ignorado"));
    assert.deepEqual(runWithParameters(db, query, parameters), [
      [[":ignorado", 25, "O'Connor", "O'Connor", "080", 1]],
      [[null, 14.5, "integer"]],
      [[1, 8]],
    ]);
    assert.throws(
      () =>
        runWithParameters(db, "SELECT :tema, ?1", {
          ":tema": "SQL",
          "?1": "React",
        }),
      /misma posición|posición 1/,
    );
    assert.deepEqual(
      runWithParameters(db, "SELECT :tema, ?1", { ":tema": "SQL", "?1": "" }),
      [[["SQL", "SQL"]]],
    );
    assert.deepEqual(
      runWithParameters(db, "SELECT :🎨, @año", {
        ":🎨": "Azul",
        "@año": "2026",
      }),
      [[["Azul", 2026]]],
    );
  } finally {
    db.close();
  }
});

test("los nombres de parámetros de SQLite excluyen comentarios y literales", () => {
  const source =
    "-- :comentario ?2\nSELECT ':valor''@texto', \"?8\", [:_columna], :tema /* ?1 */";
  assert.deepEqual(sqlParameterNames(source), [":tema"]);
  assert.deepEqual(
    readSqlParameters(source, { ":tema": "a".repeat(2001) }),
    {},
  );
});
