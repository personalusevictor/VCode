import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { createStudioEnvironment } from "./brandModel.js";
import {
  loadLanguageSculpture,
  disposeLanguageSculpture,
} from "./languageSculptureModel.js";
import { TechIcon } from "../../app/Brand.jsx";

export default function LanguageSculpture({ id, paused = false }) {
  const host = useRef(),
    control = useRef(() => {}),
    pause = useRef(paused);
  pause.current = paused;
  const [status, setStatus] = useState("waiting");
  useEffect(() => {
    const node = host.current,
      stage = node.closest(".story-explorer");
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    let disposed = false,
      failed = false,
      loading = false,
      inView = false,
      frame = 0,
      renderer,
      environment,
      model,
      scene,
      camera,
      width = 1,
      height = 1;
    const rotation = { x: 0.1, y: -0.68 },
      target = { x: 0.1, y: -0.42 };
    const visible = () =>
      inView &&
      !document.hidden &&
      stage?.getAttribute("aria-hidden") !== "true";
    const draw = () => {
      if (!renderer || disposed) return;
      model.rotation.set(rotation.x, rotation.y, -0.04);
      renderer.render(scene, camera);
    };
    const tick = () => {
      frame = 0;
      if (!visible() || pause.current || reduced.matches) return;
      rotation.x += (target.x - rotation.x) * 0.14;
      rotation.y += (target.y - rotation.y) * 0.14;
      draw();
      if (
        Math.abs(target.x - rotation.x) + Math.abs(target.y - rotation.y) >
        0.0005
      )
        frame = requestAnimationFrame(tick);
    };
    const resize = () => {
      const rect = node.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      if (!renderer) return;
      const aspect = width / height;
      camera.left = -1.3 * aspect;
      camera.right = 1.3 * aspect;
      camera.top = 1.3;
      camera.bottom = -1.3;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
      renderer.setSize(width, height, false);
      draw();
    };
    const abort = new AbortController();
    const initialise = async () => {
      if (renderer || disposed || failed || loading || !visible()) return;
      loading = true;
      try {
        const loaded = await loadLanguageSculpture(id, abort.signal);
        if (disposed || !visible()) {
          disposeLanguageSculpture(loaded);
          return;
        }
        model = loaded;
        renderer = new THREE.WebGLRenderer({
          alpha: true,
          antialias: true,
          powerPreference: "low-power",
        });
        renderer.setClearColor(0, 0);
        renderer.toneMapping = THREE.NeutralToneMapping;
        renderer.toneMappingExposure = 1.08;
        renderer.domElement.setAttribute("aria-hidden", "true");
        node.appendChild(renderer.domElement);
        scene = new THREE.Scene();
        camera = new THREE.OrthographicCamera(-2, 2, 1.3, -1.3, 0.1, 50);
        camera.position.set(0, 0, 8);
        environment = createStudioEnvironment(renderer, {
          warm: id === "html",
          neutral: id !== "html",
        });
        scene.environment = environment.texture;
        scene.environmentIntensity = 0.65;
        scene.add(
          new THREE.HemisphereLight(
            "#ffffff",
            id === "html" ? "#9b705a" : "#8a94a0",
            2,
          ),
        );
        const light = new THREE.DirectionalLight("#fff9ee", 3);
        light.position.set(-3, 4, 5);
        scene.add(light);
        scene.add(model);
        if (reduced.matches || pause.current) {
          rotation.x = target.x;
          rotation.y = target.y;
        }
        resize();
        setStatus("ready");
        if (!pause.current && !reduced.matches)
          frame = requestAnimationFrame(tick);
      } catch {
        if (disposed) return;
        failed = true;
        renderer?.dispose();
        renderer?.domElement.remove();
        environment?.dispose();
        if (model) disposeLanguageSculpture(model);
        renderer = null;
        setStatus("fallback");
      } finally {
        loading = false;
      }
    };
    const sync = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      if (!visible()) return;
      initialise();
      if (renderer && !pause.current && !reduced.matches)
        frame = requestAnimationFrame(tick);
    };
    control.current = sync;
    const move = (event) => {
      if (
        event.pointerType !== "mouse" ||
        pause.current ||
        reduced.matches ||
        !visible()
      )
        return;
      const rect = node.getBoundingClientRect();
      target.x = 0.1 - ((event.clientY - rect.top) / height - 0.5) * 0.3;
      target.y = -0.42 + ((event.clientX - rect.left) / width - 0.5) * 0.5;
      if (!frame) frame = requestAnimationFrame(tick);
    };
    const leave = () => {
      target.x = 0.1;
      target.y = -0.42;
      if (visible() && !frame && !pause.current && !reduced.matches)
        frame = requestAnimationFrame(tick);
    };
    let stageState = stage?.getAttribute("aria-hidden");
    const size = new ResizeObserver(resize),
      view = new IntersectionObserver(([entry]) => {
        inView = entry.isIntersecting;
        sync();
      }),
      stageObserver = new MutationObserver(() => {
        const next = stage?.getAttribute("aria-hidden");
        if (next !== stageState) {
          stageState = next;
          sync();
        }
      });
    size.observe(node);
    view.observe(node);
    if (stage)
      stageObserver.observe(stage, {
        attributes: true,
        attributeFilter: ["aria-hidden"],
      });
    document.addEventListener("visibilitychange", sync);
    reduced.addEventListener("change", sync);
    node.addEventListener("pointermove", move, { passive: true });
    node.addEventListener("pointerleave", leave);
    return () => {
      disposed = true;
      abort.abort();
      cancelAnimationFrame(frame);
      size.disconnect();
      view.disconnect();
      stageObserver.disconnect();
      document.removeEventListener("visibilitychange", sync);
      reduced.removeEventListener("change", sync);
      node.removeEventListener("pointermove", move);
      node.removeEventListener("pointerleave", leave);
      if (model) disposeLanguageSculpture(model);
      environment?.dispose();
      renderer?.dispose();
      renderer?.forceContextLoss();
      renderer?.domElement.remove();
      control.current = () => {};
    };
  }, [id]);
  useEffect(() => control.current(), [paused]);
  return (
    <div
      className={`html-sculpture language-sculpture is-${status}`}
      ref={host}
      aria-hidden="true"
    >
      {status === "fallback" && <TechIcon id={id} />}
    </div>
  );
}
