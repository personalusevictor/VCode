import { phpReferenceBucket } from "../src/docs/routes.js";

export function writePhpReference(catalog, readModule, writeBlock) {
  const byId = new Map(catalog.map((record) => [record.id, record]));
  const byTitle = new Map(
    catalog.map((record) => [record.title.toLowerCase(), record]),
  );
  const link = ({ id, title }) => ({ id, title });
  function lookup(name) {
    const title = name.replace(/^\\/, "").toLowerCase();
    return byTitle.get(title) || byTitle.get(`${title.replace(/\(\)$/, "")}()`);
  }

  const modules = new Map();
  const blocks = new Map();
  for (const { id, extension } of catalog) {
    if (!modules.has(extension))
      modules.set(
        extension,
        new Map(readModule(extension).map((record) => [record.id, record])),
      );
    const record = modules.get(extension).get(id);
    if (!record) throw new Error(`Falta la referencia PHP ${id}.`);
    const { related, members, returnValues, ...entry } = record;
    const owner =
      !entry.label && entry.title.includes("::")
        ? lookup(entry.title.split("::")[0])
        : null;
    const connections = [owner, ...related.map(lookup)].filter(
      (item) => item && item.id !== id,
    );
    if (connections.length)
      entry.connections = [
        ...new Map(connections.map((item) => [item.id, link(item)])).values(),
      ];
    if (entry.alias) {
      const target = lookup(entry.alias);
      if (target) entry.aliasLink = link(target);
    }
    if (members?.length)
      entry.methodLinks = members
        .map((member) => byId.get(member))
        .filter(Boolean)
        .map(({ id, title }) => ({ id, title: title.split("::")[1] }));
    if (returnValues)
      entry.returnValues = returnValues.map((row) => {
        const target = lookup(row.value);
        return target ? { ...row, id: target.id } : row;
      });

    const bucket = phpReferenceBucket(id);
    if (!blocks.has(bucket)) blocks.set(bucket, []);
    blocks.get(bucket).push(entry);
  }
  for (const [bucket, entries] of blocks)
    writeBlock(`php-ref-${bucket}`, entries);
}
