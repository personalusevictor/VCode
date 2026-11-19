# Consulta y búsqueda de VCode

## Referencias estudiadas

- [MDN: referencia de HTML](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference): separar el índice de la explicación de cada elemento.
- [MDN: details](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/details): organización por ejemplos, atributos y uso; comportamiento nativo del desplegable.
- [HTML Living Standard: elementos interactivos](https://html.spec.whatwg.org/multipage/interactive-elements.html#the-details-element): open, name y agrupación exclusiva de details.
- [React: documentación de referencia](https://react.dev/reference/react): lectura centrada, navegación lateral y acceso estable a temas relacionados.
- [Linear: búsqueda](https://linear.app/docs/search): filtros explícitos y acceso a contenido reciente.

## Dirección visual

Papel, tipografía local y azul de VCode. El nav compartido mantiene su forma de cápsula. La biblioteca utiliza una jerarquía editorial y filas de contenido; el lector tiene una columna de lectura, navegación temática y un índice del artículo. Se han evitado nuevas escenas 3D y animaciones continuas durante la lectura.

El panel de búsqueda utiliza los mismos materiales y bordes neutros. La columna izquierda permite elegir un resultado; la derecha explica su contenido antes de abrirlo. En móvil se priorizan los resultados y se oculta la vista previa para conservar espacio de lectura. Todos los destinos del buscador están implementados.

## Contenido

- 27 referencias de elementos HTML con ejemplos, atributos, recomendaciones y fuentes.
- 84 guías existentes de los siete lenguajes, recuperadas como contenido de consulta con texto, código y notas. No se ha restaurado el antiguo sistema de cursos, evaluaciones ni editores.
- details incluye dos variantes sincronizadas con el código: desplegable y acordeón nativo.
- Los ejemplos visibles están aislados; no ejecutan JavaScript, no envían formularios ni cargan recursos externos. Los fragmentos de metadatos o que requieren archivos externos se muestran como código.
- El lector enlaza conceptos relacionados, la guía del tema y las entradas anterior y siguiente.

## Interacción y datos

- El índice conserva lenguaje, consulta y tipo en el enlace. Las combinaciones sin referencias HTML se deshabilitan explícitamente.
- El buscador admite flechas, Enter, Escape y ⌘/Ctrl K. El foco vuelve al control que lo abrió.
- Los recientes representan páginas visitadas y se pueden borrar desde el panel. Se guardan únicamente hasta seis identificadores en `vcode-reading-history-v1`, sin modificar notas o avances de versiones anteriores.
- Los enlaces de apartados se pueden compartir. La navegación interna utiliza desplazamiento nativo y respeta el movimiento reducido.
- Copiar código y copiar enlace muestran confirmación solo cuando la operación se completa.

La portada aprobada conserva sus secciones y sus escenas. Las páginas de cursos, proyectos y herramientas continúan siendo provisionales.
