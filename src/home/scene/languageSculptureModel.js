import * as THREE from "three";
import { SVGLoader } from "three/addons/loaders/SVGLoader.js";
import { toCreasedNormals } from "three/addons/utils/BufferGeometryUtils.js";
import {
  createHtmlSculpture,
  disposeHtmlSculpture,
} from "./htmlSculptureModel.js";

const sources = new Map();
const ids = new Set([
  "html",
  "css",
  "javascript",
  "react",
  "php",
  "java",
  "sql",
  "typescript",
  "cpp",
]);
export function createLanguageSculpture(id, paths) {
  if (!ids.has(id)) throw new Error("Lenguaje desconocido");
  if (id === "html") return createHtmlSculpture();
  const root = new THREE.Group(),
    content = new THREE.Group();
  const openSymbol = id === "react" || id === "java" || id === "sql";
  let layer = 0;
  try {
    for (const path of paths) {
      const style = path.userData?.style;
      if (style?.fill === "none" || style?.fillOpacity === 0) continue;
      const shapes = path.toShapes();
      if (!shapes.length) continue;
      const base = openSymbol || layer === 0;
      const depth = base ? (openSymbol ? 8 : 18) : 0.38;
      const color = path.color.clone();
      const face = new THREE.MeshPhysicalMaterial({
        color,
        metalness: 0.18,
        roughness: 0.25,
        clearcoat: 0.75,
        clearcoatRoughness: 0.18,
      });
      const edge = new THREE.MeshPhysicalMaterial({
        color: color.clone().multiplyScalar(0.48),
        metalness: 0.5,
        roughness: 0.27,
        clearcoat: 0.6,
      });
      const raw = new THREE.ExtrudeGeometry(shapes, {
        depth,
        steps: 1,
        bevelEnabled: true,
        bevelSize: base ? (id === "sql" ? 0.24 : 0.65) : 0.04,
        bevelThickness: base ? 0.65 : 0.04,
        bevelSegments: 4,
        curveSegments: 10,
      });
      const geometry = toCreasedNormals(raw, Math.PI / 3);
      if (geometry !== raw) raw.dispose();
      geometry.translate(0, 0, base ? layer * 0.12 : 18.8 + layer * 0.16);
      content.add(new THREE.Mesh(geometry, [face, edge]));
      layer++;
    }
    if (!content.children.length) throw new Error("Símbolo sin geometría");
    const box = new THREE.Box3().setFromObject(content),
      size = box.getSize(new THREE.Vector3());
    const scale = 1.9 / Math.max(size.x, size.y);
    content.position
      .copy(box.getCenter(new THREE.Vector3()))
      .multiplyScalar(-1);
    root.add(content);
    root.scale.set(scale, -scale, scale);
    return root;
  } catch (error) {
    disposeHtmlSculpture(content);
    throw error;
  }
}
export async function loadLanguageSculpture(id, signal) {
  if (id === "html") return createHtmlSculpture();
  if (!ids.has(id)) throw new Error("Lenguaje desconocido");
  if (!sources.has(id)) {
    const response = await fetch(
      `${import.meta.env.BASE_URL}technologies/${id}.svg`,
      { signal },
    );
    if (!response.ok) throw new Error("No se ha podido cargar el símbolo");
    sources.set(id, await response.text());
  }

  const source = sources
    .get(id)
    .replace(/fill="url\(#[^)]+\)"/g, 'fill="#565b88"');
  return createLanguageSculpture(id, new SVGLoader().parse(source).paths);
}
export { disposeHtmlSculpture as disposeLanguageSculpture };
