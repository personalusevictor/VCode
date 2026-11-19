export const clamp = (value) => Math.min(1, Math.max(0, value));
export const smooth = (value) => {
  const t = clamp(value);
  return t * t * (3 - 2 * t);
};
export const smoother = (value) => {
  const t = clamp(value);
  return t * t * t * (t * (t * 6 - 15) + 10);
};
export function advanceStory(current, target, seconds) {
  const dt = Math.min(Math.max(seconds, 0), 0.04);
  const step = (clamp(target) - current) * (1 - Math.exp(-dt / 0.12));
  const limit = dt * 0.8;
  return clamp(current + Math.max(-limit, Math.min(limit, step)));
}
export function brandPose(progress) {
  const p = clamp(progress),
    turn = smoother((p - 0.025) / 0.615),
    gather = smoother((p - 0.67) / 0.26);
  return {
    rotationY: -0.22 + turn * Math.PI * 2,
    rotationX: -0.1 + Math.sin(turn * Math.PI * 2) * 0.065,
    rotationZ: -0.055 + Math.sin(turn * Math.PI * 2) * 0.025,
    scale: 1 - gather * 0.84,
    y: gather * 0.12,
    degrees: Math.round(turn * 360),
    gather,
  };
}
