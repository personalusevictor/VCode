import fs from "node:fs";
const path = new URL("../src/docs/data/", import.meta.url);
const input = fs.readFileSync(new URL("quick-reference.txt", path), "utf8");
const entries = input
  .trim()
  .split("\n")
  .map((line) => {
    const [language, description, title, detail, example, source] =
      line.split("|").length === 6
        ? line.split("|")
        : line
            .match(
              /^([^|]+)\|([^|]+)\|([^|]+)\|([^|]+)\|(.*)\|(https:\/\/[^|]+)$/,
            )
            .slice(1);
    return {
      id: `${language}-api-${encodeURIComponent(title)}`,
      title,
      language,
      description,
      group: description,
      detail,
      example: example.replaceAll("\\n", "\n"),
      source,
    };
  });
fs.writeFileSync(
  new URL("quick-reference.json", path),
  JSON.stringify(entries, null, 2) + "\n",
);
