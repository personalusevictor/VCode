import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { checkTypes } from "../src/workspace/check-types.js";
import { readTypeCheckOptions } from "../src/workspace/type-check-options.js";

const require = createRequire(import.meta.url);
const libDirectory = join(
  dirname(require.resolve("typescript/package.json")),
  "lib",
);
const types = {
  messages: {},
  files: Object.fromEntries(
    readdirSync(libDirectory)
      .filter((name) => /^lib\..+\.d\.ts$/.test(name))
      .map((name) => [name, readFileSync(join(libDirectory, name), "utf8")]),
  ),
};

test("TypeScript activa cada opción sin alterar la comprobación estricta", () => {
  const cases = [
    [
      "exactOptionalPropertyTypes",
      "TS2412",
      "const plan: { tema?: string } = {}; plan.tema = undefined;",
      "const plan: { tema?: string } = {}; delete plan.tema;",
    ],
    [
      "noUncheckedIndexedAccess",
      "TS2322",
      "const datos: Record<string, number> = {}; const n: number = datos['CSS'];",
      "const datos: Record<string, number> = {}; const n: number = datos['CSS'] ?? 0;",
    ],
    [
      "noPropertyAccessFromIndexSignature",
      "TS4111",
      "const datos: Record<string, number> = {}; console.log(datos.CSS);",
      "const datos: Record<string, number> = {}; console.log(datos['CSS']);",
    ],
    [
      "noImplicitReturns",
      "TS7030",
      "function nivel(n: number) { if (n > 10) return 'medio'; }",
      "function nivel(n: number) { if (n > 10) return 'medio'; return 'base'; }",
    ],
  ];

  for (const [key, code, source, repair] of cases) {
    assert.deepEqual(checkTypes(source, types), [], key);
    const diagnostics = checkTypes(source, types, {}, { [key]: true });
    assert.ok(
      diagnostics.some(({ value }) => value.startsWith(code)),
      key,
    );
    assert.deepEqual(checkTypes(repair, types, {}, { [key]: true }), [], key);
  }

  assert.deepEqual(
    readTypeCheckOptions({
      strict: false,
      noImplicitReturns: true,
      noUnusedLocals: true,
      noUncheckedIndexedAccess: "true",
    }),
    { noImplicitReturns: true },
  );
  assert.ok(
    checkTypes("let n: number = null;", types, {}, { strict: false }).some(
      ({ value }) => value.startsWith("TS2322"),
    ),
  );
});

test("TypeScript reconoce los tipos a partir de un JSON auxiliar", () => {
  const source =
    'import ficha from "./curso.json" with { type: "json" }; const total: number = ficha.minutos;';
  assert.deepEqual(
    checkTypes(source, types, { "curso.json": '{"minutos":25}' }),
    [],
  );
  const diagnostics = checkTypes(source, types, {
    "curso.json": '{"minutos":"25"}',
  });
  assert.ok(
    diagnostics.some(
      ({ value, file }) => value.startsWith("TS2322") && file === "programa.ts",
    ),
  );
});
