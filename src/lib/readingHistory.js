const KEY = "vcode-reading-history-v1";
export function readHistory(index) {
  try {
    const stored = JSON.parse(localStorage.getItem(KEY));
    if (!Array.isArray(stored)) return [];
    const ids = [
      ...new Set(stored.filter((id) => typeof id === "string")),
    ].slice(0, 6);
    return ids
      .map((id) => index.find((entry) => entry.id === id))
      .filter(Boolean);
  } catch {
    return [];
  }
}
export function rememberEntry(id, index) {
  if (!index.some((entry) => entry.id === id)) return;
  try {
    localStorage.setItem(
      KEY,
      JSON.stringify(
        [
          id,
          ...readHistory(index)
            .map((entry) => entry.id)
            .filter((value) => value !== id),
        ].slice(0, 6),
      ),
    );
  } catch {}
}
export function clearHistory() {
  try {
    localStorage.removeItem(KEY);
  } catch {}
}
