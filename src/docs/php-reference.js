import { loadCompressedJson } from "../lib/load-compressed-json";
import { phpReferenceBucket } from "./routes";

const blocks = new Map();

export async function loadPhpReference(id) {
  const bucket = phpReferenceBucket(id);
  if (!blocks.has(bucket)) {
    const base = new URL(import.meta.env.BASE_URL, location.href);
    const pending = loadCompressedJson(
      `search-library/php-ref-${bucket}.json.gz`,
      base,
    )
      .then((entries) => new Map(entries.map((entry) => [entry.id, entry])))
      .catch((error) => {
        blocks.delete(bucket);
        throw error;
      });
    blocks.set(bucket, pending);
  }
  return (await blocks.get(bucket)).get(id) ?? null;
}
