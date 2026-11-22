import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ChevronDown, List } from "lucide-react";
import { usePreferences } from "../../app/Preferences";

export function ReferenceSection({
  id,
  title,
  label = title,
  className,
  children,
}) {
  return (
    <section
      id={`ref-${id}`}
      data-reference-section={label}
      className={["doc-article-section", className].filter(Boolean).join(" ")}
      aria-labelledby={`ref-title-${id}`}
    >
      <h2 id={`ref-title-${id}`} tabIndex={-1}>
        {title}
      </h2>
      {children}
    </section>
  );
}

export function ReferenceContents({
  items,
  active,
  sectionHref,
  onMove,
  rail = false,
}) {
  const links = (
    <nav aria-label="Secciones de la ficha" className="reference-jump-links">
      {items.map(({ id, label }) => (
        <a
          aria-current={active === id ? "location" : undefined}
          href={sectionHref(id)}
          key={id}
          onClick={(event) => onMove(event, id)}
        >
          {label}
        </a>
      ))}
    </nav>
  );
  return rail ? (
    <aside className="reference-rail">
      <div className="reference-rail-title">En esta ficha</div>
      {links}
    </aside>
  ) : (
    <details className="reference-contents">
      <summary>
        <List size={16} aria-hidden="true" />
        En esta ficha
        <ChevronDown size={15} aria-hidden="true" />
      </summary>
      {links}
    </details>
  );
}

export function ReferenceBody({ href, section, content, children }) {
  const body = useRef(null);
  const [items, setItems] = useState([]);
  const [active, setActive] = useState("");
  const { reducedMotion } = usePreferences();
  const showIndex = items.length >= 3;
  const sectionHref = (id) => `${href}?section=${id.slice(4)}`;

  useLayoutEffect(() => {
    setItems(
      [...body.current.querySelectorAll("[data-reference-section]")].map(
        ({ id, dataset }) => ({ id, label: dataset.referenceSection }),
      ),
    );
  }, [content]);

  useEffect(() => {
    const id = `ref-${section}`;
    if (!items.some((item) => item.id === id)) return;
    let mounted = true;
    document.fonts.ready.then(() => {
      if (mounted) {
        document
          .getElementById(id)
          ?.scrollIntoView({ block: "start", behavior: "instant" });
        setActive(id);
      }
    });
    return () => {
      mounted = false;
    };
  }, [section, items]);

  function move(event, id) {
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return;
    const target = document.getElementById(id);
    if (!target) return;
    event.preventDefault();
    event.currentTarget.closest("details")?.removeAttribute("open");
    history.replaceState(history.state, "", sectionHref(id));
    target.firstElementChild.focus({ preventScroll: true });
    target.scrollIntoView({
      block: "start",
      behavior: reducedMotion ? "instant" : "smooth",
    });
    setActive(id);
  }

  const contents = { items, active, sectionHref, onMove: move };
  return (
    <div className="reference-body" data-contents={showIndex || undefined}>
      <div className="reference-body-content">
        {showIndex && <ReferenceContents {...contents} />}
        <div ref={body}>{children}</div>
      </div>
      {showIndex && <ReferenceContents {...contents} rail />}
    </div>
  );
}
