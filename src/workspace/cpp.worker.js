import { compileCpp } from "./cpp-compiler";
import { WASI, File, OpenFile, ConsoleStdout } from "@bjorn3/browser_wasi_shim";

const limit = 20000;
let previous;

function capture() {
  const decoder = new TextDecoder();
  let output = "";
  let truncated = false;
  return {
    stream: new ConsoleStdout((bytes) => {
      if (truncated) return;
      const next = decoder.decode(bytes, { stream: true });
      truncated = output.length + next.length > limit;
      output += next.slice(0, limit - output.length);
    }),
    read() {
      return (
        output + decoder.decode() + (truncated ? "\n[Salida recortada]" : "")
      );
    },
  };
}

self.onmessage = async ({ data: { source, input, files, compileOnly } }) => {
  const stdout = capture();
  const stderr = capture();
  try {
    const key = JSON.stringify([source, files]);
    if (previous?.key !== key) {
      self.postMessage({ phase: "Preparando el compilador de C++…" });
      const result = await compileCpp(
        source,
        Object.fromEntries(
          Object.entries(files).map(([name, content]) => [
            `/vcode-files/${name}`,
            content,
          ]),
        ),
        () => self.postMessage({ phase: "Compilando C++20…" }),
      );
      previous = { key, ...result };
    }
    const { module, compileOutput } = previous;
    const diagnostics = compileOutput.slice(0, limit);
    if (!module) {
      self.postMessage({ diagnostics, compileFailed: true });
      return;
    }

    if (compileOnly) {
      self.postMessage({ diagnostics, compiledOnly: true });
      return;
    }

    self.postMessage({ phase: "Ejecutando el programa…" });
    const runner = new WASI(
      ["main"],
      [],
      [
        new OpenFile(new File(new TextEncoder().encode(input))),
        stdout.stream,
        stderr.stream,
      ],
    );
    const instance = await WebAssembly.instantiate(module, {
      wasi_snapshot_preview1: runner.wasiImport,
    });
    const exitCode = runner.start(instance);
    self.postMessage({
      exitCode,
      diagnostics,
      output: stdout.read(),
      errors: stderr.read(),
    });
  } catch (error) {
    self.postMessage({
      error: error.message || "No se pudo abrir el entorno de C++.",
    });
  }
};
