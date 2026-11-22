self.onmessage = async ({
  data: { source, file, files, mainClass, directory },
}) => {
  const diagnostics = [];
  const asset = (name) => new URL(name, directory).href;
  try {
    self.postMessage({ phase: "Preparando el compilador de Java…" });
    const { load } = await import(
      /* @vite-ignore */ asset("compiler.wasm-runtime.js")
    );
    const fetchBytes = async (name) => {
      const response = await fetch(asset(name));
      if (!response.ok) throw new Error(`Falta el archivo de Java ${name}.`);
      return new Int8Array(await response.arrayBuffer());
    };
    const [runtime, sdk, classlib] = await Promise.all([
      load(asset("compiler.wasm"), { noAutoImports: true }),
      fetchBytes("compile-classlib-teavm.bin"),
      fetchBytes("runtime-classlib-teavm.bin"),
    ]);
    self.postMessage({ phase: "Compilando Java…" });
    const compiler = runtime.exports.createCompiler();
    compiler.setSdk(sdk);
    compiler.setTeaVMClasslib(classlib);
    compiler.onDiagnostic((diagnostic) => {
      if (diagnostics.length >= 30) return;
      const { type, severity, message } = diagnostic;
      let location = "";
      if (type === "javac") {
        const { lineNumber, columnNumber } = diagnostic;
        if (lineNumber > 0)
          location = `Línea ${lineNumber}${columnNumber > 0 ? `, columna ${columnNumber}` : ""} · `;
      }
      diagnostics.push({
        type: severity === "error" ? "error" : "warn",
        value: (location + message).slice(0, 2500),
      });
    });
    compiler.addSourceFile(file, source);
    for (const [name, content] of Object.entries(files))
      compiler.addSourceFile(name, content);
    if (
      !compiler.compile() ||
      !compiler.generateWebAssembly({ outputName: "app", mainClass })
    ) {
      self.postMessage({ diagnostics, compileFailed: true });
      return;
    }
    const output = compiler.getWebAssemblyOutputFile("app.wasm");
    if (!output?.length)
      throw new Error("El compilador no produjo un programa.");
    const wasm = new Uint8Array(output);
    self.postMessage({ wasm, diagnostics }, [wasm.buffer]);
  } catch (error) {
    self.postMessage({ error: error.message || "No se pudo iniciar Java." });
  }
};
