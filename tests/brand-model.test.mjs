import test from "node:test";
import assert from "node:assert/strict";
import { Mesh, MeshBasicMaterial, Raycaster, Vector3, DoubleSide } from "three";
import {
  APERTURE_OUTLINE,
  createBrandGeometry,
} from "../src/home/scene/brandModel.js";
import { brandPose, advanceStory } from "../src/home/motion/brandMotion.js";
const frame = [
  [8, 9],
  [40, 9],
  [40, 21],
  [20, 21],
  [20, 43],
  [40, 43],
  [40, 55],
  [8, 55],
];
const diagonal = [
  [46, 9],
  [59, 9],
  [39, 55],
  [26, 55],
];
function contains(polygon, x, y) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i],
      [xj, yj] = polygon[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi)
      inside = !inside;
  }
  return inside;
}
test("el contorno unido conserva la silueta de los dos trazos originales", () => {
  for (let y = 0.173; y < 64; y += 0.53)
    for (let x = 0.217; x < 64; x += 0.47)
      assert.equal(
        contains(APERTURE_OUTLINE, x, y),
        contains(frame, x, y) || contains(diagonal, x, y),
        `${x},${y}`,
      );
});
test("la extrusión tiene profundidad y coordenadas finitas", () => {
  const g = createBrandGeometry();
  try {
    g.computeBoundingBox();
    assert(g.boundingBox.max.z - g.boundingBox.min.z > 0.7);
    assert(g.boundingBox.max.x - g.boundingBox.min.x > 4.9);
    for (const name of ["position", "normal"])
      assert(Array.from(g.getAttribute(name).array).every(Number.isFinite));
    const uv = Array.from(g.getAttribute("uv").array);
    assert(uv.every((value) => value >= 0 && value <= 1));
    assert(uv.some((value) => value === 0) && uv.some((value) => value === 1));
  } finally {
    g.dispose();
  }
});
test("ambas caras tienen normales planas y el contorno conserva normales unitarias", () => {
  const geometry = createBrandGeometry();
  try {
    const positions = geometry.getAttribute("position");
    const normals = geometry.getAttribute("normal");
    const capZ = geometry.boundingBox.max.z;
    let front = 0,
      back = 0;
    for (let i = 0; i < positions.count; i++) {
      const x = normals.getX(i),
        y = normals.getY(i),
        z = normals.getZ(i);
      assert(Math.abs(Math.hypot(x, y, z) - 1) < 0.00001);
      if (Math.abs(Math.abs(positions.getZ(i)) - capZ) < 0.00001) {
        assert(Math.abs(x) < 0.00001 && Math.abs(y) < 0.00001);
        assert(Math.sign(z) === Math.sign(positions.getZ(i)));
        if (z > 0) front++;
        else back++;
      }
    }
    assert(front > 0 && back > 0);
  } finally {
    geometry.dispose();
  }
});
test("el relieve conserva la apertura vacía y los dos trazos sólidos", () => {
  const geometry = createBrandGeometry();
  const material = new MeshBasicMaterial({ side: DoubleSide });
  const mesh = new Mesh(geometry, material);
  mesh.updateMatrixWorld();
  const ray = new Raycaster();
  const intersects = (x, y) => {
    ray.set(
      new Vector3((x - 33.5) / 10, (32 - y) / 10, 10),
      new Vector3(0, 0, -1),
    );
    return ray.intersectObject(mesh).length > 0;
  };
  try {
    for (const point of [
      [25, 27],
      [25, 32],
      [25, 37],
      [29, 30],
    ])
      assert.equal(
        intersects(...point),
        false,
        `apertura obstruida en ${point}`,
      );
    for (const point of [
      [13, 16],
      [13, 34],
      [18, 49],
      [48, 15],
    ])
      assert.equal(intersects(...point), true, `trazo ausente en ${point}`);
  } finally {
    geometry.dispose();
    material.dispose();
  }
});
test("el desplazamiento completa una vuelta y recupera la orientación inicial", () => {
  const first = brandPose(0),
    last = brandPose(1);
  assert(Math.abs(last.rotationY - first.rotationY - 2 * Math.PI) < 1e-10);
  assert(Math.abs(first.rotationX - last.rotationX) < 1e-10);
  assert(Math.abs(first.rotationZ - last.rotationZ) < 1e-10);
  assert.equal(first.degrees, 0);
  assert.equal(last.degrees, 360);
  assert(last.scale > 0 && last.scale < first.scale);
  for (let i = 0; i < 100; i++)
    assert(brandPose((i + 1) / 100).rotationY >= brandPose(i / 100).rotationY);
});
test("el estado se limita a los extremos de la secuencia", () => {
  assert.deepEqual(brandPose(-1), brandPose(0));
  assert.deepEqual(brandPose(2), brandPose(1));
});
test("el giro termina antes de recoger la pieza y llega sin velocidad residual", () => {
  assert.equal(brandPose(0.64).degrees, 360);
  assert.equal(brandPose(0.64).gather, 0);
  assert.equal(brandPose(0.67).gather, 0);
  assert(Math.abs(brandPose(0.93).gather - 1) < 1e-12);
  const epsilon = 0.00001;
  assert(
    Math.abs(brandPose(0.64).rotationY - brandPose(0.64 - epsilon).rotationY) /
      epsilon <
      0.001,
  );
  assert(
    Math.abs(
      brandPose(0.025 + epsilon).rotationY - brandPose(0.025).rotationY,
    ) /
      epsilon <
      0.001,
  );
});
test("una rueda rápida no salta a otro extremo y la inversión no sobrepasa el objetivo", () => {
  let current = 0;
  for (let i = 0; i < 240; i++) {
    const next = advanceStory(current, 1, 1 / 60);
    assert(next >= current && next <= 1);
    assert(next - current <= 0.8 / 60 + 1e-12);
    current = next;
  }
  assert(Math.abs(current - 1) < 0.0001);
  for (let i = 0; i < 240; i++) {
    const next = advanceStory(current, 0, 1 / 60);
    assert(next <= current && next >= 0);
    assert(current - next <= 0.8 / 60 + 1e-12);
    current = next;
  }
  assert(current < 0.0001);
  assert(advanceStory(0, 1, 10) <= 0.032);
  assert.equal(advanceStory(0.5, 1, 0), 0.5);
});
