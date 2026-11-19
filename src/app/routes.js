export const readRoute = () => location.hash.slice(1) || "home";
export const isHomeRoute = (route) =>
  route === "home" || route === "main-content";
