import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";

const groups = [
  {
    selector: ".home-library",
    items: [
      ".library-emblem",
      ".library-console > h2 .reveal-word",
      ".library-searchbar",
      ".library-refiners",
      ".library-index",
    ],
  },
  {
    selector: ".home-toolkit",
    items: ["h2 .reveal-word", ".toolkit-lab", ".toolkit-companions > a"],
  },
  {
    selector: ".home-practical",
    items: [".brand-heading svg > g > *", "details"],
  },
];

export default function useSectionReveals(root, paused) {
  const revealed = useRef(new WeakSet());
  useLayoutEffect(() => {
    const media = gsap.matchMedia();
    media.add(
      "(prefers-reduced-motion: no-preference)",
      () => {
        if (paused) return;
        const context = gsap.context(() => {
          const animations = new Map();
          const observer = new IntersectionObserver(
            (entries) => {
              entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                revealed.current.add(entry.target);
                const timeline = animations.get(entry.target);
                timeline?.play();
                observer.unobserve(entry.target);
              });
            },
            { threshold: 0.12 },
          );

          groups.forEach(({ selector, items }) => {
            const section = root.current.querySelector(selector);
            if (!section || revealed.current.has(section)) return;
            const timeline = gsap.timeline({ paused: true });
            items.forEach((selector, index) => {
              const targets = section.querySelectorAll(selector);
              const words = selector.includes("reveal-word");
              const letters = selector.includes("svg");
              const emblem = selector.includes("emblem");
              timeline.from(
                targets,
                {
                  yPercent: words ? 115 : 0,
                  y: words ? 0 : letters ? 20 : 26,
                  rotation: words ? 4 : 0,
                  opacity: words ? 1 : 0,
                  scale: emblem ? 0.94 : 1,
                  clipPath: emblem ? "inset(0 100% 0 0)" : "inset(0 0% 0 0)",
                  duration: emblem ? 1.15 : letters ? 0.65 : 0.85,
                  stagger: words ? 0.065 : letters ? 0.018 : 0.09,
                  ease: "power3.out",
                  clearProps: "transform,opacity,clipPath",
                },
                index * 0.075,
              );
            });
            animations.set(section, timeline);
            observer.observe(section);
          });
          return () => {
            observer.disconnect();
            animations.forEach((timeline) => timeline.kill());
          };
        }, root);
        return () => context.revert();
      },
      root,
    );
    return () => media.revert();
  }, [root, paused]);
}
