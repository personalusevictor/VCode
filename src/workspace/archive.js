import { useSyncExternalStore } from "react";
import { auxiliaryTypes, readAuxiliaryFiles } from "./program-files";
import { readSqlParameters } from "./sql-parameters";
import { readTypeCheckOptions } from "./type-check-options";
import { readPhpRequest } from "./php-request";

const key = "vcode-archive-v1";
const empty = {
  done: [],
  favorites: [],
  notes: "",
  drafts: {},
  markup: {},
  extraFiles: {},
  sqlParameters: {},
  cppInput: "",
  phpRequest: null,
  typeOptions: {},
  projectDrafts: {},
  practiceDrafts: {},
};
const languageId = /^(html|css|javascript|typescript|react|sql|java|cpp|php)$/;
const documentLanguages = new Set(["css", "javascript", "react"]);
const practiceId = /^exercise-([a-z]+)-\d{1,3}$/;
const listeners = new Set();

function readScopedDrafts(records, getLanguage) {
  return Object.fromEntries(
    Object.entries(records || {}).flatMap(([id, draft]) => {
      const language = getLanguage(id);
      if (
        !languageId.test(language) ||
        typeof draft?.code !== "string" ||
        draft.code.length > 100000
      )
        return [];
      const hasMarkup =
        documentLanguages.has(language) &&
        typeof draft.markup === "string" &&
        draft.markup.length <= 60000;
      const files = readAuxiliaryFiles(language, draft.files);
      const parameters =
        language === "sql" && readSqlParameters(draft.code, draft.parameters);
      const typeOptions =
        language === "typescript" && readTypeCheckOptions(draft.typeOptions);
      return [
        [
          id,
          {
            code: draft.code,
            ...(hasMarkup && { markup: draft.markup }),
            ...(Object.keys(files).length && { files }),
            ...(parameters && Object.keys(parameters).length && { parameters }),
            ...(language === "cpp" &&
              typeof draft.stdin === "string" && {
                stdin: draft.stdin.slice(0, 10000),
              }),
            ...(language === "php" &&
              draft.phpRequest && {
                phpRequest: readPhpRequest(draft.phpRequest),
              }),
            ...(typeOptions &&
              Object.keys(typeOptions).length && { typeOptions }),
          },
        ],
      ];
    }),
  );
}
function validate(data) {
  const list = (value) =>
    Array.isArray(value)
      ? [
          ...new Set(
            value.filter(
              (item) => typeof item === "string" && item.length <= 160,
            ),
          ),
        ].slice(0, 3000)
      : [];
  const markup = Object.fromEntries(
    Object.entries(data?.markup || {}).filter(
      ([id, value]) =>
        documentLanguages.has(id) &&
        typeof value === "string" &&
        value.length <= 60000,
    ),
  );
  const drafts = Object.fromEntries(
    Object.entries(data?.drafts || {}).filter(
      ([id, code]) =>
        languageId.test(id) &&
        typeof code === "string" &&
        code.length <= 100000,
    ),
  );
  return {
    markup,
    sqlParameters: readSqlParameters(drafts.sql || "", data?.sqlParameters),
    cppInput:
      Object.hasOwn(drafts, "cpp") && typeof data?.cppInput === "string"
        ? data.cppInput.slice(0, 10000)
        : "",
    phpRequest:
      Object.hasOwn(drafts, "php") && data?.phpRequest
        ? readPhpRequest(data.phpRequest)
        : null,
    typeOptions: Object.hasOwn(drafts, "typescript")
      ? readTypeCheckOptions(data?.typeOptions)
      : {},
    extraFiles: Object.fromEntries(
      Object.keys(auxiliaryTypes).map((id) => [
        id,
        readAuxiliaryFiles(id, data?.extraFiles?.[id]),
      ]),
    ),
    projectDrafts: readScopedDrafts(data?.projectDrafts, (id) => id),
    practiceDrafts: readScopedDrafts(
      data?.practiceDrafts,
      (id) => practiceId.exec(id)?.[1],
    ),
    done: list(data?.done),
    favorites: list(data?.favorites),
    notes: typeof data?.notes === "string" ? data.notes.slice(0, 100000) : "",
    drafts,
  };
}
function read() {
  try {
    return validate(JSON.parse(localStorage.getItem(key)) || empty);
  } catch {
    return empty;
  }
}
let state = read();
const notify = () => listeners.forEach((listener) => listener());
window.addEventListener("storage", (event) => {
  if (event.key !== null && event.key !== key) return;
  state = read();
  notify();
});
function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
export const useArchive = () => useSyncExternalStore(subscribe, () => state);
export function updateArchive(update) {
  const next = validate(typeof update === "function" ? update(state) : update);
  try {
    localStorage.setItem(key, JSON.stringify(next));
  } catch {
    return false;
  }
  state = next;
  notify();
  return true;
}
export function toggleArchive(field, id) {
  return updateArchive((current) => ({
    ...current,
    [field]: current[field].includes(id)
      ? current[field].filter((item) => item !== id)
      : [...current[field], id],
  }));
}
export function importArchive(body) {
  try {
    const loaded = JSON.parse(body);
    if (
      loaded?.version !== 1 ||
      !loaded.archive ||
      typeof loaded.archive !== "object"
    )
      return false;
    const incoming = validate(loaded.archive);
    return updateArchive((current) => ({
      done: [...current.done, ...incoming.done],
      favorites: [...current.favorites, ...incoming.favorites],
      notes: [...new Set([current.notes, incoming.notes].filter(Boolean))].join(
        "\n\n",
      ),
      drafts: { ...incoming.drafts, ...current.drafts },
      sqlParameters: Object.hasOwn(current.drafts, "sql")
        ? current.sqlParameters
        : incoming.sqlParameters,
      cppInput: Object.hasOwn(current.drafts, "cpp")
        ? current.cppInput
        : incoming.cppInput,
      phpRequest: Object.hasOwn(current.drafts, "php")
        ? current.phpRequest
        : incoming.phpRequest,
      typeOptions: Object.hasOwn(current.drafts, "typescript")
        ? current.typeOptions
        : incoming.typeOptions,
      markup: { ...incoming.markup, ...current.markup },
      extraFiles: Object.fromEntries(
        Object.keys(auxiliaryTypes).map((id) => [
          id,
          { ...incoming.extraFiles[id], ...current.extraFiles[id] },
        ]),
      ),
      projectDrafts: { ...incoming.projectDrafts, ...current.projectDrafts },
      practiceDrafts: { ...incoming.practiceDrafts, ...current.practiceDrafts },
    }));
  } catch {
    return false;
  }
}
export function download(name, contents, type = "text/plain") {
  const url = URL.createObjectURL(new Blob([contents], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
