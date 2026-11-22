import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePageTitle } from "../app/pageTitle";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  Terminal,
  Hammer,
  Code2,
  ListChecks,
  Download,
  Play,
  RotateCcw,
  Save,
  Square,
} from "lucide-react";
import { TechIcon } from "../app/Brand";
import { courses } from "../lib/catalog";
import { updateArchive, download, toggleArchive, useArchive } from "./archive";
import { documents, formats } from "./formats";
import { workshopExample } from "./project-workshops";
import { practiceExample, practiceMatches, practiceUrl } from "./practice";
import {
  consoleCode,
  domCode,
  javaCode,
  moduleCode,
  previewDocument,
  reactCode,
} from "./preview";
import { webExampleById } from "../docs/web-examples";
import { isPhpReferenceId } from "../docs/routes";
import { inlineLessonAssets } from "../docs/lesson-assets";
import CodeEditor from "./CodeEditor";
import LabFiles from "./LabFiles";
import LabBundle from "./LabBundle";
import PhpRequest from "./PhpRequest";
import { hasPhpRequest, readPhpRequest } from "./php-request";
import LabOutput from "./LabOutput";
import SqlParameters from "./SqlParameters";
import { SqlSchema } from "./SqlWorkbench";
import { cppDiagnostics } from "./cpp-diagnostics";
import TypeCheckOptions from "./TypeCheckOptions";
import { readTypeCheckOptions } from "./type-check-options";
import { readSqlParameters, sqlParameterNames } from "./sql-parameters";
import { auxiliaryTypes, readAuxiliaryFiles } from "./program-files";

const noFiles = Object.freeze({});

function runInWorker(worker, input, signal, timeout = 5000, onPhase, release) {
  return new Promise((resolve, reject) => {
    const finish = (error, result) => {
      clearTimeout(timer);
      signal.removeEventListener("abort", cancel);
      worker.onmessage = worker.onerror = null;
      if (release) release(Boolean(result));
      else worker.terminate();
      if (error) reject(error);
      else resolve(result);
    };
    const cancel = () =>
      finish(new DOMException("Ejecución detenida", "AbortError"));
    const timer = setTimeout(
      () => finish(new Error("La ejecución superó el tiempo disponible.")),
      timeout,
    );
    if (signal.aborted) {
      cancel();
      return;
    }
    signal.addEventListener("abort", cancel, { once: true });
    worker.onmessage = ({ data }) => {
      if (data.phase) onPhase?.(data.phase);
      else finish(data.error && new Error(data.error), data);
    };
    worker.onerror = (event) =>
      finish(new Error(event.message || "No se pudo iniciar el motor."));
    try {
      worker.postMessage(input);
    } catch (error) {
      finish(error);
    }
  });
}

function disposeRuntime(ref) {
  if (!ref.current) return;
  clearTimeout(ref.current.idle);
  ref.current.worker.terminate();
  ref.current = null;
}

function runWithRuntime(ref, createWorker, input, signal, timeout, onPhase) {
  const runtime = (ref.current ??= { worker: createWorker() });
  clearTimeout(runtime.idle);
  return runInWorker(
    runtime.worker,
    input,
    signal,
    timeout,
    onPhase,
    (ready) => {
      if (ref.current !== runtime) return;
      if (!ready) disposeRuntime(ref);
      else runtime.idle = setTimeout(() => disposeRuntime(ref), 30000);
    },
  );
}

export default function Laboratory({ route }) {
  const query = new URLSearchParams(route.split("?")[1]);
  const id = query.get("example");
  if (isPhpReferenceId(id))
    return <PhpSample key={route} id={id} variant={query.get("variant")} />;
  const reference = webExampleById(id);
  const example =
    workshopExample(id) ||
    practiceExample(id, query.get("variant")) ||
    reference;
  const requestedLanguage = query.get("language");
  if (id && !example)
    return <LibrarySample key={route} id={id} language={requestedLanguage} />;
  return (
    <Editor
      key={route}
      example={example}
      requestedLanguage={requestedLanguage}
      referenceId={reference ? id : undefined}
    />
  );
}

function LibrarySample({ id, language }) {
  const [sample, setSample] = useState(undefined);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    async function readExample() {
      if (/^(?:tag-|[a-z]+-[1-9]\d*$)/.test(id)) {
        const { exampleById } = await import("../docs/catalog");
        const example = await exampleById(id);
        if (example) return { example };
      }
      const { loadWebReference } = await import("../docs/web-reference");
      const details = await loadWebReference(id);
      if (details?.example)
        return details.example.runnable === false
          ? null
          : { example: details.example, referenceId: id };
      const { symbolById } = await import("../docs/symbol-catalog");
      const entry = symbolById(id);
      return entry?.example
        ? {
            example: { language: entry.language, code: entry.example },
            referenceId: id,
          }
        : null;
    }
    readExample().then(
      (result) => {
        if (active) setSample(result);
      },
      () => {
        if (active) setFailed(true);
      },
    );
    return () => {
      active = false;
    };
  }, [id, attempt]);
  if (failed)
    return (
      <div className="doc-note">
        <p role="alert">No se pudo abrir el ejemplo.</p>
        <button
          className="work-secondary"
          onClick={() => {
            setFailed(false);
            setAttempt((value) => value + 1);
          }}
        >
          Volver a intentar
        </button>
      </div>
    );
  if (sample === undefined) return <p role="status">Cargando el ejemplo…</p>;
  return (
    <Editor
      example={sample?.example}
      requestedLanguage={language}
      referenceId={sample?.referenceId}
    />
  );
}

function PhpSample({ id, variant }) {
  const [sample, setSample] = useState(null);
  const [missing, setMissing] = useState(false);
  useEffect(() => {
    let open = true;
    import("../docs/php-reference")
      .then(({ loadPhpReference }) => loadPhpReference(id))
      .then(
        (entry) => {
          if (!open) return;
          const example = entry?.examples[Number(variant ?? 0)];
          if (example?.runnable)
            setSample({
              language: "php",
              title: example.title,
              code: example.code,
              files: example.files,
              expected: example.output,
            });
          else setMissing(true);
        },
        () => {
          if (open) setMissing(true);
        },
      );
    return () => {
      open = false;
    };
  }, [id, variant]);
  if (sample)
    return <Editor example={sample} requestedLanguage="php" referenceId={id} />;
  if (missing)
    return (
      <section className="work-panel">
        <h1>Ejemplo no disponible</h1>
        <p>Esta variante no se puede ejecutar en el laboratorio.</p>
        <a className="work-secondary" href="#playground?language=php">
          Abrir un borrador de PHP
        </a>
      </section>
    );
  return <p role="status">Cargando el ejemplo de PHP…</p>;
}

function Editor({ example, requestedLanguage, referenceId }) {
  const archive = useArchive();
  const lang = example?.language || requestedLanguage;
  const initialLanguage = Object.hasOwn(formats, lang) ? lang : "html";
  const project = example?.project;
  const guide = Number.isInteger(example?.number) ? example : null;
  const exercise = example?.practice?.id ? example.practice : null;
  const draft = example?.solution
    ? null
    : project
      ? archive.projectDrafts[project]
      : exercise && archive.practiceDrafts[exercise.id];
  const [language, setLanguage] = useState(initialLanguage);
  const languageName = courses.find(({ id }) => id === language)?.name;
  usePageTitle(languageName ? `Laboratorio de ${languageName}` : "Laboratorio");
  const [buffers, setBuffers] = useState(() => ({
    ...archive.drafts,
    ...(example?.code && { [initialLanguage]: draft?.code ?? example.code }),
  }));
  const [extraFiles, setExtraFiles] = useState(() => ({
    ...archive.extraFiles,
    ...(example && {
      [initialLanguage]: readAuxiliaryFiles(
        initialLanguage,
        draft ? draft.files : example.files,
      ),
    }),
  }));
  const [selection, setSelection] = useState({});
  const [frame, setFrame] = useState(null);
  const [logs, setLogs] = useState([]);
  const [tables, setTables] = useState(null);
  const [stdin, setStdin] = useState(() =>
    initialLanguage === "cpp" && example
      ? (draft?.stdin ?? example.stdin ?? "")
      : archive.cppInput || "",
  );
  const [phpResponse, setPhpResponse] = useState(null);
  const [phpRequest, setPhpRequest] = useState(() =>
    readPhpRequest(
      example?.language === "php"
        ? draft
          ? draft.phpRequest
          : example.phpRequest
        : archive.phpRequest,
    ),
  );
  const [sqlInputs, setSqlInputs] = useState(() =>
    example?.language === "sql"
      ? (draft ? draft.parameters : example.parameters) || {}
      : archive.sqlParameters || {},
  );
  const [typeOptions, setTypeOptions] = useState(() =>
    readTypeCheckOptions(
      example?.language === "typescript"
        ? draft
          ? draft.typeOptions
          : example.typeOptions
        : archive.typeOptions,
    ),
  );
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [executionComplete, setExecutionComplete] = useState(false);
  const [practiceError, setPracticeError] = useState(false);
  const run = useRef();
  const runtime = useRef(null);
  const executed = useRef();
  const checkingTypes = useRef(false);
  const iframe = useRef();
  const editorToolbar = useRef(null);
  const resultPane = useRef(null);
  const editor = useRef();
  const editorSessions = useRef(new Map());
  const pendingDiagnostic = useRef(null);
  const format = formats[language];
  const [jsMode, setJsMode] = useState(
    example?.mode === "dom" || example?.id === "javascript-6"
      ? "dom"
      : "console",
  );
  const [markup, setMarkup] = useState(() => ({
    ...archive.markup,
    ...(example?.markup && {
      [initialLanguage]: draft?.markup ?? example.markup,
    }),
  }));
  const [editingDocument, setEditingDocument] = useState(false);
  const hasDocument =
    language === "css" ||
    (language === "javascript" && jsMode === "dom") ||
    (language === "react" && typeof markup.react === "string");
  const editingHtml = hasDocument && editingDocument;
  const documentCode = markup[language] ?? documents[language];
  const code = buffers[language] ?? format.demo;
  const web =
    ["html", "css", "react"].includes(language) ||
    (language === "javascript" && jsMode === "dom");
  const javaClass =
    language === "java" &&
    /\bpublic\s+(?:(?:final|abstract|sealed|non-sealed)\s+)*(?:class|record|enum|interface)\s+([A-Za-z_$][\w$]*)/.exec(
      code,
    )?.[1];
  const file = javaClass ? `${javaClass}.java` : format.file;
  const supportsFiles = Object.hasOwn(auxiliaryTypes, language);
  const files = extraFiles[language] ?? noFiles;
  const javaPackage =
    language === "java" ? /^\s*package\s+([\w.]+)\s*;/m.exec(code)?.[1] : null;
  const program = file.replace(/\.java$/, "");
  const javaMainClass = javaPackage ? `${javaPackage}.${program}` : program;
  const javaSources = language === "java" ? [file, ...Object.keys(files)] : [];
  const nativeOnly = example?.runtime === "native";
  const javaCommand =
    javaSources.length > 1 || javaPackage
      ? `javac --release 21 -d clases ${javaSources.map((name) => `'${name}'`).join(" ")}\njava -cp clases '${javaMainClass}'`
      : `java '${file}'`;
  const cppCommand = nativeOnly
    ? "c++ -std=c++20 -Wall -Wextra -pthread main.cpp -o programa && ./programa"
    : format.command;
  const selected = selection[language] ?? null;
  function selectFile(name) {
    setEditingDocument(false);
    setSelection((current) => ({ ...current, [language]: name }));
  }
  function changeFiles(next) {
    for (const filename of Object.keys(files)) {
      if (!Object.hasOwn(next, filename))
        editorSessions.current.delete(`${language}-file-${filename}`);
    }
    clearDiagnostics();
    setExtraFiles((current) => ({ ...current, [language]: next }));
  }
  const parameterNames = useMemo(
    () => (language === "sql" ? sqlParameterNames(code) : []),
    [language, code],
  );
  const activeFile = selected ?? (editingHtml ? "vista.html" : file);
  const extension = selected?.split(".").at(-1);
  const editorLanguage = editingHtml
    ? "html"
    : ["css", "json"].includes(extension)
      ? extension
      : language;
  const editorKey = `${language}-${selected ? `file-${selected}` : editingHtml ? "html" : "program"}`;
  const activeCode = selected
    ? files[selected]
    : editingHtml
      ? documentCode
      : code;
  const inProject = project === language && !example?.solution;
  const inPractice = exercise?.language === language && !example.solution;
  const expectedOutput =
    language === initialLanguage && !exercise
      ? (guide?.exampleOutput ?? (referenceId && example?.expected))
      : undefined;
  const done = exercise && archive.done.includes(exercise.id);
  const hasComparison =
    inPractice &&
    exercise.expected !== undefined &&
    executionComplete &&
    code === executed.current?.code &&
    files === executed.current.files &&
    stdin === executed.current.input &&
    (language !== "sql" || sqlInputs === executed.current.sqlInputs) &&
    (language !== "php" || phpRequest === executed.current.phpRequest);
  const changedFixture =
    hasComparison &&
    Object.entries(exercise.parameters || {}).some(
      ([name, value]) => sqlInputs[name]?.trim() !== value,
    );
  const comparison = hasComparison
    ? changedFixture
      ? "parameters"
      : practiceMatches(exercise.expected, logs, tables)
        ? "match"
        : "mismatch"
    : null;
  const showConsole = ["javascript", "typescript", "react", "java"].includes(
    language,
  );
  function stop() {
    run.current?.abort();
    run.current = null;
    checkingTypes.current = false;
    setFrame(null);
    setBusy(false);
    setExecutionComplete(false);
  }
  useEffect(
    () => () => {
      run.current?.abort();
      disposeRuntime(runtime);
    },
    [],
  );
  useEffect(() => {
    const receive = (event) => {
      if (
        event.source !== iframe.current?.contentWindow ||
        event.data?.token !== frame?.token
      )
        return;
      const { type, value } = event.data;
      if (type === "done" || type === "error") {
        setBusy(false);
        setExecutionComplete(type === "done");
        setStatus(
          type === "done"
            ? "Ejecución completada."
            : "La ejecución devolvió un error.",
        );
      }
      if (typeof value === "string" && type !== "done") {
        setLogs((items) =>
          items.length >= 200
            ? items
            : [...items, { type, value: value.slice(0, 5000) }],
        );
      }
    };
    window.addEventListener("message", receive);
    return () => window.removeEventListener("message", receive);
  }, [frame?.token]);

  useLayoutEffect(() => {
    const jump = pendingDiagnostic.current;
    if (jump?.file !== activeFile) return;
    pendingDiagnostic.current = null;
    editor.current?.select(jump.offset, jump.length);
  }, [activeFile]);

  function clearDiagnostics() {
    if (checkingTypes.current || logs.some(({ line }) => line)) {
      if (checkingTypes.current) stop();
      setLogs([]);
      setStatus("");
    }
  }

  function edit(value) {
    clearDiagnostics();
    setBuffers((current) => ({ ...current, [language]: value }));
  }
  async function execute({ compileOnly = false } = {}) {
    stop();
    if (Object.hasOwn(files, file)) {
      setLogs([
        {
          type: "error",
          value: `Hay dos archivos con el nombre ${file}. Cambia el nombre de la clase principal o quita el archivo repetido.`,
        },
      ]);
      setStatus("Revisa los nombres de los archivos.");
      return;
    }
    executed.current = { code, input: stdin, files, sqlInputs, phpRequest };
    const controller = new AbortController();
    run.current = controller;
    setTables(null);
    setPhpResponse(null);
    setLogs([]);
    setBusy(true);
    setStatus("Ejecutando…");
    const token = crypto.randomUUID();

    try {
      if (language === "java") {
        const directory = new URL(
          `${import.meta.env.BASE_URL}lab/java/`,
          location.href,
        ).href;
        const result = await runInWorker(
          new Worker(new URL("./java.worker.js", import.meta.url), {
            type: "module",
          }),
          {
            source: code,
            file,
            files,
            mainClass: javaMainClass,
            directory,
          },
          controller.signal,
          30000,
          setStatus,
        );
        if (controller.signal.aborted) return;
        setLogs(result.diagnostics);
        if (result.compileFailed) {
          setStatus("La compilación devolvió errores.");
          setBusy(false);
          return;
        }
        const response = await fetch(new URL("program-runtime.js", directory), {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("No se pudo abrir el entorno Java.");
        const runtime = await response.text();
        if (controller.signal.aborted) return;
        const bytes =
          typeof result.wasm.toBase64 === "function"
            ? result.wasm.toBase64()
            : btoa(
                Array.from(result.wasm, (byte) =>
                  String.fromCharCode(byte),
                ).join(""),
              );
        setStatus("Ejecutando el programa…");
        setFrame({
          token,
          html: previewDocument({ code: javaCode(runtime, bytes), token }),
        });
        return;
      }
      if (language === "cpp") {
        const result = await runWithRuntime(
          runtime,
          () =>
            new Worker(new URL("./cpp.worker.js", import.meta.url), {
              type: "module",
            }),
          { source: code, input: stdin, files, compileOnly },
          controller.signal,
          45000,
          setStatus,
        );
        if (controller.signal.aborted) return;
        setLogs([
          ...cppDiagnostics(
            result.diagnostics,
            code,
            files,
            result.compileFailed,
          ),
          ...(result.output ? [{ type: "log", value: result.output }] : []),
          ...(result.errors ? [{ type: "error", value: result.errors }] : []),
        ]);
        setStatus(
          result.compileFailed
            ? "La compilación devolvió errores."
            : result.compiledOnly
              ? "Compilación completada."
              : result.exitCode
                ? `El programa terminó con código ${result.exitCode}.`
                : "Ejecución completada.",
        );
        setExecutionComplete(!result.compileFailed && result.exitCode === 0);
        setBusy(false);
        return;
      }
      if (language === "php") {
        const result = await runInWorker(
          new Worker(new URL("./php.worker.js", import.meta.url), {
            type: "module",
          }),
          { source: code, file, files, request: phpRequest },
          controller.signal,
          25000,
        );
        if (controller.signal.aborted) return;
        setLogs([
          ...(result.output ? [{ type: "log", value: result.output }] : []),
          ...(result.warnings
            ? [{ type: "warn", value: result.warnings }]
            : []),
        ]);
        if (hasPhpRequest(phpRequest) || result.response.status !== 200)
          setPhpResponse(result.response);
        setStatus(
          result.exitCode
            ? `PHP terminó con código ${result.exitCode}.`
            : "Ejecución completada.",
        );
        setExecutionComplete(result.exitCode === 0);
        setBusy(false);
        return;
      }
      if (language === "sql") {
        const result = await runWithRuntime(
          runtime,
          () =>
            new Worker(new URL("./sql.worker.js", import.meta.url), {
              type: "module",
            }),
          { code, parameters: readSqlParameters(code, sqlInputs) },
          controller.signal,
          undefined,
          setStatus,
        );
        if (controller.signal.aborted) return;
        setTables(result.tables);
        setStatus(
          result.omitted
            ? `Ejecución completada. Resultados mostrados: ${result.tables.length} de ${result.tables.length + result.omitted}.`
            : "Ejecución completada.",
        );
        setExecutionComplete(true);
        setBusy(false);
        return;
      }

      let bundle;
      if (
        ["javascript", "typescript", "react"].includes(language) &&
        Object.keys(files).length
      ) {
        bundle = await runInWorker(
          new Worker(new URL("./web-modules.worker.js", import.meta.url), {
            type: "module",
          }),
          { language, file, source: code, files },
          controller.signal,
          20000,
          setStatus,
        );
        if (controller.signal.aborted) return;
        setLogs(bundle.diagnostics);
        if (bundle.compileFailed) {
          setStatus("Revisa los errores de los módulos.");
          setBusy(false);
          return;
        }
      }
      let options = { modules: Boolean(bundle) };
      if (language === "html")
        options.markup = guide?.resources?.length
          ? await inlineLessonAssets(code, guide.resources)
          : code;
      if (language === "css") options = { css: code, markup: documentCode };
      if (language === "javascript") {
        if (jsMode === "dom") options.markup = documentCode;
        options.code = bundle
          ? moduleCode(bundle.code, jsMode)
          : jsMode === "dom"
            ? domCode(code)
            : consoleCode(code);
      }
      if (language === "typescript" || language === "react") {
        const { code: compiled } =
          bundle ??
          (await runInWorker(
            new Worker(new URL("./compiler.worker.js", import.meta.url), {
              type: "module",
            }),
            { language, source: code },
            controller.signal,
            12000,
          ));
        if (language === "typescript")
          options.code = bundle
            ? moduleCode(compiled, "console")
            : consoleCode(compiled);
        else {
          const response = await fetch(
            `${import.meta.env.BASE_URL}lab/react-runtime.js`,
            { signal: controller.signal },
          );
          if (!response.ok)
            throw new Error("No se ha podido abrir el entorno React.");
          options = {
            ...options,
            runtime: await response.text(),
            css: bundle?.css,
            markup: documentCode,
            code: bundle ? moduleCode(compiled, "react") : reactCode(compiled),
          };
        }
      }

      if (controller.signal.aborted) return;
      setFrame({ token, html: previewDocument({ ...options, token }) });
      if (!showConsole) {
        setBusy(false);
        setStatus("Vista previa actualizada.");
      }
    } catch (error) {
      if (controller.signal.aborted) return;
      setBusy(false);
      setLogs([{ type: "error", value: error.message }]);
      setStatus("No se pudo ejecutar el código.");
    }
  }

  async function verifyTypes() {
    stop();
    setLogs([]);
    setStatus("Comprobando tipos…");
    checkingTypes.current = true;
    setBusy(true);
    const controller = new AbortController();
    run.current = controller;
    try {
      const { diagnostics } = await runInWorker(
        new Worker(new URL("./compiler.worker.js", import.meta.url), {
          type: "module",
        }),
        {
          language,
          source: code,
          files,
          check: true,
          typeOptions,
          libraries: new URL(
            `${import.meta.env.BASE_URL}lab/typescript-check.json`,
            location.href,
          ).href,
        },
        controller.signal,
        12000,
      );
      if (controller.signal.aborted) return;
      setLogs(
        diagnostics.length
          ? diagnostics
          : [{ type: "log", value: "Tipos correctos." }],
      );
      setStatus(
        diagnostics.length
          ? `${diagnostics.length} ${diagnostics.length === 1 ? "diagnóstico" : "diagnósticos"} de TypeScript.`
          : "Comprobación completada.",
      );
    } catch (error) {
      if (controller.signal.aborted) return;
      setLogs([{ type: "error", value: error.message }]);
      setStatus("No se pudo comprobar el código.");
    } finally {
      if (!controller.signal.aborted) {
        checkingTypes.current = false;
        setBusy(false);
      }
    }
  }

  function goToDiagnostic(filename, offset, length) {
    if (filename && activeFile !== filename) {
      pendingDiagnostic.current = { file: filename, offset, length };
      selectFile(filename === file ? null : filename);
    } else editor.current?.select(offset, length);
  }

  function changeLanguage(value) {
    stop();
    disposeRuntime(runtime);
    setLanguage(value);
    setPhpResponse(null);
    setEditingDocument(false);
    setLogs([]);
    setTables(null);
    setStatus("");
  }

  function saveDraft() {
    const scopedField = inProject
      ? "projectDrafts"
      : inPractice
        ? "practiceDrafts"
        : null;
    const ok = updateArchive((state) => {
      if (scopedField) {
        return {
          ...state,
          [scopedField]: {
            ...state[scopedField],
            [inProject ? project : exercise.id]: {
              code,
              ...(hasDocument && { markup: documentCode }),
              ...(supportsFiles && { files }),
              ...(language === "sql" && { parameters: sqlInputs }),
              ...(language === "php" && { phpRequest }),
              ...(language === "cpp" && { stdin }),
              ...(language === "typescript" && { typeOptions }),
            },
          },
        };
      }
      return {
        ...state,
        drafts: { ...state.drafts, [language]: code },
        sqlParameters: language === "sql" ? sqlInputs : state.sqlParameters,
        phpRequest: language === "php" ? phpRequest : state.phpRequest,
        cppInput: language === "cpp" ? stdin : state.cppInput,
        typeOptions:
          language === "typescript" ? typeOptions : state.typeOptions,
        extraFiles: supportsFiles
          ? { ...state.extraFiles, [language]: files }
          : state.extraFiles,
        markup: hasDocument
          ? { ...state.markup, [language]: documentCode }
          : state.markup,
      };
    });
    setStatus(
      !ok
        ? "No se pudo guardar el borrador."
        : inProject
          ? "Avance guardado en este proyecto."
          : inPractice
            ? "Borrador guardado en este ejercicio."
            : "Borrador guardado en Mi archivo.",
    );
  }

  function resetExample() {
    stop();
    if (language === "php") {
      setPhpRequest(
        readPhpRequest(language === initialLanguage && example?.phpRequest),
      );
      setPhpResponse(null);
    }
    if (language === "cpp" && !selected)
      setStdin(language === initialLanguage ? (example?.stdin ?? "") : "");
    if (language === "sql")
      setSqlInputs(
        language === initialLanguage ? example?.parameters || {} : {},
      );
    if (language === "typescript")
      setTypeOptions(
        readTypeCheckOptions(
          language === initialLanguage && example?.typeOptions,
        ),
      );
    if (selected)
      changeFiles({
        ...files,
        [selected]:
          (language === initialLanguage && example?.files?.[selected]) || "",
      });
    else if (editingHtml)
      setMarkup((current) => ({
        ...current,
        [language]:
          language === initialLanguage && example?.markup
            ? example.markup
            : documents[language],
      }));
    else {
      const defaults = language === initialLanguage && example?.files;
      if (
        defaults &&
        Object.keys(defaults).some((name) => !Object.hasOwn(files, name))
      )
        changeFiles({ ...defaults, ...files });
      edit(
        language === initialLanguage && example?.code
          ? example.code
          : format.demo,
      );
    }
    setTables(null);
    setLogs([]);
    setStatus("Ejemplo restablecido.");
  }

  const resetLabel = inProject
    ? "Restablecer punto de partida"
    : "Restablecer ejemplo";
  const resetButton = (
    <button
      className="work-icon"
      title={resetLabel}
      aria-label={resetLabel}
      onClick={resetExample}
    >
      <RotateCcw size={16} />
    </button>
  );

  return (
    <>
      <div
        className={`work-intro work-intro-compact lab-intro${exercise ? " practice-intro" : ""}`}
      >
        <div>
          <h1>
            {exercise
              ? example.solution
                ? `Solución · ${exercise.title}`
                : exercise.title
              : (guide?.title ??
                (referenceId && example?.title) ??
                "Laboratorio")}
          </h1>
          <p>
            {exercise
              ? exercise.brief
              : nativeOnly
                ? `Este ejemplo usa funciones de ${language === "java" ? "un JDK" : "un compilador nativo"}. Descarga el código cuando quieras probarlo.`
                : (guide?.body[0] ??
                  (referenceId && example?.description) ??
                  "Elige un lenguaje, edita el ejemplo y pulsa Ejecutar.")}
          </p>
        </div>
        {referenceId ? (
          <a className="work-secondary" href={`#symbol/${referenceId}`}>
            <ArrowLeft size={16} /> Volver a la ficha
          </a>
        ) : (
          <a
            className="work-secondary"
            href={
              project
                ? `#projects/${project}`
                : exercise
                  ? `#practice/${exercise.language}`
                  : guide
                    ? `#lesson/${guide.lessonLanguage || guide.language}/${guide.number}?section=example`
                    : "#practice"
            }
          >
            {(exercise || guide) && <ArrowLeft size={16} />}
            {project
              ? "Volver al proyecto"
              : guide
                ? "Volver a la lección"
                : "Ver ejercicios"}
          </a>
        )}
      </div>
      {!exercise && (
        <div
          className="work-tabbar lab-language-tabs"
          role="group"
          aria-label="Lenguaje del laboratorio"
        >
          {courses.map((course) => (
            <button
              key={course.id}
              aria-pressed={language === course.id}
              onClick={() => changeLanguage(course.id)}
            >
              <TechIcon id={course.id} /> {course.name}
            </button>
          ))}
        </div>
      )}
      {language === "javascript" && !exercise && (
        <div
          className="work-tabbar"
          role="group"
          aria-label="Entorno JavaScript"
        >
          {[
            ["console", "Consola JavaScript"],
            ["dom", "Documento de prueba"],
          ].map(([value, label]) => (
            <button
              key={value}
              aria-pressed={jsMode === value}
              onClick={() => {
                stop();
                setLogs([]);
                setStatus("");
                setJsMode(value);
              }}
            >
              {label}
            </button>
          ))}
        </div>
      )}
      {exercise?.language === language && (
        <section className="practice-brief" aria-label="Guía del ejercicio">
          {inPractice ? (
            <>
              <details>
                <summary>Qué comprobar</summary>
                <ul>
                  {exercise.criteria.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                {exercise.expected !== undefined && (
                  <pre>{exercise.expectedText || exercise.expected}</pre>
                )}
              </details>
              <details>
                <summary>Ver pista</summary>
                <p>{exercise.hint}</p>
              </details>
            </>
          ) : (
            <a className="work-link" href={practiceUrl(exercise)}>
              Volver a mi intento <ArrowRight size={16} />
            </a>
          )}
          <a
            className="work-link"
            href={`#lesson/${language}/${exercise.lesson}`}
          >
            Repasar la lección <ArrowUpRight size={15} />
          </a>
        </section>
      )}
      <div className="lab-toolbar" ref={editorToolbar}>
        {language === "php" && (
          <PhpRequest
            request={phpRequest}
            initiallyOpen={Boolean(example?.phpRequest)}
            onChange={(name, value) => {
              setPhpRequest((current) =>
                readPhpRequest({ ...current, [name]: value }),
              );
              setExecutionComplete(false);
              if (phpResponse)
                setStatus("Ejecuta para aplicar la petición editada.");
            }}
          />
        )}
        {language === "sql" && (
          <div className="lab-run-settings">
            <SqlSchema />
            <SqlParameters
              names={parameterNames}
              fields={sqlInputs}
              onChange={(name, value) => {
                setSqlInputs((current) => ({ ...current, [name]: value }));
                setExecutionComplete(false);
                if (tables)
                  setStatus("Ejecuta para aplicar los parámetros editados.");
              }}
            />
          </div>
        )}
        {language === "cpp" && (
          <div className="lab-run-settings lab-cpp-settings">
            <details className="lab-console-settings">
              <summary>
                <Terminal size={16} aria-hidden="true" /> Entrada del programa
                <ChevronDown size={15} aria-hidden="true" />
              </summary>
              <textarea
                aria-label="Entrada estándar de C++"
                rows={3}
                placeholder="Datos que leerá std::cin"
                value={stdin}
                maxLength={10000}
                onChange={(event) => {
                  setStdin(event.target.value);
                  setExecutionComplete(false);
                  if (logs.length)
                    setStatus("Ejecuta para usar la entrada editada.");
                }}
              />
            </details>
            <details
              className="lab-console-settings"
              open={nativeOnly || undefined}
            >
              <summary>
                <Hammer size={16} aria-hidden="true" /> Compilar en tu equipo
                <ChevronDown size={15} aria-hidden="true" />
              </summary>
              <div className="lab-build-command">
                <p>
                  {Object.keys(files).length
                    ? "Descarga el ZIP y abre la carpeta de los archivos."
                    : `Descarga ${file} y abre la carpeta del archivo.`}
                </p>
                <pre tabIndex={0} aria-label="Comando para compilar C++20">
                  {cppCommand}
                </pre>
              </div>
            </details>
          </div>
        )}
        <div className="lab-actions">
          {busy ? (
            <button
              className="work-primary"
              onClick={() => {
                stop();
                setStatus("Ejecución detenida.");
              }}
            >
              <Square size={15} /> Detener
            </button>
          ) : (
            <button
              className="work-primary"
              onClick={execute}
              title="Ejecutar · ⌘/Ctrl + Intro"
            >
              <Play size={16} /> Ejecutar
            </button>
          )}
          {language === "cpp" && (
            <button
              className="work-secondary"
              disabled={busy}
              onClick={() => execute({ compileOnly: true })}
            >
              <Hammer size={16} aria-hidden="true" /> Compilar
            </button>
          )}
          {language === "typescript" && (
            <button
              className="work-secondary"
              disabled={busy}
              onClick={verifyTypes}
            >
              <ListChecks size={16} /> Comprobar tipos
            </button>
          )}
          <button className="work-secondary" onClick={saveDraft}>
            <Save size={16} />{" "}
            {inProject
              ? "Guardar avance"
              : inPractice
                ? "Guardar borrador"
                : "Guardar"}
          </button>
          <button
            className="work-icon"
            aria-label="Descargar código"
            title="Descargar código"
            onClick={() => download(activeFile, activeCode)}
          >
            <Download size={17} />
          </button>
          {(hasDocument ||
            Object.keys(files).length > 0 ||
            guide?.resources?.length > 0) && (
            <LabBundle
              key={language}
              language={language}
              main={{ name: file, code }}
              document={hasDocument ? documentCode : undefined}
              files={files}
              resources={guide?.resources ?? []}
            />
          )}
          <button
            className="work-secondary lab-mobile-jump"
            onClick={() => {
              resultPane.current?.focus({ preventScroll: true });
              resultPane.current?.scrollIntoView({
                block: "start",
                behavior: "instant",
              });
            }}
          >
            <ArrowDown size={15} /> Ver resultado
          </button>
        </div>
      </div>
      <div className="lab-grid">
        <section className="lab-pane" aria-label="Editor">
          {supportsFiles ? (
            <LabFiles
              key={language}
              language={language}
              primary={file}
              documentTab={
                hasDocument
                  ? {
                      selected: editingHtml,
                      select() {
                        selectFile(null);
                        setEditingDocument(true);
                      },
                    }
                  : null
              }
              files={files}
              selected={selected}
              onSelect={selectFile}
              onChange={changeFiles}
              resetButton={resetButton}
            />
          ) : (
            <div className="lab-bar">
              <span>
                <Code2 size={17} />{" "}
                <span className="lab-active-file" title={activeFile}>
                  {activeFile}
                </span>
              </span>
              {hasDocument && (
                <div
                  className="lab-file-tabs"
                  role="group"
                  aria-label="Archivo que se está editando"
                >
                  <button
                    aria-pressed={!editingHtml}
                    onClick={() => setEditingDocument(false)}
                  >
                    {format.file}
                  </button>
                  <button
                    aria-pressed={editingHtml}
                    onClick={() => setEditingDocument(true)}
                  >
                    vista.html
                  </button>
                </div>
              )}
              {resetButton}
            </div>
          )}
          <CodeEditor
            key={editorKey}
            ref={editor}
            sessions={editorSessions.current}
            sessionKey={editorKey}
            label={`Código de ${activeFile}`}
            language={editorLanguage}
            value={activeCode}
            maxLength={editingHtml ? 60000 : 100000}
            diagnostics={logs.filter(
              ({ file }) => !file || file === activeFile,
            )}
            onChange={(value) => {
              if (selected) changeFiles({ ...files, [selected]: value });
              else if (editingHtml)
                setMarkup((current) => ({ ...current, [language]: value }));
              else edit(value);
            }}
            onRun={execute}
          />
          {language === "typescript" && (
            <TypeCheckOptions
              selected={typeOptions}
              onChange={(key, enabled) => {
                stop();
                setTypeOptions((current) =>
                  readTypeCheckOptions({ ...current, [key]: enabled }),
                );
                setLogs([]);
                setStatus("Comprueba los tipos con los ajustes actualizados.");
              }}
            />
          )}
        </section>
        <LabOutput
          language={language}
          mainFile={file}
          paneRef={resultPane}
          onEdit={() => {
            editorToolbar.current?.scrollIntoView({
              block: "start",
              behavior: "instant",
            });
            editor.current?.focus();
          }}
          frame={frame}
          iframe={iframe}
          web={web}
          showConsole={showConsole}
          tables={tables}
          phpResponse={phpResponse}
          logs={logs}
          busy={busy}
          status={status}
          expectedOutput={
            typeof expectedOutput === "string" ? expectedOutput : ""
          }
          onDiagnostic={goToDiagnostic}
          comparison={comparison}
        />
      </div>
      {inPractice && (
        <div className="practice-finish">
          <a className="work-link" href={practiceUrl(exercise, false)}>
            Ver solución <ArrowUpRight size={15} />
          </a>
          <button
            className="work-secondary"
            aria-pressed={done}
            onClick={() =>
              setPracticeError(!toggleArchive("done", exercise.id))
            }
          >
            <Check size={16} /> {done ? "Resuelto" : "Marcar como resuelto"}
          </button>
          {practiceError && <p role="alert">No se pudo guardar el avance.</p>}
        </div>
      )}
      {language === "php" && (
        <p className="work-muted">
          PHP 8.3 en el navegador. El ejemplo se ejecuta con un sistema de
          archivos temporal.
        </p>
      )}
      {language === "java" && (
        <div className="work-muted lab-native-option">
          <p>VCode compila Java y ejecuta programas de consola con TeaVM.</p>
          <details open={nativeOnly || undefined}>
            <summary>Ejecutar con un JDK</summary>
            <p>
              {javaSources.length > 1
                ? "Descarga todos los archivos Java en la misma carpeta y ejecuta estos comandos con un JDK 21 o posterior."
                : `Descarga ${file} y ejecuta el comando en la carpeta del archivo con un JDK 21 o posterior.`}
            </p>
            <pre>{javaCommand}</pre>
          </details>
        </div>
      )}
      {language === "typescript" && (
        <p className="work-muted">
          Comprueba los tipos del programa en modo estricto con la biblioteca
          ES2022. Ejecutar transpila el código y muestra el resultado en la
          consola.
        </p>
      )}
      {language === "react" && (
        <p className="work-muted">
          Exporta un componente por defecto. Puedes importar de{" "}
          <code>react</code>, <code>react-dom</code> y{" "}
          <code>react-dom/client</code>.
        </p>
      )}
    </>
  );
}
