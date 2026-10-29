"use strict";

(() => {
  const page = document.querySelector(".examples-page");
  if (!page) return;
  const status = page.querySelector("#example-copy-status");
  const timers = new WeakMap();
  let statusTimer;
  const canCopy =
    window.isSecureContext && Boolean(navigator.clipboard?.writeText);
  function announce(message) {
    clearTimeout(statusTimer);
    status.textContent = message;
    statusTimer = setTimeout(() => {
      status.textContent = "";
    }, 2600);
  }
  function selectCode(code) {
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(code);
    selection.removeAllRanges();
    selection.addRange(range);
    code.closest("pre").focus();
    announce("Código seleccionado. Cópialo con Ctrl+C o ⌘C.");
  }
  page.querySelectorAll(".ex-copy").forEach((button) => {
    const code = document.getElementById(button.dataset.code);
    if (!code) return;
    button.hidden = false;
    if (!canCopy) {
      button.textContent = "Seleccionar";
      button.setAttribute(
        "aria-label",
        button.getAttribute("aria-label").replace("Copiar", "Seleccionar"),
      );
    }
    button.addEventListener("click", async () => {
      if (!canCopy) {
        selectCode(code);
        return;
      }
      try {
        await navigator.clipboard.writeText(code.textContent);
        clearTimeout(timers.get(button));
        button.textContent = "Copiado";
        button.dataset.copied = "";
        timers.set(
          button,
          setTimeout(() => {
            button.textContent = "Copiar";
            delete button.dataset.copied;
          }, 1800),
        );
        announce("Código copiado");
      } catch {
        selectCode(code);
      }
    });
  });
})();
