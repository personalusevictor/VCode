import { Clang, LLD, setUpSysroot } from "browsercc";
import clangUrl from "browsercc/dist/clang.wasm?url";
import lldUrl from "browsercc/dist/lld.wasm?url";
import sysrootUrl from "browsercc/dist/sysroot.tar?url";

const fileName = "main.cpp";
const flags = [
  "-std=c++20",
  "-O0",
  "-Wall",
  "-fno-color-diagnostics",
  "-Wextra",
  "-fno-exceptions",
  "-iquote",
  "/vcode-files",
];

let toolchain;

async function asset(url) {
  const response = await fetch(url);
  if (!response.ok)
    throw new Error("No se pudo descargar el compilador de C++.");
  return response;
}

async function wasmModule(url) {
  const response = await asset(url);
  return response.headers.get("content-type") === "application/wasm"
    ? WebAssembly.compileStreaming(response)
    : WebAssembly.compile(await response.arrayBuffer());
}

function createTool(factory, binary, thisProgram, printErr) {
  return factory({
    thisProgram,
    printErr,
    instantiateWasm(imports, receive) {
      receive(new WebAssembly.Instance(binary, imports), binary);
    },
  });
}

async function driverArguments(binary) {
  let output = "";
  const driver = await createTool(Clang, binary, "clang++", (line) => {
    output += line + "\n";
  });
  // The driver plans the commands using the path and flags, without reading the source.
  driver.FS.writeFile(fileName, "");
  driver.FS.mkdirTree("/lib/wasm32-wasi");
  driver.FS.mkdirTree("/include/c++/v1");
  driver.FS.writeFile("/lib/wasm32-wasi/crt1-command.o", "");
  driver.FS.writeFile("/lib/wasm32-wasi/crt1-reactor.o", "");
  if (driver.callMain([fileName, ...flags, "-###"]) !== 0)
    throw new Error("No se pudo preparar la compilación de C++.");

  return ["-cc1", "wasm-ld"].map((marker) => {
    const command = output.split("\n").find((line) => line.includes(marker));
    const args = [...(command?.matchAll(/"([^"]*)"/g) ?? [])]
      .slice(1)
      .map((match) => match[1]);
    const outputName = args.indexOf("-o");
    if (outputName < 0 || !args[outputName + 1])
      throw new Error("No se encontró el archivo de salida de C++.");
    return { args, output: args[outputName + 1] };
  });
}

function loadToolchain() {
  return (toolchain ??= Promise.all([
    wasmModule(clangUrl),
    wasmModule(lldUrl),
    asset(sysrootUrl).then((response) => response.arrayBuffer()),
  ])
    .then(async ([clang, lld, sysroot]) => ({
      clang,
      lld,
      sysroot,
      commands: await driverArguments(clang),
    }))
    .catch((error) => {
      toolchain = undefined;
      throw error;
    }));
}

export async function compileCpp(source, files, onReady) {
  const {
    clang: clangBinary,
    lld: lldBinary,
    sysroot,
    commands: [compiler, linker],
  } = await loadToolchain();
  onReady();
  let compileOutput = "";
  const printErr = (line) => {
    compileOutput += line + "\n";
  };
  const clang = await createTool(Clang, clangBinary, "clang++", printErr);
  clang.FS.writeFile(fileName, source);
  setUpSysroot(clang, sysroot, files);
  // Emscripten prepends the program name to the argument array.
  if (clang.callMain([...compiler.args]) !== 0)
    return { compileOutput, module: null };

  const lld = await createTool(LLD, lldBinary, "wasm-ld", printErr);
  lld.FS.writeFile(compiler.output, clang.FS.readFile(compiler.output));
  setUpSysroot(lld, sysroot, files);
  if (lld.callMain([...linker.args]) !== 0)
    return { compileOutput, module: null };

  const module = await WebAssembly.compile(lld.FS.readFile(linker.output));
  return { compileOutput, module };
}
