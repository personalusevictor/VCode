const tokens =
  /--[^\r\n]*|\/\*[\s\S]*?(?:\*\/|$)|'(?:''|[^'])*(?:'|$)|"(?:""|[^"])*(?:"|$)|\x60(?:\x60\x60|[^\x60])*(?:\x60|$)|\[[^\]]*(?:\]|$)|[A-Za-z_\u0080-\u{10ffff}][A-Za-z0-9_$\u0080-\u{10ffff}]*|(\?\d*|[:@][A-Za-z0-9_$\u0080-\u{10ffff}]+|\$[A-Za-z0-9_$\u0080-\u{10ffff}]+(?:::[A-Za-z0-9_$\u0080-\u{10ffff}]+)*(?:\([^)]*\))?)/gu;

const anonymousName = (number) => `? · ${number}`;
const numbered = /^\?\d+$/;
const rawLimit = 2000;

function* parameterTokens(code) {
  for (const match of code.matchAll(tokens)) {
    if (match[1]) yield match[1];
  }
}

export function sqlParameterNames(code) {
  const names = new Set();
  let anonymous = 0;
  for (const token of parameterTokens(code)) {
    names.add(token === "?" ? anonymousName(++anonymous) : token);
  }
  return [...names];
}

export function readSqlParameters(code, inputs) {
  if (!inputs || !Object.keys(inputs).length) return {};
  return Object.fromEntries(
    sqlParameterNames(code).flatMap((name) => {
      const value = inputs?.[name];
      return typeof value === "string" && value.length <= rawLimit
        ? [[name, value]]
        : [];
    }),
  );
}

function sqlValue(input) {
  const text = input.trim();
  if (!text || /^null$/i.test(text)) return null;
  try {
    const value = JSON.parse(text);
    if (typeof value === "string") return value;
    if (typeof value === "boolean") return Number(value);
    if (
      typeof value === "number" &&
      Number.isFinite(value) &&
      (!Number.isInteger(value) || Number.isSafeInteger(value))
    )
      return value;
  } catch {
    return input;
  }
  return input;
}

export function bindSqlParameters(statement, inputs, position) {
  const indexes = new Map();
  const values = new Map();
  let highest = 0;
  for (const token of parameterTokens(statement)) {
    const name = token === "?" ? anonymousName(++position.anonymous) : token;
    const index = numbered.test(token)
      ? Number(token.slice(1))
      : (indexes.get(name) ?? highest + 1);
    highest = Math.max(highest, index);
    indexes.set(name, index);
    if (!Object.hasOwn(inputs, name) || !inputs[name].trim()) continue;
    const value = sqlValue(inputs[name]);
    if (values.has(index) && values.get(index) !== value)
      throw new Error(
        `Dos parámetros de la consulta tienen valores distintos para la posición ${index}.`,
      );
    values.set(index, value);
  }
  if (!values.size) return [];
  return Array.from(
    { length: highest },
    (_, index) => values.get(index + 1) ?? null,
  );
}
