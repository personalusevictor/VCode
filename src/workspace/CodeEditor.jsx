import React, {
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { basicSetup } from "codemirror";
import { Annotation, Compartment, EditorState, Prec } from "@codemirror/state";
import { EditorView, keymap } from "@codemirror/view";
import {
  HighlightStyle,
  indentUnit,
  syntaxHighlighting,
} from "@codemirror/language";
import { historyField, indentWithTab } from "@codemirror/commands";
import { setDiagnostics } from "@codemirror/lint";
import { tags } from "@lezer/highlight";
import { usePreferences } from "../app/Preferences";

const extensions = {
  html: () => import("@codemirror/lang-html").then(({ html }) => html()),
  css: () => import("@codemirror/lang-css").then(({ css }) => css()),
  json: () => import("@codemirror/lang-json").then(({ json }) => json()),
  javascript: () =>
    import("@codemirror/lang-javascript").then(({ javascript }) =>
      javascript(),
    ),
  typescript: () =>
    import("@codemirror/lang-javascript").then(({ javascript }) =>
      javascript({ typescript: true }),
    ),
  react: () =>
    import("@codemirror/lang-javascript").then(({ javascript }) =>
      javascript({ jsx: true }),
    ),
  php: () => import("@codemirror/lang-php").then(({ php }) => php()),
  java: () => import("@codemirror/lang-java").then(({ java }) => java()),
  cpp: () => import("@codemirror/lang-cpp").then(({ cpp }) => cpp()),
  sql: () =>
    import("@codemirror/lang-sql").then(({ sql, SQLite }) =>
      sql({ dialect: SQLite, upperCaseKeywords: true }),
    ),
};

const editorRules = {
  "&": {
    backgroundColor: "var(--editor-background)",
    color: "var(--editor-ink)",
  },
  "&.cm-focused": {
    outline: "2px solid var(--editor-focus)",
    outlineOffset: "-2px",
  },
  ".cm-scroller": {
    fontFamily: "Cascadia, monospace",
    fontSize: "0.86rem",
    lineHeight: "1.64",
  },
  ".cm-content": { padding: "13px 0 24px", caretColor: "var(--editor-focus)" },
  ".cm-line": { padding: "0 11px 0 9px" },
  ".cm-gutters": {
    color: "var(--editor-muted)",
    backgroundColor: "var(--editor-panel)",
    borderColor: "var(--editor-border)",
  },
  ".cm-activeLine, .cm-activeLineGutter": {
    backgroundColor: "var(--editor-line)",
  },
  ".cm-cursor, .cm-dropCursor": { borderLeftColor: "var(--editor-focus)" },
  ".cm-selectionBackground, &.cm-focused .cm-selectionBackground, ::selection":
    {
      backgroundColor: "var(--editor-selection)",
    },
  ".cm-matchingBracket": {
    color: "var(--editor-accent)",
    backgroundColor: "var(--editor-selection)",
  },
};
const editorThemes = {
  light: EditorView.theme(editorRules),
  dark: EditorView.theme(editorRules, { dark: true }),
};
const editorHighlight = syntaxHighlighting(
  HighlightStyle.define([
    {
      tag: [tags.keyword, tags.modifier, tags.operatorKeyword],
      color: "var(--editor-keyword)",
    },
    {
      tag: [tags.string, tags.special(tags.string)],
      color: "var(--editor-string)",
    },
    {
      tag: [tags.number, tags.bool, tags.null, tags.atom],
      color: "var(--editor-accent)",
    },
    { tag: [tags.comment, tags.meta], color: "var(--editor-muted)" },
    {
      tag: [tags.typeName, tags.className, tags.tagName],
      color: "var(--editor-type)",
    },
    {
      tag: [
        tags.definition(tags.variableName),
        tags.propertyName,
        tags.attributeName,
      ],
      color: "var(--editor-definition)",
    },
    { tag: tags.invalid, color: "var(--editor-error)" },
  ]),
);

const spanish = EditorState.phrases.of({
  Find: "Buscar",
  Replace: "Reemplazar",
  next: "siguiente",
  previous: "anterior",
  all: "todas",
  "match case": "mayúsculas",
  regexp: "expresión regular",
  "by word": "palabra completa",
  replace: "reemplazar",
  "replace all": "reemplazar todas",
  close: "cerrar",
  "current match": "coincidencia actual",
  "on line": "en la línea",
  "replaced match on line $": "Coincidencia reemplazada en la línea $",
  "replaced $ matches": "Se reemplazaron $ coincidencias",
  "Go to line": "Ir a la línea",
  go: "ir",
  "Fold line": "Plegar bloque",
  "Unfold line": "Desplegar bloque",
  "folded code": "Código plegado",
  "Folded lines": "Líneas plegadas",
  "Unfolded lines": "Líneas desplegadas",
  unfold: "desplegar",
  to: "a",
  Diagnostics: "Diagnósticos",
  "No diagnostics": "Sin diagnósticos",
  Completions: "Sugerencias",
  "Control character": "Carácter de control",
});

const externalUpdate = Annotation.define();

function positionOf(state) {
  const cursor = state.selection.main.head;
  const line = state.doc.lineAt(cursor);
  return { line: line.number, column: cursor - line.from + 1 };
}

export default function CodeEditor({
  ref,
  value,
  label,
  language,
  maxLength,
  sessions,
  sessionKey,
  diagnostics,
  onChange,
  onRun,
}) {
  const container = useRef(null);
  const view = useRef(null);
  const callbacks = useRef({ onChange, onRun });
  const hintId = useId();
  const { theme } = usePreferences();
  const [appearance] = useState(() => new Compartment());
  const [syntax] = useState(() => new Compartment());
  const [attributes] = useState(() => new Compartment());
  const [position, setPosition] = useState({ line: 1, column: 1 });
  const describe = () =>
    EditorView.contentAttributes.of({
      "aria-label": label,
      "aria-describedby": hintId,
      tabindex: "0",
    });

  useLayoutEffect(() => {
    callbacks.current = { onChange, onRun };
  }, [onChange, onRun]);

  useLayoutEffect(() => {
    const runCode = (instance) => {
      if (instance.composing) return false;
      callbacks.current.onRun();
      return true;
    };
    const extensions = [
      basicSetup,
      appearance.of(editorThemes[theme]),
      editorHighlight,
      spanish,
      EditorState.tabSize.of(2),
      indentUnit.of("  "),
      EditorView.lineWrapping,
      attributes.of(describe()),
      syntax.of([]),
      Prec.highest(
        keymap.of([
          { key: "Mod-Enter", run: runCode },
          { key: "Ctrl-Enter", run: runCode },
          indentWithTab,
        ]),
      ),
      EditorState.transactionFilter.of((transaction) =>
        !transaction.docChanged ||
        transaction.newDoc.length <= maxLength ||
        transaction.annotation(externalUpdate)
          ? transaction
          : [],
      ),
      EditorView.updateListener.of((update) => {
        if (update.docChanged || update.selectionSet)
          setPosition(positionOf(update.state));
        if (
          update.docChanged &&
          !update.transactions.some((t) => t.annotation(externalUpdate))
        ) {
          callbacks.current.onChange(update.state.doc.toString());
        }
      }),
    ];
    const slot = sessions.get(sessionKey) || {};
    sessions.set(sessionKey, slot);
    const saved = slot.state?.doc === value;
    const config = { doc: value, extensions };
    const fields = { history: historyField };
    const state = saved
      ? EditorState.fromJSON(slot.state, config, fields)
      : EditorState.create(config);
    const editor = new EditorView({ parent: container.current, state });
    view.current = editor;
    setPosition(positionOf(state));
    const scrollRestore =
      saved &&
      requestAnimationFrame(() => {
        if (editor.state.selection.eq(state.selection))
          editor.scrollDOM.scrollTop = slot.scrollTop;
      });
    return () => {
      if (scrollRestore) cancelAnimationFrame(scrollRestore);
      slot.state = editor.state.toJSON(fields);
      slot.scrollTop = editor.scrollDOM.scrollTop;
      view.current = null;
      editor.destroy();
    };
  }, []);

  useLayoutEffect(() => {
    view.current.dispatch({
      effects: appearance.reconfigure(editorThemes[theme]),
    });
  }, [appearance, theme]);

  useLayoutEffect(() => {
    const editor = view.current;
    editor.dispatch({ effects: attributes.reconfigure(describe()) });
  }, [label]);

  useLayoutEffect(() => {
    const editor = view.current;
    if (editor.state.doc.toString() === value) return;
    editor.dispatch({
      changes: { from: 0, to: editor.state.doc.length, insert: value },
      selection: { anchor: 0 },
      annotations: externalUpdate.of(true),
    });
  }, [value]);

  useLayoutEffect(() => {
    const editor = view.current;
    let active = true;
    extensions[language]().then(
      (extension) => {
        if (!active) return;
        editor.dispatch({ effects: syntax.reconfigure(extension) });
      },
      () => {},
    );
    return () => {
      active = false;
    };
  }, [language]);

  useLayoutEffect(() => {
    const editor = view.current;
    const max = editor.state.doc.length;
    const markers = diagnostics.flatMap(
      ({ offset, length, type, value: message }) => {
        if (offset === undefined || offset < 0 || offset > max) return [];
        return [
          {
            from: offset,
            to: Math.min(max, offset + Math.max(1, length || 0)),
            severity: type === "error" ? "error" : "warning",
            message,
          },
        ];
      },
    );
    editor.dispatch(setDiagnostics(editor.state, markers));
  }, [diagnostics]);

  useImperativeHandle(
    ref,
    () => ({
      focus() {
        view.current?.contentDOM.focus({ preventScroll: true });
      },
      select(offset, length) {
        const editor = view.current;
        const max = editor.state.doc.length;
        const from = Math.max(0, Math.min(max, offset));
        const to = Math.min(max, from + (length || 1));
        editor.dispatch({
          selection: { anchor: from, head: to },
          effects: EditorView.scrollIntoView(from, { y: "center" }),
        });
        editor.focus();
      },
    }),
    [],
  );

  return (
    <>
      <div className="lab-editor" ref={container} />
      <div className="lab-editor-status">
        <span id={hintId} className="sr-only">
          Pulsa Escape y después Tab para salir del editor.
        </span>
        <span>
          Línea {position.line}, columna {position.column}
        </span>
      </div>
    </>
  );
}
