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
const levels = [-0.65, 0.65];

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
      columns,
      verticalAxis,
      warpSin,
      warpCos;
    let frame = 0,
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
    const values = new Float32Array(4);
    function updateField() {
      // The phases along each axis are shared by all the points on that row or column.
      for (let x = 0; x <= cols; x++) {
        const warp = Math.sin(columns[x].warp - time * 0.1) * 0.9 - time * 0.14;
        warpSin[x] = Math.sin(warp);
        warpCos[x] = Math.cos(warp);
      }
      for (let y = 0; y <= rows; y++) {
        const v = verticalAxis[y];
        const rowWarp = Math.cos(v * 0.7 + time * 0.17) * 1.1 + time * 0.12;
        const rowSin = Math.sin(rowWarp);
        const rowCos = Math.cos(rowWarp);
        const verticalSin = Math.sin(v * 1.7);
        const verticalCos = Math.cos(v * 1.7);
        const diagonalSin = Math.sin(v * 1.4 + time * 0.22);
        const diagonalCos = Math.cos(v * 1.4 + time * 0.22);
        const offset = y * (cols + 1);
        for (let x = 0; x <= cols; x++) {
          const column = columns[x];
          field[offset + x] =
            column.mainSin * rowCos +
            column.mainCos * rowSin +
            verticalSin * warpCos[x] +
            verticalCos * warpSin[x] +
            (column.diagonalSin * diagonalCos +
              column.diagonalCos * diagonalSin) *
              0.32;
        }
      }
    }
    function draw() {
      const dx = width / cols,
        dy = height / rows;
      updateField();
      context.clearRect(0, 0, width, height);
      context.strokeStyle =
        root.dataset.theme === "dark"
          ? "rgba(191,191,182,0.29)"
          : "rgba(89,101,105,0.39)";
      context.lineWidth = width < 600 ? 1 : 1.15;
      context.lineCap = "round";
      for (const level of levels) {
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
      if (lastDraw) {
        time += Math.min((now - lastDraw) / 1000, 0.1) * 1.3;
        draw();
      }
      lastDraw = now;
      frame = requestAnimationFrame(tick);
    }
    function sync() {
      cancelAnimationFrame(frame);
      frame = 0;
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
      columns = Array.from({ length: cols + 1 }, (_, x) => {
        const u = ((x * width) / cols - width / 2) / scale;
        return {
          mainSin: Math.sin(u * 1.55),
          mainCos: Math.cos(u * 1.55),
          diagonalSin: Math.sin(u * 2.9),
          diagonalCos: Math.cos(u * 2.9),
          warp: u * 0.8,
        };
      });
      verticalAxis = Float64Array.from(
        { length: rows + 1 },
        (_, y) => ((y * height) / rows - height / 2) / scale,
      );
      warpSin = new Float64Array(cols + 1);
      warpCos = new Float64Array(cols + 1);
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
