import { phpReferenceBucket } from "../src/docs/routes.js";

const constantFamilies = [
  [
    /^MYSQLI_TYPE_/,
    "Código de tipo de una columna en los metadatos del resultado. Compáralo con la propiedad type para distinguir el tipo SQL antes de procesar el valor.",
    ["mysqli_result::fetch_field", "mysqli_result::fetch_fields"],
  ],
  [
    /^MYSQLI_(?:NOT_NULL|PRI_KEY|UNIQUE_KEY|MULTIPLE_KEY|BLOB|UNSIGNED|ZEROFILL|AUTO_INCREMENT|TIMESTAMP|SET|NUM|PART_KEY|GROUP|NO_DEFAULT_VALUE|ENUM|BINARY|ON_UPDATE_NOW)_FLAG$/,
    "Bandera del campo flags en los metadatos de una columna. Varias banderas pueden estar activas a la vez. Usa el operador & para comprobar esta en particular.",
    ["mysqli_result::fetch_field", "mysqli_result::fetch_fields"],
  ],
  [
    /^MYSQLI_REPORT_(?:ERROR|STRICT|INDEX|ALL|OFF)$/,
    "Opción del modo de notificación de mysqli. Configúralo antes de abrir la conexión. Un modo habitual para detectar fallos es MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT.",
    ["mysqli_report"],
  ],
  [
    /^MYSQLI_OPT_/,
    "Identifica una opción de conexión. Configura las opciones con mysqli::options() después de crear el objeto y antes de conectarlo con mysqli::real_connect(). Comprueba qué versiones y controladores admiten esta opción.",
    ["mysqli::options", "mysqli::real_connect"],
  ],
  [
    /^CURLOPT_/,
    "Identifica la opción que quieres configurar en un manejador cURL. El tipo, las unidades y los valores admitidos dependen de la opción. Consulta el manual antes de asignarle un valor.",
    ["curl_setopt", "curl_setopt_array"],
  ],
  [
    /^CURLE_/,
    "Código de estado de libcurl. Usa curl_errno() para recuperar el código de la última operación del manejador y curl_strerror() para obtener su texto descriptivo.",
    ["curl_errno", "curl_strerror"],
  ],
  [
    /^CURLMOPT_/,
    "Opción de un manejador múltiple cURL. Se configura en el manejador que coordina las transferencias. Cada transferencia conserva sus propias opciones.",
    ["curl_multi_setopt", "curl_multi_init"],
  ],
  [
    /^CURLSHEOPT_/,
    "Opción que controla un manejador de datos compartidos entre transferencias cURL.",
    ["curl_share_setopt", "curl_share_init"],
  ],
  [
    /^CURLINFO_(?!HEADER_OUT$)/,
    "Identificador de un dato asociado a una transferencia cURL. Consulta curl_getinfo() después de ejecutar la transferencia. Algunas opciones solo proporcionan datos si configuraste la operación correspondiente.",
    ["curl_getinfo", "curl_exec"],
  ],
  [
    /^ZipArchive::CM_/,
    "Identifica un método de compresión ZIP. Que exista la constante no garantiza que la versión de libzip instalada pueda comprimir con ese método. Compruébalo antes de elegirlo para una entrada.",
    [
      "ZipArchive::isCompressionMethodSupported",
      "ZipArchive::setCompressionName",
    ],
  ],
  [
    /^ZipArchive::EM_/,
    "Identifica un método de cifrado para una entrada ZIP. La disponibilidad para cifrar o descifrar depende de libzip. Compruébala antes de seleccionar un método.",
    [
      "ZipArchive::isEncryptionMethodSupported",
      "ZipArchive::setEncryptionName",
    ],
  ],
  [
    /^Memcached::RES_/,
    "Código de resultado de una operación de Memcached. Consulta el código justo después de la llamada que te interesa. Otra llamada puede sustituir el resultado almacenado.",
    ["Memcached::getResultCode", "Memcached::getResultMessage"],
  ],
  [
    /^Memcached::OPT_/,
    "Identifica una opción del cliente Memcached. Usa getOption() para consultar su valor y setOption() para cambiarlo. El tipo depende de la opción.",
    ["Memcached::getOption", "Memcached::setOption"],
  ],
  [
    /^PDO::FETCH_ORI_/,
    "Indica la dirección o posición que solicita PDOStatement::fetch() cuando la consulta tiene un cursor desplazable. Comprueba que el controlador permita este tipo de cursor.",
    ["PDOStatement::fetch", "PDO::prepare"],
  ],
  [
    /^PDO::FETCH_(?!ORI_)/,
    "Modo de lectura o modificador de lectura de PDO. Determina cómo se representa una fila o cómo se organizan los resultados. Algunos modos solo se admiten en fetchAll() o requieren argumentos adicionales.",
    ["PDOStatement::fetch", "PDOStatement::fetchAll"],
  ],
  [
    /^PDO::PARAM_(?:BOOL|NULL|INT|STR|LOB)$/,
    "Tipo explícito para un parámetro de una consulta preparada. Se pasa al asociar un valor o una variable con el marcador. El controlador se encarga de enviarlo a la base de datos.",
    ["PDOStatement::bindValue", "PDOStatement::bindParam"],
  ],
  [
    /^SOCKET_E[A-Z0-9]+$/,
    "Código de error relacionado con la extensión sockets. Comprueba el resultado de la operación y consulta socket_last_error() tras el fallo. El valor numérico y la disponibilidad pueden variar entre sistemas operativos.",
    ["socket_last_error", "socket_strerror"],
    "sockets",
  ],
  [
    /^U_(?:[A-Z0-9_]+_(?:ERROR|WARNING)|ZERO_ERROR)$/,
    "Código de estado de ICU. Usa intl_is_failure() para saber si indica un fallo. Un aviso de ICU puede acompañar a una operación que sí consiguió producir un resultado.",
    ["intl_is_failure", "intl_get_error_code", "intl_error_name"],
    "intl",
  ],
  [
    /^imagick::COMPOSITE_/i,
    "Operador de composición. Decide cómo se combinan los píxeles de la imagen superpuesta y los de la imagen de destino. El resultado puede depender de sus canales alfa.",
    ["Imagick::compositeImage", "Imagick::getImageCompose"],
    "imagick",
  ],
  [
    /^imagick::COLORSPACE_/i,
    "Identifica un espacio de color de ImageMagick. Usa getImageColorspace() para consultar el espacio actual y transformImageColorspace() para convertir los valores de los píxeles.",
    ["Imagick::getImageColorspace", "Imagick::transformImageColorspace"],
    "imagick",
  ],
  [
    /^imagick::FILTER_/i,
    "Filtro de remuestreo. Indica cómo se calculan los píxeles de la imagen redimensionada a partir de los píxeles originales. El filtro afecta la nitidez y el suavizado.",
    ["Imagick::resizeImage"],
    "imagick",
  ],
  [
    /^imagick::EVALUATE_/i,
    "Operación matemática que se aplica a los píxeles de los canales seleccionados. El significado del argumento numérico depende de la operación.",
    ["Imagick::evaluateImage"],
    "imagick",
  ],
  [
    /^imagick::ALPHACHANNEL_/i,
    "Modo para ajustar el canal alfa de una imagen. Según el modo, puede activar la transparencia, ocultarla o modificar los valores del canal.",
    ["Imagick::setImageAlphaChannel", "Imagick::getImageAlphaChannel"],
    "imagick",
  ],
  [
    /^imagick::IMGTYPE_/i,
    "Identificador de un tipo de imagen que describe su organización de canales o paleta. Algunos valores se usan para solicitar una conversión y no describen un tipo que el lector pueda devolver.",
    ["Imagick::getImageType", "Imagick::setImageType"],
    "imagick",
  ],
  [
    /^ZipArchive::ER_/,
    "Código de estado de la extensión ZIP. En funciones como ZipArchive::open(), un entero distinto de true indica un fallo. Comprueba el valor con una comparación estricta.",
    ["ZipArchive::open", "ZipArchive::getStatusString"],
    "zip",
  ],
  [
    /^IMAGETYPE_(?!COUNT$|UNKNOWN$)/,
    "Identificador del formato detectado en los metadatos de una imagen. El tercer valor de getimagesize() se puede comparar con esta constante. Obtener dimensiones no valida todo el archivo.",
    ["getimagesize", "image_type_to_mime_type"],
    "image",
  ],
];

export function writePhpReference(catalog, readModule, writeBlock) {
  const byId = new Map(catalog.map((record) => [record.id, record]));
  const byTitle = new Map(
    catalog.map((record) => [record.title.toLowerCase(), record]),
  );
  const link = ({ id, title }) => ({ id, title });
  function lookup(name) {
    const title = name.replace(/^\\/, "").toLowerCase();
    return byTitle.get(title) || byTitle.get(`${title.replace(/\(\)$/, "")}()`);
  }

  const modules = new Map();
  const blocks = new Map();
  const references = new Map();
  const returnUses = new Map();
  const parameterUses = new Map();

  function readEntry({ id, extension }) {
    if (!modules.has(extension))
      modules.set(
        extension,
        new Map(readModule(extension).map((record) => [record.id, record])),
      );
    const record = modules.get(extension).get(id);
    if (!record) throw new Error(`Falta la referencia PHP ${id}.`);
    return record;
  }

  for (const indexed of catalog) {
    const record = readEntry(indexed);
    const { related, members, returnValues, ...entry } = record;
    const owner =
      !entry.label && entry.title.includes("::")
        ? lookup(entry.title.split("::")[0])
        : null;
    const family =
      entry.label === "Constante PHP" &&
      constantFamilies.find(
        ([pattern, , , extension]) =>
          (!extension || extension === entry.extension) &&
          pattern.test(entry.title),
      );
    if (family) entry.usageContext = family[1];
    const connections = [
      owner,
      ...related.map(lookup),
      ...(family ? family[2].map(lookup) : []),
    ].filter((item) => item && item.id !== entry.id);
    if (connections.length)
      entry.connections = [
        ...new Map(connections.map((item) => [item.id, link(item)])).values(),
      ];
    if (entry.alias) {
      const target = lookup(entry.alias);
      if (target) {
        entry.aliasLink = link(target);
        const canonical = readEntry(target);
        entry.aliasDocumentation = {
          locale: canonical.locale,
          description: canonical.description?.length
            ? canonical.description.slice(0, 2)
            : [canonical.summary].filter(Boolean),
          returns: canonical.returns?.slice(0, 2),
        };
      }
    }
    if (members?.length)
      entry.methodLinks = members
        .map((member) => byId.get(member))
        .filter(Boolean)
        .map(({ id, title }) => ({ id, title: title.split("::")[1] }));
    if (returnValues)
      entry.returnValues = returnValues.map((row) => {
        const target = lookup(row.value);
        if (!target) return row;
        if (target.label === "Constante PHP" && target.id !== entry.id) {
          if (!returnUses.has(target.id)) returnUses.set(target.id, []);
          returnUses
            .get(target.id)
            .push({ ...link(entry), meaning: row.meaning });
        }
        return { ...row, id: target.id };
      });

    for (const signature of entry.signatures || []) {
      for (const parameter of signature.parameters) {
        for (const note of parameter.notes || []) {
          if (note.length > 300) continue;
          const names = new Set(
            note.match(/(?<![\w:])(?:[\w\\]+::)?[A-Z_][A-Z0-9_]{3,}(?!\w)/g),
          );
          for (const name of names) {
            const constant = lookup(name);
            if (
              !constant ||
              constant.label !== "Constante PHP" ||
              constant.extension !== entry.extension
            )
              continue;
            if (!parameterUses.has(constant.id))
              parameterUses.set(constant.id, []);
            const uses = parameterUses.get(constant.id);
            if (
              uses.length < 3 &&
              !uses.some(
                ({ id, parameter: argument }) =>
                  id === entry.id && argument === parameter.name,
              )
            ) {
              uses.push({
                ...link(entry),
                parameter: parameter.name,
                note,
                locale: entry.locale,
              });
            }
          }
        }
      }
    }

    references.set(entry.id, entry);
    const bucket = phpReferenceBucket(entry.id);
    if (!blocks.has(bucket)) blocks.set(bucket, []);
    blocks.get(bucket).push(entry);
  }
  for (const [id, uses] of returnUses) references.get(id).returnUses = uses;
  for (const [id, uses] of parameterUses)
    references.get(id).parameterUses = uses;
  for (const [bucket, entries] of blocks)
    writeBlock(`php-ref-${bucket}`, entries);
}
