import fs from "node:fs";
import webref from "@webref/css";
import { cssReferenceContext } from "./css-reference-context.mjs";

const css = await webref.listAll();
const labels = {
  properties: "Propiedad",
  atrules: "Regla @",
  descriptors: "Descriptor",
  selectors: "Selector",
  functions: "Función CSS",
};
const featured = {
  "grid-template-columns": [
    "Define las columnas explícitas de una cuadrícula.",
    ".lista { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(14rem, 100%), 1fr)); gap: 1rem; }",
  ],
  display: [
    "Determina cómo participa un elemento en el diseño y cómo organiza a sus hijos.",
    ".lista { display: flex; gap: 1rem; }",
  ],
  color: [
    "Define el color del texto y el valor de currentColor para el elemento.",
    ".nota { color: #2349aa; }",
  ],
  "aspect-ratio": [
    "Proporciona una proporción preferida cuando al menos una dimensión se calcula automáticamente.",
    ".portada { width: 100%; aspect-ratio: 16 / 9; object-fit: cover; }",
  ],
  "@media": [
    "Aplica reglas solo cuando se cumple una condición del medio, como el ancho de la ventana.",
    "@media (width >= 48rem) { .lista { grid-template-columns: repeat(3, 1fr); } }",
  ],
  "@container": [
    "Aplica reglas según las características de un contenedor elegible.",
    ".panel { container-type: inline-size; }\n@container (width > 30rem) { .tarjeta { display: grid; grid-template-columns: 1fr 2fr; } }",
  ],
  ":has()": [
    "Selecciona un elemento si contiene o se relaciona con otro que coincide con un selector relativo.",
    "form:has(input:invalid) button { opacity: .75; }",
  ],
  "clamp()": [
    "Acota el valor preferido entre un mínimo y un máximo.",
    "h1 { font-size: clamp(2rem, 5vw, 4rem); }",
  ],
  "minmax()": [
    "Establece un mínimo y un máximo para una pista de Grid.",
    ".lista { display: grid; grid-template-columns: minmax(12rem, 1fr) 2fr; }",
  ],
  gap: [
    "Separa pistas o ítems sin introducir margen exterior.",
    ".lista { display: grid; gap: .75rem 1.5rem; }",
  ],
  "object-fit": [
    "Controla cómo encaja el contenido de una imagen o vídeo en la caja asignada.",
    ".portada { width: 100%; height: 12rem; object-fit: cover; }",
  ],
  "margin-inline": [
    "Define los márgenes en el eje de escritura, adaptándose a la dirección del texto.",
    ".contenido { max-width: 64rem; margin-inline: auto; }",
  ],
  "box-sizing": [
    "Determina si width y height incluyen el relleno y el borde.",
    ".tarjeta { box-sizing: border-box; width: 12rem; padding: 1rem; border: 1px solid; }",
  ],
  "border-radius": [
    "Redondea esquinas mediante radios horizontales y verticales. Los porcentajes se calculan respecto a la caja del borde.",
    ".tarjeta { border-radius: 12px 12px 4px 4px; }",
  ],
  "align-items": [
    "Establece la alineación por defecto de los elementos en el eje transversal de Flexbox o el eje de bloque de Grid.",
    ".galeria { display: grid; align-items: center; }",
  ],
  "justify-content": [
    "Distribuye el espacio disponible en el eje principal de Flexbox o el eje en línea de Grid.",
    ".galeria { display: flex; justify-content: space-between; }",
  ],
  "flex-wrap": [
    "Permite que los ítems flexibles formen varias líneas cuando no caben en una sola.",
    ".galeria { display: flex; flex-wrap: wrap; gap: 1rem; }",
  ],
  flex: [
    "Abrevia el crecimiento, la reducción y la base de un elemento flexible.",
    ".galeria { display: flex; } .tarjeta { flex: 1 1 8rem; }",
  ],
  "grid-auto-flow": [
    "Determina cómo se colocan los elementos sin posición explícita. Evita dense si el cambio de orden visual perjudica la lectura.",
    ".galeria { display: grid; grid-auto-flow: row; }",
  ],
  position: [
    "Define cómo se coloca una caja. sticky cambia su relación con el contenedor de desplazamiento al cruzar un umbral.",
    ".barra { position: sticky; top: 0; }",
  ],
  "z-index": [
    "Controla el nivel de apilamiento dentro del contexto correspondiente. No compara directamente elementos en contextos distintos.",
    ".tarjeta { position: relative; z-index: 1; }",
  ],
  overflow: [
    "Controla qué sucede cuando el contenido desborda la caja. auto permite desplazarse si hace falta.",
    ".galeria { max-height: 9rem; overflow: auto; }",
  ],
  visibility: [
    "Puede ocultar visualmente una caja manteniendo su espacio en el diseño.",
    ".tarjeta:first-child { visibility: hidden; }",
  ],
  outline: [
    "Dibuja un contorno fuera del borde sin ocupar espacio en el diseño. Resulta útil para indicar el foco.",
    "button:focus-visible { outline: 3px solid royalblue; outline-offset: 4px; }",
  ],
  "box-shadow": [
    "Añade una o varias sombras a partir de la caja del borde.",
    ".tarjeta { box-shadow: 0 4px 14px #19244933; }",
  ],
  "font-size": [
    "Controla el tamaño de la fuente. rem toma como referencia la raíz y em depende del contexto.",
    ".tarjeta { font-size: 1.125rem; }",
  ],
  "line-height": [
    "Establece la altura de las cajas de línea. Un número sin unidad se multiplica por el tamaño de fuente del propio elemento.",
    ".tarjeta { line-height: 1.6; }",
  ],
  "letter-spacing": [
    "Ajusta la separación entre caracteres. Usa valores moderados que no dificulten la lectura.",
    ".tarjeta { letter-spacing: .02em; }",
  ],
  background: [
    "Abrevia las capas de fondo y sus parámetros. Una abreviatura reinicia los componentes que dejas sin especificar.",
    ".tarjeta { background: linear-gradient(145deg, white, #b6c7ff); }",
  ],
  transform: [
    "Aplica transformaciones visuales. El espacio original en el flujo del documento se conserva.",
    ".tarjeta:hover { transform: translateY(-4px); }",
  ],
  transition: [
    "Interpola propiedades entre estados cuando es posible. Indica qué cambias y respeta la preferencia de movimiento reducido.",
    ".tarjeta { transition: background-color .2s; } .tarjeta:hover { background-color: #dbeafe; }",
  ],
  "padding-inline": [
    "Establece relleno en los extremos del eje en línea conforme al modo de escritura.",
    ".tarjeta { padding-inline: clamp(.75rem, 3vw, 2rem); }",
  ],
  "color-scheme": [
    "Declara los esquemas que admite un elemento y permite que el navegador adapte controles y colores predeterminados.",
    ":root { color-scheme: light dark; }",
  ],
  "@supports": [
    "Aplica reglas si el navegador reconoce la declaración indicada. Define primero una alternativa funcional.",
    "@supports (display: grid) { .galeria { display: grid; gap: 1rem; } }",
  ],
  "@layer": [
    "Ordena capas de cascada para que las reglas no dependan solo de la especificidad de sus selectores.",
    "@layer base, componentes;\n@layer componentes { .tarjeta { color: navy; } }",
  ],
  "@keyframes": [
    "Define valores en puntos de una animación. Una propiedad animation enlaza sus fotogramas.",
    "@keyframes aparecer { from { opacity: 0; } to { opacity: 1; } }\n@media (prefers-reduced-motion: no-preference) { .tarjeta { animation: aparecer .3s both; } }",
  ],
  ":focus-visible": [
    "Selecciona el elemento enfocado cuando el navegador considera útil mostrar una indicación visual.",
    "button:focus-visible { outline: 3px solid royalblue; outline-offset: 3px; }",
  ],
  ":where()": [
    "Agrupa selectores con especificidad cero. Sirve para ofrecer estilos base fáciles de sobrescribir.",
    ":where(.tarjeta, .aviso) { padding: 1rem; }",
  ],
  ":nth-child()": [
    "Selecciona un elemento según su posición entre hermanos. Se cuenta a partir de uno.",
    ".tarjeta:nth-child(2n) { background: #e2e8ff; }",
  ],
  "var()": [
    "Sustituye una propiedad personalizada. El segundo argumento proporciona un valor alternativo si la variable no está disponible.",
    ".tarjeta { color: var(--texto, navy); }",
  ],
  "color-mix()": [
    "Mezcla colores en el espacio indicado. El espacio de color influye en el resultado de la interpolación.",
    ".tarjeta { background: color-mix(in oklab, royalblue 20%, white); }",
  ],
  "background-position-block": [
    "Coloca la imagen de fondo en el eje de bloque. En el modo de escritura horizontal, este eje es vertical. El porcentaje se calcula sobre el espacio que queda en ese eje después de descontar el tamaño de la imagen.",
    ".portada { background-position-block: end 1rem; }",
  ],
  "background-position-inline": [
    "Coloca la imagen de fondo en el eje en el que avanza el texto. El lado que corresponde a start o end depende del modo y la dirección de escritura.",
    ".portada { background-position-inline: start 2rem; }",
  ],
  "background-position-x": [
    "Ajusta la posición horizontal de cada imagen de fondo. Un 0% alinea sus bordes izquierdos con los del área de posicionamiento y un 100% alinea sus bordes derechos.",
    ".portada { background-position-x: right 1rem; }",
  ],
  "background-position-y": [
    "Ajusta la posición vertical de cada imagen de fondo. Con un 50%, la imagen y su área de posicionamiento quedan centradas en ese eje.",
    ".portada { background-position-y: bottom 1rem; }",
  ],
  "background-repeat-block": [
    "Controla si la imagen se repite en el eje de bloque. Elige no-repeat para una copia, space para separar copias enteras o round para ajustarlas al espacio disponible.",
    ".patron { background-repeat-block: no-repeat; }",
  ],
  "background-repeat-inline": [
    "Controla cómo se repite la imagen en el eje en el que avanza el texto. Con varias capas, puedes indicar un comportamiento distinto para cada imagen con una lista separada por comas.",
    ".patron { background-repeat-inline: repeat, no-repeat; }",
  ],
  "background-repeat-x": [
    "Controla la repetición horizontal del fondo por capas. El valor no-repeat conserva una sola copia en ese eje.",
    ".patron { background-repeat-x: no-repeat; }",
  ],
  "background-repeat-y": [
    "Controla la repetición vertical del fondo. El valor round ajusta el tamaño de las copias para que quepa un número entero en ese eje.",
    ".patron { background-repeat-y: round; }",
  ],
  "@font-feature-values": [
    "Define nombres para variantes OpenType de familias concretas. Actívalas en font-variant-alternates. Cada índice depende de las variantes que incluya la fuente.",
    '@font-feature-values "Mi Serif" { @swash { curvas: 1; } }\n.firma { font-family: "Mi Serif", serif; font-variant-alternates: swash(curvas); }',
  ],
  "@annotation · @font-feature-values": [
    "Da un nombre a un estilo de anotación, como caracteres enmarcados, si la fuente lo incluye. Se activa con annotation() y cada nombre se asocia a un solo índice.",
    '@font-feature-values "Mi Serif" { @annotation { marco: 1; } }\n.nota { font-variant-alternates: annotation(marco); }',
  ],
  "@character-variant · @font-feature-values": [
    "Da un nombre a una variante de caracteres de una fuente. El primer entero elige la característica OpenType cv y el segundo, si aparece, elige la variante dentro de ella.",
    '@font-feature-values "Mi Serif" { @character-variant { alternativa: 2 1; } }\n.titulo { font-variant-alternates: character-variant(alternativa); }',
  ],
  "@ornaments · @font-feature-values": [
    "Da un nombre a un juego de glifos ornamentales de la fuente. Usa ornaments() en font-variant-alternates para seleccionar el nombre.",
    '@font-feature-values "Mi Serif" { @ornaments { flor: 1; } }\n.adornos { font-variant-alternates: ornaments(flor); }',
  ],
  "@styleset · @font-feature-values": [
    "Da un nombre a uno o varios conjuntos estilísticos de la fuente. Puedes combinar varios índices en una misma declaración y activar la combinación con styleset().",
    '@font-feature-values "Mi Serif" { @styleset { editorial: 4 5; } }\n.titulo { font-variant-alternates: styleset(editorial); }',
  ],
  "@stylistic · @font-feature-values": [
    "Da un nombre a una alternativa estilística concreta de la fuente. Cada nombre se vincula a un solo índice y se puede seleccionar con stylistic().",
    '@font-feature-values "Mi Serif" { @stylistic { expresiva: 1; } }\n.titulo { font-variant-alternates: stylistic(expresiva); }',
  ],
  "@swash · @font-feature-values": [
    "Da un nombre a un conjunto de trazos caligráficos alternativos. El índice corresponde a una opción de la fuente y se activa con swash().",
    '@font-feature-values "Mi Serif" { @swash { curvas: 1; } }\n.firma { font-variant-alternates: swash(curvas); }',
  ],
  "@container · aspect-ratio": [
    "Comprueba la relación entre el ancho y el alto de la caja de contenido del contenedor. Para consultar ambos ejes, establece container-type: size.",
    ".panel { container-type: size; }\n@container (aspect-ratio > 4 / 3) { .grafica { display: grid; } }",
  ],
  "@container · block-size": [
    "Consulta el tamaño de la caja de contenido en el eje de bloque. En un modo de escritura horizontal, mide la altura. El contenedor necesita admitir consultas de tamaño en ese eje.",
    ".panel { container-type: size; }\n@container (block-size > 20rem) { .detalle { display: block; } }",
  ],
  "@container · inline-size": [
    "Consulta el tamaño disponible en la dirección en que avanza el texto. Con container-type: inline-size, el diseño de un componente puede responder al espacio que le da su contenedor.",
    ".panel { container-type: inline-size; }\n@container (inline-size > 32rem) { .tarjetas { grid-template-columns: repeat(2, 1fr); } }",
  ],
  "@container · height": [
    "Consulta el alto físico de la caja de contenido del contenedor. Usa container-type: size si el eje consultado es el de bloque.",
    ".panel { container-type: size; }\n@container (height >= 30rem) { .grafica { min-height: 24rem; } }",
  ],
  "@container · orientation": [
    "Comprueba la orientación de la caja de contenido del contenedor. portrait coincide cuando el alto es mayor o igual que el ancho y landscape cuando el ancho es mayor.",
    ".panel { container-type: size; }\n@container (orientation: landscape) { .tarjetas { display: grid; } }",
  ],
  "@container · scrollable": [
    "Detecta si queda contenido oculto al que se puede llegar desplazando el contenedor en la dirección consultada. La condición puede cambiar al llegar a un extremo del desplazamiento.",
    ".lista { container-type: scroll-state; overflow: auto; }\n@container scroll-state(scrollable: bottom) { .aviso { opacity: 1; } }",
  ],
  "@container · snapped": [
    "Detecta si un elemento objetivo está encajado en un eje de su contenedor de desplazamiento con scroll snap.",
    ".diapositiva { container-type: scroll-state; scroll-snap-align: start; }\n@container scroll-state(snapped: x) { .pie { opacity: 1; } }",
  ],
  "@container · stuck": [
    "Detecta que un elemento con position: sticky se ha pegado al borde indicado. Permite cambiar el estilo de sus descendientes mientras se mantiene adherido.",
    ".barra { container-type: scroll-state; position: sticky; top: 0; }\n@container scroll-state(stuck: top) { .titulo { text-decoration: underline; } }",
  ],
  "@container · width": [
    "Consulta el ancho físico de la caja de contenido del contenedor. Se puede combinar con operadores de rango para adaptar los elementos que contiene.",
    ".panel { container-type: size; }\n@container (width >= 40rem) { .tarjetas { grid-template-columns: repeat(3, 1fr); } }",
  ],
};
const features = [
  ...Object.keys(labels)
    .filter((key) => key !== "descriptors")
    .flatMap((key) => css[key].map((entry) => [key, entry])),
  ...css.atrules.flatMap(({ name, descriptors }) =>
    Object.values(descriptors).map((entry) => [
      "descriptors",
      { ...entry, scope: name },
    ]),
  ),
];
const pageBoxes = {
  "@top-left-corner": "la esquina superior izquierda",
  "@top-left": "la parte izquierda del margen superior",
  "@top-center": "el centro del margen superior",
  "@top-right": "la parte derecha del margen superior",
  "@top-right-corner": "la esquina superior derecha",
  "@bottom-left-corner": "la esquina inferior izquierda",
  "@bottom-left": "la parte izquierda del margen inferior",
  "@bottom-center": "el centro del margen inferior",
  "@bottom-right": "la parte derecha del margen inferior",
  "@bottom-right-corner": "la esquina inferior derecha",
  "@left-top": "la parte superior del margen izquierdo",
  "@left-middle": "el centro del margen izquierdo",
  "@left-bottom": "la parte inferior del margen izquierdo",
  "@right-top": "la parte superior del margen derecho",
  "@right-middle": "el centro del margen derecho",
  "@right-bottom": "la parte inferior del margen derecho",
};
const entries = features.map(([kind, entry]) => {
  const title = entry.scope
    ? `${entry.scope} · ${entry.name}`
    : entry.for?.length
      ? `${entry.name} · ${entry.for.join(", ")}`
      : entry.name;
  const box = entry.for?.includes("@page") && pageBoxes[entry.name];
  const [detail, example] =
    featured[title] ||
    (box
      ? [
          `Dentro de @page, coloca contenido en ${box} de cada página impresa. Usa content para generar texto, imágenes o el número de página.`,
          `@page {\n  ${entry.name} { content: "Página " counter(page); }\n}`,
        ]
      : cssReferenceContext(title, entry.href));
  return {
    id: `css-${kind}-${encodeURIComponent(title)}`,
    title,
    language: "css",
    description: labels[kind],
    group: `css-${kind}`,
    source: entry.href,
    ...(detail && { detail, example }),
    ...(entry.syntax && { syntax: entry.syntax }),
    ...(entry.initial && { initial: entry.initial }),
    ...(entry.inherited && { inherited: entry.inherited }),
    ...(entry.legacyAliasOf && { alias: entry.legacyAliasOf }),
  };
});
const unique = [...new Map(entries.map((entry) => [entry.id, entry])).values()];
const webCatalog = new URL(
  "../src/docs/data/web-catalog.json",
  import.meta.url,
);
const cssArticles = fs.existsSync(webCatalog)
  ? JSON.parse(fs.readFileSync(webCatalog, "utf8")).filter(
      ({ language }) => language === "css",
    )
  : [];
const byTitle = new Map(
  [...unique, ...cssArticles].map((entry) => [
    `${entry.group}/${entry.title}`,
    entry,
  ]),
);
const syntaxTerms = {
  "alpha-value":
    "Opacidad como número o porcentaje. Cero es transparente y el máximo es opaco.",
  angle: "Ángulo expresado con una unidad como deg, rad o turn.",
  "boolean-condition": "Condición que se evalúa como verdadera o falsa.",
  "calc-sum": "Expresión aritmética compatible con las reglas de calc().",
  color:
    "Valor de color CSS, como un nombre, un hexadecimal o una función de color.",
  "custom-ident":
    "Nombre que puedes elegir respetando las palabras reservadas del contexto.",
  "dashed-ident":
    "Identificador elegido por el autor que empieza por dos guiones, como --galeria.",
  "declaration-list": "Lista de declaraciones CSS dentro de un bloque.",
  "declaration-value":
    "Secuencia de valores que se puede escribir tras los dos puntos de una declaración.",
  "easing-function":
    "Función que ajusta cómo cambia el progreso de una animación o transición.",
  image: "Imagen CSS, que puede venir de una URL o generarse con un degradado.",
  integer:
    "Número entero sin parte decimal. La sintaxis puede limitar su rango.",
  length: "Distancia con una unidad de longitud, como px o rem.",
  "length-percentage":
    "Longitud o porcentaje. El lugar donde se usa determina la base del porcentaje.",
  number: "Número sin unidad que puede incluir una parte decimal.",
  percentage:
    "Número seguido de %. El contexto indica sobre qué cantidad se calcula.",
  "rule-list": "Lista de reglas CSS completas.",
  "selector-list": "Uno o varios selectores CSS separados por comas.",
  string: "Texto CSS entre comillas. Las comillas delimitan la cadena.",
  time: "Duración con una unidad como s o ms.",
  "transform-list":
    "Lista de funciones de transformación que se aplican como una secuencia.",
  url: "Referencia a un recurso. Una URL relativa se resuelve contra la base del documento o de la hoja que la define.",
};
for (const entry of unique) {
  if (entry.detail) continue;
  const property = entry.alias && `css-properties/${entry.alias}`;
  const scoped =
    /^(.*?) · (?:filter|<basic-shape>|<transform-function>|transform)$/.exec(
      entry.title,
    );
  const canonical = byTitle.get(
    property || (scoped && `css-functions/${scoped[1]}`),
  );
  if (!canonical || canonical.id === entry.id) continue;
  entry.relatedReference = { id: canonical.id, title: canonical.title };
  if (entry.alias) {
    entry.detail = `${entry.title} es un alias de ${canonical.title}. Consulta la propiedad principal para ver sus valores y ejemplos.`;
  } else {
    entry.detail = `${scoped[1]} es una función que se admite en el contexto indicado. Su ficha principal explica los argumentos, el resultado y los ejemplos de uso.`;
  }
}
for (const entry of unique) {
  if (entry.detail || !entry.syntax) continue;
  const terms = new Set(
    Array.from(
      entry.syntax.matchAll(/<([a-z-]+)(?:\s+\[[^\]]+\])?>/g),
      (match) => match[1],
    ),
  );
  const explanations = [...terms].flatMap((name) => {
    const explanation = Object.hasOwn(syntaxTerms, name) && syntaxTerms[name];
    if (!explanation) return [];
    const label = `<${name}>`;
    const reference = byTitle.get(`css-values/${label}`);
    return [{ label, explanation, ...(reference && { id: reference.id }) }];
  });
  if (explanations.length) entry.syntaxTerms = explanations;
}
fs.writeFileSync(
  new URL("../src/docs/data/css-reference.json", import.meta.url),
  JSON.stringify(unique, null, 2) + "\n",
);
console.log(`CSS: ${unique.length} entradas del índice W3C Webref.`);
