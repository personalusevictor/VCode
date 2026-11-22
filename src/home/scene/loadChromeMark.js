let request;

export default function loadChromeMark() {
  return (request ??= import("./ChromeMark.jsx"));
}
