import React, { useEffect, useRef, useState } from "react";
import {
  Search as SearchIcon,
  Sun,
  Moon,
  Folder,
  Settings2,
} from "lucide-react";
import { Mark } from "./Brand";
import { usePreferences } from "./Preferences";

const navigation = [
  {
    href: "#courses",
    label: "Aprender",
    routes: /^(courses|course|lesson|practice|projects|paths)([/?]|$)/,
  },
  {
    href: "#docs",
    label: "Buscar",
    routes: /^(docs|reference|symbol)([/?]|$)/,
  },
  {
    href: "#playground",
    label: "Laboratorio",
    routes: /^(playground|studio)([/?]|$)/,
  },
];

export default function Header({ onSearch, route }) {
  const [settings, setSettings] = useState(false);
  const {
    theme,
    setTheme,
    motionPaused,
    setMotionPaused,
    reducedMotion,
    searchShortcut,
    setSearchShortcut,
  } = usePreferences();
  const settingsTrigger = useRef();
  const settingsPanel = useRef();
  const root = useRef();

  useEffect(() => {
    setSettings(false);
  }, [route]);
  useEffect(() => {
    const close = (event) => {
      if (!root.current?.contains(event.target)) setSettings(false);
    };
    const escape = (event) => {
      if (event.key !== "Escape") return;
      if (settings) settingsTrigger.current?.focus();
      setSettings(false);
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", escape);
    };
  }, [settings]);
  useEffect(() => {
    if (settings) settingsPanel.current?.querySelector("button")?.focus();
  }, [settings]);

  const openSearch = (event) => {
    setSettings(false);
    onSearch(event);
  };
  return (
    <header
      ref={root}
      className="home-navigation"
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
          {navigation.map(({ href, label, routes }) => (
            <a
              key={href}
              href={href}
              draggable={false}
              aria-current={routes.test(route) ? "page" : undefined}
            >
              {label}
            </a>
          ))}
        </nav>
        <div className="home-navigation-tools">
          <button
            className="home-quick-search"
            aria-label="Buscar en todo VCode"
            aria-keyshortcuts={searchShortcut ? "/" : undefined}
            title={searchShortcut ? "Búsqueda rápida · /" : "Búsqueda rápida"}
            onClick={openSearch}
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
            onClick={() => setSettings((value) => !value)}
          >
            <Settings2 size={17} />
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
          <div className="settings-group settings-motion-group">
            <button
              className="settings-motion-switch"
              role="switch"
              aria-label="Atajo de búsqueda"
              aria-checked={searchShortcut}
              onClick={() => setSearchShortcut((value) => !value)}
            >
              <span>
                <span className="settings-label">Atajo de búsqueda</span>
                <span className="settings-value">
                  {searchShortcut ? "Pulsa / para buscar" : "Desactivado"}
                </span>
              </span>
              <span className="settings-switch-track" aria-hidden="true">
                <span />
              </span>
            </button>
          </div>
        </section>
      )}
    </header>
  );
}
