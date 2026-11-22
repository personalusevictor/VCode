import ts from "typescript";
import { readTypeCheckOptions } from "./type-check-options.js";

const filename = "/programa.ts";
const runtime = "/vcode-console.d.ts";
const defaults = "lib.es2022.d.ts";
const consoleDeclarations = `
declare const console: {
  log(...values: unknown[]): void;
  info(...values: unknown[]): void;
  table(...values: unknown[]): void;
  warn(...values: unknown[]): void;
  error(...values: unknown[]): void;
};
declare function setTimeout(callback: () => void, delay?: number): number;
declare function clearTimeout(id?: number): void;
`;

export function checkTypes(source, { files, messages }, extras = {}, options) {
  ts.setLocalizedDiagnosticMessages(messages);
  const available = new Map([
    [filename, source],
    [runtime, consoleDeclarations],
    ...Object.entries(files).map(([name, text]) => [`/${name}`, text]),
    ...Object.entries(extras).map(([name, text]) => [`/${name}`, text]),
  ]);
  const absolute = (name) => (name.startsWith("/") ? name : `/${name}`);
  const readFile = (name) => available.get(absolute(name));
  const program = ts.createProgram(
    [filename, runtime, ...Object.keys(extras).map((name) => `/${name}`)],
    {
      strict: true,
      ...readTypeCheckOptions(options),
      allowJs: true,
      allowImportingTsExtensions: true,
      resolveJsonModule: true,
      noEmit: true,
      skipLibCheck: true,
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      lib: [defaults],
      types: [],
    },
    {
      fileExists: (name) => available.has(absolute(name)),
      readFile,
      directoryExists: (name) => name === "/",
      getDirectories: () => [],
      getCurrentDirectory: () => "/",
      getDefaultLibLocation: () => "/",
      getDefaultLibFileName: () => defaults,
      getCanonicalFileName: (name) => name,
      useCaseSensitiveFileNames: () => true,
      getNewLine: () => "\n",
      writeFile: () => {},
      getSourceFile(name, languageVersion) {
        const contents = readFile(name);
        if (contents === undefined) return undefined;
        return ts.createSourceFile(absolute(name), contents, languageVersion);
      },
    },
  );
  return ts.getPreEmitDiagnostics(program).map((diagnostic) => {
    const { file, start, length, code, category, messageText } = diagnostic;
    const position =
      file && start !== undefined
        ? file.getLineAndCharacterOfPosition(start)
        : null;
    return {
      type: category === ts.DiagnosticCategory.Error ? "error" : "warn",
      value: `TS${code} · ${ts.flattenDiagnosticMessageText(messageText, "\n")}`,
      ...(position &&
        (file.fileName === filename ||
          Object.hasOwn(extras, file.fileName.slice(1))) && {
          file: file.fileName.slice(1),
          offset: start,
          length,
          line: position.line + 1,
          column: position.character + 1,
        }),
    };
  });
}
