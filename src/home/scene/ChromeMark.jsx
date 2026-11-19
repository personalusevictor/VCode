import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import gsap from "gsap";
import { createBrandGeometry, createStudioEnvironment } from "./brandModel.js";
import { brandPose, smooth } from "../motion/brandMotion.js";
import { installNeoClouds } from "./neoCloudSurface.js";
import { Mark } from "../../app/Brand.jsx";

export default function ChromeMark({
  onReady,
  onFallback,
  onPresented,
  paused = false,
}) {
  const host = useRef(),
    callbacks = useRef(),
    flowControl = useRef();
  callbacks.current = { onReady, onFallback, onPresented };
  const [ready, setReady] = useState(false),
    [failed, setFailed] = useState(false);
  useEffect(() => {
    let disposed = false,
      frame = 0,
      lost = false,
      first = true,
      current = 0;
    let poseDirty = true,
      renderDirty = true,
      lastFlow = 0,
      lastCloud = 0,
      inView = false,
      manuallyPaused = paused;
    let wasAnimating = false;
    let renderer, environment;
    function showFallback() {
      setFailed(true);
      callbacks.current.onFallback?.();
    }
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: "low-power",
      });
    } catch {
      showFallback();
      return;
    }
    const node = host.current,
      canvas = renderer.domElement;
    canvas.setAttribute("aria-hidden", "true");
    node.appendChild(canvas);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.toneMapping = THREE.NeutralToneMapping;
    renderer.toneMappingExposure = 1.0;
    const scene = new THREE.Scene(),
      camera = new THREE.OrthographicCamera(-5, 5, 5, -5, 0.1, 100);
    camera.position.set(0, 0, 16);
    try {
      environment = createStudioEnvironment(renderer);
    } catch {
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
      showFallback();
      return;
    }
    scene.environment = environment.texture;
    scene.environmentIntensity = 0.82;
    scene.add(new THREE.HemisphereLight("#ffffff", "#c9d3e7", 0.95));
    const light = new THREE.DirectionalLight("#ffffff", 1.25);
    light.position.set(-3, 5, 7);
    scene.add(light);
    const geometry = createBrandGeometry();
    const material = new THREE.MeshPhysicalMaterial({
      color: "#367cff",
      metalness: 0.97,
      roughness: 0.19,
      clearcoat: 0.35,
      clearcoatRoughness: 0.1,
      iridescence: 0.1,
      iridescenceIOR: 1.36,
      iridescenceThicknessMinimum: 240,
      iridescenceThicknessMaximum: 360,
    });

    const cloudTime = installNeoClouds(material);
    const mark = new THREE.Mesh(geometry, material);
    scene.add(mark);
    const pointer = { x: 0, y: 0, energy: 0 };
    const raycaster = new THREE.Raycaster(),
      pointerNdc = new THREE.Vector2(),
      pointerHits = [];
    const pointerHost = node.closest(".chrome-mark");
    const pointerX = gsap.quickTo(pointer, "x", {
      duration: 0.65,
      ease: "power3.out",
      onUpdate: () => update(current),
    });
    const pointerY = gsap.quickTo(pointer, "y", {
      duration: 0.65,
      ease: "power3.out",
      onUpdate: () => update(current),
    });
    const pointerEnergy = gsap.quickTo(pointer, "energy", {
      duration: 0.8,
      ease: "power2.out",
      onUpdate: () => update(current),
    });
    function interact(position) {
      const permitted =
        position &&
        !disposed &&
        !lost &&
        !first &&
        !manuallyPaused &&
        !motionQuery.matches &&
        current < 0.6;
      let hit = false;
      if (permitted) {
        const rect = node.getBoundingClientRect();
        pointerNdc.set(
          THREE.MathUtils.clamp(
            ((position.x - rect.left) / width) * 2 - 1,
            -1,
            1,
          ),
          THREE.MathUtils.clamp(
            -((position.y - rect.top) / height) * 2 + 1,
            -1,
            1,
          ),
        );

        raycaster.setFromCamera(pointerNdc, camera);
        mark.updateMatrixWorld();
        pointerHits.length = 0;
        raycaster.intersectObject(mark, false, pointerHits);
        hit = pointerHits.length > 0;
      }
      pointerHost.toggleAttribute("data-pointer-active", hit);
      pointerHost.toggleAttribute("data-pointer-following", Boolean(permitted));
      const nextX = permitted ? pointerNdc.x : 0;
      const nextY = permitted ? -pointerNdc.y : 0;
      if (nextX !== pointerXTarget) {
        pointerXTarget = nextX;
        pointerX(nextX);
      }
      if (nextY !== pointerYTarget) {
        pointerYTarget = nextY;
        pointerY(nextY);
      }
      if (Boolean(permitted) !== pointerActive) {
        pointerActive = Boolean(permitted);
        pointerEnergy(permitted ? 1 : 0);
      }
      return hit;
    }
    let pointerXTarget = 0,
      pointerYTarget = 0,
      pointerActive = false;
    const reveal = {
      value: matchMedia("(prefers-reduced-motion: reduce)").matches ? 1 : 0,
    };
    let width = 1,
      height = 1,
      pixel = 1;
    const point = (x, y) =>
      new THREE.Vector3((x - width / 2) * pixel, (height / 2 - y) * pixel, 0);
    function schedule() {
      if (!disposed && !lost && !frame && !document.hidden)
        frame = requestAnimationFrame(renderFrame);
    }
    function draw() {
      renderDirty = true;
      schedule();
    }
    function renderFrame(now) {
      frame = 0;
      if (disposed || lost || document.hidden) return;
      const animate = flowAllowed();
      if (animate && !wasAnimating) lastFlow = lastCloud = now;
      wasAnimating = animate;
      const interval = 1000 / 30;
      if (animate && now - lastFlow >= interval - 0.5) {
        cloudTime.value += Math.min((now - lastCloud) / 1000, 0.1);
        lastCloud = now;
        lastFlow += interval;
        if (now - lastFlow > interval) lastFlow = now;
        renderDirty = true;
      }
      if (poseDirty) {
        poseDirty = false;
        applyPose(current);
      }
      if (renderDirty) {
        renderDirty = false;
        try {
          renderer.render(scene, camera);
        } catch {
          lost = true;
          canvas.style.display = "none";
          showFallback();
          return;
        }
        if (first) {
          first = false;
          setReady(true);
          callbacks.current.onPresented?.();
          gsap.to(reveal, {
            value: 1,
            duration: reveal.value === 1 ? 0 : 1.45,
            delay: reveal.value === 1 ? 0 : 0.35,
            ease: "power3.out",
            onUpdate: () => update(current),
          });
        }
      }
      if (animate || renderDirty || poseDirty) schedule();
    }

    function update(progress) {
      current = progress;
      poseDirty = true;
      draw();
    }
    function applyPose(progress) {
      current = progress;
      const pose = brandPose(progress),
        mobile = width < 641,
        short = height < 560 && !mobile;
      const entrance = (1 - reveal.value) * (1 - smooth(progress / 0.12));
      const size = Math.min(
        width * (mobile ? 0.87 : width < 1051 ? 0.76 : 0.55),
        height * (mobile ? 0.55 : 0.72),
        640,
      );
      const initialY = height * 0.5 + entrance * 45;
      const finalY = height * (short ? 0.27 : mobile ? 0.15 : 0.18);
      mark.position.copy(
        point(width / 2, THREE.MathUtils.lerp(initialY, finalY, pose.gather)),
      );
      mark.rotation.set(
        pose.rotationX +
          entrance * 0.16 +
          pointer.y * pointer.energy * 0.06 * (1 - pose.gather),
        pose.rotationY -
          entrance * 0.55 +
          pointer.x * pointer.energy * 0.075 * (1 - pose.gather),
        pose.rotationZ - entrance * 0.08,
      );
      light.position.set(
        -3 + pointer.x * pointer.energy * 0.9,
        5 - pointer.y * pointer.energy * 0.6,
        7,
      );
      light.intensity = 1.25 + pointer.energy * 0.18;
      mark.scale.setScalar(
        (size / 5.1) * pixel * pose.scale * (1 - entrance * 0.2),
      );
    }
    function resize() {
      const rect = node.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      width = rect.width;
      height = rect.height;
      const ratio = Math.min(
        devicePixelRatio,
        width < 641 ? 1.5 : 1.75,
        Math.max(1, Math.sqrt(2500000 / (width * height))),
      );
      if (renderer.getPixelRatio() !== ratio) renderer.setPixelRatio(ratio);
      renderer.setSize(width, height, false);
      camera.left = (-5 * width) / height;
      camera.right = (5 * width) / height;
      camera.updateProjectionMatrix();
      pixel = 10 / height;
      update(current);
    }
    const observer = new ResizeObserver(resize);
    observer.observe(node);
    const motionQuery = matchMedia("(prefers-reduced-motion: reduce)");
    const flowAllowed = () =>
      !disposed &&
      !lost &&
      inView &&
      !document.hidden &&
      !motionQuery.matches &&
      !manuallyPaused &&
      current < 0.94;
    function syncFlow() {
      cancelAnimationFrame(frame);
      frame = 0;
      lastFlow = lastCloud = performance.now();
      if (flowAllowed() || renderDirty || poseDirty) schedule();
    }
    flowControl.current = (value) => {
      manuallyPaused = value;
      if (value) interact(null);
      syncFlow();
    };
    const visibilityObserver = new IntersectionObserver(
      (entries) => {
        inView = entries[0].isIntersecting;
        syncFlow();
      },
      { threshold: 0.01 },
    );
    visibilityObserver.observe(node);
    const motionChanged = () => {
      if (motionQuery.matches) {
        interact(null);
        gsap.killTweensOf(reveal);
        reveal.value = 1;
      }
      resize();
      syncFlow();
    };
    motionQuery.addEventListener("change", motionChanged);
    document.fonts.ready.then(() => {
      if (!disposed) resize();
    });
    const contextLost = (event) => {
      event.preventDefault();
      lost = true;
      syncFlow();
      canvas.style.display = "none";
      showFallback();
    };
    const visibility = () => {
      syncFlow();
      if (!document.hidden) draw();
    };
    canvas.addEventListener("webglcontextlost", contextLost);
    document.addEventListener("visibilitychange", visibility);
    resize();
    callbacks.current.onReady?.({ update, point: interact });
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      visibilityObserver.disconnect();
      flowControl.current = null;
      motionQuery.removeEventListener("change", motionChanged);
      gsap.killTweensOf(reveal);
      gsap.killTweensOf(pointer);
      pointerHost.removeAttribute("data-pointer-active");
      pointerHost.removeAttribute("data-pointer-following");
      callbacks.current.onReady?.(null);
      document.removeEventListener("visibilitychange", visibility);
      canvas.removeEventListener("webglcontextlost", contextLost);
      geometry.dispose();
      material.dispose();
      environment.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
    };
  }, []);
  useEffect(() => {
    flowControl.current?.(paused);
  }, [paused]);
  return (
    <div
      className={`chrome-mark ${ready && !failed ? "is-ready" : ""} ${failed ? "is-fallback" : ""}`}
      role="img"
      aria-busy={!ready && !failed}
      aria-label={
        failed
          ? "Símbolo de VCode, vista estática."
          : "Símbolo de VCode con acabado neo chrome azul e iridiscente."
      }
    >
      {failed && <Mark className="chrome-fallback-symbol" />}
      <div className="chrome-canvas" ref={host} />
    </div>
  );
}
