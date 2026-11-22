import { build } from "esbuild";
await build({
  entryPoints: ["src/workspace/react-runtime.js"],
  outfile: "public/lab/react-runtime.js",
  bundle: true,
  format: "iife",
  minify: true,
  legalComments: "inline",
  define: { "process.env.NODE_ENV": '"production"' },
});

const { cp, mkdir, readFile, writeFile } = await import("node:fs/promises");
const { dirname, join } = await import("node:path");
const { default: ts } = await import("typescript");
const libraryDirectory = dirname(
  ts.getDefaultLibFilePath({ target: ts.ScriptTarget.ES2022 }),
);
const files = {};
async function includeLibrary(file) {
  if (Object.hasOwn(files, file)) return;
  const contents = await readFile(join(libraryDirectory, file), "utf8");
  files[file] = contents;
  for (const [, dependency] of contents.matchAll(/<reference lib="([^"]+)"/g)) {
    await includeLibrary(`lib.${dependency}.d.ts`);
  }
}
await includeLibrary("lib.es2022.d.ts");
const messages = JSON.parse(
  await readFile(
    join(libraryDirectory, "es", "diagnosticMessages.generated.json"),
    "utf8",
  ),
);
await writeFile(
  "public/lab/typescript-check.json",
  JSON.stringify({ files, messages }),
);

const javaRuntimeDirectory = "public/lab/java";
await mkdir(javaRuntimeDirectory, { recursive: true });
for (const file of [
  "compiler.wasm",
  "compiler.wasm-runtime.js",
  "compile-classlib-teavm.bin",
  "runtime-classlib-teavm.bin",
  "NOTICE.md",
]) {
  await cp(`vendor/teavm-javac/${file}`, `${javaRuntimeDirectory}/${file}`);
}
await build({
  entryPoints: ["vendor/teavm-javac/compiler.wasm-runtime.js"],
  outfile: `${javaRuntimeDirectory}/program-runtime.js`,
  bundle: true,
  format: "iife",
  globalName: "TeaVM",
  minify: true,
  legalComments: "inline",
});
