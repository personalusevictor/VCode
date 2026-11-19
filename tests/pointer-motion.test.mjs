import test from "node:test";
import assert from "node:assert/strict";
import {
  easePointer,
  nearestNavigationItem,
} from "../src/home/motion/pointerMotion.js";
const rects = [
  { left: 0, top: 0, width: 80, height: 36 },
  { left: 83, top: 0, width: 100, height: 36 },
  { left: 186, top: 0, width: 65, height: 36 },
];
test("los huecos entre enlaces mantienen un destino, sin volver al tamaño de bolita", () => {
  for (let x = 0; x <= 251; x++)
    assert.notEqual(nearestNavigationItem(rects, x, 18), -1);
  assert.equal(nearestNavigationItem(rects, 81, 18), 0);
  assert.equal(nearestNavigationItem(rects, 150, 18), 1);
  assert.equal(nearestNavigationItem(rects, 235, 18), 2);
  assert.equal(nearestNavigationItem(rects, -5, 18), -1);
  assert.equal(nearestNavigationItem(rects, 120, 50), -1);
});
test("cambiar rápido de destino continúa desde el tamaño actual sin reinicios ni rebotes", () => {
  let width = 86;
  for (const target of [106, 71, 106, 71]) {
    const before = width;
    width = easePointer(width, target, 16);
    assert.ok(
      width >= Math.min(before, target) && width <= Math.max(before, target),
    );
    assert.ok(width > 7);
  }
  for (let i = 0; i < 100; i++) width = easePointer(width, 71, 16);
  assert.ok(Math.abs(width - 71) < 0.001);
});
test("la transición tarda lo mismo a 60 y 120 Hz", () => {
  const run = (hz) => {
    let x = 0;
    for (let i = 0; i < hz; i++) x = easePointer(x, 100, 1000 / hz);
    return x;
  };
  assert.ok(Math.abs(run(60) - run(120)) < 0.00001);
});
