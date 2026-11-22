import React, { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

export default function ChoiceMenu({ label, value, options, onChange }) {
  const id = useId();
  const root = useRef(null);
  const list = useRef(null);
  const typing = useRef({ text: "", time: 0 });
  const [menu, setMenu] = useState(null);
  const [active, setActive] = useState(0);
  const selected = Math.max(
    0,
    options.findIndex(([key]) => key === value),
  );

  function open(index = selected) {
    const bounds = root.current.getBoundingClientRect();
    const dialog = root.current.closest("dialog")?.getBoundingClientRect();
    const visible = window.visualViewport;
    const top = Math.max(dialog?.top ?? 0, visible?.offsetTop ?? 0);
    const viewportBottom = visible
      ? visible.offsetTop + visible.height
      : window.innerHeight;
    const above = bounds.top - top - 12;
    const below =
      Math.min(dialog?.bottom ?? viewportBottom, viewportBottom) -
      bounds.bottom -
      12;
    const up = below < 175 && above > below;
    setActive(index);
    setMenu({ up, height: Math.max(64, Math.min(292, up ? above : below)) });
  }

  function choose(index) {
    setMenu(null);
    if (options[index]) onChange(options[index][0]);
  }

  useEffect(() => {
    if (!menu) return;
    function outside(event) {
      if (!root.current?.contains(event.target)) setMenu(null);
    }
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [menu]);

  useEffect(() => {
    if (!menu) return;
    const option = list.current?.children[active];
    if (option) {
      const box = list.current;
      if (option.offsetTop < box.scrollTop) box.scrollTop = option.offsetTop;
      else if (
        option.offsetTop + option.offsetHeight >
        box.scrollTop + box.clientHeight
      )
        box.scrollTop =
          option.offsetTop + option.offsetHeight - box.clientHeight;
    }
  }, [active, menu]);

  function keys(event) {
    if (event.key === "Tab") {
      if (menu) choose(active);
      return;
    }
    if (event.key === "Escape" && menu) {
      event.preventDefault();
      event.stopPropagation();
      setMenu(null);
      return;
    }
    if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
      event.preventDefault();
      const index =
        event.key === "Home"
          ? 0
          : event.key === "End"
            ? options.length - 1
            : Math.max(
                0,
                Math.min(
                  options.length - 1,
                  (menu ? active : selected) +
                    (event.key === "ArrowDown" ? 1 : -1),
                ),
              );
      if (menu) setActive(index);
      else open(index);
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (menu) choose(active);
      else open();
      return;
    }
    if (
      event.key.length !== 1 ||
      event.metaKey ||
      event.ctrlKey ||
      event.altKey
    )
      return;
    event.preventDefault();
    const time = performance.now();
    const character = event.key.toLocaleLowerCase("es");
    const prefix =
      time - typing.current.time < 550
        ? typing.current.text + character
        : character;
    const match = options.findIndex(([, title]) =>
      title.toLocaleLowerCase("es").startsWith(prefix),
    );
    typing.current = { text: prefix, time };
    if (match < 0) return;
    if (menu) setActive(match);
    else open(match);
  }

  return (
    <div
      className="choice-menu"
      ref={root}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setMenu(null);
      }}
    >
      <button
        type="button"
        className="choice-trigger"
        role="combobox"
        aria-label={label}
        aria-expanded={Boolean(menu)}
        aria-controls={id}
        aria-activedescendant={menu ? `${id}-${active}` : undefined}
        onClick={(event) => {
          event.currentTarget.focus({ preventScroll: true });
          if (menu) setMenu(null);
          else open();
        }}
        onKeyDown={keys}
      >
        <span>{options[selected]?.[1]}</span>
        <ChevronDown size={15} aria-hidden="true" />
      </button>
      <ul
        id={id}
        ref={list}
        className="choice-options"
        role="listbox"
        aria-label={label}
        data-up={menu?.up || undefined}
        hidden={!menu}
        style={menu ? { maxHeight: menu.height } : undefined}
      >
        {options.map(([key, title], index) => (
          <li
            id={`${id}-${index}`}
            key={key}
            role="option"
            aria-selected={key === value}
            data-active={menu && index === active ? true : undefined}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => choose(index)}
          >
            <span>{title}</span>
            {key === value && <Check size={15} aria-hidden="true" />}
          </li>
        ))}
      </ul>
    </div>
  );
}
