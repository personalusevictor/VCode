import assert from "node:assert/strict";
import test from "node:test";
import {
  phpRequestOptions,
  readPhpRequest,
} from "../src/workspace/php-request.js";

test("las peticiones PHP conservan el contrato de un borrador anterior", () => {
  assert.deepEqual(phpRequestOptions(null, "programa.php"), {});
  assert.deepEqual(readPhpRequest({ method: "TRACE", format: "xml" }), {
    method: "GET",
    query: "",
    format: "form",
    body: "",
  });
  assert.deepEqual(
    phpRequestOptions(
      { query: "?curso=c++&lección=3", body: "a=b" },
      "programa.php",
    ),
    {
      method: "GET",
      relativeUri: "/programa.php?curso=c++&lecci%C3%B3n=3",
    },
  );
});

test("las peticiones PHP conservan los datos del cuerpo y el tipo declarado", () => {
  assert.deepEqual(
    phpRequestOptions(
      { method: "POST", body: "correo=ana%40ejemplo.test" },
      "programa.php",
    ),
    {
      method: "POST",
      relativeUri: "/programa.php",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: "correo=ana%40ejemplo.test",
    },
  );
  assert.deepEqual(
    phpRequestOptions(
      { method: "PATCH", format: "json", body: '{"curso":"PHP"}' },
      "programa.php",
    ),
    {
      method: "PATCH",
      relativeUri: "/programa.php",
      headers: { "Content-Type": "application/json" },
      body: '{"curso":"PHP"}',
    },
  );
});
