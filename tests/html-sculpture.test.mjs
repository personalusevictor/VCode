import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import {
  createHtmlSculpture,
  disposeHtmlSculpture,
} from "../src/home/scene/htmlSculptureModel.js";

test("la pieza HTML conserva la proporción del escudo y tiene profundidad real", () => {
  const model = createHtmlSculpture(),
    box = new THREE.Box3().setFromObject(model),
    size = box.getSize(new THREE.Vector3());
  assert.ok(Math.abs(size.x / size.y - 0.882) < 0.03);
  assert.ok(size.z > 0.15 && size.z < 0.4);
  let triangles = 0;
  model.traverse((object) => {
    if (!object.geometry) return;
    const position = object.geometry.getAttribute("position"),
      normal = object.geometry.getAttribute("normal");
    triangles += position.count / 3;
    for (let i = 0; i < position.count; i++) {
      assert.ok(
        Number.isFinite(position.getX(i) + position.getY(i) + position.getZ(i)),
      );
      assert.ok(
        Math.abs(
          Math.hypot(normal.getX(i), normal.getY(i), normal.getZ(i)) - 1,
        ) < 0.001,
      );
    }
  });
  assert.ok(triangles < 10000);
  disposeHtmlSculpture(model);
});
test("la salida de HTML libera todas las geometrías y materiales del modelo", () => {
  const model = createHtmlSculpture(),
    geometries = new Set(),
    materials = new Set(),
    disposed = new Set();
  model.traverse((object) => {
    if (object.geometry) geometries.add(object.geometry);
    if (object.material)
      (Array.isArray(object.material)
        ? object.material
        : [object.material]
      ).forEach((material) => materials.add(material));
  });
  for (const resource of [...geometries, ...materials])
    resource.addEventListener("dispose", () => disposed.add(resource));
  disposeHtmlSculpture(model);
  assert.equal(disposed.size, geometries.size + materials.size);
});
