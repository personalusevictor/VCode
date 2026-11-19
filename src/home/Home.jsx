import React, { useCallback, useLayoutEffect, useRef, useState } from "react";
import ContourBackground from "./scene/ContourBackground.jsx";
import Essentials from "./sections/Essentials.jsx";
import Library from "./sections/Library.jsx";
import { smoother } from "./motion/brandMotion.js";
import ChromeStory from "./sections/ChromeStory.jsx";
import Entrance from "./motion/Entrance";
import useSectionReveals from "./motion/useSectionReveals";

export default function Home({ motionPaused = false, onPresented }) {
  const world = useRef();
  const [sceneReady, setSceneReady] = useState(false);
  const scenePresented = useCallback(() => setSceneReady(true), []);
  useSectionReveals(world, motionPaused);
  useLayoutEffect(() => {
    const node = world.current;
    const story = node.querySelector(".chrome-story");
    const stage = node.querySelector(".story-stage");
    const explorer = node.querySelector(".story-explorer");
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const measure = () => {
      const tail =
        reduced.matches || story.classList.contains("is-static")
          ? 0
          : Math.max(
              0,
              stage.clientHeight -
                explorer.offsetTop -
                explorer.offsetHeight -
                8,
            );
      node.style.setProperty("--story-tail", `${Math.round(tail)}px`);
    };
    const size = new ResizeObserver(measure);
    size.observe(stage);
    size.observe(explorer);
    const mode = new MutationObserver(measure);
    mode.observe(story, { attributes: true, attributeFilter: ["class"] });
    reduced.addEventListener("change", measure);
    measure();
    return () => {
      size.disconnect();
      mode.disconnect();
      reduced.removeEventListener("change", measure);
    };
  }, []);
  const progress = useCallback((p) => {
    world.current?.style.setProperty(
      "--home-wave-opacity",
      1 - 0.7 * smoother((p - 0.4) / 0.4),
    );
  }, []);
  return (
    <div className="home-world" ref={world}>
      <Entrance
        paused={motionPaused}
        ready={sceneReady}
        onComplete={onPresented}
      />
      <div className="home-ambient" aria-hidden="true">
        <ContourBackground paused={motionPaused} />
      </div>
      <ChromeStory
        motionPaused={motionPaused}
        onProgress={progress}
        onPresented={scenePresented}
      />
      <Library paused={motionPaused} />
      <Essentials />
    </div>
  );
}
