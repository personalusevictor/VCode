export function easePointer(value, target, milliseconds, duration = 70) {
  const dt = Math.min(40, Math.max(0, milliseconds));
  return value + (target - value) * (1 - Math.exp(-dt / duration));
}
export function nearestNavigationItem(rects, x, y) {
  if (!rects.length) return -1;
  const left = Math.min(...rects.map((r) => r.left)),
    right = Math.max(...rects.map((r) => r.left + r.width));
  const top = Math.min(...rects.map((r) => r.top)),
    bottom = Math.max(...rects.map((r) => r.top + r.height));
  if (x < left || x > right || y < top || y > bottom) return -1;
  let best = 0,
    distance = Infinity;
  rects.forEach((r, i) => {
    const next = Math.abs(x - r.left - r.width / 2);
    if (next < distance) {
      best = i;
      distance = next;
    }
  });
  return best;
}

export function insetRadii(corners, width, height, inset) {
  const x = [];
  const y = [];
  const pixels = (value, size) =>
    Number.parseFloat(value) * (value.endsWith("%") ? size / 100 : 1);
  for (const corner of corners) {
    const [horizontal, vertical = horizontal] = corner.trim().split(/\s+/);
    x.push(pixels(horizontal, width));
    y.push(pixels(vertical, height));
  }
  const scale = Math.min(
    1,
    width / (x[0] + x[1]),
    width / (x[3] + x[2]),
    height / (y[0] + y[3]),
    height / (y[1] + y[2]),
  );
  return [...x, ...y].map((value) => Math.max(0, value * scale - inset));
}
