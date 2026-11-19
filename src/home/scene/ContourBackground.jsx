import React, { useEffect, useRef } from "react";

const edges = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 0],
];
const cases = [
  [],
  [3, 0],
  [0, 1],
  [3, 1],
  [1, 2],
  [3, 2, 0, 1],
  [0, 2],
  [3, 2],
  [2, 3],
  [0, 2],
  [0, 3, 1, 2],
  [1, 2],
  [1, 3],
  [0, 1],
  [3, 0],
  [],
];
export default function ContourBackground({ paused = false, onReady }) {
  const canvas = useRef(),
    pauseControl = useRef(),
    ready = useRef(onReady);
  ready.current = onReady;
  useEffect(() => {
    const element = canvas.current,
      context = element.getContext("2d");
    if (!context) return;
    let width = 1,
      height = 1,
      cols = 1,
      rows = 1,
      field,
      uAxis,
      vAxis,
      columnWarp,
      rowWarp;
    let frame = 0,
      previous = 0,
      lastDraw = 0,
      time = 0,
      inView = false,
      active = true,
      manualPause = paused,
      disposed = false;
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    const root = document.documentElement;
    const allowed = () =>
      !disposed &&
      active &&
      inView &&
      !manualPause &&
      !motion.matches &&
      !document.hidden;
    function draw() {
      const dx = width / cols,
        dy = height / rows;
      for (let x = 0; x <= cols; x++)
        columnWarp[x] = Math.sin(uAxis[x] * 0.8 - time * 0.1) * 0.9;
      for (let y = 0; y <= rows; y++)
        rowWarp[y] = Math.cos(vAxis[y] * 0.7 + time * 0.17) * 1.1;
      for (let y = 0; y <= rows; y++)
        for (let x = 0; x <= cols; x++) {
          const u = uAxis[x],
            v = vAxis[y];
          field[y * (cols + 1) + x] =
            Math.sin(u * 1.55 + rowWarp[y] + time * 0.12) +
            Math.sin(v * 1.7 + columnWarp[x] - time * 0.14) +
            Math.sin(u * 2.9 + v * 1.4 + time * 0.22) * 0.32;
        }
      context.clearRect(0, 0, width, height);
      context.strokeStyle =
        root.dataset.theme === "dark"
          ? "rgba(159,184,224,0.36)"
          : "rgba(89,101,105,0.39)";
      context.lineWidth = width < 600 ? 1 : 1.15;
      context.lineCap = "round";
      const values = new Float32Array(4);
      for (const level of [-0.65, 0.65]) {
        context.beginPath();
        for (let y = 0; y < rows; y++)
          for (let x = 0; x < cols; x++) {
            const offset = y * (cols + 1) + x;
            values[0] = field[offset];
            values[1] = field[offset + 1];
            values[2] = field[offset + cols + 2];
            values[3] = field[offset + cols + 1];
            const code =
              (values[0] > level ? 1 : 0) |
              (values[1] > level ? 2 : 0) |
              (values[2] > level ? 4 : 0) |
              (values[3] > level ? 8 : 0);
            let segments = cases[code];
            if (code === 5 || code === 10) {
              const centerHigh =
                (values[0] + values[1] + values[2] + values[3]) * 0.25 > level;
              segments =
                centerHigh === (code === 5) ? [0, 1, 2, 3] : [3, 0, 1, 2];
            }
            for (let i = 0; i < segments.length; i++) {
              const [a, b] = edges[segments[i]];
              const t = (level - values[a]) / (values[b] - values[a]);
              const ax = a === 1 || a === 2 ? 1 : 0,
                ay = a >= 2 ? 1 : 0;
              const bx = b === 1 || b === 2 ? 1 : 0,
                by = b >= 2 ? 1 : 0;
              const px = (x + ax + (bx - ax) * t) * dx,
                py = (y + ay + (by - ay) * t) * dy;
              if (i % 2 === 0) context.moveTo(px, py);
              else context.lineTo(px, py);
            }
          }
        context.stroke();
      }
    }
    function tick(now) {
      frame = 0;
      if (!allowed()) return;
      if (!previous) previous = lastDraw = now;
      const interval = 1000 / 30;
      if (now - previous >= interval - 0.5) {
        time += Math.min((now - lastDraw) / 1000, 0.1) * 1.3;
        lastDraw = now;
        previous += interval;
        if (now - previous > interval) previous = now;
        draw();
      }
      frame = requestAnimationFrame(tick);
    }
    function sync() {
      cancelAnimationFrame(frame);
      frame = 0;
      previous = 0;
      lastDraw = 0;
      if (allowed()) frame = requestAnimationFrame(tick);
    }
    function resize() {
      const rect = element.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      const pixel = Math.min(devicePixelRatio || 1, 1.5);
      element.width = Math.round(width * pixel);
      element.height = Math.round(height * pixel);
      context.setTransform(pixel, 0, 0, pixel, 0, 0);
      cols = Math.ceil(width / 18);
      rows = Math.ceil(height / 18);
      field = new Float32Array((cols + 1) * (rows + 1));
      const scale = Math.max(width / 8, height / 5.2);
      uAxis = Float32Array.from(
        { length: cols + 1 },
        (_, x) => ((x * width) / cols - width / 2) / scale,
      );
      vAxis = Float32Array.from(
        { length: rows + 1 },
        (_, y) => ((y * height) / rows - height / 2) / scale,
      );
      columnWarp = new Float32Array(cols + 1);
      rowWarp = new Float32Array(rows + 1);
      draw();
      sync();
    }
    const sizeObserver = new ResizeObserver(resize);
    const viewObserver = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      sync();
    });
    const themeObserver = new MutationObserver(draw);
    sizeObserver.observe(element);
    viewObserver.observe(element);
    themeObserver.observe(root, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    motion.addEventListener("change", sync);
    document.addEventListener("visibilitychange", sync);
    pauseControl.current = (value) => {
      manualPause = value;
      sync();
    };
    ready.current?.({
      setActive(value) {
        if (active !== value) {
          active = value;
          sync();
        }
      },
    });
    resize();
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      sizeObserver.disconnect();
      viewObserver.disconnect();
      themeObserver.disconnect();
      motion.removeEventListener("change", sync);
      document.removeEventListener("visibilitychange", sync);
      pauseControl.current = null;
      ready.current?.(null);
    };
  }, []);
  useEffect(() => {
    pauseControl.current?.(paused);
  }, [paused]);
  return (
    <canvas className="story-wave-field" ref={canvas} aria-hidden="true" />
  );
}
