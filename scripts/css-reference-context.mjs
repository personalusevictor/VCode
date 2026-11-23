const media = {
  width: [
    "Consulta el ancho de la ventana gráfica. Las comparaciones de rango permiten ajustar el diseño cuando cambia el espacio disponible.",
  ],
  "-webkit-device-pixel-ratio": [
    "Consulta la relación entre píxeles físicos y píxeles CSS con la sintaxis histórica de WebKit. Para código nuevo usa resolution y la unidad dppx.",
  ],
  "-webkit-transform-3d": [
    "Consulta si el motor admite transformaciones 3D mediante una característica histórica de WebKit. Para código nuevo, comprueba con @supports la declaración concreta que necesitas.",
  ],
  "any-hover": [
    "Comprueba si algún dispositivo de entrada disponible permite apuntar sin pulsar. Úsalo para añadir interacciones opcionales al pasar el puntero sin quitar alternativas de teclado o toque.",
    "hover",
  ],
  "any-pointer": [
    "Comprueba la precisión de cualquiera de los punteros disponibles. Un dispositivo híbrido puede coincidir con fine por su ratón y con coarse por su pantalla táctil.",
    "coarse",
  ],
  "aspect-ratio": [
    "Compara la proporción entre el ancho y el alto de la ventana gráfica. En medios paginados consulta la proporción de la caja de página.",
    "16 / 9",
  ],
  color: [
    "Consulta los bits disponibles por componente de color. Un valor de cero indica que el dispositivo no muestra color.",
    "8",
  ],
  "color-gamut": [
    "Comprueba si el dispositivo puede mostrar aproximadamente la gama de color solicitada. Permite empezar con colores sRGB y ofrecer después una versión de gama más amplia.",
    "p3",
  ],
  "color-index": [
    "Consulta cuántas entradas tiene la tabla de colores del dispositivo. Si la salida no usa una tabla indexada, el valor es cero.",
  ],
  "device-aspect-ratio": [
    "Consulta la proporción de toda la superficie del dispositivo. Es una característica obsoleta. Para adaptar un diseño a la ventana usa aspect-ratio.",
  ],
  "device-height": [
    "Consulta el alto de la superficie del dispositivo. Es una característica obsoleta. Para adaptar un diseño al espacio disponible usa height.",
  ],
  "device-width": [
    "Consulta el ancho de la superficie del dispositivo. Es una característica obsoleta. Para adaptar un diseño al espacio disponible usa width.",
  ],
  "display-mode": [
    "Comprueba cómo se presenta la aplicación, por ejemplo en una pestaña, en modo independiente o en pantalla completa.",
    "standalone",
  ],
  "display-state": [
    "Consulta el estado de presentación de la ventana, como si está maximizada, minimizada o a pantalla completa. Su disponibilidad depende del navegador y del modo de aplicación.",
  ],
  "dynamic-range": [
    "Determina si la presentación admite un rango dinámico alto según sus capacidades de brillo, contraste y profundidad de color.",
    "high",
  ],
  "environment-blending": [
    "Consulta cómo se combina la salida con el entorno que ve la persona. Distingue una presentación opaca de dispositivos que añaden o atenúan luz.",
  ],
  "forced-colors": [
    "Detecta si el navegador está aplicando una paleta de colores impuesta por el usuario, como un modo de contraste elevado. Usa colores de sistema cuando necesites conservar una señal visual.",
    "active",
  ],
  grid: [
    "Distingue una salida de cuadrícula de caracteres de una salida de mapa de bits. Esta consulta no comprueba si el navegador admite CSS Grid.",
  ],
  height: [
    "Consulta el alto de la ventana gráfica. En medios paginados consulta la altura de la caja de página.",
    "40rem",
  ],
  "horizontal-viewport-segments": [
    "Consulta cuántos segmentos de ventana gráfica hay dispuestos en horizontal. Resulta útil en dispositivos con una separación física vertical entre pantallas.",
    "2",
  ],
  hover: [
    "Comprueba si el dispositivo apuntador principal puede señalar un elemento sin pulsarlo. Para preguntar por cualquier puntero disponible, usa any-hover.",
    "hover",
  ],
  "inverted-colors": [
    "Detecta si el navegador o el sistema invierte los colores de salida. Puede ayudar a evitar una segunda inversión en imágenes u otros elementos.",
    "inverted",
  ],
  monochrome: [
    "Consulta los bits por píxel de un dispositivo monocromo. Si el dispositivo no es monocromo, devuelve cero.",
  ],
  "nav-controls": [
    "Consulta si el navegador ofrece un control de navegación como un botón para volver. Es una característica en borrador.",
  ],
  orientation: [
    "Consulta la proporción de la ventana, no la posición física del dispositivo. portrait coincide también cuando ambos lados miden lo mismo.",
    "landscape",
  ],
  "overflow-block": [
    "Indica cómo presenta el medio el contenido que desborda en el eje de bloque. Por ejemplo, puede desplazarse o repartirse en páginas.",
    "paged",
  ],
  "overflow-inline": [
    "Indica si el medio permite desplazarse para alcanzar contenido que desborda en el eje de escritura.",
    "scroll",
  ],
  pointer: [
    "Consulta la precisión del puntero principal. coarse describe una entrada poco precisa como un dedo, mientras que fine indica mayor precisión.",
    "coarse",
  ],
  "prefers-bold-text": [
    "Consulta si la persona prefiere que el texto se muestre con mayor grosor. Es una característica en borrador.",
  ],
  "prefers-color-scheme": [
    "Consulta si la persona ha elegido una apariencia clara u oscura. Define primero un tema base y usa esta consulta para adaptar la paleta.",
    "dark",
  ],
  "prefers-contrast": [
    "Consulta la preferencia de contraste de la persona. custom permite detectar una combinación de colores personalizada que no encaja en más o menos contraste.",
    "more",
  ],
  "prefers-reduced-data": [
    "Consulta si la persona prefiere consumir menos ancho de banda. En una versión con soporte, permite omitir imágenes pesadas o recursos secundarios.",
  ],
  "prefers-reduced-motion": [
    "Detecta una preferencia por reducir el movimiento. Ofrece una versión más estable de animaciones largas, desplazamientos suaves y efectos de paralaje.",
    "reduce",
  ],
  "prefers-reduced-transparency": [
    "Consulta si la persona prefiere superficies más opacas. Puede usarse para hacer legible el texto sobre paneles translúcidos.",
    "reduce",
  ],
  resizable: [
    "Consulta si el usuario puede cambiar el tamaño de la ventana. Es una característica en borrador.",
  ],
  resolution: [
    "Consulta la densidad de píxeles del medio. 1dppx equivale a 96dpi. Esta consulta resulta útil para elegir recursos que necesitan más resolución.",
    "2dppx",
  ],
  scan: [
    "Distingue el escaneo progresivo del entrelazado en ciertos dispositivos de vídeo.",
    "progressive",
  ],
  scripting: [
    "Consulta si el medio admite la ejecución de scripts. initial-only indica que pueden ejecutarse durante la carga inicial, pero no durante la interacción posterior.",
    "none",
  ],
  shape: [
    "Consulta la forma del área de presentación. Sirve para distinguir superficies redondas de rectangulares. Es una característica en borrador.",
  ],
  "ua-color-scheme": [
    "Consulta el esquema claro u oscuro que usa el navegador para presentar el documento. Es una característica en borrador.",
  ],
  update: [
    "Consulta con qué rapidez puede cambiar la presentación del documento después de mostrarlo. Por ejemplo, una salida impresa no puede actualizarse.",
    "slow",
  ],
  "vertical-viewport-segments": [
    "Consulta cuántos segmentos de ventana gráfica hay dispuestos en vertical. Resulta útil cuando una separación física horizontal divide la pantalla.",
    "2",
  ],
  "video-color-gamut": [
    "Consulta la gama de color que admite la ruta de presentación del vídeo. Puede ser distinta de la gama del contenido CSS.",
    "p3",
  ],
  "video-dynamic-range": [
    "Consulta si el dispositivo y el navegador pueden presentar vídeo con un rango dinámico alto.",
    "high",
  ],
};

const sides = {
  "": "los cuatro lados",
  "-top": "el borde superior",
  "-right": "el borde derecho",
  "-bottom": "el borde inferior",
  "-left": "el borde izquierdo",
  "-block": "ambos bordes del eje de bloque",
  "-block-start": "el borde de inicio del eje de bloque",
  "-block-end": "el borde de fin del eje de bloque",
  "-inline": "ambos bordes del eje de escritura",
  "-inline-start": "el borde de inicio del eje de escritura",
  "-inline-end": "el borde de fin del eje de escritura",
};

const notes = {
  "event-trigger": [
    "Declara un disparador de animación a partir de su nombre y los eventos que lo activan. Pertenece al borrador de Animation Triggers.",
  ],
  "event-trigger-name": [
    "Da nombre a un disparador de eventos para que una animación pueda referirse a él. El nombre es un identificador que empieza por dos guiones.",
  ],
  "event-trigger-source": [
    "Elige los eventos a los que responde un disparador. En la propuesta, una barra separa los eventos que lo activan de los que lo desactivan.",
  ],
  "timeline-trigger-range": [
    "Abrevia los límites que activan un disparador y el intervalo durante el que permanece activo según avanza la línea de tiempo.",
  ],
  "animation-range-center": [
    "Fija qué punto del intervalo corresponde al 50 % de progreso de una animación. Permite mover ese punto con respecto al centro geométrico.",
  ],
  "pointer-timeline": [
    "Abrevia la configuración de una línea de tiempo cuyo progreso depende de la posición del puntero. La característica está en borrador.",
  ],
  "pointer-timeline-axis": [
    "Selecciona el eje que se usa para convertir la posición del puntero en progreso. Puede ser un eje físico o dependiente del modo de escritura.",
  ],
  "pointer-timeline-name": [
    "Da un nombre a una línea de tiempo controlada por el puntero para asociarla con una animación.",
  ],
  "pointer()": [
    "Crea una referencia a una línea de tiempo de puntero sin declarar primero un nombre. El progreso se calcula a partir de la posición del puntero dentro del intervalo de referencia.",
  ],
  "calc-mix()": [
    "Calcula una media ponderada de números, porcentajes o dimensiones compatibles. Los porcentajes indican el peso de cada entrada.",
  ],
  "calc-interpolate()": [
    "Calcula un valor numérico intermedio a partir de un progreso y de los valores entre los que se interpola. El tipo de las entradas debe ser compatible.",
  ],
  "color-interpolate()": [
    "Obtiene un color intermedio según un valor de progreso. La interpolación depende del espacio en el que se mezclen los colores.",
  ],
  "transform-mix()": [
    "Combina listas de transformaciones con pesos. Los pesos indican cuánto contribuye cada lista al resultado.",
  ],
  "transform-interpolate()": [
    "Calcula una transformación intermedia a partir del progreso y de las listas de transformaciones de referencia.",
  ],
  "interpolate()": [
    "Selecciona un resultado intermedio entre valores asociados a un progreso. El tipo de la propiedad determina cómo se pueden interpolar los valores.",
  ],
  "cross-origin() · <request-url-modifier>": [
    "Declara cómo debe tratarse el origen al solicitar el recurso referenciado por la URL. Su sintaxis forma parte de una propuesta.",
  ],
  "integrity() · <request-url-modifier>": [
    "Asocia a una URL los metadatos de integridad esperados del recurso. La comprobación permite detectar cuando el recurso no coincide con el contenido esperado.",
  ],
  "referrer-policy() · <request-url-modifier>": [
    "Indica cuánta información del origen de la página se envía como referencia al solicitar el recurso de esa URL.",
  ],
  "cycle()": [
    "Permite seleccionar entre valores ordenados dentro de un ciclo. Consulta la versión de la propuesta para conocer el criterio de selección y su sintaxis.",
  ],
  "first-valid()": [
    "Prueba valores alternativos en orden y usa el primero que el motor acepta como valor completo de la propiedad. Si no admite ninguno, la declaración resulta inválida al calcular su valor.",
  ],
  "ident()": [
    "Construye un identificador de CSS a partir de las piezas que se le pasan. Sirve cuando el nombre que necesita una propiedad se compone dinámicamente.",
  ],
  "inherit()": [
    "Recupera el valor de una propiedad personalizada del elemento padre. Es una función propuesta, distinta de usar inherit como valor completo de una propiedad.",
  ],
  "random-item()": [
    "Elige una opción de una lista con la misma probabilidad para cada entrada. La clave inicial determina cuándo se reutiliza el valor escogido.",
  ],
  "type() · attr()": [
    "Indica qué sintaxis debe cumplir el valor del atributo para que attr() pueda convertirlo a un tipo CSS. Si la conversión no funciona, se aplica el mecanismo de valor alternativo.",
  ],
  "@apply": [
    "Aplica un mixin definido con @mixin a la regla actual. Puede pasar valores a sus parámetros o proporcionar un bloque de contenido.",
  ],
  "@contents": [
    "Indica dónde va el bloque que pasa @apply a un mixin. Puede definir un bloque alternativo para el caso en que la llamada no aporte contenido.",
  ],
  "@mixin": [
    "Define un grupo de declaraciones o reglas reutilizables. La propuesta permite parametrizarlo y aplicarlo en otros selectores.",
  ],
  "@private": [
    "Declara propiedades personalizadas visibles solo en la regla de estilo que las contiene y en sus reglas anidadas. El nombre puede repetirse en otra regla sin crear la misma variable.",
  ],
  "type() · @function": [
    "Declara la gramática CSS que debe cumplir un argumento o el resultado de una función personalizada.",
  ],
  "@function · result": [
    "Indica el valor que devuelve una función personalizada. El valor se sustituye en el lugar donde se usó la llamada.",
  ],
  "@when": [
    "Abre una regla condicional que puede combinar pruebas del medio y de soporte. Pertenece a CSS Conditional Rules y su implementación no es general.",
  ],
  "@else": [
    "Define una alternativa en una cadena condicional. Se evalúa cuando la condición precedente no se cumple.",
  ],
  "media()": [
    "Inserta una consulta de medios como condición dentro de una construcción que admite estas pruebas.",
  ],
  "supports()": [
    "Inserta como condición una prueba de soporte de un selector, declaración o característica admitida por CSS Supports.",
  ],
  "@container · scrolled": [
    "Consulta el estado de desplazamiento del contenedor mediante scroll-state(). Se usa con un contenedor configurado para este tipo de consulta.",
  ],

  "&": [
    "Hace referencia a los elementos que coinciden con el selector de la regla exterior. En una regla anidada permite aplicar clases, estados o combinadores a esos elementos.",
    ".tarjeta { &.activa { outline: 2px solid; } }",
  ],
  ":host()": [
    "Selecciona el anfitrión del árbol de sombra si coincide con el selector que recibe. Se usa desde el CSS del componente para aplicar estilos al propio anfitrión.",
    ":host(.compacto) { padding: .5rem; }",
  ],
  ":before": [
    "Escritura histórica de ::before, el pseudoelemento que genera contenido antes del contenido del elemento.",
    ".destacado::before { content: '★ '; }",
  ],
  ":after": [
    "Escritura histórica de ::after, el pseudoelemento que genera contenido después del contenido del elemento.",
    ".externo::after { content: ' ↗'; }",
  ],
  ":first-line": [
    "Escritura histórica de ::first-line. Aplica estilos a la primera línea formateada del bloque. La línea puede cambiar cuando cambia el ancho disponible.",
  ],
  ":first-letter": [
    "Escritura histórica de ::first-letter. Permite cambiar el aspecto de la primera letra tipográfica de un bloque compatible.",
  ],
  "::-webkit-input-placeholder": [
    "Selector prefijado histórico para dar estilo al texto de ayuda dentro de un campo vacío. Para navegadores actuales usa ::placeholder.",
  ],
  "@-webkit-keyframes": [
    "Variante prefijada de @keyframes, usada por versiones antiguas de motores WebKit. Usa @keyframes para declarar las etapas de una animación en CSS actual.",
  ],
  "rgba()": [
    "Alias de rgb() que también puede indicar la opacidad del color. Un alfa de 0 es transparente y uno de 1 es opaco.",
    ".marca { color: rgba(24, 60, 150, .75); }",
  ],
  "hsla()": [
    "Alias de hsl() para describir un color por tono, saturación y luminosidad, con un canal alfa opcional.",
    ".marca { color: hsla(220, 65%, 45%, .8); }",
  ],
  "::cue()": [
    "Aplica estilos a subtítulos o a contenido dentro de ellos que coincide con un selector del formato WebVTT.",
    "video::cue(b) { color: gold; }",
  ],
  "::cue-region": [
    "Representa una región que agrupa pistas de texto de WebVTT en el área de un vídeo.",
  ],
  "::cue-region()": [
    "Permite aplicar estilos a una región WebVTT que coincide con el selector indicado. La región está asociada a la pista de texto.",
  ],
  "color-adjust": [
    "Nombre anterior del control de ajustes de color para algunos modos de salida. Usa print-color-adjust cuando quieras dar una indicación de fidelidad de colores al imprimir.",
  ],
  "-webkit-box-align": [
    "Alinea los elementos de una caja flexible antigua en su eje transversal. Para Flexbox actual usa align-items.",
  ],
  "-webkit-box-flex": [
    "Controla cuánto crece un hijo en el modelo flexible antiguo. Para código nuevo, consulta flex-grow y el resto de la propiedad flex.",
  ],
  "-webkit-box-orient": [
    "Configura la orientación de una caja flexible antigua. En la sintaxis prefijada de recorte de líneas suele aparecer con vertical.",
  ],
  "-webkit-box-pack": [
    "Alinea o reparte los elementos de una caja flexible antigua en su eje principal. En Flexbox actual se usa justify-content.",
  ],
  "-webkit-box-ordinal-group": [
    "Configura el grupo de orden visual de un elemento dentro de una caja flexible antigua. En Flexbox actual se usa order. Mantén un orden comprensible también en el HTML.",
  ],
  "-webkit-image-set()": [
    "Forma prefijada de image-set(). Ofrece varias versiones de una imagen para que el navegador elija una resolución adecuada.",
  ],
  "type() · image-set()": [
    "Declara el tipo MIME de una alternativa de imagen. El navegador puede excluir recursos con un formato que no admite.",
    ".portada { background-image: image-set(url('foto.avif') type('image/avif'), url('foto.jpg') type('image/jpeg')); }",
  ],
  "fit-content() · grid-template-columns, grid-template-rows": [
    "Calcula el tamaño de una pista de Grid según su contenido y el límite indicado. Respeta el tamaño mínimo intrínseco de la pista.",
    ".lista { display: grid; grid-template-columns: fit-content(16rem) 1fr; }",
  ],
  "minmax() · grid-template-columns, grid-template-rows": [
    "Acota el tamaño de una pista entre un mínimo y un máximo. Si el máximo resulta menor que el mínimo, prevalece el mínimo.",
    ".lista { display: grid; grid-template-columns: minmax(12rem, 2fr) 1fr; }",
  ],
  "repeat() · <auto-repeat>, <fixed-repeat>, <track-repeat>": [
    "Repite un patrón de pistas para definir filas o columnas. Usa un entero para una cantidad fija, o auto-fill o auto-fit cuando el número dependa del espacio disponible.",
    ".lista { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); }",
  ],
  "@page · bleed": [
    "Configura cuánto puede extenderse la impresión fuera del borde final de corte. Sirve para que imágenes y fondos lleguen hasta el borde después de cortar.",
  ],
  "@page · marks": [
    "Indica si se dibujan marcas de corte o de registro al imprimir. El dispositivo o el motor de publicación debe admitirlas.",
    "@page { marks: crop; }",
  ],
  "@page · page-margin-safety": [
    "Controla el tratamiento de los márgenes que quedan en un área en la que la impresora puede no marcar papel. Pertenece a las propuestas de impresión paginada.",
  ],
  "filter()": [
    "Aplica una lista de filtros a una imagen para producir otra imagen. Esta función se usa como valor de imagen. La propiedad filter aplica el efecto al elemento completo.",
  ],
  "rect() · clip": [
    "Define una región rectangular para la propiedad antigua clip. El uso actual suele resolverse con clip-path e inset().",
  ],
  "src()": [
    "Representa una URL mediante una cadena. Es una forma funcional de referencia a una ubicación de recurso en CSS.",
  ],
  "shape-inside": [
    "Propone limitar el área interior en la que se distribuye el contenido de una caja usando una forma.",
  ],
  "shape-padding": [
    "En una caja con shape-inside, separa el contenido del borde de la forma interior.",
  ],
  "wrap-flow": [
    "Define alrededor de qué lados de una exclusión se permite fluir al contenido que la rodea.",
  ],
  "wrap-through": [
    "Controla si el contenido tiene en cuenta las exclusiones del contexto que lo contiene al distribuir las líneas.",
  ],
  "@view-transition · navigation": [
    "Controla la participación de una página en transiciones de vista entre documentos. Ambos documentos deben cumplir las condiciones de la transición.",
    "@view-transition { navigation: auto; }",
  ],
  "@view-transition · types": [
    "Asocia nombres de tipos a transiciones de vista entre documentos. Esos nombres permiten aplicar estilos distintos según la clase de transición.",
  ],
  "view-transition-group": [
    "Determina cómo se agrupan las representaciones de un elemento dentro del árbol de una transición de vista. Permite conservar relaciones entre grupos en casos de anidamiento.",
  ],
  "::view-transition-group-children()": [
    "Representa el contenedor de los grupos hijos de un grupo nombrado en el árbol de pseudoelementos de una transición de vista.",
  ],
  "running()": [
    "Convierte un elemento en contenido de cabecera o pie reutilizable bajo un nombre. Se usa como valor de position y se recupera con element() en un contexto de impresión.",
  ],
  "footnote-display": [
    "Controla cómo se disponen las notas al pie de una página, como bloques separados o juntas según las opciones del medio paginado.",
  ],
  "footnote-policy": [
    "Controla qué ocurre si una nota al pie no cabe en el área de notas de la página.",
  ],
  "glyph-orientation-vertical": [
    "Propiedad histórica de SVG que controlaba la orientación de los glifos en texto vertical. En CSS actual se usa text-orientation.",
  ],
  "border-boundary": [
    "Propone escoger si el borde de una caja debe adaptarse a la forma de una pantalla redonda.",
  ],
  "animation-delay-start": [
    "Identifica una propuesta para configurar por separado el retraso inicial de una animación. La forma habitual en CSS es animation-delay.",
  ],
  "animation-delay-end": [
    "Identifica una propuesta de retraso aplicado al extremo final del intervalo de animación. Consulta la versión de la especificación que describe la propiedad.",
  ],
  "@font-face · font-language-override": [
    "Fuerza una etiqueta de sistema de idioma OpenType al seleccionar determinadas variantes de una fuente. Se usa cuando el etiquetado normal del idioma no basta para activar una forma tipográfica concreta.",
  ],
  "@font-face · font-named-instance": [
    "Obtiene la configuración de los ejes de una fuente variable a partir de una instancia con nombre definida por la fuente.",
  ],
  "@color-profile · src": [
    "Identifica la ubicación del perfil de color que se carga para interpretar los componentes de colores que referencien ese perfil.",
  ],
  "@color-profile · rendering-intent": [
    "Selecciona cómo se asignan colores entre gamas al usar el perfil. El propósito de conversión influye cuando el destino no puede reproducir un color de origen.",
  ],
  "@color-profile · components": [
    "Define los componentes que los colores deben proporcionar para el perfil indicado.",
  ],

  "+": [
    "Selecciona un elemento si inmediatamente antes hay un hermano que coincide con el selector de la izquierda. Los dos elementos comparten padre.",
    "h2 + p { margin-block-start: 0; }",
  ],
  ">": [
    "Selecciona hijos directos del elemento de la izquierda. Un descendiente situado dos niveles más abajo queda fuera.",
    ".menu > li { list-style: none; }",
  ],
  "~": [
    "Selecciona los hermanos posteriores que coinciden, aunque haya otros elementos entre ellos. Todos deben compartir el mismo padre.",
    "h2 ~ p { color: #354354; }",
  ],
  "||": [
    "Selecciona celdas que pertenecen a la columna indicada a la izquierda. Es el combinador de columnas propuesto en Selectors 5.",
  ],
  ":matches()": [
    "Nombre histórico de :is(). Agrupa varios selectores alternativos. En código nuevo usa :is().",
    ".panel :is(h2, h3) { margin-block-end: .5rem; }",
  ],
  ":unchecked": [
    "Selecciona un control que admite estado marcado y que está sin marcar. Es distinto de negar :checked sobre cualquier elemento.",
  ],
  ":heading()": [
    "Selecciona encabezados por sus niveles semánticos. El nivel procede del documento y no del tamaño visual del texto.",
  ],
  ":nth-col()": [
    "Selecciona celdas según su índice de columna contado desde el inicio de la tabla. Sigue la notación An+B.",
  ],
  ":nth-last-col()": [
    "Selecciona celdas según su índice de columna contado desde el final de la tabla.",
  ],
  "-webkit-user-select": [
    "Versión prefijada de user-select que ofrecen algunas implementaciones. Controla la selección de texto. Conserva la declaración estándar para el resto de navegadores.",
    ".empuñadura { -webkit-user-select: none; user-select: none; }",
  ],
  "input-security": [
    "Controla si se ocultan visualmente los caracteres introducidos en un campo sensible. La propiedad no cambia cómo se almacena o se envía el valor.",
  ],
  "slider-orientation": [
    "Define la orientación y el sentido de incremento de un control deslizante, por ejemplo de abajo arriba.",
  ],
  "::clear-icon": [
    "Representa el botón interno que vacía el texto en los campos que ofrecen esa acción.",
  ],
  "::color-swatch": [
    "Representa la muestra que muestra el color seleccionado en un control de color.",
  ],
  "::field-component": [
    "Representa una parte editable de un campo segmentado, como las partes del día, mes y año de un control de fecha.",
  ],
  "::field-content": [
    "Representa la parte del campo donde se muestra o edita su contenido. Puede distinguirse del borde, del icono y de los controles auxiliares.",
  ],
  "::field-separator": [
    "Representa el separador visual entre las partes de un campo segmentado, como los separadores de una fecha.",
  ],
  "::reveal-icon": [
    "Representa el control que alterna la visibilidad de texto sensible cuando el navegador ofrece esa acción.",
  ],
  "::slider-fill": [
    "Representa el tramo de la pista que señala el avance o la proporción del valor actual.",
  ],
  "::slider-thumb": [
    "Representa el tirador que la persona mueve para cambiar el valor del control deslizante.",
  ],
  "::slider-track": [
    "Representa la pista por la que se desplaza el tirador del control.",
  ],
  "::step-control": [
    "Representa el contenedor de los botones de un campo numérico que aumentan y reducen su valor.",
  ],
  "::step-down": [
    "Representa el botón interno que reduce el valor de un campo con control por pasos.",
  ],
  "::step-up": [
    "Representa el botón interno que aumenta el valor de un campo con control por pasos.",
  ],
  ":high-value": [
    "Selecciona un indicador con un valor clasificado como alto por sus límites semánticos. En meter depende de sus atributos low, high y optimum.",
  ],
  ":low-value": [
    "Selecciona un indicador con un valor clasificado como bajo por los límites del control, no por lo alto o ancho que se vea.",
  ],
  ":optimal-value": [
    "Selecciona un indicador cuyo valor cae en la zona considerada óptima según la configuración del control.",
  ],
  "control-value()": [
    "La función propuesta devuelve el valor actual del control de formulario. Sigue en borrador y el grupo de trabajo todavía no recomienda implementarla.",
  ],
  "fill-break": [
    "Decide si un relleno se pinta como una sola superficie al dividir una caja en fragmentos o se vuelve a aplicar a cada fragmento.",
  ],
  "fill-color": [
    "Define el color de relleno de una forma SVG o de los caracteres a los que se aplica. Puede formar parte de un relleno por capas.",
  ],
  "fill-image": [
    "Elige las capas de imagen usadas para pintar el interior, por ejemplo con un degradado. El efecto se recorta a la forma rellena.",
  ],
  "fill-origin": [
    "Selecciona el área que sirve de referencia al calcular la posición de las capas de relleno.",
  ],
  "fill-position": [
    "Coloca cada imagen de relleno dentro de su área de referencia.",
  ],
  "fill-repeat": [
    "Indica si cada imagen de relleno se repite y de qué manera se distribuyen sus copias.",
  ],
  "fill-size": [
    "Define el tamaño de una imagen de relleno dentro del área elegida para posicionarla.",
  ],
  "stroke-align": [
    "Elige si el trazo queda centrado sobre el contorno o se dibuja hacia dentro o hacia fuera.",
  ],
  "stroke-break": [
    "Determina cómo se pinta el trazo cuando la caja está dividida en fragmentos, por ejemplo entre páginas.",
  ],
  "stroke-color": [
    "Determina el color del trazo en torno a una figura o a los glifos. El grosor se configura por separado.",
  ],
  "stroke-dash-corner": [
    "Controla si se fuerza un segmento visible en los vértices de una forma con trazo discontinuo.",
  ],
  "stroke-dash-justify": [
    "Ajusta los segmentos o los huecos de un trazo discontinuo para que el patrón encaje un número entero de veces en el recorrido.",
  ],
  "stroke-image": [
    "Determina las imágenes que pintan las capas del trazo. La pintura queda limitada a la forma que ocupa el trazo.",
  ],
  "stroke-origin": [
    "Elige la caja de referencia para alinear y dimensionar las imágenes del trazo.",
  ],
  "stroke-position": [
    "Posiciona las imágenes del trazo con respecto al área que define stroke-origin.",
  ],
  "stroke-repeat": [
    "Configura la repetición de una imagen usada como pintura del trazo.",
  ],
  "stroke-size": [
    "Configura el tamaño que se aplica a cada imagen de trazo antes de colocarla y repetirla.",
  ],
  "hyphenate-limit-last": [
    "Restringe la separación con guiones al final de unidades de composición, como un bloque, columna o página.",
  ],
  "hyphenate-limit-lines": [
    "Limita el número de líneas consecutivas que pueden acabar con una palabra partida mediante guion.",
  ],
  "hyphenate-limit-zone": [
    "Ajusta el espacio que se admite dejar vacío al final de la línea antes de considerar partir una palabra mediante guion.",
  ],
  "line-padding": [
    "Reserva espacio junto al comienzo y al final de fragmentos de texto formateados en línea.",
  ],
  "text-align-all": [
    "Controla la alineación general del texto dentro de sus líneas. text-align-last puede aplicar una alineación distinta a la última línea.",
  ],
  "text-autospace-size": [
    "Ajusta el tamaño de espacios que el navegador inserta automáticamente entre ciertos sistemas de escritura.",
  ],
  "text-group-align": [
    "Alinea conjuntamente un grupo de líneas de texto en vez de limitarse a alinear cada línea por separado.",
  ],
  "text-spacing": [
    "Abrevia ajustes de espaciado tipográfico, como el espacio automático entre escrituras y el tratamiento de ciertos signos de puntuación.",
  ],
  "white-space-trim": [
    "Configura qué espacios se descartan en los límites de un elemento. Se combina con el modo de colapso de espacios, que controla cómo se tratan dentro del contenido.",
  ],
  "word-space-transform": [
    "Da un tratamiento tipográfico a los separadores entre palabras, por ejemplo usando un espacio de ancho completo.",
  ],
  "wrap-after": [
    "Permite favorecer, evitar o forzar un salto después de una caja en línea o un ítem flexible según el contexto.",
  ],
  "wrap-before": [
    "Permite favorecer, evitar o forzar un salto antes de una caja en línea o un ítem flexible según el contexto.",
  ],
  "wrap-inside": [
    "Restringe los saltos dentro de la caja. Es útil para mantener juntas las partes de un fragmento corto cuando hay espacio.",
  ],
  "box-shadow-blur": [
    "Determina el radio de desenfoque de cada sombra en la lista de box-shadow.",
  ],
  "box-shadow-color": [
    "Determina el color de cada sombra. currentColor permite que la sombra tome el color de texto del elemento.",
  ],
  "box-shadow-offset": [
    "Define cuánto se desplaza la sombra respecto a la caja de origen.",
  ],
  "box-shadow-position": [
    "Distingue sombras interiores de sombras exteriores. Es una de las propiedades propuestas para descomponer box-shadow.",
  ],
  "box-shadow-spread": [
    "Ajusta cuánto se expande o se contrae la sombra antes de aplicar el desenfoque.",
  ],
  "border-limit": [
    "Limita el tramo de borde que se pinta. Para describir varios tramos alternos en lados concretos, consulta border-clip.",
  ],

  "-webkit-line-clamp": [
    "Limita un bloque de texto a un número de líneas mediante la sintaxis prefijada. Úsala con display: -webkit-box y -webkit-box-orient: vertical. Oculta el desbordamiento para recortar el texto sobrante.",
    ".resumen { display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 3; overflow: hidden; }",
  ],
  "block-ellipsis": [
    "Controla el indicador que se dibuja en la última línea visible al truncar un bloque. none elimina el indicador y auto usa el que corresponda al contexto.",
    ".resumen { line-clamp: 3; block-ellipsis: auto; }",
  ],
  continue: [
    "Determina qué ocurre con el contenido de un bloque después de llegar al límite de líneas. Se usa junto a las propiedades de truncamiento.",
  ],
  "max-lines": [
    "Fija el número máximo de líneas antes de interrumpir el bloque. Para el caso habitual de recortar un texto con puntos suspensivos, consulta line-clamp.",
  ],
  "fade() · text-overflow": [
    "Atenúa el contenido que no cabe al borde de una línea. La longitud o porcentaje del argumento controla hasta dónde llega la transición.",
    ".etiqueta { white-space: nowrap; overflow: hidden; text-overflow: fade(2rem); }",
  ],
  cue: [
    "Abrevia las señales de audio que se reproducen antes y después del contenido en un motor de síntesis de voz. Con un solo valor, se aplica la misma señal en ambas posiciones.",
  ],
  "cue-after": [
    "Reproduce una señal de audio después del contenido leído. La señal puede usar una URL y un ajuste de volumen en decibelios.",
  ],
  "cue-before": [
    "Reproduce una señal de audio antes del contenido leído. Usa una señal breve para separar partes del documento durante la lectura.",
  ],
  pause: [
    "Configura las pausas de síntesis de voz antes y después del contenido. Las pausas adyacentes pueden combinarse. Consulta rest si necesitas un intervalo que se suma a los demás.",
  ],
  "pause-after": [
    "Controla la pausa que sigue al elemento dentro del ritmo de lectura. Admite una duración o un valor relativo como medium.",
  ],
  "pause-before": [
    "Controla la pausa previa al elemento dentro del ritmo de lectura. Admite una duración o un valor relativo como medium.",
  ],
  rest: [
    "Abrevia los intervalos de silencio anteriores y posteriores al elemento. A diferencia de pause, estos intervalos no se colapsan con los de elementos vecinos.",
  ],
  "rest-after": [
    "Inserta un intervalo de silencio al final de la secuencia de audio del elemento.",
  ],
  "rest-before": [
    "Inserta un intervalo de silencio al inicio de la secuencia de audio del elemento.",
  ],
  speak: [
    "Determina si el motor de voz debe presentar el contenido de forma audible. never excluye el elemento de la presentación sonora.",
  ],
  "voice-balance": [
    "Ajusta el balance izquierdo y derecho de la voz sintetizada. center reparte la salida entre ambos canales.",
  ],
  "voice-duration": [
    "Solicita una duración para la presentación por voz del contenido. Con auto, la duración resulta de la velocidad de lectura y de la extensión del texto.",
  ],
  "voice-family": [
    "Ofrece una lista ordenada de voces para la síntesis de voz. El motor escoge la primera opción disponible que cumple los criterios.",
  ],
  "voice-pitch": [
    "Controla lo grave o agudo que suena el tono medio de la voz. Admite ajustes relativos o una frecuencia absoluta.",
  ],
  "voice-range": [
    "Controla cuánto varía el tono de la voz durante la frase. Es distinto de voice-pitch, que ajusta el tono medio.",
  ],
  "voice-rate": [
    "Controla la velocidad de lectura sintetizada. Un porcentaje permite aumentarla o reducirla en relación con la velocidad de referencia.",
  ],
  "voice-stress": [
    "Controla el énfasis prosódico de las palabras en el contenido hablado. Su efecto depende de las posibilidades de la voz utilizada.",
  ],
  "voice-volume": [
    "Ajusta la amplitud de la voz y de las señales de audio asociadas al elemento. silent impide que se produzca sonido.",
  ],
  "bookmark-label": [
    "Define el texto del marcador de un elemento en formatos que admiten marcadores. El marcador solo se genera cuando bookmark-level establece un nivel.",
  ],
  "bookmark-level": [
    "Establece el nivel en el árbol de marcadores del documento. none desactiva la generación de marcador para ese elemento.",
  ],
  "bookmark-state": [
    "Controla si el marcador y sus hijos se muestran inicialmente abiertos o cerrados. La salida depende del motor de publicación.",
  ],
  "string-set": [
    "Guarda contenido del documento con un nombre para reutilizarlo al generar cabeceras o pies de página. Se recupera con string().",
    "h2 { string-set: capitulo content(); }\n@page { @top-center { content: string(capitulo); } }",
  ],
  "content()": [
    "Recupera partes del contenido del elemento para usarlas en cadenas de impresión y otros contenidos generados. El argumento elige qué parte se lee.",
  ],
  "leader()": [
    "Rellena el hueco entre dos fragmentos de texto con un patrón repetido, como los puntos que separan el título y el número de página en un índice.",
  ],
  "string()": [
    "Recupera una cadena registrada por string-set para mostrarla en contenido generado. En medios paginados se puede elegir qué valor tomar cuando cambia durante una página.",
  ],
  "target-counter()": [
    "Lee un contador en el destino de una referencia. En un índice impreso, permite añadir el número de página del elemento enlazado.",
    ".indice a::after { content: target-counter(attr(href url), page); }",
  ],
  "target-counters()": [
    "Construye una secuencia a partir de los valores anidados de un contador en el destino de una referencia. El separador permite mostrar números jerárquicos como 2.3.",
  ],
  "target-text()": [
    "Inserta texto recuperado del destino de una referencia. Resulta útil cuando un enlace debe reproducir el título del elemento que apunta.",
  ],
};

const mediaStyles = {
  "any-hover": ".tarjeta:hover { outline: 2px solid currentColor; }",
  "any-pointer": ".cerrar { min-width: 44px; min-height: 44px; }",
  "color-gamut": ":root { --acento: color(display-p3 .2 .4 .95); }",
  "forced-colors": "button { outline: 1px solid ButtonText; }",
  hover: "a:hover { text-decoration-thickness: 2px; }",
  orientation: ".galeria { grid-template-columns: repeat(2, 1fr); }",
  pointer: ".herramientas button { padding: .9rem; }",
  "prefers-color-scheme": ":root { color-scheme: dark; }",
  "prefers-contrast": ".panel { border: 2px solid currentColor; }",
  "prefers-reduced-motion": ".galeria { scroll-behavior: auto; }",
  "prefers-reduced-transparency": ".panel { background: Canvas; }",
};

const eventConditions = {
  "change()": "cuando se confirma un cambio de valor",
  "click()": "al producirse un clic",
  "dblclick()": "al producirse un doble clic",
  "focusin()": "al entrar el foco",
  "focusout()": "al salir el foco",
  "input()": "al cambiar el valor mientras se edita el campo",
  "pointerdown()": "al pulsar con el puntero",
  "pointerenter()": "al entrar el puntero",
  "pointerleave()": "al salir el puntero",
  "pointerup()": "al soltar la pulsación del puntero",
  "keypress() · <event-function>":
    "al recibirse una pulsación de tecla. Su cadena opcional limita las teclas que activan el evento",
};

export function cssReferenceContext(title, source) {
  if (
    source?.includes("/animation-triggers-1/") &&
    Object.hasOwn(eventConditions, title)
  ) {
    return [
      `En el borrador de disparadores de animación, activa o desactiva el disparador ${eventConditions[title]}.`,
    ];
  }
  if (Object.hasOwn(notes, title)) return notes[title];
  if (title.startsWith("@media · ")) {
    const name = title.slice("@media · ".length);
    const feature = media[name];
    if (feature) {
      const [explanation, value] = feature;
      return [
        explanation,
        mediaStyles[name] &&
          `@media (${name}: ${value}) {\n  ${mediaStyles[name]}\n}`,
      ];
    }
  }
  const edgeRadius =
    /^border(-(?:top|bottom|left|right|block-start|block-end|inline-start|inline-end))-radius$/.exec(
      title,
    );
  if (edgeRadius) {
    return [
      `Ajusta el redondeo de las dos esquinas que delimitan ${sides[edgeRadius[1]]}. Los nombres lógicos se adaptan al modo de escritura.`,
      `.tarjeta { ${title}: 1rem; }`,
    ];
  }
  const corner =
    /^corner(?:-(top|bottom|left|right|block-start|block-end|inline-start|inline-end|top-left|top-right|bottom-left|bottom-right|start-start|start-end|end-start|end-end))?$/.exec(
      title,
    );
  if (corner) {
    const position = corner[1] && sides["-" + corner[1]];
    return [
      position
        ? `Abrevia los valores de radio y forma para las esquinas que delimitan ${position}. Es una sintaxis en borrador.`
        : corner[1]
          ? "Configura el radio y la forma de la esquina indicada. Las esquinas lógicas se identifican por la intersección de los ejes de bloque y escritura."
          : "Abrevia los radios y las formas de las cuatro esquinas. Permite combinar redondeo, recorte u otras formas definidas en el borrador.",
    ];
  }
  const overflowSide = /^overflow-clip-margin(-[a-z-]+)$/.exec(title);
  if (overflowSide && sides[overflowSide[1]]) {
    return [
      `Extiende la zona visible de overflow: clip en ${sides[overflowSide[1]]}. La distancia se mide desde la caja de referencia que indiques. El soporte de las variantes por lado puede variar.`,
      `.tarjeta { overflow: clip; ${title}: padding-box 0.5rem; }`,
    ];
  }
  const borderSide = /^border(-[a-z-]+)?-clip$/.exec(title);
  if (borderSide && sides[borderSide[1] || ""]) {
    return [
      `Dibuja solo algunos tramos de ${sides[borderSide[1] || ""]}. La lista alterna longitudes visibles y ocultas empezando por un tramo visible. Es una característica en borrador.`,
      `.marco { border: 2px solid; ${title}: 1rem 1fr 1rem; }`,
    ];
  }
  return [];
}
