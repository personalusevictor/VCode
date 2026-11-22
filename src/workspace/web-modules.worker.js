import { build, initialize } from "esbuild-wasm/esm/browser.js";
import wasmURL from "esbuild-wasm/esbuild.wasm?url";
import { resolveProgramImport } from "./program-files";

const reactModules = new Map([
  ["react", "React"],
  ["react-dom", "ReactDOM"],
  ["react-dom/client", "ReactClient"],
]);

function modulePlugin(language, entry, sources) {
  return {
    name: "vcode-modules",
    setup(plugin) {
      plugin.onResolve({ filter: /.*/ }, ({ kind, path, with: attributes }) => {
        if (kind === "entry-point") return { path: entry, namespace: "vcode" };
        if (language === "react" && reactModules.has(path))
          return { path, namespace: "vcode-react" };
        const file = resolveProgramImport(language, path, sources);
        if (file) {
          const keys = Object.keys(attributes || {});
          if (
            keys.length &&
            (keys.length !== 1 ||
              attributes.type !== "json" ||
              !file.endsWith(".json"))
          )
            return {
              errors: [
                {
                  text: 'El laboratorio admite with { type: "json" } en archivos JSON.',
                },
              ],
            };
          return { path: file, namespace: "vcode" };
        }
        return {
          errors: [
            { text: `No se encuentra el módulo «${path}» en este programa.` },
          ],
        };
      });
      plugin.onLoad({ filter: /.*/, namespace: "vcode" }, ({ path }) => {
        const extension = path.split(".").at(-1);
        const loader = { mjs: "js", mts: "ts" }[extension] ?? extension;
        return { contents: sources[path], loader };
      });
      plugin.onLoad({ filter: /.*/, namespace: "vcode-react" }, ({ path }) => ({
        contents: `module.exports = ${reactModules.get(path)};`,
        loader: "js",
      }));
    },
  };
}

function formatMessage(type, message, sources) {
  const location = message.location;
  const file = location?.file.replace(/^vcode:/, "");
  const diagnostic = { type, value: message.text };
  if (!file || !Object.hasOwn(sources, file)) return diagnostic;
  const lines = sources[file].split("\n");
  const before = lines.slice(0, location.line - 1).join("\n");
  const encoded = new TextEncoder().encode(location.lineText);
  const decoder = new TextDecoder();
  const column = decoder.decode(encoded.subarray(0, location.column)).length;
  const length = decoder.decode(
    encoded.subarray(location.column, location.column + location.length),
  ).length;
  return {
    ...diagnostic,
    file,
    offset: before.length + (location.line - 1 > 0 ? 1 : 0) + column,
    length,
    line: location.line,
    column: column + 1,
  };
}

self.onmessage = async ({ data: { language, file, source, files } }) => {
  const sources = { ...files, [file]: source };
  try {
    self.postMessage({ phase: "Preparando los módulos locales…" });
    await initialize({ wasmURL, worker: false });
    const output = await build({
      entryPoints: [file],
      write: false,
      outdir: "/",
      logLevel: "silent",
      bundle: true,
      format: "esm",
      target: "es2022",
      platform: "browser",
      plugins: [modulePlugin(language, file, sources)],
    });
    self.postMessage({
      code: output.outputFiles.find(({ path }) => path.endsWith(".js")).text,
      css: output.outputFiles.find(({ path }) => path.endsWith(".css"))?.text,
      diagnostics: output.warnings.map((item) =>
        formatMessage("warn", item, sources),
      ),
    });
  } catch (error) {
    if (error.errors?.length)
      self.postMessage({
        compileFailed: true,
        diagnostics: error.errors.map((item) =>
          formatMessage("error", item, sources),
        ),
      });
    else self.postMessage({ error: error.message });
  }
};
