import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { easePointer, nearestNavigationItem } from "../motion/pointerMotion.js";
export default function NativePointer({ onScenePoint }) {
  const outline = useRef(),
    callback = useRef(onScenePoint);
  callback.current = onScenePoint;
  useEffect(() => {
    const ring = outline.current,
      root = document.documentElement;
    const media = matchMedia(
      "(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)",
    );
    const scope = ".home-world,.home-navigation,.home-footer";
    let x = 0,
      y = 0,
      px = 0,
      py = 0,
      width = 7,
      height = 7,
      radius = 4,
      blend = 0,
      frame = 0,
      last = 0,
      lastPick = 0,
      known = false,
      under = null,
      target = null,
      rect = null,
      group = null,
      items = [],
      rects = [],
      refresh = false,
      point = false,
      scene = false,
      pressed = false,
      mode = "dot";
    const excluded =
      "input,textarea,select,[contenteditable=true],iframe,pre,code,button:disabled,[aria-disabled=true]";
    function hide() {
      cancelAnimationFrame(frame);
      frame = 0;
      last = 0;
      known = false;
      under = target = rect = group = null;
      items = [];
      rects = [];
      blend = 0;
      width = height = 7;
      radius = 4;
      pressed = false;
      ring.hidden = true;
      root.classList.remove(
        "vcode-pointer-active",
        "vcode-pointer-magnet",
        "vcode-pointer-on-mark",
      );
      if (scene) callback.current?.(null);
      scene = false;
      ring.dataset.onMark = "false";
    }
    function schedule() {
      if (!frame) frame = requestAnimationFrame(paint);
    }
    function paint(now) {
      frame = 0;
      if (!media.matches || !known || document.hidden || !document.hasFocus()) {
        hide();
        return;
      }
      if (refresh) {
        under = document.elementFromPoint(x, y);
        target = rect = group = null;
        refresh = false;
      }
      if (
        !under?.closest(scope) ||
        under.closest(excluded) ||
        under.closest("[inert]")
      ) {
        hide();
        return;
      }
      let next = under.closest(
        "a[href],button:not(:disabled),summary,[role=button]",
      );
      const nav = under.closest(
        ".home-navigation-links,.home-navigation-tools",
      );
      if (nav) {
        if (group !== nav) {
          group = nav;
          items = [...nav.querySelectorAll("a[href],button:not(:disabled)")];
          rects = items.map((el) => el.getBoundingClientRect());
        }
        const index = nearestNavigationItem(rects, x, y);
        if (index >= 0) next = items[index];
      } else group = null;
      if (next !== target || !rect) {
        target = next;
        rect = target?.getBoundingClientRect() || null;
      }
      const small =
        rect &&
        rect.width <= 220 &&
        rect.height <= 65 &&
        !target.closest(".language-explorer");
      const nextMode = small ? "magnet" : target ? "bubble" : "dot";
      const inScene = Boolean(under.closest(".chrome-story"));
      if (point && now - lastPick >= 1000 / 30) {
        point = false;
        lastPick = now;
        const hit = inScene ? Boolean(callback.current?.({ x, y })) : false;
        if (!inScene && scene) callback.current?.(null);
        scene = inScene;
        ring.dataset.onMark = String(hit);
      }
      const first = ring.hidden,
        dt = last ? now - last : 16;
      ring.hidden = false;
      root.classList.add("vcode-pointer-active");
      const tx = small
        ? rect.left + rect.width / 2 + (x - rect.left - rect.width / 2) * 0.035
        : x;
      const ty = small
        ? rect.top + rect.height / 2 + (y - rect.top - rect.height / 2) * 0.035
        : y;
      const tw =
        (small ? rect.width + 6 : target ? 22 : 7) * (pressed ? 0.94 : 1);
      const th =
        (small ? rect.height + 4 : target ? 22 : 7) * (pressed ? 0.94 : 1);
      const tr =
        small && target.closest(".home-navigation-menu,.home-settings-panel")
          ? 10
          : th / 2;
      blend = easePointer(blend, small ? 1 : 0, dt, 45);
      px =
        first || (!small && blend < 0.02)
          ? x
          : easePointer(px, tx, dt, small ? 42 : 18);
      py =
        first || (!small && blend < 0.02)
          ? y
          : easePointer(py, ty, dt, small ? 42 : 18);
      width = first ? tw : easePointer(width, tw, dt, 70);
      height = first ? th : easePointer(height, th, dt, 70);
      radius = first ? tr : easePointer(radius, tr, dt, 70);
      mode = nextMode;
      ring.dataset.mode = mode;
      ring.dataset.pressed = String(pressed);
      ring.style.transform = `translate3d(${px}px,${py}px,0) translate(-50%,-50%)`;
      ring.style.width = `${width}px`;
      ring.style.height = `${height}px`;
      ring.style.borderRadius = `${radius}px`;
      last = now;
      if (
        point ||
        Math.abs(width - tw) +
          Math.abs(height - th) +
          Math.abs(radius - tr) +
          Math.abs(px - tx) +
          Math.abs(py - ty) >
          0.15 ||
        Math.abs(blend - (small ? 1 : 0)) > 0.01
      )
        schedule();
    }
    function move(event) {
      if (event.pointerType !== "mouse" || !media.matches) {
        hide();
        return;
      }
      x = event.clientX;
      y = event.clientY;
      under = event.target;
      known = true;
      point = true;

      if (!ring.hidden && mode !== "magnet" && blend < 0.02) {
        px = x;
        py = y;
        ring.style.transform = `translate3d(${x}px,${y}px,0) translate(-50%,-50%)`;
      }
      schedule();
    }
    function recheck() {
      refresh = true;
      rect = group = null;
      point = known;
      if (known) schedule();
    }
    let alive = true;
    document.fonts.ready.then(() => {
      if (alive) recheck();
    });
    function down() {
      pressed = true;
      if (known) schedule();
    }
    function up() {
      pressed = false;
      recheck();
    }
    function leave(event) {
      if (!event.relatedTarget) hide();
    }
    function focus(event) {
      if (
        event.target.closest(excluded) ||
        document.querySelector("dialog[open]")
      )
        hide();
    }
    function key(event) {
      if (event.key === "Tab" || event.key === "Escape") hide();
    }
    document.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerdown", down, { passive: true });
    document.addEventListener("pointerup", up, { passive: true });
    root.addEventListener("pointerleave", leave);
    document.addEventListener("keydown", key);
    document.addEventListener("focusin", focus);
    document.addEventListener("contextmenu", hide);
    document.addEventListener("visibilitychange", hide);
    window.addEventListener("blur", hide);
    window.addEventListener("scroll", recheck, { passive: true });
    window.addEventListener("resize", recheck);
    media.addEventListener("change", hide);
    return () => {
      alive = false;
      hide();
      document.removeEventListener("pointermove", move);
      document.removeEventListener("pointerdown", down);
      document.removeEventListener("pointerup", up);
      root.removeEventListener("pointerleave", leave);
      document.removeEventListener("keydown", key);
      document.removeEventListener("focusin", focus);
      document.removeEventListener("contextmenu", hide);
      document.removeEventListener("visibilitychange", hide);
      window.removeEventListener("blur", hide);
      window.removeEventListener("scroll", recheck);
      window.removeEventListener("resize", recheck);
      media.removeEventListener("change", hide);
    };
  }, []);
  return createPortal(
    <div className="vcode-pointer-layer" aria-hidden="true">
      <div ref={outline} className="vcode-pointer-outline" hidden />
    </div>,
    document.body,
  );
}
