"""Spanish explanations for Java SE 21 operations with sparse source comments."""

STRING_OPERATIONS = {
    "appendCodePoint": (
        "Añade un punto de código Unicode al final de la secuencia.",
        "Un punto de código fuera del plano básico ocupa dos unidades char. Devuelve el mismo objeto para encadenar llamadas.",
    ),
    "capacity": (
        "Devuelve cuántas unidades char caben en el almacenamiento actual sin ampliarlo.",
        "La capacidad puede ser mayor que length(), que cuenta las unidades char que contiene la secuencia.",
    ),
    "codePointAt": (
        "Devuelve el punto de código Unicode que empieza en el índice indicado.",
        "El índice se mide en unidades char. Si empieza un par sustituto válido, devuelve el punto de código que forman las dos unidades.",
    ),
    "codePointBefore": (
        "Devuelve el punto de código Unicode inmediatamente anterior al índice indicado.",
        "El índice debe estar entre 1 y length(), ambos incluidos. Un par sustituto válido se interpreta como un solo punto de código.",
    ),
    "codePointCount": (
        "Cuenta los puntos de código Unicode del intervalo indicado.",
        "El índice inicial se incluye y el final se excluye. Los índices cuentan unidades char. Una unidad sustituta sin pareja cuenta como un punto de código.",
    ),
    "delete": (
        "Elimina el intervalo de caracteres que empieza en start e incluye hasta antes de end.",
        "Si end supera length(), se elimina hasta el final de la secuencia. Devuelve el mismo objeto.",
    ),
    "deleteCharAt": (
        "Elimina la unidad char que ocupa el índice indicado.",
        "Si necesitas eliminar un punto de código suplementario, comprueba si ocupa dos unidades char y elimina el intervalo completo con delete().",
    ),
    "ensureCapacity": (
        "Reserva almacenamiento para al menos la capacidad mínima indicada.",
        "La llamada conserva el contenido y su longitud. Un mínimo menor o igual que cero no tiene efecto.",
    ),
    "getChars": (
        "Copia las unidades char de un intervalo a un arreglo existente.",
        "srcBegin se incluye y srcEnd se excluye. destBegin indica dónde empieza la escritura en el arreglo de destino.",
    ),
    "indexOf": (
        "Busca la primera aparición de la cadena indicada.",
        "La sobrecarga con fromIndex empieza la búsqueda a partir de ese índice. Devuelve el índice inicial de la coincidencia o -1.",
    ),
    "insert": (
        "Inserta un valor en la posición indicada y desplaza el contenido posterior.",
        "El índice de inserción se mide en unidades char. La sobrecarga determina si se inserta una secuencia, un intervalo o la representación textual de un valor.",
    ),
    "lastIndexOf": (
        "Busca la última aparición de la cadena indicada.",
        "La sobrecarga con fromIndex limita el índice inicial de la coincidencia. Devuelve el índice inicial encontrado o -1.",
    ),
    "offsetByCodePoints": (
        "Encuentra un índice moviéndose el número indicado de puntos de código desde un índice dado.",
        "Un desplazamiento negativo retrocede. El índice que devuelve se mide en unidades char.",
    ),
    "repeat": (
        "Añade al final varias copias de una secuencia o de un punto de código Unicode. Está disponible desde Java 21.",
        "count indica el número de copias. Si es cero, no añade nada. Un valor negativo provoca IllegalArgumentException.",
    ),
    "replace": (
        "Sustituye un intervalo de la secuencia por el contenido de un String.",
        "start se incluye y end se excluye. Si end supera length(), se sustituye hasta el final de la secuencia.",
    ),
    "reverse": (
        "Invierte el orden de los caracteres dentro del objeto.",
        "Los pares sustitutos válidos conservan su orden interno. Devuelve este mismo objeto con el contenido invertido.",
    ),
    "setCharAt": (
        "Cambia la unidad char que ocupa un índice existente.",
        "La longitud se conserva. El índice debe estar entre cero y length() - 1.",
    ),
    "setLength": (
        "Cambia la longitud de la secuencia.",
        "Si la longitud disminuye, se eliminan las unidades finales. Si aumenta, las posiciones nuevas se rellenan con el carácter nulo U+0000.",
    ),
    "substring": (
        "Devuelve un String que contiene una parte de la secuencia.",
        "El índice inicial se incluye y el final se excluye. Con un solo índice, el intervalo llega hasta el final. El objeto original conserva su contenido.",
    ),
    "toString": (
        "Devuelve un String con el contenido actual de la secuencia.",
        "Los cambios posteriores en el constructor de cadenas no cambian ese String.",
    ),
    "trimToSize": (
        "Intenta reducir el almacenamiento reservado para la secuencia.",
        "Conserva los caracteres y su longitud. La implementación puede dejar su capacidad como estaba.",
    ),
}

PROPERTIES = {
    "compute": ("Calcula un nuevo valor a partir de la clave y de su valor actual.", "Si la función devuelve null, elimina la asociación que hubiera para esa clave."),
    "computeIfAbsent": ("Calcula y almacena un valor solo si falta la clave.", "Si la función devuelve null, deja la clave sin asociar."),
    "computeIfPresent": ("Calcula un nuevo valor para una clave que ya tiene una asociación.", "Si la función devuelve null, elimina esa asociación."),
    "getOrDefault": ("Devuelve el valor almacenado para la clave o el valor alternativo si falta.", "Consulta las asociaciones de este mapa. Usa getProperty() cuando quieras buscar también en las propiedades predeterminadas."),
    "merge": ("Asocia un valor a la clave si no existe. Si existe, combina el valor actual y el nuevo mediante la función indicada.", "Si la combinación devuelve null, elimina la asociación."),
    "put": ("Asocia la clave al valor indicado y devuelve el valor anterior, si lo había.", "Para claves y valores de texto, usa setProperty() para que puedan guardarse con store()."),
    "putAll": ("Copia las asociaciones del mapa recibido a este objeto.", "Si una clave ya existía, su valor se sustituye. Mantén claves y valores de tipo String al usar Properties como archivo de configuración."),
    "putIfAbsent": ("Añade la pareja clave-valor solo si falta la clave.", "Devuelve el valor anterior o null si realizó la inserción."),
    "replace": ("Sustituye el valor de una clave que ya existe.", "Con dos argumentos devuelve el valor anterior. Con tres exige que coincida el valor esperado y devuelve si realizó el cambio."),
    "replaceAll": ("Sustituye cada valor por el resultado de aplicar una función a su clave y al valor actual.", "El mapa Properties no admite valores null."),
}

ITERABLES = {
    "ArrayBlockingQueue", "ArrayDeque", "ArrayList", "ConcurrentHashMap.KeySetView",
    "ConcurrentLinkedDeque", "ConcurrentLinkedQueue", "CopyOnWriteArrayList", "CopyOnWriteArraySet",
    "LinkedBlockingDeque", "LinkedBlockingQueue", "LinkedTransferQueue", "PriorityBlockingQueue",
    "PriorityQueue", "Vector",
}
MAPS = {"ConcurrentSkipListMap", "Properties", "Provider"}
DOM_EXCEPTIONS = {"DOMException", "EventException", "LSException", "RangeException"}
CALENDAR_DATES = {"HijrahDate", "JapaneseDate", "MinguoDate", "ThaiBuddhistDate"}
SPECIAL = {
    ("ArrayList", "equals"): ("Compara la lista con otro objeto.", "Devuelve true si el otro objeto es una lista del mismo tamaño y sus elementos correspondientes son iguales en el mismo orden."),
    ("ArrayList", "hashCode"): ("Calcula el código hash de la lista según sus elementos y su orden.", "Listas iguales devuelven el mismo hash. Cambiar los elementos puede cambiar el resultado."),
    ("AbstractRegionPainter", "paint"): ("Dibuja la región en el contexto Graphics2D recibido.", "El componente y las dimensiones proporcionan el contexto y el tamaño del área de dibujo."),
    ("BasicAttribute", "clone"): ("Crea una copia del atributo.", "Los objetos que sirven de valores se comparten. La copia no clona cada objeto."),
    ("BasicAttributes", "clone"): ("Crea una copia del conjunto de atributos.", "Los objetos Attribute de la colección se comparten con la copia."),
    ("ObjectInputStream", "close"): ("Cierra el flujo de entrada de objetos y libera sus recursos.", "La operación puede lanzar IOException si falla el cierre."),
    ("ConcurrentHashMap.KeySetView", "equals"): ("Compara las claves visibles con los elementos de otro conjunto.", "Aplica la igualdad definida en Set. El orden del recorrido no interviene."),
    ("ConcurrentHashMap.KeySetView", "getMap"): ("Devuelve el ConcurrentHashMap al que pertenece esta vista de claves.", "Es el mapa que respalda la vista, no una copia."),
    ("ConcurrentHashMap.KeySetView", "hashCode"): ("Calcula el código hash del conjunto de claves según el contrato de Set.", "El resultado es la suma de los códigos hash de sus elementos."),
    ("ConcurrentHashMap.KeySetView", "removeAll"): ("Elimina las claves que también están en la colección indicada.", "La eliminación se refleja en el mapa asociado. Devuelve true si cambió el conjunto."),
    ("ConcurrentLinkedQueue", "removeAll"): ("Elimina todos los elementos de la cola que aparecen en la colección indicada.", "Devuelve true si la cola cambió. Con modificaciones concurrentes, la operación en bloque no actúa como un único paso atómico."),
    ("ConcurrentLinkedQueue", "retainAll"): ("Elimina de la cola los elementos que no aparecen en la colección indicada.", "Devuelve true si la cola cambió. Con modificaciones concurrentes, la operación en bloque no actúa como un único paso atómico."),
    ("ConcurrentSkipListMap", "replaceAll"): ("Calcula un valor nuevo para cada clave a partir de la clave y del valor actual.", "El mapa no admite valores null. Ante cambios concurrentes, la función puede volver a aplicarse a una misma clave."),
    ("BasicComboBoxRenderer", "getListCellRendererComponent"): ("Devuelve el componente que representa un valor del cuadro combinado.", "Los argumentos indican el valor, la posición y si se muestra seleccionado o enfocado."),
    ("DefaultListCellRenderer", "getListCellRendererComponent"): ("Configura y devuelve el componente que Swing usa para pintar una celda de la lista.", "Recibe el valor y los estados de selección y foco. Se suele reutilizar un solo componente para varias celdas."),
    ("RMIConnectorServer", "getAddress"): ("Devuelve la dirección del servidor de conectores para que un cliente pueda conectarse.", "Devuelve null si el servidor todavía no está activo o si no expone una dirección."),
    ("Package", "getDeclaredAnnotationsByType"): ("Devuelve las anotaciones del tipo indicado que declara el paquete.", "Busca también dentro de la anotación contenedora de un tipo repetible. Devuelve un arreglo vacío si no hay coincidencias."),
    ("Provider", "getOrDefault"): ("Busca el valor almacenado para la clave indicada en este proveedor.", "Si la clave no está asociada a un valor, devuelve el valor alternativo recibido."),
}


def localized_context(owner, name):
    if owner in {"StringBuilder", "StringBuffer"}:
        return STRING_OPERATIONS.get(name)
    if owner == "Properties" and name in PROPERTIES:
        return PROPERTIES[name]
    if name == "forEach" and owner in ITERABLES:
        return (
            "Aplica la acción recibida a cada elemento de la colección.",
            "Si la acción lanza una excepción, se propaga. El orden depende del contrato de recorrido de esta colección.",
        )
    if name == "forEach" and owner in MAPS:
        return (
            "Aplica la acción recibida a cada asociación del mapa.",
            "La acción recibe primero la clave y después el valor. Si lanza una excepción, se propaga.",
        )
    if owner in DOM_EXCEPTIONS and name == "code":
        return ("Contiene el código numérico que identifica la causa del error DOM.", "Compáralo con las constantes de esta clase para distinguir errores sin analizar el mensaje.")
    if owner in DOM_EXCEPTIONS and name == "<init>":
        return ("Construye una excepción DOM con código de error y mensaje.", "El parámetro code identifica el tipo de error. message aporta la descripción de esta incidencia.")
    if owner in CALENDAR_DATES and name == "toString":
        return ("Devuelve una representación textual de la fecha en su calendario.", "Usa un formateador con la cronología correspondiente cuando necesites controlar el formato de salida.")
    if owner in {"ChronoField", "ChronoUnit"} and name == "toString":
        return ("Devuelve el nombre legible del campo o de la unidad temporal.", "Para obtener el identificador exacto de la constante de la enumeración, usa name().")
    return SPECIAL.get((owner, name))
