import React, {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import Header from "./Header";
import Footer from "./Footer";
import SearchDialog from "./SearchDialog";
import ErrorBoundary from "./ErrorBoundary";
import PlaceholderPage from "./PlaceholderPage";
import Home from "../home/Home";
import { usePreferences } from "./Preferences";
import { readRoute, isHomeRoute } from "./routes";
import { parseDocumentationRoute } from "../docs/routes";
import { knowledgeIndex } from "../lib/catalog";
const Documentation = lazy(() => import("../docs/Documentation"));

export default function App() {
  const [route, setRoute] = useState(readRoute);
  const [search, setSearch] = useState(false);
  const [entering, setEntering] = useState(() => isHomeRoute(readRoute()));
  const { motionPaused } = usePreferences();
  const main = useRef();
  const isHome = isHomeRoute(route);
  const isDocumentation = Boolean(parseDocumentationRoute(route));
  const present = useCallback(() => setEntering(false), []);

  useEffect(() => {
    const navigate = () => {
      const next = readRoute();
      setRoute(next);
      setSearch(false);
      setEntering(isHomeRoute(next));
      window.scrollTo({ top: 0, behavior: "instant" });
    };
    const shortcuts = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearch((open) => !open);
      }
    };
    window.addEventListener("hashchange", navigate);
    window.addEventListener("keydown", shortcuts);
    return () => {
      window.removeEventListener("hashchange", navigate);
      window.removeEventListener("keydown", shortcuts);
    };
  }, []);

  useEffect(() => {
    const entry = knowledgeIndex.find(
      (item) => item.href === `#${route.split("?")[0]}`,
    );
    document.title = `${isHome ? "El código, en tus manos" : isDocumentation ? entry?.title || "Consulta" : "Página provisional"} · VCode`;
    main.current?.focus({ preventScroll: true });
  }, [isHome, isDocumentation, route]);

  return (
    <>
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
      <Header
        onSearch={() => setSearch(true)}
        route={route}
        entering={isHome && entering}
      />
      <main
        id="main-content"
        ref={main}
        tabIndex={-1}
        className={`main-content ${isHome ? "page-home" : isDocumentation ? "page-docs" : "page-provisional"}`}
      >
        <ErrorBoundary route={route}>
          {isHome ? (
            <Home
              key={route}
              motionPaused={motionPaused || search}
              onPresented={present}
            />
          ) : isDocumentation ? (
            <Suspense
              fallback={
                <div className="docs-loading" role="status">
                  Abriendo la consulta…
                </div>
              }
            >
              <Documentation key={route} route={route} />
            </Suspense>
          ) : (
            <PlaceholderPage />
          )}
        </ErrorBoundary>
      </main>
      <Footer onSearch={() => setSearch(true)} />
      {search && <SearchDialog onClose={() => setSearch(false)} />}
    </>
  );
}
