import React from "react";
import { ArrowUp, Search, ArrowUpRight } from "lucide-react";
import { Mark } from "./Brand.jsx";
export default function Footer({ onSearch }) {
  const scrollTop = () =>
    window.scrollTo({
      top: 0,
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  return (
    <footer className="home-footer">
      <div className="home-footer-main">
        <div className="home-footer-signature">
          <a
            href="#home"
            aria-label="VCode · Inicio"
            onClick={(event) => {
              if (!location.hash || location.hash === "#home") {
                event.preventDefault();
                scrollTop();
              }
            }}
          >
            <Mark />
            <span>VCode</span>
          </a>
        </div>
        <nav aria-label="Aprender">
          <span>APRENDER</span>
          <a href="#courses">Lenguajes</a>
          <a href="#practice">Ejercicios</a>
        </nav>
        <nav aria-label="Buscar">
          <span>BUSCAR</span>
          <a href="#docs">Guías y referencias</a>
          <a href="#reference">Elementos HTML</a>
          <button onClick={onSearch}>
            <Search size={13} /> Búsqueda rápida
          </button>
        </nav>
        <nav aria-label="Herramientas">
          <span>HERRAMIENTAS</span>
          <a href="#playground">Laboratorio</a>
          <a href="#progress">Mi archivo</a>
        </nav>
        <nav aria-label="Información">
          <span>INFORMACIÓN</span>
          <a href="#resources">Fuentes y créditos</a>
          <a href="#contact">Contacto</a>
        </nav>
      </div>
      <div className="home-footer-bottom">
        <a
          className="footer-copyright"
          href="#home"
          onClick={(event) => {
            if (location.hash && location.hash !== "#home") return;
            event.preventDefault();
            scrollTop();
          }}
        >
          <Mark />
          <span>© {new Date().getFullYear()} VCode</span>
        </a>
        <nav className="footer-bottom-links" aria-label="Información de VCode">
          <a href="#resources">
            Fuentes y créditos <ArrowUpRight size={13} />
          </a>
          <a href="#contact">
            Contacto <ArrowUpRight size={13} />
          </a>
        </nav>
        <button className="footer-top" type="button" onClick={scrollTop}>
          Volver arriba <ArrowUp size={15} />
        </button>
      </div>
    </footer>
  );
}
