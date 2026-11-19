import React, { useCallback, useLayoutEffect, useRef } from "react";
import gsap from "gsap";

export default function Entrance({ ready, paused, onComplete }) {
  const root = useRef();
  const timeline = useRef();
  const events = useRef();
  const finished = useRef(false);
  const complete = useRef(onComplete);
  complete.current = onComplete;

  const finish = useCallback(() => {
    if (finished.current) return;
    finished.current = true;
    timeline.current?.kill();
    events.current?.abort();
    root.current.hidden = true;
    complete.current?.();
  }, []);

  useLayoutEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    if (media.matches) {
      finish();
      return;
    }
    const abort = new AbortController();
    events.current = abort;
    const skip = (event) => {
      if (
        event.type !== "keydown" ||
        ["Tab", "Escape", "PageDown", "End", "ArrowDown", " "].includes(
          event.key,
        )
      )
        finish();
    };
    const options = { passive: true, signal: abort.signal };
    window.addEventListener("wheel", skip, options);
    window.addEventListener("touchstart", skip, options);
    window.addEventListener("keydown", skip, { signal: abort.signal });
    media.addEventListener("change", finish, { signal: abort.signal });
    return () => abort.abort();
  }, [finish]);

  useLayoutEffect(() => {
    if (finished.current || (!ready && !paused)) return;
    if (paused || window.scrollY > 40) {
      finish();
      return;
    }
    const node = root.current;
    const sequence = gsap.timeline({ onComplete: finish });
    timeline.current = sequence;
    sequence
      .fromTo(
        node.querySelector(".entry-seam"),
        { scaleY: 0, opacity: 0 },
        { scaleY: 1, opacity: 0.6, duration: 0.32, ease: "power2.out" },
      )
      .to(
        node.querySelector(".entry-seam"),
        { opacity: 0, duration: 0.16 },
        0.28,
      )
      .to(
        node.querySelector(".entry-shutter-left"),
        { xPercent: -105, duration: 1.12, ease: "expo.inOut" },
        0.14,
      )
      .to(
        node.querySelector(".entry-shutter-right"),
        { xPercent: 105, duration: 1.12, ease: "expo.inOut" },
        0.19,
      );
    return () => sequence.kill();
  }, [ready, paused, finish]);

  return (
    <div className="home-entry" ref={root} aria-hidden="true">
      <div className="entry-shutter entry-shutter-left" />
      <div className="entry-shutter entry-shutter-right" />
      <div className="entry-seam" />
    </div>
  );
}
