export const auxiliaryTypes = {
  cpp: { hint: "resumen.hpp", extensions: ["h", "hh", "hpp", "hxx", "inl"] },
  java: { hint: "Tema.java", extensions: ["java"] },
  php: { hint: "formato.php", extensions: ["php"] },
  javascript: { hint: "tema.js", extensions: ["js", "mjs", "json"] },
  typescript: {
    hint: "tema.ts",
    extensions: ["ts", "mts", "js", "mjs", "json"],
  },
  react: { hint: "Tema.jsx", extensions: ["jsx", "js", "css", "json"] },
};

export function validAuxiliaryName(language, name) {
  return (
    typeof name === "string" &&
    name.length <= 160 &&
    /^[\p{L}\p{N}_$][\p{L}\p{M}\p{N}_$.-]*$/u.test(name) &&
    (auxiliaryTypes[language]?.extensions?.includes(name.split(".").at(-1)) ??
      false) &&
    name.includes(".")
  );
}

export function readAuxiliaryFiles(language, files) {
  return Object.fromEntries(
    Object.entries(files || {}).filter(
      ([name, content]) =>
        validAuxiliaryName(language, name) &&
        typeof content === "string" &&
        content.length <= 100000,
    ),
  );
}

export function resolveProgramImport(language, specifier, sources) {
  if (!specifier.startsWith("./")) return null;
  const name = specifier.slice(2);
  const extensions = auxiliaryTypes[language].extensions;
  const typedFilename =
    language === "typescript" && /\.m?js$/.test(name)
      ? name.replace(/js$/, "ts")
      : null;
  return (
    [
      ...(typedFilename ? [typedFilename] : []),
      name,
      ...extensions.map((extension) => `${name}.${extension}`),
    ].find((candidate) => Object.hasOwn(sources, candidate)) ?? null
  );
}
