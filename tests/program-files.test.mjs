import assert from "node:assert/strict";
import test from "node:test";
import {
  readAuxiliaryFiles,
  resolveProgramImport,
  validAuxiliaryName,
} from "../src/workspace/program-files.js";

test("los archivos auxiliares se limitan a nombres locales del lenguaje activo", () => {
  assert.equal(validAuxiliaryName("java", "Edición.java"), true);
  assert.equal(validAuxiliaryName("cpp", "resumen.hpp"), true);
  assert.equal(validAuxiliaryName("php", "formato.php"), true);
  assert.equal(validAuxiliaryName("java", "formato.php"), false);
  assert.equal(validAuxiliaryName("cpp", "fuente.cpp"), false);
  assert.equal(validAuxiliaryName("css", "tema.css"), false);
  for (const language of ["javascript", "typescript", "react"])
    assert.equal(validAuxiliaryName(language, "Sesiones.json"), true);
  assert.equal(validAuxiliaryName("php", "Sesiones.json"), false);
  for (const name of [
    "../cambio.php",
    "/cambio.php",
    "x\\cambio.php",
    ".php",
  ]) {
    assert.equal(validAuxiliaryName("php", name), false);
  }
});

test("la restauración conserva archivos vacíos y descarta entradas ajenas o inválidas", () => {
  const files = readAuxiliaryFiles("php", {
    "formato.php": "<?php",
    "pendiente.php": "",
    " inválido.php": "",
    "../fuera.php": "",
    "Tema.java": "",
    "no-texto.php": { text: "" },
    "demasiado.php": "a".repeat(100001),
  });
  assert.deepEqual(files, { "formato.php": "<?php", "pendiente.php": "" });
  assert.deepEqual(readAuxiliaryFiles("php", null), {});
});

test("la resolución de módulos usa los archivos del programa", () => {
  const source = {
    "tema.ts": "",
    "tema.js": "",
    "Resumen.jsx": "",
    "estilos.css": "",
    "sesiones.json": "{}",
  };
  assert.equal(
    resolveProgramImport("typescript", "./tema.js", source),
    "tema.ts",
  );
  assert.equal(resolveProgramImport("javascript", "./tema", source), "tema.js");
  assert.equal(
    resolveProgramImport("react", "./Resumen", source),
    "Resumen.jsx",
  );
  assert.equal(
    resolveProgramImport("react", "./estilos.css", source),
    "estilos.css",
  );
  for (const language of ["javascript", "typescript", "react"]) {
    assert.equal(
      resolveProgramImport(language, "./sesiones.json", source),
      "sesiones.json",
    );
    assert.equal(
      resolveProgramImport(language, "../sesiones.json", source),
      null,
    );
  }
  assert.equal(resolveProgramImport("javascript", "./ausente", source), null);
  assert.equal(resolveProgramImport("javascript", "../tema.js", source), null);
  assert.equal(
    resolveProgramImport("javascript", "https://ejemplo.test/tema.js", source),
    null,
  );
});
