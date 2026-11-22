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
              Puedes seguir nueve cursos, consultar la biblioteca y probar el
              código en el laboratorio. Cada curso incluye ejercicios y un
              proyecto.
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
              Las guías de los nueve lenguajes y sus referencias. Para detalles
              adicionales, cada lenguaje enlaza a su documentación oficial.
            </p>
          </details>
        </div>
      </div>
    </section>
  );
}
