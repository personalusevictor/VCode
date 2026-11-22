const diagnosticLine = /^(.+?):(\d+):(\d+): (fatal error|error|warning|note): /;
const utf8 = new TextEncoder();

export function cppDiagnostics(output, source, files, failed) {
  if (!output) return [];
  const entries = [];
  const sources = { ...files, "main.cpp": source };
  for (const line of output.split("\n")) {
    const match = diagnosticLine.exec(line);
    if (!match) {
      const previous = entries.at(-1);
      if (previous) previous.value += "\n" + line;
      else if (line)
        entries.push({ type: failed ? "error" : "warn", value: line });
      continue;
    }

    const [, path, row, position, severity] = match;
    const file = path.split("/").at(-1);
    const type = severity.endsWith("error")
      ? "error"
      : severity === "warning"
        ? "warn"
        : "info";
    if (!Object.hasOwn(sources, file)) {
      entries.push({ type, value: line });
      continue;
    }
    const lines = sources[file].split("\n");
    const number = Number(row);
    const column = Number(position);
    const text = lines[number - 1];
    if (text === undefined) {
      entries.push({ type, value: line });
      continue;
    }
    let start = 0;
    let bytes = 1;
    for (const character of text) {
      if (bytes >= column) break;
      bytes += utf8.encode(character).length;
      start += character.length;
    }
    const offset = lines
      .slice(0, number - 1)
      .reduce((sum, item) => sum + item.length + 1, start);
    entries.push({
      type,
      value: line.slice(match[0].length),
      file,
      line: number,
      column: start + 1,
      offset,
      length: 1,
    });
  }
  return entries.map((entry) => ({ ...entry, value: entry.value.trimEnd() }));
}
