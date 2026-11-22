import locator from "../data/web-locator.json";
import { isJavaLibraryReferenceId, javaReferenceBucket } from "./routes";
import { loadCompressedJson } from "../lib/load-compressed-json";

const shards = import.meta.glob(
  ["./data/web/*.json", "!./data/web/java-se-*.json"],
  { import: "default" },
);
const cache = new Map();
const javaLocators = import.meta.glob("../data/java-reference/*.json", {
  import: "default",
});

export const hasWebReference = (id) =>
  Object.hasOwn(locator, id) || isJavaLibraryReferenceId(id);

async function locateReference(id) {
  if (!isJavaLibraryReferenceId(id)) return locator[id];
  const location =
    javaLocators[`../data/java-reference/${javaReferenceBucket(id)}.json`];
  return location ? (await location())[id] : undefined;
}

function loadShard(shard) {
  if (shard.startsWith("java-se-")) {
    const base = new URL(import.meta.env.BASE_URL, location.href);
    return loadCompressedJson(
      `search-library/reference-${shard}.json.gz`,
      base,
    );
  }
  const load = shards[`./data/web/${shard}.json`];
  if (!load) throw new Error("No encontramos el módulo de referencia.");
  return load();
}

export async function loadWebReference(id) {
  if (!hasWebReference(id)) return null;
  const web = await locateReference(id);
  if (!web) return null;
  if (!cache.has(web)) {
    cache.set(
      web,
      loadShard(web)
        .then((items) => new Map(items.map((item) => [item.id, item])))
        .catch((error) => {
          cache.delete(web);
          throw error;
        }),
    );
  }
  return (await cache.get(web)).get(id) || null;
}
