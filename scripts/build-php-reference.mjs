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
  const references = new Map();
  const returnUses = new Map();
  const parameterUses = new Map();

  function readEntry({ id, extension }) {
    if (!modules.has(extension))
      modules.set(
        extension,
        new Map(readModule(extension).map((record) => [record.id, record])),
      );
    const record = modules.get(extension).get(id);
    if (!record) throw new Error(`Falta la referencia PHP ${id}.`);
    return record;
  }

  for (const indexed of catalog) {
    const record = readEntry(indexed);
    const { related, members, returnValues, ...entry } = record;
    const owner =
      !entry.label && entry.title.includes("::")
        ? lookup(entry.title.split("::")[0])
        : null;
    const connections = [owner, ...related.map(lookup)].filter(
      (item) => item && item.id !== entry.id,
    );
    if (connections.length)
      entry.connections = [
        ...new Map(connections.map((item) => [item.id, link(item)])).values(),
      ];
    if (entry.alias) {
      const target = lookup(entry.alias);
      if (target) {
        entry.aliasLink = link(target);
        const canonical = readEntry(target);
        entry.aliasDocumentation = {
          locale: canonical.locale,
          description: canonical.description?.length
            ? canonical.description.slice(0, 2)
            : [canonical.summary].filter(Boolean),
          returns: canonical.returns?.slice(0, 2),
        };
      }
    }
    if (members?.length)
      entry.methodLinks = members
        .map((member) => byId.get(member))
        .filter(Boolean)
        .map(({ id, title }) => ({ id, title: title.split("::")[1] }));
    if (returnValues)
      entry.returnValues = returnValues.map((row) => {
        const target = lookup(row.value);
        if (!target) return row;
        if (target.label === "Constante PHP" && target.id !== entry.id) {
          if (!returnUses.has(target.id)) returnUses.set(target.id, []);
          returnUses
            .get(target.id)
            .push({ ...link(entry), meaning: row.meaning });
        }
        return { ...row, id: target.id };
      });

    for (const signature of entry.signatures || []) {
      for (const parameter of signature.parameters) {
        for (const note of parameter.notes || []) {
          if (note.length > 300) continue;
          const names = new Set(
            note.match(/(?<![\w:])(?:[\w\\]+::)?[A-Z_][A-Z0-9_]{3,}(?!\w)/g),
          );
          for (const name of names) {
            const constant = lookup(name);
            if (
              !constant ||
              constant.label !== "Constante PHP" ||
              constant.extension !== entry.extension
            )
              continue;
            if (!parameterUses.has(constant.id))
              parameterUses.set(constant.id, []);
            const uses = parameterUses.get(constant.id);
            if (
              uses.length < 3 &&
              !uses.some(
                ({ id, parameter: argument }) =>
                  id === entry.id && argument === parameter.name,
              )
            ) {
              uses.push({
                ...link(entry),
                parameter: parameter.name,
                note,
                locale: entry.locale,
              });
            }
          }
        }
      }
    }

    references.set(entry.id, entry);
    const bucket = phpReferenceBucket(entry.id);
    if (!blocks.has(bucket)) blocks.set(bucket, []);
    blocks.get(bucket).push(entry);
  }
  for (const [id, uses] of returnUses) references.get(id).returnUses = uses;
  for (const [id, uses] of parameterUses)
    references.get(id).parameterUses = uses;
  for (const [bucket, entries] of blocks)
    writeBlock(`php-ref-${bucket}`, entries);
}
