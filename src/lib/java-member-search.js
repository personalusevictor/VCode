const qualifierPattern =
  /^([a-z_$][\w$]*(?:[.$][a-z_$][\w$]*)*)[.#]([a-z_$][\w$]*)(?:\(\))?$/i;

const qualifiedName = (value) =>
  value.toLowerCase().replaceAll("$", ".").replaceAll("#", ".");

export function javaMemberQuery(query) {
  const match = qualifierPattern.exec(query.trim());
  return match
    ? { type: qualifiedName(match[1]), member: match[2].toLowerCase() }
    : null;
}

export function isDeclaredJavaMember(entry, { type, member }) {
  if (entry.language !== "java" || entry.kind !== "reference") return false;
  const name = `${type}.${member}`;
  return [entry.title, ...(entry.aliases || [])].some(
    (alias) => qualifiedName(alias.replace(/\(\)$/, "")) === name,
  );
}

function searchParents(id, graph, interfaces, getMember) {
  const pending = [];
  let current = id;
  while (current) {
    const parents = graph.parents[current] || [];
    pending.push(...parents.filter((parent) => interfaces.has(parent)));
    current = parents.find((parent) => !interfaces.has(parent));
    if (current) {
      const match = getMember(current);
      if (match) return match;
    }
  }

  const seen = new Set();
  for (const parent of pending) {
    if (seen.has(parent)) continue;
    seen.add(parent);
    const match = getMember(parent);
    if (match) return match;
    pending.push(...(graph.parents[parent] || []));
  }
  return null;
}

export function inheritedJavaMembers(index, graph, { type, member }, category) {
  const types = new Map();
  const origins = [];
  const members = new Map();
  const excluded = new Set(graph.staticInterfaceMethods);
  const interfaces = new Set(graph.interfaces);
  const ending = `.${member}`;

  for (const entry of index) {
    if (entry.kind !== "reference") continue;
    if (Object.hasOwn(graph.parents, entry.id)) {
      const name = qualifiedName(entry.aliases[0]);
      types.set(entry.id, name);
      if (
        (name === type || qualifiedName(entry.title) === type) &&
        (category === "all" || entry.group === category)
      ) {
        origins.push(entry.id);
      }
    } else if (!excluded.has(entry.id)) {
      const name = qualifiedName(entry.aliases?.[0] || "");
      if (name.endsWith(ending)) members.set(name, entry);
    }
  }
  const getMember = (id) => members.get(`${types.get(id)}${ending}`);
  const results = new Map();
  for (const id of origins) {
    const result = searchParents(id, graph, interfaces, getMember);
    if (result) results.set(result.id, result);
  }
  return [...results.values()];
}
