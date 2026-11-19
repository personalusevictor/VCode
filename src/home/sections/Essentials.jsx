import React from "react";
import BrandHeading from "../components/BrandHeading.jsx";
import Workbench from "./Workbench.jsx";
export default function Essentials() {
  return (
    <section className="home-essentials" aria-labelledby="essentials-title">
      <Workbench />
      <div className="home-practical">
        <BrandHeading as="h3" text="Antes de empezar" />
        <div>
          <details>
            <summary>
              ¿Puedo aprender desde cero?<span aria-hidden="true">+</span>
            </summary>
            <p>
              Sí. Empieza por HTML, continúa con CSS y después JavaScript. Las
              lecciones incluyen explicación, ejemplos y práctica; también
              puedes entrar directamente en cualquier tema.
            </p>
          </details>
          <details>
            <summary>
              ¿Qué está disponible ahora?<span aria-hidden="true">+</span>
            </summary>
            <p>
              Esta versión está centrada en la página principal. Las páginas de
              aprendizaje, consulta y herramientas están en preparación.
            </p>
          </details>
          <details>
            <summary>
              ¿Dónde se guarda mi archivo?<span aria-hidden="true">+</span>
            </summary>
            <p>
              En este navegador, sin cuenta y sin sincronización entre
              dispositivos. Desde Mi archivo puedes exportar una copia e
              importarla en otro navegador.
            </p>
          </details>
          <details>
            <summary>
              ¿Qué incluye la consulta?<span aria-hidden="true">+</span>
            </summary>
            <p>
              Las 84 guías de los siete lenguajes y un diccionario de 27
              elementos HTML. Para detalles adicionales, cada lenguaje enlaza a
              su documentación oficial.
            </p>
          </details>
        </div>
      </div>
    </section>
  );
}
