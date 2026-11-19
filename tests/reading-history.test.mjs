import test from "node:test";
import assert from "node:assert/strict";
import {
  readHistory,
  rememberEntry,
  clearHistory,
} from "../src/lib/readingHistory.js";

test("los recientes validan el contenido, eliminan duplicados y pueden borrarse", () => {
  const values = new Map();
  globalThis.localStorage = {
    getItem: (key) => values.get(key) || null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
  try {
    const index = Array.from({ length: 9 }, (_, i) => ({ id: `entry-${i}` }));
    for (const entry of index) rememberEntry(entry.id, index);
    assert.equal(readHistory(index).length, 6);
    assert.equal(readHistory(index)[0].id, "entry-8");
    rememberEntry("entry-6", index);
    assert.equal(readHistory(index)[0].id, "entry-6");
    assert.equal(new Set(readHistory(index).map(({ id }) => id)).size, 6);
    rememberEntry("no-existe", index);
    assert.equal(readHistory(index)[0].id, "entry-6");
    clearHistory();
    assert.deepEqual(readHistory(index), []);
    values.set("vcode-reading-history-v1", "{malformado");
    assert.deepEqual(readHistory(index), []);
    values.set(
      "vcode-reading-history-v1",
      JSON.stringify([{}, null, "entry-2", "entry-2", "no-existe"]),
    );
    assert.deepEqual(readHistory(index), [{ id: "entry-2" }]);
  } finally {
    delete globalThis.localStorage;
  }
});

test("no disponer de almacenamiento no impide buscar o leer", () => {
  assert.doesNotThrow(() => rememberEntry("a", [{ id: "a" }]));
  assert.deepEqual(readHistory([{ id: "a" }]), []);
  assert.doesNotThrow(clearHistory);
});
