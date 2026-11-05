"use strict";
document.body.classList.add("js-enabled");
const menuButton = document.querySelector(".menu-toggle");
const navigation = document.querySelector("#navigation-links");
function setMenu(open) {
  menuButton?.setAttribute("aria-expanded", String(open));
  navigation?.classList.toggle("is-open", open);
}
menuButton?.addEventListener("click", () => setMenu(menuButton.getAttribute("aria-expanded") !== "true"));
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && menuButton?.getAttribute("aria-expanded") === "true") {
    setMenu(false);
    menuButton.focus();
  }
});
navigation?.addEventListener("click", (event) => {
  if (event.target.closest("a")) setMenu(false);
});
window.matchMedia("(min-width: 701px)").addEventListener("change", (event) => {
  if (event.matches) setMenu(false);
});