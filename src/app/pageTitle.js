import { useEffect } from "react";

export function setPageTitle(name) {
  document.title = `VCode | ${name}`;
}

export function usePageTitle(name) {
  useEffect(() => setPageTitle(name), [name]);
}
