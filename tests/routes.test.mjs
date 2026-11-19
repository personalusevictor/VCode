import test from "node:test";
import assert from "node:assert/strict";
import { isHomeRoute } from "../src/app/routes.js";

test("solo el inicio y su ancla accesible muestran la principal", () => {
  assert.equal(isHomeRoute("home"), true);
  assert.equal(isHomeRoute("main-content"), true);
  for (const route of [
    "courses",
    "course/html",
    "lesson/html/1",
    "docs/all/grid",
    "studio",
    "playground",
    "projects",
    "progress",
    "reference/tag-details",
    "paths",
    "practice",
    "resources",
    "contact",
    "no-existe",
  ]) {
    assert.equal(isHomeRoute(route), false, route);
  }
});
