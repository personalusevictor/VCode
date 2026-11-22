import React, {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import Header from "./Header";
import NativePointer from "../home/components/NativePointer";
import ContourBackground from "../home/scene/ContourBackground";
import loadChromeMark from "../home/scene/loadChromeMark";
import Entrance from "../home/motion/Entrance";
import Footer from "./Footer";

import ErrorBoundary from "./ErrorBoundary";
import { workspaceNames } from "../workspace/routes";
import { courses } from "../lib/catalog";

import { usePreferences } from "./Preferences";
import { readRoute, isHomeRoute } from "./routes";
import { parseDocumentationRoute } from "../docs/routes";
import { setPageTitle } from "./pageTitle";
const SearchDialog = lazy(() => import("./SearchDialog"));
const Home = lazy(() => {
  loadChromeMark().catch(() => {});
  return import("../home/Home");
});
const Workspace = lazy(() => import("../workspace/Workspace"));
const Documentation = lazy(() => import("../docs/Documentation"));

export default function App() {
  const [route, setRoute] = useState(readRoute);
  const [search, setSearch] = useState(false);
  const [scenePending, setScenePending] = useState(() =>
    isHomeRoute(readRoute()),
  );
  const { motionPaused, searchShortcut } = usePreferences();
  const main = useRef();
  const ambient = useRef();
  const scenePointer = useRef(null);
  const aimAtScene = useCallback((point) => scenePointer.current?.(point), []);
  const setAmbient = useCallback((opacity) => {
    ambient.current?.style.setProperty("--ambient-strength", opacity);
  }, []);
  const isHome = isHomeRoute(route);
  const isDocumentation = Boolean(parseDocumentationRoute(route));
  const present = useCallback(() => setScenePending(false), []);

  function openSearch(event) {
    event.currentTarget.focus({ preventScroll: true });
    setSearch(true);
  }

  useEffect(() => {
    const navigate = () => {
      const next = readRoute();
      setRoute(next);
      setSearch(false);
      setScenePending(isHomeRoute(next));
      if (isHomeRoute(next)) setAmbient(1);
      window.scrollTo({ top: 0, behavior: "instant" });
    };
    window.addEventListener("hashchange", navigate);
    return () => window.removeEventListener("hashchange", navigate);
  }, [setAmbient]);

  useEffect(() => {
    if (!searchShortcut || search) return;
    function openWithSlash(event) {
      if (
        event.key !== "/" ||
        event.defaultPrevented ||
        event.isComposing ||
        event.repeat ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey
      )
        return;
      const target = event.target;
      if (
        target instanceof Element &&
        (target.isContentEditable ||
          target.closest(
            "input, textarea, select, [role=textbox], [role=combobox], .cm-editor",
          ))
      )
        return;
      event.preventDefault();
      setSearch(true);
    }
    window.addEventListener("keydown", openWithSlash);
    return () => window.removeEventListener("keydown", openWithSlash);
  }, [search, searchShortcut]);

  useLayoutEffect(() => {
    const type = parseDocumentationRoute(route)?.type;
    const [page, language] = route.split("?")[0].split("/");
    const name = courses.find(({ id }) => id === language)?.name;
    let title = Object.hasOwn(workspaceNames, page)
      ? workspaceNames[page]
      : "Página no encontrada";
    if (isHome) title = "Inicio";
    else if (type === "index") title = "Buscar";
    else if (type === "guide") title = "Lección";
    else if (type) title = "Referencia";
    else if (page === "course")
      title = name ? `Curso de ${name}` : "Página no encontrada";
    else if (name && page === "practice") title = `Práctica de ${name}`;
    else if (name && page === "projects") title = `Proyecto de ${name}`;
    setPageTitle(title);
  }, [isHome, route]);

  useEffect(() => {
    main.current?.focus({ preventScroll: true });
  }, [route]);

  return (
    <>
      <div
        ref={ambient}
        className="site-ambient"
        data-home={isHome}
        aria-hidden="true"
      >
        <ContourBackground
          paused={motionPaused || search || (isHome && scenePending)}
        />
      </div>
      {!search && <NativePointer onScenePoint={aimAtScene} route={route} />}
      <a
        className="skip-link"
        href="#main-content"
        onClick={(event) => {
          event.preventDefault();
          main.current?.focus();
        }}
      >
        Ir al contenido
      </a>
      <Header onSearch={openSearch} route={route} />
      {isHome && (
        <Entrance key={route} ready={!scenePending} paused={motionPaused} />
      )}
      <main
        id="main-content"
        ref={main}
        tabIndex={-1}
        className={`main-content ${isHome ? "page-home" : isDocumentation ? "page-docs" : "page-workspace"}`}
      >
        <ErrorBoundary route={route} onError={isHome ? present : undefined}>
          <Suspense
            fallback={
              isHome ? (
                <div className="home-loading-space" aria-hidden="true" />
              ) : (
                <div className="docs-loading" role="status">
                  Abriendo VCode…
                </div>
              )
            }
          >
            {isHome ? (
              <Home
                key={route}
                motionPaused={motionPaused || search}
                onPresented={present}
                onAmbient={setAmbient}
                scenePointer={scenePointer}
              />
            ) : isDocumentation ? (
              <Documentation key={route} route={route} />
            ) : (
              <Workspace key={route} route={route} />
            )}
          </Suspense>
        </ErrorBoundary>
      </main>
      <Footer onSearch={openSearch} />
      {search && (
        <Suspense fallback={null}>
          <SearchDialog onClose={() => setSearch(false)} />
        </Suspense>
      )}
    </>
  );
}
