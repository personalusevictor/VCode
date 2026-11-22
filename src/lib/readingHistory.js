const KEY = "vcode-reading-history-v1";
const idPattern = /^[^#/?\s]{1,160}$/;
const languagePattern =
  /^(html|css|javascript|typescript|react|php|java|cpp|sql)$/;

function recordOf(value) {
  const { id, title, language, kind, href, description, summary } = value || {};
  if (
    typeof id !== "string" ||
    !idPattern.test(id) ||
    typeof title !== "string" ||
    !title.trim() ||
    !languagePattern.test(language)
  )
    return null;
  const guide = kind === "guide" && /^#[^/?]+\/[a-z]+\/[1-9]\d*$/.test(href);
  const validHref = guide
    ? href === `#lesson/${language}/${id.slice(language.length + 1)}` &&
      id.startsWith(`${language}-`)
    : kind === "reference" &&
      (href === `#symbol/${id}` ||
        (language === "html" && href === `#reference/${id}`));
  if (!validHref) return null;
  return {
    id,
    title: title.slice(0, 200),
    language,
    kind,
    href,
    description:
      typeof description === "string" ? description.slice(0, 200) : "",
    summary: typeof summary === "string" ? summary.slice(0, 650) : "",
  };
}

const idOf = (value) => (typeof value === "string" ? value : value.id);
const limit = 6;
function history() {
  try {
    const stored = JSON.parse(localStorage.getItem(KEY));
    if (!Array.isArray(stored)) return [];
    const values = stored
      .map((value) =>
        typeof value === "string" && idPattern.test(value)
          ? value
          : recordOf(value),
      )
      .filter(Boolean);
    return values
      .filter(
        (value, index) =>
          values.findIndex((other) => idOf(other) === idOf(value)) === index,
      )
      .slice(0, limit);
  } catch {
    return [];
  }
}

function save(records) {
  try {
    localStorage.setItem(KEY, JSON.stringify(records));
  } catch {}
}

export const legacyHistoryIds = () =>
  history().filter((value) => typeof value === "string");

export const hasLegacyHistory = () => legacyHistoryIds().length > 0;

export function readHistory(index = []) {
  return history()
    .map(
      (value) =>
        index.find((entry) => entry.id === idOf(value)) ||
        (typeof value === "string" ? null : value),
    )
    .filter(Boolean);
}

export function upgradeHistory(index) {
  save(readHistory(index).map(recordOf).filter(Boolean));
}

export function rememberEntry(value, index) {
  if (
    typeof value === "string" &&
    index &&
    !index.some(({ id }) => id === value)
  )
    return;
  const stored = history();
  const entry =
    typeof value === "string"
      ? stored.find((candidate) => idOf(candidate) === value) ||
        (idPattern.test(value) ? value : null)
      : recordOf(value);
  if (entry)
    save(
      [entry, ...stored.filter((item) => idOf(item) !== idOf(entry))].slice(
        0,
        limit,
      ),
    );
}

export function clearHistory() {
  try {
    localStorage.removeItem(KEY);
  } catch {}
}
