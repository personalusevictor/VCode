import assert from "node:assert/strict";
import test from "node:test";
import guides from "../src/docs/data/guides.json" with { type: "json" };
import {
  practiceExample,
  practiceForLanguage,
  practiceMatches,
} from "../src/workspace/practice.js";
import { readAuxiliaryFiles } from "../src/workspace/program-files.js";
import { readSqlParameters } from "../src/workspace/sql-parameters.js";
import { readTypeCheckOptions } from "../src/workspace/type-check-options.js";

test("los retos intermedios de los nueve lenguajes conservan sus datos al abrir las dos variantes", () => {
  for (const language of new Set(guides.map((guide) => guide.language))) {
    const entry = practiceForLanguage(language).find(({ id }) =>
      id.endsWith("-3"),
    );
    assert.ok(entry, language);
    assert.ok(
      guides.some(
        (guide) => guide.language === language && guide.number === entry.lesson,
      ),
    );

    const starter = practiceExample(entry.id, "starter");
    const solution = practiceExample(entry.id);
    assert.notEqual(starter.code, solution.code, entry.id);
    for (const example of [starter, solution]) {
      if (entry.files)
        assert.deepEqual(
          readAuxiliaryFiles(language, example.files),
          entry.files,
        );
      if (entry.parameters)
        assert.deepEqual(
          readSqlParameters(example.code, example.parameters),
          entry.parameters,
        );
      if (entry.typeOptions)
        assert.deepEqual(
          readTypeCheckOptions(example.typeOptions),
          entry.typeOptions,
        );
    }
  }
});

test("la comparación SQL conserva los tipos y el orden y exige el resultado completo", () => {
  const expected = [
    ["SQL", 40],
    ["SQL", 30],
  ];
  assert.equal(practiceMatches(expected, [], [{ values: expected }]), true);
  assert.equal(
    practiceMatches(
      expected,
      [],
      [
        {
          values: [
            ["SQL", "40"],
            ["SQL", 30],
          ],
        },
      ],
    ),
    false,
  );
  assert.equal(
    practiceMatches(expected, [], [{ values: expected.toReversed() }]),
    false,
  );
  assert.equal(
    practiceMatches(expected, [], [{ values: expected, truncated: true }]),
    false,
  );
  assert.equal(
    practiceMatches(expected, [], [{ values: expected }, { values: expected }]),
    false,
  );
});
