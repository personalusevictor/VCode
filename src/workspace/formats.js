export const formats = {
  html: {
    file: "index.html",
    demo: '<article class="tarjeta">\n  <h1>Mi cuaderno web</h1>\n  <p>Un espacio para probar ideas con VCode.</p>\n  <details><summary>Ver contenidos</summary><p>HTML, CSS y JavaScript.</p></details>\n</article>',
  },
  css: {
    file: "estilos.css",
    demo: ".galeria {\n  display: grid;\n  grid-template-columns: repeat(auto-fit, minmax(6rem, 1fr));\n  gap: 12px;\n}\n.tarjeta {\n  background: #dbeafe;\n  color: #192449;\n  padding: 18px;\n  border-radius: 12px;\n}",
  },
  javascript: {
    file: "programa.js",
    demo: "const temas = ['HTML', 'CSS', 'JavaScript'];\nconsole.table(temas.map((nombre, i) => ({ id: i + 1, nombre })));",
  },
  typescript: {
    file: "programa.ts",
    demo: 'type Entrada = { tema: string; minutos: number };\nconst plan: Entrada[] = [{ tema: "TypeScript", minutos: 25 }];\nconsole.log(plan.map(({ tema, minutos }) => `${tema}: ${minutos} min`));',
  },
  react: {
    file: "App.jsx",
    demo: 'import { useState } from "react";\n\nexport default function App() {\n  const [pasos, setPasos] = useState(0);\n  return <button onClick={() => setPasos(pasos + 1)}>Pasos: {pasos}</button>;\n}',
  },
  sql: {
    file: "consulta.sql",
    demo: "SELECT tema, minutos\nFROM sesiones\nWHERE minutos >= 20\nORDER BY minutos DESC;",
  },
  java: {
    file: "Main.java",
    command: "java Main.java",
    demo: 'public class Main {\n  public static void main(String[] args) {\n    System.out.println("Hola, VCode");\n  }\n}',
  },
  cpp: {
    file: "main.cpp",
    command: "c++ -std=c++20 -Wall -Wextra main.cpp -o programa && ./programa",
    demo: '#include <iostream>\n\nint main() {\n  std::cout << "Hola, VCode!\\n";\n}',
  },
  php: {
    file: "programa.php",
    demo: '<?php\n\n$temas = ["PHP", "SQL"];\necho implode(", ", $temas), PHP_EOL;',
  },
};
export const documents = {
  react: '<div id="root"></div>',
  css: '<div class="galeria">\n  <article class="tarjeta">HTML</article>\n  <article class="tarjeta">CSS</article>\n  <article class="tarjeta">JavaScript</article>\n</div>',
  javascript:
    '<button id="sumar">Sumar</button>\n<p id="total" aria-live="polite">0</p>\n<div id="app"></div>',
};
export const sqlSeed = `
  PRAGMA foreign_keys = ON;
  CREATE TABLE cursos (
    id INTEGER PRIMARY KEY, nombre TEXT NOT NULL, horas INTEGER NOT NULL,
    categoria TEXT DEFAULT 'Web', descripcion TEXT, publicado BOOLEAN DEFAULT true
  );
  CREATE TABLE alumnos (id INTEGER PRIMARY KEY, nombre TEXT NOT NULL);
  CREATE TABLE inscripciones (alumno_id INTEGER REFERENCES alumnos(id), curso_id INTEGER REFERENCES cursos(id), nota REAL);
  CREATE TABLE cuentas (id INTEGER PRIMARY KEY, saldo INTEGER NOT NULL);
  INSERT INTO cursos (nombre, horas, categoria, descripcion) VALUES
    ('HTML', 8, 'Web', 'Estructura'), ('JavaScript', 14, 'Web', NULL), ('PHP', 10, 'Backend', 'Servidor');
  INSERT INTO alumnos (nombre) VALUES ('Iria'), ('Víctor');
  INSERT INTO inscripciones VALUES (1, 1, 8), (2, 1, 9), (2, 2, 7), (1, 3, NULL);
  INSERT INTO cuentas VALUES (1, 100), (2, 40);
  CREATE TABLE sesiones (id INTEGER PRIMARY KEY, tema TEXT NOT NULL, minutos INTEGER NOT NULL);
  INSERT INTO sesiones (tema, minutos) VALUES ('HTML', 15), ('CSS', 25), ('JavaScript', 40);
`;
