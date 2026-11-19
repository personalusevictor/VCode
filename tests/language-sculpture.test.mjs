import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import {
  createLanguageSculpture,
  disposeLanguageSculpture,
} from "../src/home/scene/languageSculptureModel.js";
function ring() {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.lineTo(100, 0);
  shape.lineTo(100, 100);
  shape.lineTo(0, 100);
  shape.closePath();
  const hole = new THREE.Path();
  hole.moveTo(30, 30);
  hole.lineTo(30, 70);
  hole.lineTo(70, 70);
  hole.lineTo(70, 30);
  hole.closePath();
  shape.holes.push(hole);
  return [{ color: new THREE.Color("#61dafb"), toShapes: () => [shape] }];
}
test("los seis símbolos conservan sus huecos al ganar profundidad", () => {
  for (const id of ["css", "javascript", "react", "php", "java", "sql"]) {
    const model = createLanguageSculpture(id, ring());
    model.updateMatrixWorld(true);
    const size = new THREE.Box3()
      .setFromObject(model)
      .getSize(new THREE.Vector3());
    assert.ok(Math.abs(Math.max(size.x, size.y) - 1.9) < 0.001, id);
    assert.ok(size.z > 0.1 && size.z < 0.5, id);
    const ray = new THREE.Raycaster(
      new THREE.Vector3(0, 0, 3),
      new THREE.Vector3(0, 0, -1),
    );
    assert.equal(
      ray.intersectObject(model, true).length,
      0,
      `${id}: el centro debe seguir vacío`,
    );
    ray.set(new THREE.Vector3(0.7, 0, 3), new THREE.Vector3(0, 0, -1));
    assert.ok(
      ray.intersectObject(model, true).length > 0,
      `${id}: el borde debe ser sólido`,
    );
    disposeLanguageSculpture(model);
  }
});
test("el modelo general libera sus recursos y rechaza símbolos no admitidos", () => {
  const model = createLanguageSculpture("react", ring()),
    resources = new Set(),
    disposed = new Set();
  model.traverse((o) => {
    if (o.geometry) resources.add(o.geometry);
    if (o.material) for (const m of [o.material].flat()) resources.add(m);
  });
  for (const r of resources)
    r.addEventListener("dispose", () => disposed.add(r));
  disposeLanguageSculpture(model);
  assert.equal(disposed.size, resources.size);
  assert.throws(() => createLanguageSculpture("unknown", ring()));
});
