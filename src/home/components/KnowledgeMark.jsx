import React, { useEffect, useRef } from "react";

export default function KnowledgeMark({ query = "", paused = false }) {
  const canvas = useRef(),
    settings = useRef({ paused, query });
  settings.current = { paused, query };
  const syncRef = useRef(() => {});
  useEffect(() => {
    const element = canvas.current,
      context = element.getContext("2d");
    if (!context) return;
    const shape = new Path2D("M8 9h32v12H20v22h20v12H8ZM46 9h13L39 55H26Z");
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    let width = 1,
      height = 1,
      frame = 0,
      time = 0,
      previous = 0,
      visible = false,
      disposed = false;
    const pointer = { x: -1000, y: -1000 };
    const draw = () => {
      context.clearRect(0, 0, width, height);
      const gap = Math.min(width / 34, height / 22),
        ox = (width - 32 * gap) / 2,
        oy = (height - 20 * gap) / 2;
      const energy = settings.current.query.trim() ? 0.12 : 0;
      const dark = document.documentElement.dataset.theme === "dark";
      for (let y = 0; y < 20; y++)
        for (let x = 0; x < 32; x++) {
          const px = ox + (x + 0.5) * gap,
            py = oy + (y + 0.5) * gap;
          const inside = context.isPointInPath(
            shape,
            ((x - 6) / 20) * 64,
            (y / 20) * 64,
          );
          const wave =
            Math.sin(x * 0.22 + time) * Math.cos(y * 0.22 + time * 0.7);
          const power = inside ? 0.55 + 0.45 * Math.abs(wave) : 0.055;
          const influence = Math.max(
            0,
            1 - Math.hypot(px - pointer.x, py - pointer.y) / 90,
          );
          context.fillStyle = !inside
            ? dark
              ? "#2c374b"
              : "#94a4ba25"
            : wave > 0
              ? dark
                ? "#8092ff"
                : "#4556d8"
              : dark
                ? "#dcebea"
                : "#92a9d4";
          context.beginPath();
          context.arc(
            px + (px - pointer.x) * influence * 0.07,
            py + (py - pointer.y) * influence * 0.07,
            Math.max(
              0.65,
              gap * 0.43 * Math.min(1, power + influence * 0.35 + energy),
            ),
            0,
            Math.PI * 2,
          );
          context.fill();
        }
    };
    const allowed = () =>
      visible &&
      !disposed &&
      !document.hidden &&
      !reduced.matches &&
      !settings.current.paused;
    const tick = (now) => {
      frame = 0;
      if (!allowed()) return;
      if (now - previous >= 1000 / 30) {
        time += Math.min((now - previous) / 1000, 0.05) * 0.65;
        previous = now;
        draw();
      }
      frame = requestAnimationFrame(tick);
    };
    const sync = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      previous = performance.now();
      draw();
      if (allowed()) frame = requestAnimationFrame(tick);
    };
    syncRef.current = sync;
    const resize = () => {
      let rect = element.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      const pixel = Math.min(devicePixelRatio || 1, 1.5);
      element.width = Math.round(width * pixel);
      element.height = Math.round(height * pixel);
      context.setTransform(pixel, 0, 0, pixel, 0, 0);
      sync();
    };
    const theme = new MutationObserver(draw);
    theme.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    const size = new ResizeObserver(resize),
      view = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        sync();
      });
    size.observe(element);
    view.observe(element);
    const move = (event) => {
      if (reduced.matches || settings.current.paused) return;
      const rect = element.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
      if (!allowed()) draw();
    };
    const leave = () => {
      pointer.x = pointer.y = -1000;
      if (!allowed()) draw();
    };
    element.addEventListener("pointermove", move, { passive: true });
    element.addEventListener("pointerleave", leave);
    document.addEventListener("visibilitychange", sync);
    reduced.addEventListener("change", sync);
    resize();
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      theme.disconnect();
      size.disconnect();
      view.disconnect();
      document.removeEventListener("visibilitychange", sync);
      reduced.removeEventListener("change", sync);
      element.removeEventListener("pointermove", move);
      element.removeEventListener("pointerleave", leave);
      syncRef.current = () => {};
    };
  }, []);
  useEffect(() => syncRef.current(), [paused, query]);
  return (
    <figure className="knowledge-mark">
      <canvas ref={canvas} aria-hidden="true" />
    </figure>
  );
}
