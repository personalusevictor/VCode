import React, {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import NativePointer from "../components/NativePointer.jsx";
import LanguageExplorer from "./LanguageExplorer.jsx";
import { advanceStory, brandPose, smoother } from "../motion/brandMotion.js";
const ChromeMark = lazy(() => import("../scene/ChromeMark.jsx"));
gsap.registerPlugin(ScrollTrigger);
export default function ChromeStory({
  motionPaused = false,
  onProgress,
  onPresented,
}) {
  const [staticScene, setStaticScene] = useState(false);
  const [presented, setPresented] = useState(false);
  const root = useRef(),
    controller = useRef(),
    latest = useRef(0);
  const ready = useCallback((api) => {
    controller.current = api;
    api?.update(latest.current);
  }, []);
  const showPoster = useCallback(() => {
    setStaticScene(true);
    onPresented?.();
  }, [onPresented]);
  const scenePresented = useCallback(() => {
    setPresented(true);
    onPresented?.();
  }, [onPresented]);
  useEffect(() => {
    const node = root.current,
      explorer = node.querySelector(".story-explorer");
    function update(p, accessibleFlow = false) {
      latest.current = p;
      onProgress?.(p);
      node.toggleAttribute("data-atmosphere-hidden", p >= 0.8);
      const turn = brandPose(p).rotationY + 0.22;
      node.style.setProperty(
        "--scene-presence",
        1 - smoother((p - 0.48) / 0.32),
      );
      node.style.setProperty("--scene-light-x", `${Math.sin(turn) * 42}px`);
      node.style.setProperty(
        "--scene-light-y",
        `${-smoother((p - 0.4) / 0.4) * 60}px`,
      );
      node.style.setProperty(
        "--scene-shadow-width",
        0.65 + Math.abs(Math.cos(turn - 0.22)) * 0.35,
      );
      controller.current?.update(p);
      const entered = accessibleFlow ? 1 : smoother((p - 0.83) / 0.15);
      explorer.style.opacity = entered;
      explorer.style.transform = `translate(-50%, ${18 * (1 - entered)}px)`;
      explorer.style.visibility = entered > 0.001 ? "visible" : "hidden";
      explorer.inert = entered < 0.8;
      explorer.setAttribute("aria-hidden", String(entered < 0.8));
    }
    let alive = true;
    document.fonts.ready.then(() => {
      if (alive) ScrollTrigger.refresh();
    });
    if (staticScene) {
      update(0, true);
      ScrollTrigger.refresh();
      return () => {
        alive = false;
      };
    }
    const media = gsap.matchMedia();
    media.add(
      { all: "all", reduce: "(prefers-reduced-motion: reduce)" },
      (context) => {
        if (context.conditions.reduce) {
          update(0, true);
          return;
        }
        let frame = 0,
          previous = 0,
          current = 0,
          target = 0;
        function tick(now) {
          frame = 0;
          const seconds = previous ? (now - previous) / 1000 : 1 / 60;
          previous = now;
          current = advanceStory(current, target, seconds);
          if (Math.abs(current - target) < 0.0001) current = target;
          update(current);
          if (current !== target) frame = requestAnimationFrame(tick);
          else previous = 0;
        }
        function schedule() {
          if (!frame && !document.hidden) frame = requestAnimationFrame(tick);
        }
        const trigger = ScrollTrigger.create({
          trigger: node,
          start: "top top",
          end: "bottom bottom",
          invalidateOnRefresh: true,
          onUpdate(self) {
            target = self.progress;
            schedule();
          },
          onRefresh(self) {
            target = self.progress;
            schedule();
          },
        });
        current = target = trigger.progress;
        update(current);
        function visibility() {
          if (document.hidden) {
            cancelAnimationFrame(frame);
            frame = 0;
            previous = 0;
          } else schedule();
        }
        document.addEventListener("visibilitychange", visibility);
        return () => {
          cancelAnimationFrame(frame);
          trigger.kill();
          document.removeEventListener("visibilitychange", visibility);
        };
      },
    );
    return () => {
      alive = false;
      media.revert();
    };
  }, [staticScene, onProgress]);
  return (
    <section
      className={`chrome-story ${motionPaused ? "is-motion-paused" : ""} ${staticScene ? "is-static" : ""} ${presented ? "is-presented" : ""}`}
      ref={root}
      aria-label="Presentación de VCode"
    >
      <NativePointer
        onScenePoint={(point) => controller.current?.point(point)}
      />
      <div className="story-stage">
        <h1 className="sr-only">
          VCode. Aprende y consulta lenguajes de programación.
        </h1>
        <div className="story-atmosphere" aria-hidden="true">
          <div className="story-atmosphere-content">
            <div className="story-aura" />
            <div className="story-floor" />
            <div className="story-ground-shadow" />
          </div>
        </div>
        <div className="story-model">
          <Suspense fallback={null}>
            <ChromeMark
              paused={motionPaused}
              onReady={ready}
              onFallback={showPoster}
              onPresented={scenePresented}
            />
          </Suspense>
        </div>
        <div className="story-explorer" inert aria-hidden="true">
          <LanguageExplorer paused={motionPaused} />
        </div>
      </div>
    </section>
  );
}
