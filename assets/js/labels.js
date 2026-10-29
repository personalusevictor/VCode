"use strict";

(() => {
  const root = document.querySelector(".labels-page");
  if (!root) return;

  const elements = {
    menuButton: root.querySelector(".menu-toggle"),
    menu: root.querySelector("#navigation-links"),
    search: root.querySelector("#tag-search"),
    status: root.querySelector("#search-status"),
    empty: root.querySelector("#no-results"),
    emptyMessage: root.querySelector("#empty-message"),
    sidebar: root.querySelector(".ref-sidebar-panel"),
    announcement: root.querySelector("#copy-status"),
    overview: root.querySelector(".ref-overview"),
  };
  const entries = [...root.querySelectorAll(".ref-entry")];
  const categories = [...root.querySelectorAll(".ref-category")];
  const navGroups = [...root.querySelectorAll(".ref-nav-group")];
  const links = [...root.querySelectorAll(".ref-nav-group li a")];
  const entryById = new Map(entries.map((entry) => [entry.id, entry]));
  const mobile = window.matchMedia("(max-width: 700px)");
  const copyTimers = new WeakMap();
  let announcementTimer;
  let scrollScheduled = false;
  let activeEntryId;

  const normalise = (value) =>
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[<>]/g, "")
      .trim();

  const searchIndex = new Map(
    entries.map((entry) => [
      entry.id,
      normalise(
        [
          entry.querySelector("h3").textContent,
          entry.querySelector(".ref-subtitle").textContent,
          ...[...entry.querySelectorAll(":scope > p, td, th, pre")].map(
            (node) => node.textContent,
          ),
        ].join(" "),
      ),
    ]),
  );

  function announce(message) {
    clearTimeout(announcementTimer);
    elements.announcement.textContent = message;
    announcementTimer = setTimeout(() => {
      elements.announcement.textContent = "";
    }, 2600);
  }

  function setMenu(open) {
    elements.menuButton.setAttribute("aria-expanded", String(open));
    elements.menu.classList.toggle("is-open", open);
  }

  function setCurrentEntry(id) {
    if (id === activeEntryId) return;
    activeEntryId = id;
    if (id) elements.overview.removeAttribute("aria-current");
    else elements.overview.setAttribute("aria-current", "location");
    links.forEach((link) => {
      if (link.hash === `#${id}`) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
  }

  function updateReadingPosition() {
    scrollScheduled = false;
    if (!elements.sidebar.open) return;
    const visible = entries.filter(
      (entry) => !entry.hidden && entry.closest(".ref-category").open,
    );
    const current = visible.find((entry) => {
      const bounds = entry.getBoundingClientRect();
      return bounds.bottom > 112 && bounds.top <= 160;
    });
    setCurrentEntry(current?.id || null);
  }

  function queueReadingUpdate() {
    if (scrollScheduled) return;
    scrollScheduled = true;
    requestAnimationFrame(updateReadingPosition);
  }

  function filterEntries() {
    const terms = normalise(elements.search.value).split(/\s+/).filter(Boolean);
    let count = 0;

    entries.forEach((entry) => {
      const matchesText = terms.every((term) =>
        searchIndex.get(entry.id).includes(term),
      );
      entry.hidden = !matchesText;
      if (!entry.hidden) count++;
    });
    categories.forEach((category) => {
      category.hidden = [...category.querySelectorAll(".ref-entry")].every(
        (entry) => entry.hidden,
      );
      if (terms.length && !category.hidden) category.open = true;
    });
    links.forEach((link) => {
      link.parentElement.hidden = entryById.get(link.hash.slice(1)).hidden;
    });
    navGroups.forEach((group) => {
      group.hidden = [...group.querySelectorAll("li")].every(
        (item) => item.hidden,
      );
      if (terms.length && !group.hidden) group.open = true;
    });

    elements.status.textContent = terms.length
      ? `${count} ${count === 1 ? "resultado" : "resultados"} de ${entries.length}`
      : `${entries.length} elementos`;
    elements.empty.hidden = count !== 0;
    elements.emptyMessage.textContent = "Prueba otra etiqueta o atributo.";
    queueReadingUpdate();
  }

  function resetFilters() {
    elements.search.value = "";
    filterEntries();
  }

  function linkByEntryId(id) {
    return links.find((link) => link.hash === `#${id}`);
  }

  function revealHash() {
    const id = location.hash.slice(1);
    const entry = entryById.get(id);
    if (!entry) {
      if (id === "main-content" || !id) setCurrentEntry(null);
      return;
    }
    if (entry.hidden) resetFilters();
    entry.closest(".ref-category").open = true;
    linkByEntryId(id)?.closest(".ref-nav-group").setAttribute("open", "");
    setCurrentEntry(id);
    requestAnimationFrame(() => entry.scrollIntoView({ block: "start" }));
  }

  function initialiseNavigation() {
    elements.menuButton.addEventListener("click", () => {
      setMenu(elements.menuButton.getAttribute("aria-expanded") !== "true");
    });
    const adaptNavigation = () => {
      if (!mobile.matches) setMenu(false);
      queueReadingUpdate();
    };
    adaptNavigation();
    mobile.addEventListener("change", adaptNavigation);
    root.querySelectorAll(".ref-sidebar a").forEach((link) => {
      link.addEventListener("click", () => {
        const id = link.hash.slice(1);
        if (entryById.has(id)) {
          const entry = entryById.get(id);
          entry.closest(".ref-category").open = true;
          setCurrentEntry(id);
          requestAnimationFrame(() => entry.scrollIntoView({ block: "start" }));
        } else if (id === "main-content") {
          setCurrentEntry(null);
        }
      });
    });
    elements.sidebar.addEventListener("toggle", queueReadingUpdate);
    categories.forEach((category, index) => {
      const group = navGroups[index];
      // Ambos controles representan el mismo estado; no reenviar cambios idénticos.
      const syncCategory = (source, target) => {
        if (target.open !== source.open) target.open = source.open;
        if (source.open) elements.sidebar.open = true;
        queueReadingUpdate();
      };
      category.addEventListener("toggle", () => syncCategory(category, group));
      group.addEventListener("toggle", () => syncCategory(group, category));
    });
    window.addEventListener("hashchange", revealHash);
    window.addEventListener("scroll", queueReadingUpdate, { passive: true });
    window.addEventListener("resize", queueReadingUpdate);
    revealHash();
  }

  function initialiseSearch() {
    root.querySelector(".ref-search").hidden = false;
    elements.search.addEventListener("input", filterEntries);
    root.querySelector("#clear-search").addEventListener("click", () => {
      elements.search.value = "";
      filterEntries();
      elements.search.focus();
    });
    root.querySelector("#reset-filters").addEventListener("click", () => {
      resetFilters();
      elements.search.focus();
    });
    document.addEventListener("keydown", (event) => {
      const editing =
        event.target instanceof Element &&
        event.target.closest(
          'input, textarea, select, [contenteditable="true"]',
        );
      if (
        event.key === "/" &&
        !editing &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey
      ) {
        event.preventDefault();
        elements.search.focus();
      }
      if (event.key === "Escape") {
        if (elements.menuButton.getAttribute("aria-expanded") === "true") {
          setMenu(false);
          elements.menuButton.focus();
        } else if (document.activeElement === elements.search) {
          elements.search.value = "";
          filterEntries();
        }
      }
    });
  }

  function initialiseCopyButtons() {
    if (!navigator.clipboard?.writeText || !window.isSecureContext) return;
    root.querySelectorAll(".ref-copy").forEach((button) => {
      button.hidden = false;
      button.addEventListener("click", async () => {
        try {
          const code = button
            .closest(".ref-example")
            .querySelector("code").textContent;
          await navigator.clipboard.writeText(code);
          button.textContent = "Copiado";
          button.dataset.copied = "";
          clearTimeout(copyTimers.get(button));
          copyTimers.set(
            button,
            setTimeout(() => {
              button.textContent = "Copiar";
              delete button.dataset.copied;
            }, 1800),
          );
          announce("Código copiado");
        } catch {
          announce(
            "No se pudo copiar. Selecciona el código y cópialo manualmente.",
          );
        }
      });
    });
  }

  root.classList.add("js-enabled");
  initialiseSearch();
  initialiseCopyButtons();
  initialiseNavigation();
})();
