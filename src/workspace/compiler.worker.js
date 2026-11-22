import ts from "typescript";
import { checkTypes } from "./check-types";

self.onmessage = async ({
  data: { language, source, check, libraries, files, typeOptions },
}) => {
  try {
    if (check) {
      const response = await fetch(libraries);
      if (!response.ok)
        throw new Error("No se pudieron cargar los tipos de TypeScript.");
      const diagnostics = checkTypes(
        source,
        await response.json(),
        files,
        typeOptions,
      );
      self.postMessage({ diagnostics });
      return;
    }
    const jsx = language === "react";
    const result = ts.transpileModule(source, {
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.React,
        esModuleInterop: true,
      },
      fileName: jsx ? "App.tsx" : "programa.ts",
      reportDiagnostics: true,
    });
    const errors = result.diagnostics.filter(
      (item) => item.category === ts.DiagnosticCategory.Error,
    );
    if (errors.length)
      throw new Error(
        errors
          .map((item) =>
            ts.flattenDiagnosticMessageText(item.messageText, "\n"),
          )
          .join("\n"),
      );
    self.postMessage({ code: result.outputText });
  } catch (error) {
    self.postMessage({ error: error.message });
  }
};
