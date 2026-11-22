import React, { useEffect, useState } from "react";
import { Mark } from "../../app/Brand";

export default function Entrance({ ready, paused }) {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const waiting = !ready && !dismissed;

  useEffect(() => {
    if (!waiting) return;
    const timer = window.setTimeout(() => setVisible(true), 160);
    const skipOnScroll = () => {
      if (window.scrollY > 40) setDismissed(true);
    };
    const skipOnKey = (event) => {
      if (event.key === "Escape") setDismissed(true);
    };
    skipOnScroll();
    window.addEventListener("scroll", skipOnScroll, { passive: true });
    window.addEventListener("keydown", skipOnKey);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("scroll", skipOnScroll);
      window.removeEventListener("keydown", skipOnKey);
    };
  }, [waiting]);

  const show = waiting && visible;
  const message = "Preparando la escena 3D…";
  return (
    <>
      <div className="sr-only" role="status">
        {show ? message : ""}
      </div>
      <div
        className="home-entry"
        data-visible={show || undefined}
        data-paused={paused || undefined}
        data-ready={(ready && visible && !dismissed) || undefined}
        aria-hidden="true"
      >
        <div className="entry-emblem">
          <Mark className="entry-track" />
          <Mark className="entry-fill" />
        </div>
        <p>{message}</p>
      </div>
    </>
  );
}
