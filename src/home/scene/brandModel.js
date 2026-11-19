import * as THREE from "three";
import { toCreasedNormals } from "three/addons/utils/BufferGeometryUtils.js";

export const APERTURE_OUTLINE = [
  [8, 9],
  [40, 9],
  [40, 21],
  [20, 21],
  [20, 43],
  [31.217391304347828, 43],
  [46, 9],
  [59, 9],
  [40, 52.7],
  [40, 55],
  [8, 55],
];
export function createBrandGeometry() {
  const shape = new THREE.Shape();
  APERTURE_OUTLINE.forEach(([x, y], i) =>
    i ? shape.lineTo(x, -y) : shape.moveTo(x, -y),
  );
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 10,
    steps: 1,
    bevelEnabled: true,
    bevelSegments: 24,
    bevelSize: 0.9,
    bevelThickness: 2.2,
    bevelOffset: -0.9,
    curveSegments: 1,
  });
  geometry.center();
  geometry.scale(0.1, 0.1, 0.1);

  toCreasedNormals(geometry, Math.PI / 2.5);

  const surfacePositions = geometry.getAttribute("position");
  const surfaceNormals = geometry.getAttribute("normal");
  const shoulderDepth = 0.22;
  const shoulderWidth = 0.09;
  const coreHalfDepth = 0.5;
  for (let i = 0; i < surfacePositions.count; i++) {
    const z = surfacePositions.getZ(i);
    const nz = THREE.MathUtils.clamp(
      (Math.abs(z) - coreHalfDepth) / shoulderDepth,
      0,
      1,
    );
    const radial = Math.sqrt(Math.max(0, 1 - nz * nz)) / shoulderWidth;
    const axial = nz / shoulderDepth;
    const normalLength = Math.hypot(radial, axial);
    const nx = surfaceNormals.getX(i),
      ny = surfaceNormals.getY(i);
    const xyLength = Math.hypot(nx, ny);
    if (nz > 0.9999 || xyLength < 0.00001) {
      surfaceNormals.setXYZ(i, 0, 0, Math.sign(z));
    } else {
      surfaceNormals.setXYZ(
        i,
        ((nx / xyLength) * radial) / normalLength,
        ((ny / xyLength) * radial) / normalLength,
        (Math.sign(z) * axial) / normalLength,
      );
    }
  }
  geometry.computeBoundingBox();
  const bounds = geometry.boundingBox;
  const positions = geometry.getAttribute("position");
  const uv = geometry.getAttribute("uv");
  for (let i = 0; i < positions.count; i++) {
    uv.setXY(
      i,
      (positions.getX(i) - bounds.min.x) / (bounds.max.x - bounds.min.x),
      (positions.getY(i) - bounds.min.y) / (bounds.max.y - bounds.min.y),
    );
  }
  return geometry;
}
export function createStudioEnvironment(
  renderer,
  { warm = false, neutral = false } = {},
) {
  const room = new THREE.Scene();
  room.background = new THREE.Color(
    warm ? "#30231e" : neutral ? "#272c32" : "#101c38",
  );
  const planes = [];
  function panel(w, h, position, color, intensity) {
    const geometry = new THREE.PlaneGeometry(w, h);
    const material = new THREE.MeshBasicMaterial({
      color: new THREE.Color(
        warm ? "#fff2dc" : neutral ? "#f3f6fc" : color,
      ).multiplyScalar(intensity),
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(...position);
    mesh.lookAt(0, 0, 0);
    room.add(mesh);
    planes.push(mesh);
  }
  panel(3, 8, [-4, 3, 6], "#d5edff", 3);
  panel(2, 9, [4, 1, 5], "#8ebaff", 3);
  panel(3, 8, [0, 0, -6], "#d5edff", 3);
  panel(10, 1.4, [0, 5, 0], "#f4f9ff", 3.5);
  panel(2, 8, [-6, -1, -2], "#25cfe5", 2.6);
  panel(10, 1.4, [0, -5, 3], "#367cff", 2.2);
  panel(2, 7, [6, 1, -5], "#608cff", 2.7);
  const generator = new THREE.PMREMGenerator(renderer);
  try {
    return generator.fromScene(room, 0.03);
  } finally {
    generator.dispose();
    for (const plane of planes) {
      plane.geometry.dispose();
      plane.material.dispose();
    }
  }
}
