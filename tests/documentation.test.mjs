import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { gunzipSync } from "node:zlib";
import {
  parseDocumentationRoute,
  documentationUrl,
  phpReferenceBucket,
} from "../src/docs/routes.js";
const read = (file) =>
  JSON.parse(fs.readFileSync(new URL(file, import.meta.url)));
const references = read("../src/docs/data/html-reference.json");
const guides = read("../src/docs/data/guides.json");
const index = read("../src/data/search-index.json");
const symbols = ["css-reference", "quick-reference", "standard-indexes"]
  .flatMap((file) => read(`../src/docs/data/${file}.json`))
  .filter((entry) => entry.language !== "php");
const php = read("../src/docs/data/php-catalog.json");
const java = read("../src/docs/data/java-catalog.json");
const cpp = read("../src/docs/data/cpp20-catalog.json");
const javaSyntax = read("../src/docs/data/java-syntax-catalog.json");
const standardIds = new Set(
  [...java, ...javaSyntax, ...cpp].map(({ id }) => id),
);
const web = [
  ...java,
  ...javaSyntax,
  ...cpp,
  ...read("../src/docs/data/web-catalog.json"),
  ...read("../src/docs/data/framework-catalog.json"),
  ...read("../src/docs/data/sqlite-catalog.json"),
  ...["java", "cpp"].flatMap((language) =>
    read(`../src/docs/data/web/${language}-standard.json`)
      .filter(({ id }) => !standardIds.has(id))
      .map((entry) => ({ ...entry, web: `${language}-standard` })),
  ),
];
const symbolIds = new Set(
  [...symbols, ...php, ...web].map((entry) => entry.id),
);
const languages = read("../src/data/languages.json");

test("los enlaces del índice y del buscador resuelven a contenido real", () => {
  for (const entry of index) {
    const route = parseDocumentationRoute(entry.href.slice(1));
    if (route.type === "reference")
      assert.ok(
        references.some(({ id }) => id === route.id),
        entry.href,
      );
    else if (route.type === "symbol")
      assert.ok(symbolIds.has(route.id), entry.href);
    else
      assert.ok(
        guides.some(
          (guide) =>
            guide.language === route.language && guide.number === route.number,
        ),
        entry.href,
      );
  }
  assert.equal(references.length, 113);
  assert.equal(
    index.length,
    references.length + guides.length + symbolIds.size,
  );
});

test("cada referencia tiene un ejemplo, atributos, recomendaciones y enlaces válidos", () => {
  assert.equal(new Set(references.map(({ id }) => id)).size, references.length);
  for (const entry of references) {
    assert.ok(entry.code.trim().length > 5, entry.id);
    assert.ok(Array.isArray(entry.attributes), entry.id);
    assert.ok(entry.tips.length >= 1, entry.id);
    assert.ok(
      ["developer.mozilla.org", "html.spec.whatwg.org"].includes(
        new URL(entry.source).hostname,
      ),
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
  for (const { id: language, lessons } of languages) {
    assert.deepEqual(
      guides
        .filter((guide) => guide.language === language)
        .map(({ number }) => number),
      Array.from({ length: lessons.length }, (_, i) => i + 1),
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

test("cada temario y archivo de curso conservan las mismas lecciones y rutas", () => {
  const index = read("../src/data/lesson-index.json");
  for (const language of languages) {
    const entries = guides.filter((guide) => guide.language === language.id);
    const path = new URL(
      `../public/search-library/course-${language.id}.json.gz`,
      import.meta.url,
    );
    const file = JSON.parse(gunzipSync(fs.readFileSync(path)));
    assert.deepEqual(file, entries, language.id);
    assert.deepEqual(
      index.filter((guide) => guide.language === language.id),
      entries.map(({ id, language, number, title, level, minutes }) => ({
        id,
        language,
        number,
        title,
        level,
        minutes,
      })),
    );
  }
});

test("las nueve formaciones tienen prácticas y archivos de ejemplo válidos", () => {
  for (const guide of guides) {
    assert.ok(guide.objectives.length >= 2, guide.id);
    assert.ok(guide.concepts.length >= 2, guide.id);
    assert.ok(guide.practice.steps.length >= 2, guide.id);
    for (const filename of guide.resources || []) {
      assert.ok(guide.code.includes(filename), filename);
      assert.ok(
        fs.existsSync(
          new URL(`../src/assets/lesson-media/${filename}`, import.meta.url),
        ),
        filename,
      );
    }
    if (guide.labLanguage === "javascript") {
      assert.equal(guide.mode, "dom");
      assert.ok(guide.markup.includes('<template id="tarjeta">'));
      assert.match(guide.labCode, /cloneNode\(true\)/);
    }
  }
});

test("los enlaces de las guías abren fichas que existen", () => {
  const hrefs = new Set(index.map(({ href }) => href));
  for (const { id, relatedReferences = [] } of guides)
    for (const { href } of relatedReferences)
      assert.ok(hrefs.has(href), `${id} -> ${href}`);
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
  assert.equal(parseDocumentationRoute("docs").browse, undefined);
  assert.deepEqual(
    parseDocumentationRoute(
      documentationUrl({
        language: "php",
        category: "Sesiones",
        browse: true,
      }).slice(1),
    ),
    {
      type: "index",
      language: "php",
      query: "",
      kind: "all",
      browse: true,
      category: "Sesiones",
    },
  );
});

test("el catálogo PHP apunta a fichas con contenido, no solo enlaces", () => {
  const byModule = new Map();
  for (const { id, extension } of php) {
    if (!byModule.has(extension)) {
      const items = read(`../src/docs/data/php/${extension}.json`);
      byModule.set(extension, new Map(items.map((item) => [item.id, item])));
    }
    const entry = byModule.get(extension).get(id);
    assert.ok(entry?.summary.trim(), id);
    assert.ok(entry.label || entry.alias || entry.signatures.length > 0, id);
    assert.equal(new URL(entry.source).hostname, "www.php.net", id);
  }
  const status = byModule.get("session").get("php-function-session_status");
  assert.equal(status.signatures[0].code, "session_status(): int");
  assert.deepEqual(status.signatures[0].parameters, []);
  assert.deepEqual(
    status.returnValues.map(({ value }) => value),
    ["PHP_SESSION_DISABLED", "PHP_SESSION_NONE", "PHP_SESSION_ACTIVE"],
  );
  assert.ok(status.examples.some(({ runnable }) => runnable));
  const active = byModule.get("session").get("php-constant-php_session_active");
  assert.equal(active.typeName, "int");
  assert.ok(active.related.includes("session_status"));
  const definitions = byModule.get("language");
  assert.ok(
    definitions
      .get("php-class-backedenum")
      .members.includes("php-method-backedenum.tryfrom"),
  );
  assert.equal(
    definitions.get("php-method-backedenum.tryfrom").signatures[0].returnType,
    "static|null",
  );
  const server = byModule.get("language-variables").get("php-variable-_server");
  assert.ok(server.fields.some(({ name }) => name === "REQUEST_METHOD"));
  const syntax = byModule.get("language-constructs");
  for (const entry of syntax.values()) {
    assert.equal(entry.locale, "es", entry.id);
    assert.ok(entry.declaration, entry.id);
    assert.ok(entry.description.length, entry.id);
    assert.ok(
      entry.examples.some(({ runnable, output }) => runnable && output),
      entry.id,
    );
  }
  const loadOnce = syntax.get("php-construct-require-once");
  assert.equal(loadOnce.title, "require_once");
  assert.match(loadOnce.declaration, /__DIR__/);
  assert.ok(loadOnce.examples[0].files["formato.php"]);
  assert.ok(
    syntax
      .get("php-construct-match")
      .description.some((line) => line.includes("===")),
  );
});

test("PHP publica todas las fichas por ruta y resuelve las conexiones sin un índice global", () => {
  const buckets = Map.groupBy(php, ({ id }) => phpReferenceBucket(id));
  const catalog = new Map(php.map((entry) => [entry.id, entry.title]));
  const recovered = new Map();
  for (const [bucket, entries] of buckets) {
    const file = new URL(
      `../public/search-library/php-ref-${bucket}.json.gz`,
      import.meta.url,
    );
    const blob = fs.readFileSync(file);
    assert.ok(blob.length < 18_000, bucket);
    const records = JSON.parse(gunzipSync(blob));
    assert.deepEqual(
      records.map(({ id }) => id),
      entries.map(({ id }) => id),
    );
    for (const record of records) {
      recovered.set(record.id, record);
      for (const { id, title } of record.methodLinks || [])
        assert.equal(catalog.get(id)?.split("::")[1], title);
      for (const { id, title } of record.connections || [])
        assert.equal(catalog.get(id), title);
      if (record.aliasLink)
        assert.equal(catalog.get(record.aliasLink.id), record.aliasLink.title);
      for (const { id } of record.returnValues || [])
        if (id) assert.ok(catalog.has(id), id);
    }
  }
  assert.equal(recovered.size, php.length);
  const alias = recovered.get("php-function-session_commit");
  assert.equal(alias.aliasLink.id, "php-function-session_write_close");
  assert.ok(alias.aliasDocumentation.description.length);
  const input = recovered.get("php-constant-input_get").parameterUses[0];
  assert.equal(input.id, "php-function-filter_has_var");
  assert.match(input.note, /INPUT_GET/);
  assert.ok(
    recovered
      .get("php-constant-php_session_active")
      .returnUses.some(({ id }) => id === "php-function-session_status"),
  );

  assert.deepEqual(
    recovered
      .get("php-function-session_status")
      .returnValues.map(({ id }) => id),
    [
      "php-constant-php_session_disabled",
      "php-constant-php_session_none",
      "php-constant-php_session_active",
    ],
  );
  assert.ok(
    recovered
      .get("php-class-pdo")
      .methodLinks.some(({ id }) => id === "php-api-PDO%3A%3Aprepare()"),
  );
  assert.equal(
    recovered.get("php-function-session_commit").aliasLink.id,
    "php-function-session_write_close",
  );
});

test("las referencias web ampliadas tienen contenido y su ficha original", () => {
  const shards = new Map();
  for (const { id, web: shard, source } of web) {
    if (!shards.has(shard)) {
      const items = read(`../src/docs/data/web/${shard}.json`);
      shards.set(shard, new Map(items.map((item) => [item.id, item])));
    }
    const entry = shards.get(shard).get(id);
    assert.ok(
      entry?.intro?.[0]?.trim() ||
        entry?.usage?.trim() ||
        (entry?.owner && entry?.signatures?.length),
      id,
    );
    if (entry.owner) assert.ok(standardIds.has(entry.owner.id), id);
    for (const member of entry.members || [])
      assert.ok(standardIds.has(member.id), id);
    for (const related of entry.related || [])
      assert.ok(symbolIds.has(related.id), related.id);
    assert.equal(entry.source, source, id);
    assert.ok(
      [
        "developer.mozilla.org",
        "react.dev",
        "es.react.dev",
        "www.typescriptlang.org",
        "www.sqlite.org",
        "docs.oracle.com",
        "timsong-cpp.github.io",
      ].includes(new URL(source).hostname),
      id,
    );
  }
  const useEffectEvent = shards
    .get("react-react")
    .get("react-api-useEffectEvent");
  assert.equal(useEffectEvent.parameters[0].label, "callback");
  assert.ok(useEffectEvent.returns.length && useEffectEvent.caveats.length);
  const partial = shards
    .get("typescript-utility")
    .get("typescript-api-Partial%3CT%3E");
  assert.equal(partial.usage, "Partial<Type>");
  assert.equal(
    shards.get("typescript-config").get("web-typescript-config-strict")
      .environment,
    "Compilación",
  );
  const arrayAt = shards
    .get("javascript-global_objects-array")
    .get("web-javascript-global_objects-array-at");
  assert.match(arrayAt.usage, /at\(index\)/);
  assert.ok(arrayAt.parameters.length);
  assert.ok(arrayAt.returns.length);
  const htmlEvents = read("../src/docs/data/standard-indexes.json").filter(
    ({ group }) => group === "html-events",
  );
  for (const example of read("../src/docs/data/web-examples.json")) {
    const item =
      web.find(({ id }) => id === example.id) ??
      htmlEvents.find(({ id }) => id === example.id);
    if (item?.group === "html-events") {
      assert.equal(example.language, "javascript", example.id);
      assert.equal(example.mode, "dom", example.id);
      assert.ok(example.markup.includes(item.title), example.id);
    } else assert.equal(item?.language, example.language, example.id);
    assert.ok(example.code.trim().length > 5);
  }
});

test("Java conserva sus enlaces y separa las sobrecargas públicas", () => {
  const official = read("../src/docs/data/java-se-types.json");
  const aliases = new Set(java.flatMap((entry) => entry.aliases || []));
  for (const name of official)
    assert.ok(aliases.has(name.replaceAll("$", ".")), name);
  const record = (id) => {
    const indexed = java.find((entry) => entry.id === id);
    return read(`../src/docs/data/web/${indexed.web}.json`).find(
      (entry) => entry.id === id,
    );
  };
  const valueOf = record(
    java.find(({ title }) => title === "String.valueOf()").id,
  );
  const array = valueOf.overloads.find(({ signature }) =>
    signature.includes("valueOf(char[])"),
  );
  const object = valueOf.overloads.find(({ signature }) =>
    signature.includes("valueOf(Object)"),
  );
  assert.equal(array.parameters[0].label, "data");
  assert.equal(object.parameters[0].label, "obj");
  assert.match(object.returns[0], /null/);
  const inherited = record(
    "web-java-se-java.lang.reflect.Constructor.getParameterCount",
  );
  assert.equal(inherited.inheritedDocumentation, true);
  assert.ok(inherited.documentationSource.endsWith("/Executable.java"));
  const enumMethod = record(
    "web-java-se-java.lang.reflect.ClassFileFormatVersion.values",
  );
  assert.equal(enumMethod.locale, "es");
  assert.match(enumMethod.intro[0], /orden/);
  const list = record("java-api-List");
  assert.ok(
    list.hierarchy.some(({ types }) =>
      types.some(({ title }) => title === "SequencedCollection"),
    ),
  );
  const remove = record(java.find(({ title }) => title === "List.remove()").id);
  assert.ok(list.members.some(({ id }) => id === remove.id));
  assert.equal(remove.owner.id, list.id);
  assert.ok(
    remove.signatures.some((value) => value.includes("boolean remove(Object)")),
  );
  assert.ok(remove.signatures.some((value) => value.includes("E remove(int)")));
  assert.equal(record("web-java-ArrayList.add").owner.title, "ArrayList");
  assert.equal(record("java-api-Stream.filter()").owner.title, "Stream");
});

test("un tipo Java grande se publica con sus miembros en un bloque comprimido", () => {
  const entry = java.find(({ id }) => id === "web-java-se-javax.swing.JButton");
  const file = new URL(
    `../public/search-library/reference-${entry.web}.json.gz`,
    import.meta.url,
  );
  const blob = fs.readFileSync(file);
  const shard = JSON.parse(gunzipSync(blob));
  const type = shard.find(({ id }) => id === entry.id);
  assert.ok(blob.length < 20_000);
  assert.ok(type.members.some(({ title }) => title === "setDefaultCapable"));
  for (const { id } of type.members)
    assert.ok(
      shard.some((item) => item.id === id),
      id,
    );
  assert.ok(
    type.hierarchy.some(({ types }) =>
      types.some(({ title }) => title === "AbstractButton"),
    ),
  );
});

test("C++20 enlaza los tipos con firmas públicas y conserva rutas existentes", () => {
  const containers = read("../src/docs/data/web/cpp20-containers.json");
  const capacity = containers.find(
    ({ title }) => title === "std::vector::capacity()",
  );
  assert.match(capacity.intro[0], /allocated space/);
  assert.match(capacity.documentationSource, /vector\/capacity$/);
  assert.ok(capacity.complexity.length);
  const at = containers.find(({ title }) => title === "std::array::at()");
  assert.equal(at.parameters[0].label, "pos");
  const cbegin = containers.find(
    ({ title }) => title === "std::vector::cbegin()",
  );
  assert.match(cbegin.documentationSource, /vector\/begin$/);
  const vector = containers.find(({ id }) => id === "cpp-api-std%3A%3Avector");
  const erase = containers.find(
    ({ title }) => title === "std::vector::erase()",
  );
  assert.equal(
    vector.members.find(({ title }) => title === "erase").id,
    erase.id,
  );
  assert.equal(erase.owner.id, vector.id);
  assert.equal(erase.signatures.length, 2);
  assert.ok(
    containers.some(({ id }) => id === "web-cpp-std%3A%3Avector%3A%3Areserve"),
  );
  const strings = read("../src/docs/data/web/cpp20-strings.json");
  const view = strings.find(({ title }) => title === "std::string_view");
  assert.equal(
    strings.find(({ title }) => title === "std::string_view::substr()").group,
    view.group,
  );
  assert.ok(
    view.members.some(
      ({ id }) => id === "web-cpp-std%3A%3Astring_view%3A%3Asubstr",
    ),
  );
  const ranges = read("../src/docs/data/web/cpp20-ranges.json");
  const subrange = ranges.find(
    ({ title }) => title === "std::ranges::subrange",
  );
  assert.match(subrange.usage, /template<input_or_output_iterator I/);
  assert.match(subrange.usage, /requires \(K == subrange_kind::sized/);
  const take = ranges.find(({ title }) => title === "std::views::take");
  assert.equal(take.related[0].title, "std::ranges::take_view");
  assert.equal(take.example.expected, "10\n11\n12");
  const utility = read("../src/docs/data/web/cpp20-utilities.json");
  const fn = utility.find(({ title }) => title === "std::function");
  assert.match(fn.usage, /class function<R\(ArgTypes\.\.\.\)>/);
  assert.ok(fn.members.some(({ title }) => title === "operator()"));
});

test("la sintaxis de C++20 conecta cada ficha con su ejemplo y su guía", () => {
  const authored = read("../src/docs/data/cpp-language-topics.json");
  const syntax = cpp.filter(({ id }) => id.startsWith("web-cpp20-syntax-"));
  assert.equal(syntax.length, authored.length);

  const chapters = new Map();
  for (const topic of authored) {
    const id = `web-cpp20-syntax-${topic.slug}`;
    const item = syntax.find((entry) => entry.id === id);
    assert.equal(
      item?.source,
      `https://timsong-cpp.github.io/cppwp/std20/${topic.section}`,
    );
    if (!chapters.has(item.web)) {
      chapters.set(item.web, read(`../src/docs/data/web/${item.web}.json`));
    }
    const detail = chapters.get(item.web).find((entry) => entry.id === id);
    assert.equal(detail.guide, topic.guide);
    assert.deepEqual(detail.example, topic.example);
    assert.ok(detail.example.expected && detail.example.code, id);
    assert.ok(detail.body.length && detail.caveats.length, id);
    for (const { id: related } of detail.related)
      assert.ok(standardIds.has(related), related);
  }
  assert.equal(
    authored.find(({ slug }) => slug === "catch").example.runnable,
    false,
  );
  assert.match(
    authored.find(({ slug }) => slug === "include").example.files[
      "duracion.hpp"
    ],
    /inline constexpr/,
  );
});

test("la sintaxis de Java 21 conserva ejemplos, guías y enlaces de la especificación", () => {
  const topics = read("../src/docs/data/java-language-topics.json");
  assert.equal(javaSyntax.length, topics.length);
  const chapters = new Map();
  for (const topic of topics) {
    const id = `web-java21-syntax-${topic.slug}`;
    const item = javaSyntax.find((entry) => entry.id === id);
    assert.equal(
      item?.source,
      `https://docs.oracle.com/javase/specs/jls/se21/html/jls-${topic.chapter}.html#jls-${topic.section}`,
    );
    if (!chapters.has(item.web))
      chapters.set(item.web, read(`../src/docs/data/web/${item.web}.json`));
    const detail = chapters.get(item.web).find((entry) => entry.id === id);
    assert.deepEqual(detail.example, topic.example);
    assert.equal(detail.guide, topic.guide);
    assert.ok(
      guides.some(
        ({ language, number }) => language === "java" && number === topic.guide,
      ),
      id,
    );
    for (const { id: related } of detail.related)
      assert.ok(standardIds.has(related), related);
  }
  assert.equal(
    topics.find(({ slug }) => slug === "module").example.runnable,
    false,
  );
  assert.match(
    topics.find(({ slug }) => slug === "package").example.files[
      "Duracion.java"
    ],
    /package vcode.sesiones/,
  );
});

test("JavaScript enlaza la especificación y mantiene Set separado del setter", () => {
  const curated = read("../src/docs/data/javascript-language-topics.json");
  const shards = new Map();
  for (const topic of curated) {
    const item = web.find(({ id }) => id === topic.id);
    if (!shards.has(item.web))
      shards.set(item.web, read(`../src/docs/data/web/${item.web}.json`));
    const entry = shards.get(item.web).find(({ id }) => id === item.id);
    assert.equal(entry.locale, "es");
    assert.equal(entry.provider, "ecmascript");
    assert.equal(
      entry.specification,
      `https://tc39.es/ecma262/2026/multipage/${topic.clause}`,
    );
    assert.deepEqual(entry.example, topic.example);
    assert.ok(
      guides.some(
        ({ language, number }) =>
          language === "javascript" && number === entry.guide,
      ),
      entry.id,
    );
  }
  const collection = web.find(({ id }) => id === "javascript-api-Set");
  const setter = web.find(({ id }) => id === "web-javascript-functions-set");
  assert.equal(collection.web, "javascript-global_objects-set");
  assert.match(collection.source, /Global_Objects\/Set$/);
  assert.match(setter.source, /Functions\/set$/);
});

test("las notas de sintaxis SQL se publican con fichas, ejemplos y enlaces", () => {
  const topics = read("../src/docs/data/sql-language-topics.json");
  const records = read("../src/docs/data/sqlite-catalog.json");
  const shards = new Map();
  for (const topic of topics) {
    const item = records.find(({ title }) => title === topic.title);
    assert.ok(item, topic.title);
    assert.equal(item.source, `https://www.sqlite.org/${topic.source}`);
    if (!shards.has(item.web))
      shards.set(item.web, read(`../src/docs/data/web/${item.web}.json`));
    const entry = shards.get(item.web).find(({ id }) => id === item.id);
    assert.equal(entry.locale, "es");
    assert.equal(entry.guide, topic.guide);
    assert.deepEqual(entry.example, topic.example);
    assert.ok(entry.usage && entry.body.length && entry.caveats.length);
  }
  assert.equal(
    records.find(({ title }) => title === "JOIN").id,
    "sql-api-JOIN",
  );
  assert.notEqual(
    records.find(({ title }) => title === "LIKE").id,
    records.find(({ title }) => title === "like()").id,
  );
});

test("todos los elementos del índice HTML y sus atributos consultables se cruzan", () => {
  const elements = read("../src/docs/data/html-element-meta.json");
  const names = read("../src/docs/data/html-attribute-ids.json");
  const attrs = read("../src/docs/data/standard-indexes.json");
  assert.deepEqual(
    Object.keys(elements).sort(),
    references.map(({ id }) => id).sort(),
  );
  for (const [name, id] of Object.entries(names)) {
    const entry = attrs.find((candidate) => candidate.id === id);
    assert.equal(entry?.title, name);
    assert.ok(
      entry.contexts.length &&
        entry.contexts.every((context) => context.elements.length),
      id,
    );
    assert.ok(
      index.some((candidate) => candidate.id === id),
      id,
    );
  }
  const contexts = attrs.find(({ title }) => title === "type").contexts;
  assert.ok(
    contexts.some(
      ({ elements, values }) =>
        elements.includes("button") && values.includes('"submit"'),
    ),
  );
  assert.ok(contexts.some(({ elements }) => elements.includes("input")));
  const click = attrs.find(({ title }) => title === "onclick");
  assert.equal(click.group, "html-events");
  assert.equal(click.contexts[0].event.name, "click");
  assert.ok(click.appliesTo.includes("HTML elements"));
  const pageShow = attrs.find(({ title }) => title === "onpageshow");
  assert.deepEqual(pageShow.appliesTo, ["body"]);
  assert.match(pageShow.contexts[0].purpose, /de Window\./);
});
