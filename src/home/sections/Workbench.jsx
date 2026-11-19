import RevealHeading from "../motion/RevealHeading";
import React from "react";
import {
  ArrowUpRight,
  FolderOpen,
  BookOpenCheck,
  FlaskConical,
  Code2,
} from "lucide-react";
import CodeExhibition from "./CodeExhibition.jsx";
export default function Workbench() {
  return (
    <div className="home-toolkit">
      <RevealHeading id="essentials-title">Herramientas</RevealHeading>
      <div className="toolkit-layout">
        <div className="toolkit-lab toolkit-live">
          <div className="toolkit-live-header">
            <h3>Laboratorio</h3>
            <Code2 size={25} strokeWidth={1.4} aria-hidden="true" />
          </div>
          <p>Muestra de HTML y CSS.</p>
          <CodeExhibition />
          <div className="toolkit-lab-footer">
            <a className="toolkit-open-lab" href="#playground">
              Abrir laboratorio <ArrowUpRight size={16} />
            </a>
          </div>
        </div>
        <div className="toolkit-companions">
          <a className="toolkit-file" href="#progress">
            <FolderOpen className="toolkit-icon" size={31} strokeWidth={1.3} />
            <span className="toolkit-arrow">
              <ArrowUpRight size={21} />
            </span>
            <div>
              <h3>Mi archivo</h3>
              <p>
                Notas, borradores y avance. Exporta una copia de tu trabajo.
              </p>
              <span className="toolkit-note">
                Guardado en este navegador, sin cuenta.
              </span>
            </div>
          </a>
          <a className="toolkit-studio" href="#studio">
            <FlaskConical
              className="toolkit-icon"
              size={30}
              strokeWidth={1.3}
            />
            <span className="toolkit-arrow">
              <ArrowUpRight size={21} />
            </span>
            <div>
              <h3>Estudio</h3>
              <p>Explora conceptos con experimentos interactivos.</p>
            </div>
          </a>
          <a className="toolkit-sources" href="#resources">
            <BookOpenCheck
              className="toolkit-icon"
              size={31}
              strokeWidth={1.3}
            />
            <span className="toolkit-arrow">
              <ArrowUpRight size={21} />
            </span>
            <div>
              <h3>Fuentes oficiales</h3>
              <p>Documentación de cada lenguaje y créditos de VCode.</p>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}
