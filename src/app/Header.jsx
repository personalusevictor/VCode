import React, { useEffect, useRef, useState } from "react";
import {
  Search as SearchIcon,
  Sun,
  Moon,
  X,
  ArrowUpRight,
  Folder,
  Settings2,
  MoreHorizontal,
} from "lucide-react";
import { Mark } from "./Brand";
import { usePreferences } from "./Preferences";

export default function Header({ onSearch, route, entering = false }) {
  const [menu, setMenu] = useState(false);
  const [settings, setSettings] = useState(false);
  const { theme, setTheme, motionPaused, setMotionPaused, reducedMotion } =
    usePreferences();
  const settingsTrigger = useRef();
  const settingsPanel = useRef();
  const homeMenuTrigger = useRef();
  const root = useRef();

  useEffect(() => {
    setMenu(false);
    setSettings(false);
  }, [route]);
  useEffect(() => {
    const close = (event) => {
      if (!root.current?.contains(event.target)) {
        setMenu(false);
        setSettings(false);
      }
    };
    const escape = (event) => {
      if (event.key !== "Escape") return;
      if (settings) settingsTrigger.current?.focus();
      if (menu) homeMenuTrigger.current?.focus();
      setSettings(false);
      setMenu(false);
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", escape);
    };
  }, [menu, settings]);
  useEffect(() => {
    if (settings) settingsPanel.current?.querySelector("button")?.focus();
    if (menu)
      document
        .getElementById("home-navigation-menu")
        ?.querySelector("a")
        ?.focus();
  }, [settings, menu]);

  const openSearch = () => {
    setSettings(false);
    setMenu(false);
    onSearch();
  };
  return (
    <header
      ref={root}
      className={`home-navigation ${entering ? "is-entering" : ""}`}
      aria-label="Navegación VCode"
    >
      <div className="home-navigation-bar">
        <a
          className="home-wordmark"
          href="#home"
          aria-label="VCode · Inicio"
          onClick={(event) => {
            if (location.hash && location.hash !== "#home") return;
            event.preventDefault();
            setMenu(false);
            setSettings(false);
            window.scrollTo({
              top: 0,
              behavior: reducedMotion ? "instant" : "smooth",
            });
          }}
        >
          <Mark />
        </a>
        <nav
          className="home-navigation-links"
          aria-label="Navegación principal"
        >
          {[
            ["courses", "Lenguajes"],
            ["docs", "Consultar"],
            ["studio", "Estudio"],
            ["projects", "Proyectos"],
          ].map(([id, label]) => (
            <a
              key={id}
              href={`#${id}`}
              draggable={false}
              aria-current={
                id === "docs" && /^(docs|reference|lesson)(\/|$)/.test(route)
                  ? "page"
                  : undefined
              }
            >
              {label}
            </a>
          ))}
        </nav>
        <div className="home-navigation-tools">
          <button
            aria-label="Buscar en todo VCode"
            title="Buscar · ⌘K"
            onClick={() => {
              setSettings(false);
              setMenu(false);
              openSearch();
            }}
          >
            <SearchIcon size={17} />
          </button>
          <a href="#progress" aria-label="Mi archivo" title="Mi archivo">
            <Folder size={17} />
          </a>
          <button
            ref={settingsTrigger}
            aria-label="Configuración"
            title="Configuración"
            aria-expanded={settings}
            aria-controls="home-settings"
            onClick={() => {
              setMenu(false);
              setSettings((value) => !value);
            }}
          >
            <Settings2 size={17} />
          </button>
          <button
            ref={homeMenuTrigger}
            aria-label={menu ? "Cerrar navegación" : "Más páginas"}
            title="Todas las páginas"
            aria-expanded={menu}
            aria-controls="home-navigation-menu"
            onClick={() => {
              setSettings(false);
              setMenu((value) => !value);
            }}
          >
            {menu ? <X size={18} /> : <MoreHorizontal size={20} />}
          </button>
        </div>
      </div>
      {settings && (
        <section
          className="home-settings-panel"
          id="home-settings"
          ref={settingsPanel}
          role="dialog"
          aria-modal="false"
          aria-labelledby="home-settings-title"
          onBlur={(event) => {
            if (
              event.relatedTarget &&
              !event.currentTarget.contains(event.relatedTarget) &&
              event.relatedTarget !== settingsTrigger.current
            )
              setSettings(false);
          }}
        >
          <h2 id="home-settings-title">Configuración</h2>
          <div className="settings-group">
            <span className="settings-label">Apariencia</span>
            <div
              className="settings-theme-options"
              role="group"
              aria-label="Apariencia"
            >
              <button
                aria-label="Modo claro"
                aria-pressed={theme === "light"}
                onClick={() => setTheme("light")}
              >
                <Sun size={16} />
                Claro
              </button>
              <button
                aria-label="Modo oscuro"
                aria-pressed={theme === "dark"}
                onClick={() => setTheme("dark")}
              >
                <Moon size={16} />
                Oscuro
              </button>
            </div>
          </div>
          <div className="settings-group settings-motion-group">
            <button
              className="settings-motion-switch"
              role="switch"
              aria-label="Animación de la escena"
              aria-checked={!motionPaused && !reducedMotion}
              disabled={reducedMotion}
              onClick={() => setMotionPaused((value) => !value)}
            >
              <span>
                <span className="settings-label">Animación de la escena</span>
                <span className="settings-value">
                  {reducedMotion
                    ? "Reducido por tu sistema"
                    : motionPaused
                      ? "En pausa"
                      : "Activo"}
                </span>
              </span>
              <span className="settings-switch-track" aria-hidden="true">
                <span />
              </span>
            </button>
          </div>
        </section>
      )}
      {menu && (
        <nav
          className="home-navigation-menu"
          id="home-navigation-menu"
          aria-label="Todas las páginas"
          onBlur={(event) => {
            if (
              event.relatedTarget &&
              !event.currentTarget.contains(event.relatedTarget) &&
              event.relatedTarget !== homeMenuTrigger.current
            )
              setMenu(false);
          }}
        >
          {[
            ["courses", "Lenguajes"],
            ["docs", "Consultar"],
            ["studio", "Estudio"],
            ["projects", "Proyectos"],
            ["playground", "Laboratorio"],
            ["practice", "Práctica"],
            ["resources", "Recursos"],
            ["contact", "Contacto"],
          ].map(([id, label]) => (
            <a href={`#${id}`} key={id}>
              {label}
              <ArrowUpRight size={14} />
            </a>
          ))}
        </nav>
      )}
    </header>
  );
}
