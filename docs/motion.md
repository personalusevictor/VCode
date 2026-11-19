# Dirección de movimiento

## Referencias

- [Lando Norris](https://landonorris.com/): observado en navegador. La presentación enlaza el objeto central, las máscaras y las escenas siguientes. Nos interesa la continuidad entre momentos y la geometría de las transiciones.
- [GSAP Timeline](https://gsap.com/docs/v3/GSAP/Timeline/): secuencias superpuestas con duraciones diferentes.
- [GSAP matchMedia](https://gsap.com/docs/v3/GSAP/gsap.matchMedia/): adaptación al movimiento reducido y limpieza de animaciones al cambiar las preferencias.

## Aplicación a VCode

1. Apertura diagonal: dos planos del color del papel se separan siguiendo la inclinación del símbolo. Una línea azul fugaz marca la junta. Comienza al renderizarse la escena, sin introducir una espera artificial.
2. El metal llega con profundidad: orientación, escala y posición se asientan juntas, conservando el giro de scroll y la interacción del puntero.
3. El nav aparece después de la apertura, sin tapar el símbolo ni añadir titulares al hero.
4. Búsqueda: el símbolo de puntos se revela de izquierda a derecha, el título aparece por palabras recortadas y los controles siguen en una secuencia breve.
5. Herramientas: el título y las piezas del bento entran con un pequeño desfase. FAQ: letras y preguntas se revelan de forma más contenida.

## Límites

- No se reemplaza el desplazamiento nativo ni se interpola el cursor libre.
- No se utilizan rebotes, bucles nuevos ni filtros de desenfoque de pantalla completa.
- Cada bloque inferior se presenta una sola vez durante su montaje. Abrir y cerrar la búsqueda no repite las entradas.
- Desplazar, tocar o navegar con teclado salta la apertura. El movimiento reducido muestra el contenido directamente.
- La portada conserva el grabado de nube japonesa del material: el pequeño contorno visto en la captura pertenece al shader, no al fondo ni a un indicador de carga.

## Alcance de la versión

Solo está implementada la principal. Los enlaces interiores conservan su destino para reconstruirlos más adelante, pero todos muestran una misma página provisional. La búsqueda mantiene únicamente un catálogo e índice; se han retirado las páginas completas, los motores de edición y SQL, y los archivos históricos de diseño.
