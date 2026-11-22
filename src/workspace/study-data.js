export const sources = {
  html: [
    "WHATWG · HTML",
    "https://html.spec.whatwg.org/multipage/indices.html",
  ],
  css: ["W3C · Índice de CSS", "https://drafts.csswg.org/indexes/"],
  javascript: ["TC39 · ECMAScript", "https://tc39.es/ecma262/"],
  typescript: [
    "TypeScript · Handbook",
    "https://www.typescriptlang.org/docs/handbook/intro.html",
  ],
  react: ["React · API", "https://react.dev/reference/react"],
  php: ["PHP · Manual", "https://www.php.net/manual/es/"],
  java: ["Dev.java · Guías", "https://dev.java/learn/"],
  cpp: ["C++ · Borrador del estándar", "https://eel.is/c++draft/"],
  sql: ["SQLite · Sintaxis", "https://sqlite.org/lang.html"],
};

export const projects = {
  html: [
    "Página de apuntes accesible",
    "Publica un apunte con navegación interna, contenido semántico y un formulario etiquetado.",
    [
      "Dibuja el esquema con encabezados y regiones.",
      "Identifica todos los controles con texto visible.",
      "Recorre la página de principio a fin usando el teclado.",
    ],
  ],
  css: [
    "Galería adaptable",
    "Diseña un catálogo que funcione al estrechar su contenedor.",
    [
      "Construye la cuadrícula con Grid.",
      "Añade un estado de foco visible.",
      "Prueba a 320 px y con texto ampliado.",
    ],
  ],
  javascript: [
    "Agenda de sesiones",
    "Filtra y agrupa sesiones de estudio, con una interfaz que muestre los totales.",
    [
      "Revisa las sesiones y añade datos de prueba en sesiones.js.",
      "Completa resumir() en sesiones.js para filtrar y sumar los minutos.",
      "Elige un lenguaje sin sesiones y revisa la lista y el total.",
    ],
  ],
  typescript: [
    "Catálogo tipado",
    "Modela un catálogo, valida los datos externos y devuelve resultados discriminados.",
    [
      "Lee los tipos Curso y Resultado en curso.ts.",
      "Completa analizar() para validar una entrada de tipo unknown.",
      "Prueba los casos correcto, ausente e inválido con strict.",
    ],
  ],
  react: [
    "Tablero de tareas",
    "Crea una lista que permita añadir, completar y filtrar tareas.",
    [
      "Decide qué estado necesita App.jsx para añadir y filtrar tareas.",
      "Conecta la acción de Fila.jsx con el estado de App.jsx.",
      "Verifica que las tareas conservan su identidad al filtrar.",
    ],
  ],
  php: [
    "Bloc con persistencia",
    "Construye una página que guarde notas con PDO y pueda volver a mostrarlas.",
    [
      "Define la tabla SQLite.",
      "Completa guardarNota() en notas.php y prepara la consulta.",
      "Escapa la salida HTML. Comprueba una nota vacía y otra con comillas.",
    ],
  ],
  java: [
    "Inventario en consola",
    "Gestiona artículos y cantidades desde una aplicación pequeña.",
    [
      "Guarda cada cantidad con su identificador en Inventario.java.",
      "Ejecuta las altas de prueba desde InventarioDemo.java.",
      "Comprueba identificadores duplicados y cantidades negativas.",
    ],
  ],
  cpp: [
    "Inventario sin fugas",
    "Busca, ordena y presenta artículos usando contenedores estándar.",
    [
      "Modela el artículo y su contenedor.",
      "Define buscar() en inventario.hpp y usa sort en main.cpp.",
      "Compila con advertencias y comprueba casos límite.",
    ],
  ],
  sql: [
    "Panel de sesiones",
    "Diseña el esquema y obtén resúmenes útiles de tus sesiones de estudio.",
    [
      "Crea tablas de temas y sesiones con claves.",
      "Escribe un JOIN y un resumen agrupado.",
      "Añade un índice y compara el plan de consulta.",
    ],
  ],
};

export const learningPaths = [
  {
    title: "Diseñar para la web",
    description: "Estructura, estilo y comportamiento en el navegador.",
    languages: ["html", "css", "javascript"],
  },
  {
    title: "Construir interfaces",
    description:
      "Pasa de JavaScript a contratos tipados y componentes reutilizables.",
    languages: ["javascript", "typescript", "react"],
  },
  {
    title: "Trabajar con datos",
    description:
      "Consulta, relaciona y guarda información desde una aplicación web.",
    languages: ["sql", "php"],
  },
  {
    title: "Programar con tipos",
    description:
      "Explora colecciones, objetos y gestión de recursos en Java y C++.",
    languages: ["java", "cpp"],
  },
];
