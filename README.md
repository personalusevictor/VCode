# VCode

Biblioteca de programación con portada 3D, consulta por temas y búsqueda integrada.

## Disponible

- Principal: símbolo neo chrome, recorrido de scroll, siete lenguajes, muestra de código y FAQ.
- Consulta: índice con búsqueda y filtros, 27 referencias HTML y 84 guías de los siete lenguajes.
- Lector: ejemplos, código para copiar, atributos, notas, conceptos relacionados y fuentes.
- Búsqueda global: filtros por lenguaje y tipo, vista previa, teclado y visitas recientes.

Cursos, proyectos, estudio, laboratorio y archivo personal siguen mostrando la página provisional. Las guías recuperan el contenido existente como artículos de consulta; no incluyen el antiguo sistema de ejercicios ni el editor.

## Desarrollo

```sh
npm ci
npm run dev
```

## Verificación

```sh
npm test
npm run build
npm run format:check
```

El índice de búsqueda se genera automáticamente antes de compilar y de probar. `npm run index:build` permite regenerarlo por separado.

`npm run preview` sirve la compilación en `http://127.0.0.1:8765`.

## Organización

- `src/app`: navegación, preferencias, búsqueda global, footer y página provisional.
- `src/docs`: índice, lector, ejemplos, contenido y rutas de consulta.
- `src/home/sections`: composición y contenido de la principal.
- `src/home/scene`: geometría, materiales e iluminación 3D.
- `src/home/motion`: entradas, revelaciones y movimiento del scroll.
- `src/home/components`: cursor, título y símbolo de puntos.
- `src/data`: catálogo e índice de búsqueda compartido.
- `src/lib`: búsqueda y visitas recientes.
- `scripts`: generación del índice a partir del contenido de consulta.
- `src/styles`: estilos compartidos y de la principal.
- `public`: símbolos y licencias.
- `tests`: geometría, cursor, integridad del contenido, rutas, filtros y recientes.

## Movimiento y lectura

La entrada de la principal comienza con el primer fotograma del logo. Dos planos se abren siguiendo la diagonal de la marca, el símbolo se orienta en profundidad y el nav aparece después. Los bloques inferiores se revelan una vez. Desplazar, tocar o navegar con teclado permite saltar la apertura.

La consulta utiliza desplazamiento nativo y entradas breves. Se respeta `prefers-reduced-motion`. Las animaciones continuas de la principal se pueden pausar desde Configuración y se detienen al ocultarse la pestaña.

## Datos locales

El tema utiliza `vcode-theme`. Los recientes guardan hasta seis identificadores en `vcode-reading-history-v1` y pueden borrarse en el buscador. No se crean ni modifican notas, borradores o avances de versiones anteriores. No hay servicio de cuentas ni sincronización.

## Diseño y licencias

Las decisiones y referencias están en `docs/motion.md` y `docs/consulta.md`. Los modelos 3D se generan desde el símbolo y los SVG locales. Las licencias de fuentes e iconos están en `public/licenses`. Cada referencia HTML enlaza a su documentación de origen.
