import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  easePointer,
  insetRadii,
  nearestNavigationItem,
} from "../motion/pointerMotion.js";

const dotRadii = Array(8).fill(4);
const inset = 2;
const insetMotion = (value) => Math.max(-1, Math.min(1, value * 0.035));

export default function NativePointer({
  onScenePoint,
  route,
  withinDialog = false,
}) {
  const outline = useRef(),
    recheckOnRoute = useRef(null),
    callback = useRef(onScenePoint);
  callback.current = onScenePoint;
  useEffect(() => {
    const ring = outline.current,
      root = document.documentElement;
    const media = matchMedia(
      "(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)",
    );
    const scope = withinDialog
      ? ".search-dialog[open]"
      : ".main-content,.home-navigation,.home-footer";
    const controls =
      ".home-navigation-links a,.home-navigation-tools > *,[aria-pressed],[role=combobox],[role=option],[role=tab]";
    let x = 0,
      y = 0,
      px = 0,
      py = 0,
      width = 7,
      height = 7,
      radius = dotRadii,
      blend = 0,
      frame = 0,
      last = 0,
      lastPick = 0,
      known = false,
      under = null,
      target = null,
      rect = null,
      shape = dotRadii,
      bordered = false,
      plainLink = false,
      refresh = false,
      point = false,
      scene = false,
      pressed = false,
      mode = "dot";
    const excluded =
      "input,textarea,select,[contenteditable=true],iframe,pre,button:disabled,[aria-disabled=true],[data-native-pointer]";
    function hide() {
      cancelAnimationFrame(frame);
      frame = 0;
      last = 0;
      known = false;
      under = target = rect = null;
      blend = 0;
      width = height = 7;
      radius = dotRadii;
      pressed = false;
      ring.hidden = true;
      root.classList.remove("vcode-pointer-active");
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
        target = rect = null;
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
        "a[href],button:not(:disabled),summary,[role=button],[role=option]",
      );
      const nav = !next && under.closest(".home-navigation-links");
      if (nav) {
        const links = [...nav.querySelectorAll("a")];
        const index = nearestNavigationItem(
          links.map((link) => link.getBoundingClientRect()),
          x,
          y,
        );
        next = links[index] || null;
      }
      if (next !== target || !rect) {
        target = next;
        rect = target?.getBoundingClientRect() || null;
        if (target) {
          const style = getComputedStyle(target);
          const corners = [
            style.borderTopLeftRadius,
            style.borderTopRightRadius,
            style.borderBottomRightRadius,
            style.borderBottomLeftRadius,
          ];
          plainLink =
            target.matches("a") &&
            (style.display === "inline" ||
              (corners.every((corner) => Number.parseFloat(corner) === 0) &&
                Number.parseFloat(style.paddingInlineStart) +
                  Number.parseFloat(style.paddingInlineEnd) <
                  8));
          shape = insetRadii(corners, rect.width, rect.height, inset);
          bordered = [
            style.borderTopWidth,
            style.borderRightWidth,
            style.borderBottomWidth,
            style.borderLeftWidth,
          ].some((width) => Number.parseFloat(width) > 0);
        }
      }
      const calm =
        target &&
        (plainLink ||
          target.closest(
            ".learn-card,.docs-entry-list,.home-tool-card,.tool-resource,[data-pointer-dot]",
          ));
      const magnet =
        !calm &&
        rect &&
        rect.width > 2 * inset &&
        rect.height > 2 * inset &&
        rect.height <= 72 &&
        (rect.width <= 220 ||
          target.matches(".choice-options [role=option],[role=combobox]")) &&
        (!target.closest(".language-explorer") || target.matches("[role=tab]"));
      const nextMode = magnet ? "magnet" : target && !calm ? "bubble" : "dot";
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
      const origin = withinDialog
        ? ring.parentElement.getBoundingClientRect()
        : null;
      if (
        origin &&
        (x < origin.left ||
          x > origin.right ||
          y < origin.top ||
          y > origin.bottom)
      ) {
        hide();
        return;
      }
      const cx = magnet ? rect.left + rect.width / 2 : x;
      const cy = magnet ? rect.top + rect.height / 2 : y;
      const tx = cx + (magnet ? insetMotion(x - cx) : 0);
      const ty = cy + (magnet ? insetMotion(y - cy) : 0);
      const scale = pressed ? 0.94 : 1;
      const tw =
        (magnet ? rect.width - 2 * inset : nextMode === "bubble" ? 22 : 7) *
        scale;
      const th =
        (magnet ? rect.height - 2 * inset : nextMode === "bubble" ? 22 : 7) *
        scale;
      const targetRadius = magnet ? shape : Array(8).fill(th / 2);
      blend = easePointer(blend, magnet ? 1 : 0, dt, 45);
      px =
        first || (!magnet && blend < 0.02)
          ? tx
          : easePointer(px, tx, dt, magnet ? 42 : 18);
      py =
        first || (!magnet && blend < 0.02)
          ? ty
          : easePointer(py, ty, dt, magnet ? 42 : 18);
      width = first ? tw : easePointer(width, tw, dt, 64);
      height = first ? th : easePointer(height, th, dt, 64);
      radius = first
        ? targetRadius
        : radius.map((value, i) => easePointer(value, targetRadius[i], dt, 64));
      mode = nextMode;
      ring.dataset.mode = mode;
      ring.dataset.pressed = String(pressed);
      ring.toggleAttribute(
        "data-tab",
        magnet && target.matches(".language-tabs > button"),
      );
      ring.toggleAttribute(
        "data-bordered",
        magnet && (bordered || target.matches(":focus-visible")),
      );
      ring.style.transform = `translate3d(${px - (origin?.left || 0)}px,${py - (origin?.top || 0)}px,0) translate(-50%,-50%)`;
      ring.style.width = `${width}px`;
      ring.style.height = `${height}px`;
      const corners = radius.map((value) => `${value.toFixed(2)}px`);
      ring.style.borderRadius = `${corners.slice(0, 4).join(" ")} / ${corners.slice(4).join(" ")}`;
      last = now;
      if (
        point ||
        Math.abs(width - tw) +
          Math.abs(height - th) +
          Math.abs(px - tx) +
          Math.abs(py - ty) >
          0.15 ||
        radius.some((value, i) => Math.abs(value - targetRadius[i]) > 0.15) ||
        Math.abs(blend - (magnet ? 1 : 0)) > 0.01
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

      if (!withinDialog && !ring.hidden && mode === "dot" && blend < 0.02) {
        px = x;
        py = y;
        ring.style.transform = `translate3d(${x}px,${y}px,0) translate(-50%,-50%)`;
      }
      schedule();
    }
    function recheck() {
      refresh = true;
      rect = null;
      point = known;
      if (known) schedule();
    }
    recheckOnRoute.current = recheck;
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
      if (event.target.closest(excluded) || !event.target.closest(scope))
        hide();
    }
    function key(event) {
      if (
        event.key === "Tab" ||
        event.key === "Escape" ||
        (event.target.closest(controls) &&
          ["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key))
      )
        hide();
    }
    document.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerdown", down, { passive: true });
    document.addEventListener("pointerup", up, { passive: true });
    root.addEventListener("pointerleave", leave);
    document.addEventListener("keydown", key, true);
    document.addEventListener("focusin", focus);
    document.addEventListener("contextmenu", hide);
    document.addEventListener("visibilitychange", hide);
    window.addEventListener("blur", hide);
    window.addEventListener("scroll", recheck, {
      passive: true,
      capture: true,
    });
    window.addEventListener("resize", recheck);
    media.addEventListener("change", hide);
    return () => {
      alive = false;
      recheckOnRoute.current = null;
      hide();
      document.removeEventListener("pointermove", move);
      document.removeEventListener("pointerdown", down);
      document.removeEventListener("pointerup", up);
      root.removeEventListener("pointerleave", leave);
      document.removeEventListener("keydown", key, true);
      document.removeEventListener("focusin", focus);
      document.removeEventListener("contextmenu", hide);
      document.removeEventListener("visibilitychange", hide);
      window.removeEventListener("blur", hide);
      window.removeEventListener("scroll", recheck, true);
      window.removeEventListener("resize", recheck);
      media.removeEventListener("change", hide);
    };
  }, [withinDialog]);
  useEffect(() => {
    recheckOnRoute.current?.();
  }, [route]);
  const layer = (
    <div
      className="vcode-pointer-layer"
      data-dialog={withinDialog || undefined}
      aria-hidden="true"
    >
      <div ref={outline} className="vcode-pointer-outline" hidden />
    </div>
  );
  return withinDialog ? layer : createPortal(layer, document.body);
}
