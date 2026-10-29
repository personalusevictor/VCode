"use strict";
const menuButton = document.querySelector(".menu-toggle");
const navigation = document.querySelector("#navigation-links");
menuButton?.addEventListener("click", () => {
  const open = menuButton.getAttribute("aria-expanded") !== "true";
  menuButton.setAttribute("aria-expanded", String(open));
  navigation?.classList.toggle("is-open", open);
});
