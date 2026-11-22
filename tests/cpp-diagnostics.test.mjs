import test from "node:test";
import assert from "node:assert/strict";
import { cppDiagnostics } from "../src/workspace/cpp-diagnostics.js";

test("Clang enlaza el error al archivo y traduce la columna UTF-8 para el editor", () => {
  const entries = cppDiagnostics(
    "main.cpp:2:5: error: esperado\n  sino\n  ^\n/vcode-files/dato.hpp:1:5: warning: aviso\n1 error generated.\n",
    '#include "dato.hpp"\naino\n',
    { "dato.hpp": "ñ + x\n" },
    true,
  );
  assert.equal(entries[0].file, "main.cpp");
  assert.equal(entries[0].line, 2);
  assert.match(entries[0].value, /esperado\n/);
  assert.equal(entries[1].type, "warn");
  assert.equal(entries[1].file, "dato.hpp");
  assert.equal(entries[1].offset, 3);
  assert.equal(entries[1].column, 4);
});
