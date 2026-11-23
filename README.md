# VCode

Biblioteca de programación en español, con portada 3D, cursos, referencia consultable y laboratorio local.

[Abrir VCode en GitHub Pages](https://personalusevictor.github.io/VCode/)

## Abrir en local

Con Node.js 24.18 o posterior y npm 11.16 o posterior:

```sh
npm ci
npm run dev
```

Para comprobar la compilación que se entrega:

```sh
npm test
npm run format:check
npm run build
npm run preview
```

La vista previa sirve la aplicación en `http://127.0.0.1:8765/`.

## Qué incluye

- 174 lecciones de HTML, CSS, JavaScript, TypeScript, React, PHP, SQL, Java y C++. Cada lección tiene objetivos, explicación y práctica. Los temarios, proyectos y retos tienen avance local.
- Buscador y guías en español. Las fichas indican cuándo su ampliación procede de una fuente en inglés. Los elementos HTML del índice normativo tienen una ficha con ejemplo, recomendaciones y atributos. El buscador también indexa los atributos y manejadores de eventos del estándar HTML, el catálogo W3C Webref de propiedades, reglas, funciones, descriptores y selectores CSS, APIs centrales de React y referencias de los demás lenguajes. La consulta de PHP conecta funciones y métodos con clases, interfaces, variables y constantes. Las fichas incluyen firmas, parámetros, retornos y ejemplos según la entrada.
- 36 ejercicios con pistas y soluciones, nueve proyectos guiados con código inicial, solución y comprobaciones, seis de ellos organizados en varios archivos y cuatro recorridos que combinan tecnologías.
- Laboratorio con HTML, CSS, JavaScript, TypeScript, React, SQLite, PHP 8.3, Java y C++20. Los motores de Java y C++ se abren al ejecutar. Los ejemplos con hilos o funciones propias del sistema también pueden descargarse para un JDK o compilador nativo.
- Mi archivo guarda notas, avances, referencias, borradores y proyectos en este navegador y permite exportarlos e importarlos.

Las fichas importadas de los índices marcan el alcance de sus fuentes. Algunas describen gramática o enlazan a la especificación y las fichas redactadas incluyen ejemplos propios. La colección no cubre todas las bibliotecas y herramientas de cada lenguaje. SQL se ejecuta con SQLite. Los ejemplos específicos de PostgreSQL y React de servidor requieren su entorno correspondiente. El laboratorio comprueba tipos de TypeScript y de los módulos locales que lo acompañan en modo estricto con ES2022. Usa `tsc --noEmit` en tu proyecto para aplicar sus archivos, dependencias y configuración.

## Contenido y arquitectura

- `src/home`: portada, tipografía, escena neo chrome y dirección de movimiento.
- `src/docs`: guías, fichas, lector e índice.
- `src/workspace`: cursos, práctica, proyectos, archivo y laboratorio.
- `src/lib`: búsqueda y visitas recientes.
- `scripts`: generación de referencias, búsqueda y entorno React local.

`npm run reference:build` actualiza el catálogo de CSS a partir de la versión de W3C Webref fijada en el archivo de bloqueo. `node scripts/build-quick-reference.mjs` genera las fichas redactadas desde el archivo de texto. `python3 scripts/import-standard-indexes.py <indice-html>` comprueba el índice HTML de WHATWG y actualiza los atributos y valores. El Manual de PHP se importa con su propia herramienta. Las fichas de sintaxis redactadas en español se mantienen en `src/docs/data/php-language-topics.json`. El importador valida su sección del manual y publica los ejemplos. Build y test regeneran el índice de búsqueda y empaquetan el contenido de cada curso. El temario usa una lista ligera y solo se descarga un curso al abrir una de sus lecciones.

La portada respeta la preferencia de movimiento reducido. El menú de configuración permite pausar la escena y seleccionar tema. Los motores de ejecución se cargan al utilizarlos. Las vistas HTML, CSS y React usan un marco separado y JavaScript de consola, SQL, PHP y la transformación de TypeScript usan procesos del navegador que se pueden detener. Los datos de Mi archivo permanecen en ese navegador hasta que se exportan.

## Datos de referencia

Los archivos de `vendor/reference` guardan una copia comprimida de las fichas importadas. VCode la expande al preparar el desarrollo, las pruebas o la compilación. Los índices de búsqueda se regeneran a partir de esas fichas y de las lecciones.

Para renovar un catálogo, ejecuta primero `node scripts/reference-snapshots.mjs restore` en un clon limpio. Aplica el importador del lenguaje y guarda el resultado con `node scripts/reference-snapshots.mjs pack <grupo>`. Los grupos son `web`, `framework`, `php`, `java`, `cpp` y `sql`. Incluye las notas de atribución si cambia la versión de la fuente.

El [flujo de contribución](CONTRIBUTING.md) describe cómo se integran y publican los cambios.

## Actualizar las referencias de PHP

`python3 scripts/import-php-manual.py <doc-en> <doc-es>` genera las fichas a partir de los repositorios del Manual de PHP. La versión inglesa determina la firma. El importador usa la versión española cuando la firma coincide. Las fichas indican su procedencia y los módulos se cargan al abrirlos. Los ejemplos propios de VCode que pueden ejecutarse en el laboratorio se gestionan en `src/docs/data/php-explanations.json`. Consulta `public/licenses/php-manual.txt` para atribución, licencia y huellas de los archivos usados.

## Actualizar las referencias de la web

`python3 scripts/import-mdn-reference.py <mdn-content.tar.gz> <mdn-translated-content.tar.gz>` actualiza las fichas ampliadas de CSS, JavaScript y atributos HTML. El importador conserva los enlaces originales del proyecto y contrasta la sintaxis con la edición inglesa. Las fichas indican cuándo la ampliación está en inglés. Los ejemplos ejecutables y las explicaciones propias se mantienen en `src/docs/data/web-examples.json` y `src/docs/data/web-explanations.json`. Las fichas de sintaxis de JavaScript en `src/docs/data/javascript-language-topics.json` enlazan ECMAScript 2026. Pasa `--ecmascript <capitulos-html>` al importador para comprobar sus secciones. La atribución y la licencia se detallan en `public/licenses/mdn-web-docs.txt`.

## Actualizar React y TypeScript

`python3 scripts/import-framework-reference.py <react-en.tar.gz> <react-es.tar.gz> <typescript-handbook.tar.gz>` genera las fichas de las APIs de React, tipos de TypeScript y opciones de TSConfig. La atribución y la licencia están en `public/licenses/react-typescript-docs.txt`.

## Actualizar SQL

`python3 scripts/import-sqlite-reference.py <carpeta-con-paginas-html-de-sqlite>` consulta la versión instalada de SQLite y genera fichas de funciones escalares, agregadas, matemáticas, de ventana, de fechas y de JSON, además de las sentencias principales. Las fichas de cláusulas, expresiones, restricciones, transacciones y administración se editan en `src/docs/data/sql-language-topics.json`. El importador coteja sus páginas y anclas oficiales. Los ejemplos se ejecutan en la misma base de prueba que usa el laboratorio. En el editor, los parámetros nombrados y posicionales aparecen como campos. Sus valores se vinculan a cada sentencia y se guardan con el borrador local. La documentación fuente de SQLite es de dominio público.

## Actualizar la API de Java SE 21

`python3 scripts/import-java-reference.py <jdk-home>` lee las firmas públicas de Java SE 21 desde `ct.sym` con `javap`. Incluye los 3780 tipos del índice oficial de Java SE 21 que coinciden con los módulos `java.*`. Las fichas reúnen constructores, miembros declarados, sobrecargas y enlaces a supertipos. La aplicación descarga cada bloque de tipos en JSON comprimido, con sus miembros en el mismo archivo. Pasa `--api-index <allclasses-index.html>` para cotejar y renovar la lista de tipos. La selección docente y los ejemplos propios están en `src/docs/data/java-topics.json`, `src/docs/data/java-explanations.json` y `src/docs/data/web-examples.json`.

`python3 scripts/import-java-syntax.py <indice-jls21.html>` coteja las fichas de sintaxis con el índice de la especificación Java SE 21. Las explicaciones y ejemplos propios están en `src/docs/data/java-language-topics.json`. Una consulta como `JButton.doClick()` abre la declaración heredada cuando el tipo no declara el miembro.

La búsqueda lee el catálogo comprimido de cada lenguaje en segundo plano. Abrir el índice sin escribir una consulta solo carga la primera página. Build y test generan los archivos de consulta en `public/search-library`.

## Actualizar la referencia de C++20

`python3 scripts/import-cpp-reference.py <draft-n4861>/source` contrasta declaraciones y miembros públicos con el borrador N4861 de WG21. El importador vincula cada ficha con su cláusula y conserva los enlaces anteriores. La selección de la biblioteca está en `src/docs/data/cpp-topics.json`, `src/docs/data/cpp-functions.json` y `src/docs/data/cpp-explanations.json`. El mismo importador coteja las fichas de sintaxis de `src/docs/data/cpp-language-topics.json` y registra sus ejemplos y enlaces a guías.

## Ampliar Java y C++ con documentación de referencia

Desde un clon limpio, ejecuta `node scripts/reference-snapshots.mjs restore` antes de actualizar las fichas. VCode conserva la firma de la versión que estudias y enlaza la fuente de cada ampliación.

- Java SE 21. Ejecuta `python3 scripts/import-java-docs.py <jdk-21+35.tar.gz> --generated-sources <src.zip>` con un JDK 21 o posterior y después `node scripts/reference-snapshots.mjs pack java`. Usa el [archivo de OpenJDK 21](https://github.com/openjdk/jdk21/archive/refs/tags/jdk-21%2B35.tar.gz) con SHA-256 `2807380de58faf3157f37ed95920fb9e892ef5fe5b85d16b6dac974f45c9aa45`. Para las clases generadas, extrae `lib/src.zip` de la distribución [Temurin 21+35](https://github.com/adoptium/temurin21-binaries/releases/tag/jdk-21%2B35) de la misma versión. Las explicaciones de la fuente original están en inglés y se atribuyen a [OpenJDK](public/licenses/openjdk.txt).
- C++20. Ejecuta `python3 scripts/import-cppreference-docs.py <html-book-20250209.zip>` y después `node scripts/reference-snapshots.mjs pack cpp`. La [edición del 9 de febrero de 2025](https://en.cppreference.com/Cppreference:Archives) usada aquí tiene SHA-256 `5389f2635f1417f05319b11f065ceecd1a8442c9143e2c127409137396b0c81c`. Los extractos adaptados se atribuyen a [cppreference](public/licenses/cppreference.txt).

## Editor del laboratorio

El laboratorio carga el analizador de sintaxis correspondiente al lenguaje activo. El editor admite números de línea, plegado, búsqueda, autocompletado y diagnósticos de TypeScript junto al código. Pulsa Control o Comando junto a Intro para ejecutar. Escape seguido de Tab devuelve la navegación por teclado a los controles del laboratorio.

En TypeScript, Opciones de comprobación permite añadir políticas sobre propiedades opcionales, firmas de índice y retornos. Estas opciones se guardan con el borrador y se aplican al comprobar tipos. El modo estricto sigue activo.

Pulsa Añadir archivo para separar un programa. PHP admite archivos `.php`, Java admite `.java` y C++ admite cabeceras. JavaScript y TypeScript pueden importar módulos locales. React admite componentes JSX, JavaScript y hojas de estilo CSS. Los tres permiten archivos JSON locales con su propio modo de edición. TypeScript infiere los tipos a partir de su contenido. Los módulos web usan esbuild, que se carga solo al ejecutar un programa con archivos auxiliares. Los paquetes disponibles para React son `react`, `react-dom` y `react-dom/client`.

Ejecutar inicia el archivo principal. Guardar conserva el programa con sus auxiliares y Descargar entrega el archivo de la pestaña activa. ZIP reúne el código, las pestañas y los recursos de la lección cuando hay varios archivos. Cada pestaña conserva su propio deshacer mientras el programa sigue abierto. La vista previa se puede ampliar sin reiniciar la demostración.

## Peticiones de prueba en PHP

El panel Petición HTTP permite elegir el método, los parámetros de consulta y un cuerpo de formulario o JSON. El resultado incluye el código de estado HTTP y las cabeceras pertinentes. La petición se ejecuta en la instancia temporal de PHP del navegador y queda guardada con el borrador.

## Motores de Java y C++

C++20 se compila con Clang para WebAssembly mediante BrowserCC y se ejecuta en un trabajador del navegador con WASI. Incluye entrada y salida estándar. Las excepciones y los hilos requieren un compilador nativo. Java usa TeaVM para obtener y ejecutar WebAssembly. El entorno de consola usa un marco aislado. Los artefactos y huellas de TeaVM están en `vendor/teavm-javac`, con atribuciones en `public/licenses`.
