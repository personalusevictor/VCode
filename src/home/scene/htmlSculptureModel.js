import * as THREE from "three";
import { toCreasedNormals } from "three/addons/utils/BufferGeometryUtils.js";

const shield = [
  [9.032, 1.661],
  [118.968, 1.661],
  [108.952, 113.859],
  [63.933, 126.339],
  [19.037, 113.876],
];
const inlay = [
  {
    color: "#f16529",
    points: [
      [64, 116.8],
      [100.378, 106.714],
      [108.937, 10.836],
      [64, 10.836],
    ],
  },
  {
    color: "#ebebeb",
    points: [
      [64, 52.455],
      [45.788, 52.455],
      [44.53, 38.361],
      [64, 38.361],
      [64, 24.599],
      [29.489, 24.599],
      [29.819, 28.291],
      [33.201, 66.218],
      [64, 66.218],
    ],
  },
  {
    color: "#ebebeb",
    points: [
      [64, 88.198],
      [63.939, 88.215],
      [48.612, 84.075],
      [47.633, 73.1],
      [33.816, 73.1],
      [35.744, 94.709],
      [63.937, 102.535],
      [64, 102.518],
    ],
  },
  {
    color: "#ffffff",
    points: [
      [63.952, 52.455],
      [63.952, 66.218],
      [80.899, 66.218],
      [79.302, 84.067],
      [63.952, 88.21],
      [63.952, 102.529],
      [92.167, 94.709],
      [92.374, 92.384],
      [95.608, 56.151],
      [95.943, 52.455],
      [92.235, 52.455],
    ],
  },
  {
    color: "#ffffff",
    points: [
      [63.952, 24.599],
      [63.952, 38.361],
      [97.196, 38.361],
      [97.472, 35.269],
      [98.1, 28.291],
      [98.429, 24.599],
    ],
  },
];
function geometry(points, depth, bevel, z) {
  const shape = new THREE.Shape();
  points.forEach(([x, y], i) =>
    i ? shape.lineTo(x - 64, 64 - y) : shape.moveTo(x - 64, 64 - y),
  );
  shape.closePath();
  const raw = new THREE.ExtrudeGeometry(shape, {
    depth,
    steps: 1,
    bevelEnabled: bevel > 0,
    bevelSize: bevel,
    bevelThickness: bevel,
    bevelSegments: 6,
    curveSegments: 1,
  });
  raw.translate(0, 0, z);
  raw.scale(0.015, 0.015, 0.015);
  const result = toCreasedNormals(raw, Math.PI / 3);
  if (result !== raw) raw.dispose();
  return result;
}
export function createHtmlSculpture() {
  const root = new THREE.Group();
  const front = new THREE.MeshPhysicalMaterial({
    color: "#e44d26",
    metalness: 0.2,
    roughness: 0.23,
    clearcoat: 0.8,
    clearcoatRoughness: 0.16,
  });
  const edge = new THREE.MeshPhysicalMaterial({
    color: "#a43e21",
    metalness: 0.65,
    roughness: 0.28,
    clearcoat: 0.6,
  });
  const body = new THREE.Mesh(geometry(shield, 18, 1.8, -9), [front, edge]);
  root.add(body);
  inlay.forEach(({ color, points }, i) => {
    const material = new THREE.MeshPhysicalMaterial({
      color,
      metalness: 0.12,
      roughness: 0.24,
      clearcoat: 0.65,
      clearcoatRoughness: 0.17,
    });
    root.add(
      new THREE.Mesh(
        geometry(points, 0.28, i === 0 ? 0 : 0.06, 10.84 + i * 0.12),
        material,
      ),
    );
  });
  return root;
}
export function disposeHtmlSculpture(root) {
  const materials = new Set();
  root.traverse((object) => {
    object.geometry?.dispose();
    if (object.material)
      (Array.isArray(object.material)
        ? object.material
        : [object.material]
      ).forEach((material) => materials.add(material));
  });
  materials.forEach((material) => material.dispose());
}
