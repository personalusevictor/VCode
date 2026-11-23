"""Spanish explanations for types and lookups defined by the C++20 container requirements."""

SEQUENCES = {
    "std::array", "std::vector", "std::deque", "std::forward_list",
    "std::list", "std::basic_string", "std::basic_string_view", "std::span",
}
MAPS = {"std::map", "std::multimap", "std::unordered_map", "std::unordered_multimap"}
SETS = {"std::set", "std::multiset", "std::unordered_set", "std::unordered_multiset"}
CONTAINERS = SEQUENCES | MAPS | SETS
ITERATORS = {"std::reverse_iterator", "std::move_iterator", "std::counted_iterator"}
TYPE_EXPLANATIONS = {
    "allocator_type": "Tipo del asignador que usa el contenedor. Se puede consultar sin conocer el argumento concreto de la plantilla.",
    "value_type": "Tipo de valor de la colección. Sirve para declarar un elemento con el mismo tipo que usa este contenedor.",
    "difference_type": "Tipo entero con signo para expresar distancias entre iteradores del contenedor. Una distancia puede ser negativa.",
    "size_type": "Tipo entero sin signo para representar tamaños y cantidades de elementos de este contenedor.",
    "pointer": "Tipo de puntero a un elemento según la definición de este contenedor. La declaración indica si procede de su asignador.",
    "const_pointer": "Tipo de puntero que permite leer un elemento como const. No permite modificar el elemento a través de ese puntero.",
    "reference": "Tipo de referencia que expone el contenedor para sus elementos. Consulta la declaración para saber qué cualificación const tiene.",
    "const_reference": "Tipo de referencia de solo lectura a un elemento del contenedor.",
    "iterator": "Tipo de iterador que recorre los elementos del contenedor. Se obtiene, por ejemplo, llamando a begin() sobre un contenedor no constante.",
    "const_iterator": "Iterador que recorre los elementos sin modificarlos. Se obtiene con cbegin() o al llamar a begin() sobre un contenedor const.",
    "reverse_iterator": "Tipo de iterador que recorre los elementos en sentido inverso. El recorrido empieza en rbegin() y se detiene al llegar a rend().",
    "const_reverse_iterator": "Iterador de solo lectura para recorrer el contenedor desde el último elemento hacia el primero.",
    "local_iterator": "Tipo de iterador para recorrer una sola cubeta de la tabla hash. El intervalo se obtiene con begin(n) y end(n).",
    "const_local_iterator": "Iterador de solo lectura para recorrer una sola cubeta de la tabla hash.",
    "key_type": "Tipo de las claves que recibe el contenedor para buscar, contar o eliminar entradas.",
    "mapped_type": "Tipo del valor que un mapa almacena junto a cada clave. Es el tipo de second en el par que representa la entrada.",
    "key_compare": "Tipo del comparador que mantiene las claves ordenadas. Una clave equivale a otra cuando el comparador no ordena ninguna antes de la otra.",
    "hasher": "Tipo de la función hash que usa el contenedor para distribuir las claves en cubetas.",
    "key_equal": "Tipo del predicado que determina si dos claves son equivalentes. Las claves equivalentes deben producir el mismo hash.",
    "node_type": "Tipo del manejador que puede poseer un nodo extraído del contenedor. Se puede transferir a un contenedor compatible con insert().",
    "insert_return_type": "Resultado de insertar un manejador de nodo en un contenedor de claves únicas. position indica la posición, inserted si se insertó y node conserva el nodo si no se insertó.",
    "traits_type": "Tipo de los rasgos que definen operaciones sobre los caracteres, como comparación y longitud de una secuencia.",
    "element_type": "Tipo del elemento que se ve a través de esta vista, incluidas sus cualificaciones const o volatile.",
}

def type_explanation(owner, name):
    if owner in CONTAINERS:
        if name == "value_type" and owner in MAPS:
            return "Tipo de cada entrada del mapa. Es un par que contiene la clave como const en first y el valor asociado en second."
        if name == "value_type" and owner in SETS:
            return "Tipo de cada elemento del conjunto. El elemento es también la clave con la que el contenedor lo busca."
        if name == "iterator" and owner in SETS:
            return "Iterador para recorrer el conjunto. Permite leer las claves. Para sustituir una clave, extrae o elimina la anterior y realiza una nueva inserción."
        return TYPE_EXPLANATIONS.get(name)
    if owner in ITERATORS:
        return {
            "iterator_type": "Tipo del iterador subyacente que envuelve este adaptador. base() permite recuperar ese iterador.",
            "value_type": "Tipo de valor del iterador subyacente. Distingue el tipo de valor del tipo exacto que devuelve la desreferenciación.",
            "difference_type": "Tipo de la distancia entre posiciones del iterador, derivado del iterador subyacente.",
            "reference": "Tipo que resulta al desreferenciar este adaptador. Puede ser una referencia o un tipo intermedio según el iterador subyacente.",
            "pointer": "Tipo de puntero que el adaptador obtiene de los rasgos del iterador subyacente.",
            "iterator_category": "Categoría que usan los algoritmos clásicos para saber qué operaciones admitir. Se deriva de la capacidad del iterador subyacente.",
            "iterator_concept": "Categoría que usa C++20 para comprobar los conceptos de iterador. Indica qué operaciones puede ofrecer el adaptador.",
        }.get(name)
    return None


def lookup_explanation(owner, method):
    if owner not in MAPS | SETS:
        return None
    ordered = not owner.startswith("std::unordered_")
    if method == "find":
        return {
            "intro": ["Busca una entrada cuya clave sea equivalente a la indicada."],
            "returns": ["Un iterador a una coincidencia, o end() si no existe ninguna."],
            "complexity": ["Logarítmica en size()." if ordered else "Constante en promedio y lineal en el peor caso."],
        }
    if method == "contains":
        return {
            "intro": ["Comprueba si existe una clave equivalente a la indicada."],
            "returns": ["true si hay una coincidencia o false si no la hay."],
            "caveats": ["La consulta no inserta elementos. Para obtener el iterador de una coincidencia usa find()."],
            "complexity": ["Logarítmica en size()." if ordered else "Constante en promedio y lineal en el peor caso."],
        }
    if ordered and method in {"lower_bound", "upper_bound"}:
        first = "no se ordena antes de" if method == "lower_bound" else "se ordena después de"
        return {
            "intro": [f"Busca el primer elemento cuya clave {first} la clave indicada, según el comparador del contenedor."],
            "returns": ["El iterador de ese elemento, o end() si no hay ninguno que cumpla la condición."],
            "complexity": ["Logarítmica en size()."],
        }
    if method == "count":
        return {
            "intro": ["Cuenta cuántas entradas tienen una clave equivalente a la indicada."],
            "returns": ["El número de coincidencias. En un mapa o conjunto de claves únicas solo puede devolver cero o uno."],
            "complexity": ["Logarítmica más el número de coincidencias." if ordered else "En promedio es proporcional al número de coincidencias y, en el peor caso, al tamaño del contenedor."],
        }
    if method == "equal_range":
        return {
            "intro": ["Obtiene el intervalo de todas las entradas cuya clave es equivalente a la indicada."],
            "returns": ["Un par de iteradores que delimita un intervalo semiabierto. Si no hay coincidencias, ambos iteradores son iguales."],
        }
    return None


def details_for(owner, name, signatures):
    if all(signature.startswith("using ") for signature in signatures):
        detail = type_explanation(owner, name)
        if detail:
            return {"intro": [detail]}
    lookup = lookup_explanation(owner, name)
    if lookup:
        return lookup
    member = name + "()" if "(" in signatures[0] and not signatures[0].startswith("using ") else name
    explanation = additional_explanation(owner, member, signatures)
    return {"intro": [explanation]} if explanation else None

STREAMS = {
    "std::basic_istream", "std::basic_ostream", "std::basic_iostream",
    "std::basic_stringstream", "std::basic_ifstream", "std::basic_ofstream",
    "std::istream_iterator", "std::ostream_iterator",
}
ALLOCATORS = {
    "allocator_type": "Tipo del asignador que describen estos rasgos. Se usa para asignar almacenamiento y construir elementos.",
    "value_type": "Tipo de objeto que puede almacenar el asignador.",
    "pointer": "Tipo de puntero que devuelve allocate(). Algunos asignadores usan un tipo de puntero propio.",
    "const_pointer": "Tipo de puntero a un objeto const para este asignador.",
    "void_pointer": "Tipo de puntero sin tipo de elemento derivado de los rasgos del asignador.",
    "const_void_pointer": "Tipo de puntero sin tipo de elemento que conserva la cualificación const.",
    "difference_type": "Tipo con signo para representar la diferencia entre punteros del asignador.",
    "size_type": "Tipo sin signo para representar cuántos elementos puede asignar el asignador.",
    "destroy()": "Destruye el objeto apuntado. Usa destroy del asignador si está disponible y, en caso contrario, std::destroy_at. No libera el almacenamiento.",
    "is_always_equal": "Rasgo que indica si cualquier par de instancias de este asignador puede tratarse como equivalente.",
    "propagate_on_container_copy_assignment": "Rasgo que indica si la asignación por copia de un contenedor debe sustituir también su asignador.",
    "propagate_on_container_move_assignment": "Rasgo que indica si la asignación por movimiento de un contenedor debe trasladar también su asignador.",
    "propagate_on_container_swap": "Rasgo que indica si el intercambio de dos contenedores debe intercambiar también sus asignadores.",
    "rebind_alloc": "Obtiene el tipo de asignador correspondiente a otro tipo de elemento a partir del asignador original.",
    "rebind_traits": "Obtiene los rasgos de un asignador adaptado a otro tipo de elemento.",
}
RANDOM = {
    "default_seed": "Semilla que usa el motor cuando se construye o reinicia sin proporcionar una semilla.",
    "result_type": "Tipo entero sin signo que devuelve el motor al generar un valor.",
    "word_size": "Número de bits que usa cada palabra del estado del motor.",
    "state_size": "Número de palabras que forman el estado interno del motor.",
    "shift_size": "Desplazamiento dentro del estado que se usa para seleccionar una palabra en la transición.",
    "mask_bits": "Número de bits inferiores que se toman de la segunda palabra al combinar dos palabras en la transición.",
    "xor_mask": "Máscara usada en la transición del estado según el bit menos significativo de la palabra combinada.",
    "tempering_u": "Desplazamiento a la derecha en el primer paso que transforma la palabra de salida.",
    "tempering_d": "Máscara que se combina con el resultado del primer desplazamiento a la derecha.",
    "tempering_s": "Desplazamiento a la izquierda en el segundo paso que transforma la palabra de salida.",
    "tempering_b": "Máscara que se aplica al segundo paso de transformación.",
    "tempering_t": "Desplazamiento a la izquierda en el tercer paso que transforma la palabra de salida.",
    "tempering_c": "Máscara que se aplica al tercer paso de transformación.",
    "tempering_l": "Desplazamiento a la derecha en el último paso antes de obtener el valor de salida.",
    "initialization_multiplier": "Multiplicador usado al inicializar las palabras del estado a partir de una semilla entera.",
    "operator()()": "Avanza el estado del motor y devuelve el siguiente entero seudoaleatorio. La misma semilla y el mismo uso del motor reproducen la secuencia.",
}
REGEX = {
    "ECMAScript": "Selecciona la gramática ECMAScript de expresiones regulares. Es la gramática que usa std::basic_regex por defecto.",
    "basic": "Selecciona la gramática de expresiones regulares POSIX básicas.",
    "extended": "Selecciona la gramática de expresiones regulares POSIX extendidas.",
    "awk": "Selecciona la variante de expresiones regulares empleada por awk.",
    "grep": "Selecciona la variante POSIX básica para grep. Los saltos de línea del patrón separan alternativas.",
    "egrep": "Selecciona la variante POSIX extendida para egrep. Los saltos de línea del patrón separan alternativas.",
    "icase": "Hace que las comparaciones de caracteres ignoren la diferencia de mayúsculas y minúsculas.",
    "nosubs": "Desactiva la captura de subexpresiones. mark_count() devuelve cero con esta opción.",
    "optimize": "Permite dedicar más trabajo a preparar el patrón para intentar acelerar búsquedas posteriores. No cambia qué textos coinciden.",
    "collate": "Hace que los rangos de caracteres tengan en cuenta la ordenación de la configuración regional.",
    "multiline": "En la gramática ECMAScript, permite que ^ y $ coincidan también en los límites de cada línea.",
}
BITSET = {
    "all()": "Comprueba si todos los bits están a uno. En un bitset de tamaño cero, devuelve true.",
    "any()": "Comprueba si hay al menos un bit a uno.",
    "none()": "Comprueba si todos los bits están a cero. Equivale a negar any().",
    "operator&=()": "Aplica AND bit a bit con el conjunto indicado y guarda el resultado en este objeto.",
    "operator|=()": "Aplica OR bit a bit con el conjunto indicado y guarda el resultado en este objeto.",
    "operator^=()": "Aplica XOR bit a bit con el conjunto indicado y guarda el resultado en este objeto.",
    "operator<<()": "Devuelve una copia desplazada hacia los índices mayores. Las posiciones libres se rellenan con ceros.",
    "operator>>()": "Devuelve una copia desplazada hacia los índices menores. Las posiciones libres se rellenan con ceros.",
    "operator<<=()": "Desplaza los bits de este objeto hacia los índices mayores. Las posiciones libres se rellenan con ceros.",
    "operator>>=()": "Desplaza los bits de este objeto hacia los índices menores. Las posiciones libres se rellenan con ceros.",
    "operator~()": "Devuelve un conjunto del mismo tamaño con todos los bits invertidos. El original conserva su estado.",
}
PATH = {
    "append()": "Combina la ruta con otro componente respetando las reglas de la ruta nativa. Una ruta absoluta entrante puede sustituir la ruta actual. No consulta el sistema de archivos.",
    "operator/=()": "Añade componentes a la ruta según las mismas reglas que append(). Distingue / de una concatenación literal de caracteres.",
    "is_absolute()": "Comprueba si la ruta identifica una ubicación sin depender del directorio actual. El criterio concreto depende del sistema operativo.",
    "is_relative()": "Devuelve true si la ruta no es absoluta según las reglas del sistema.",
    "lexically_relative()": "Calcula una ruta relativa respecto a la base mediante la comparación de sus componentes. No consulta el disco ni resuelve enlaces simbólicos.",
    "lexically_proximate()": "Intenta expresar la ruta respecto a la base. Si lexically_relative() no puede obtener un resultado, devuelve la ruta original.",
    "const_iterator": "Iterador bidireccional que recorre los componentes de una ruta sin modificarlos.",
    "value_type": "Tipo de carácter que usa la representación nativa de la ruta.",
    "string_type": "Tipo de cadena que almacena la representación nativa de la ruta.",
    "preferred_separator": "Separador de componentes que prefiere el sistema operativo, por ejemplo / en POSIX.",
    "operator string_type()": "Convierte la ruta a su tipo de cadena nativo. No abre ni comprueba la existencia del archivo.",
    "operator=()": "Sustituye la ruta almacenada por la indicada. Según la firma, puede copiar o mover otra ruta o convertir una secuencia de caracteres.",
    "operator<<()": "Escribe la ruta en un flujo usando formato entrecomillado para conservar espacios y caracteres especiales.",
    "operator>>()": "Lee una ruta desde un flujo de entrada. El formato entrecomillado permite leer rutas que contienen espacios.",
}
RANGES = {
    "std::ranges::ref_view": {
        "ref_view()": "Construye una vista que referencia un rango existente. El rango original debe seguir vivo mientras se use la vista.",
        "base()": "Devuelve una referencia al rango original que esta vista consulta.",
        "begin()": "Devuelve el iterador inicial del rango referenciado.",
        "end()": "Devuelve el iterador o centinela final del rango referenciado.",
        "data()": "Devuelve el puntero inicial si el rango referenciado almacena sus elementos de forma contigua.",
        "empty()": "Comprueba si el rango referenciado no contiene elementos.",
        "size()": "Devuelve el tamaño del rango referenciado cuando este admite una consulta de tamaño.",
    },
    "std::ranges::empty_view": {
        "begin()": "Devuelve un puntero nulo como inicio de la vista vacía.",
        "end()": "Devuelve el mismo puntero nulo que begin(). El intervalo nunca contiene elementos.",
        "data()": "Devuelve un puntero nulo. La vista no tiene almacenamiento de elementos.",
        "empty()": "Devuelve true. La vista representa siempre un rango vacío.",
        "size()": "Devuelve cero.",
    },
    "std::ranges::single_view": {
        "single_view()": "Construye una vista que posee un único elemento. La firma determina cómo se inicializa ese elemento.",
        "begin()": "Devuelve un puntero al único elemento de la vista.",
        "end()": "Devuelve un puntero a la posición posterior al único elemento. Sirve para delimitar el recorrido.",
        "data()": "Devuelve un puntero al elemento que almacena la vista.",
        "size()": "Devuelve uno.",
    },
    "std::ranges::filter_view": {
        "filter_view()": "Construye una vista que expone únicamente los elementos que cumplen el predicado. La selección se realiza al recorrerla.",
        "base()": "Devuelve la vista base que se está filtrando. La firma determina si la copia o la mueve.",
        "begin()": "Busca el primer elemento que satisface el predicado. Si ninguno coincide, el inicio corresponde al final del recorrido.",
        "end()": "Devuelve el límite de la vista. Su tipo depende de si la vista base usa el mismo tipo para el iterador y el final.",
        "pred()": "Devuelve una referencia constante al predicado que decide qué elementos aparecen.",
    },
    "std::ranges::reverse_view": {
        "reverse_view()": "Crea una vista que recorre un rango bidireccional en sentido inverso. No reordena los elementos del rango.",
        "base()": "Devuelve la vista cuyo orden de recorrido se ha invertido.",
        "begin()": "Devuelve el iterador inverso que arranca en el último elemento del rango base, si lo hay.",
        "end()": "Devuelve el iterador que marca el final del recorrido inverso.",
        "size()": "Devuelve el tamaño del rango base cuando este admite una consulta de tamaño.",
    },
}
MISC = {
    "std::filesystem::directory_entry": {
        "status()": "Obtiene el estado del destino asociado a la ruta. Si la ruta es un enlace simbólico, consulta el objeto al que apunta.",
        "symlink_status()": "Obtiene el estado de la propia ruta sin seguir un enlace simbólico.",
        "operator==()": "Compara las rutas de ambas entradas. No comprueba si dos rutas distintas apuntan al mismo archivo.",
        "operator<=>()": "Ordena las dos entradas comparando sus rutas.",
        "~directory_entry()": "Destruye el objeto que representa la entrada. El archivo o directorio que designa permanece en el sistema de archivos.",
    },
    "std::forward_list": {
        "before_begin()": "Devuelve el iterador a la posición anterior al primer elemento. Se usa con insert_after() o erase_after() para operar sobre el comienzo.",
        "cbefore_begin()": "Devuelve el iterador constante a la posición anterior al primer elemento. Ese iterador no se puede desreferenciar.",
        "remove()": "Elimina todos los elementos iguales al valor indicado. En C++20 devuelve cuántos elementos quitó.",
        "remove_if()": "Elimina todos los elementos para los que el predicado devuelve true. En C++20 devuelve cuántos elementos quitó.",
    },
    "std::chrono::duration": {
        "operator+()": "Devuelve la duración con el mismo recuento y periodo.",
        "operator-()": "Devuelve la duración con el recuento negado y el mismo periodo.",
        "operator+=()": "Suma el recuento de otra duración del mismo tipo al de este objeto.",
        "operator-=()": "Resta el recuento de otra duración del mismo tipo al de este objeto.",
        "operator*=()": "Multiplica el recuento de este objeto por el escalar indicado.",
        "operator/=()": "Divide el recuento de este objeto por el escalar indicado.",
        "operator%=()": "Sustituye el recuento por el resto de la división. Los tipos de representación deben admitir la operación de módulo.",
        "period": "Tipo std::ratio que expresa la duración, en segundos, de una unidad del recuento.",
        "~duration()": "Destruye el valor de duración. Deja de existir este objeto, que solo representa una cantidad de tiempo.",
    },
    "std::ratio": {
        "num": "Numerador de la fracción reducida. Si el valor es negativo, el signo se conserva en el numerador.",
        "den": "Denominador positivo de la fracción reducida.",
        "type": "Tipo std::ratio equivalente con numerador y denominador normalizados.",
    },
    "std::pmr::memory_resource": {
        "memory_resource()": "Construye la base de un recurso de memoria polimórfico. Para asignar memoria se necesita un recurso concreto que implemente sus operaciones virtuales.",
        "operator=()": "Asigna la parte base de un recurso. No sustituye por sí sola el mecanismo de asignación de una clase derivada.",
        "~memory_resource()": "Destructor virtual del recurso. Su efecto sobre el almacenamiento depende de la clase concreta que se esté destruyendo.",
    },
    "std::vector": {
        "swap()": "Intercambia el contenido y la capacidad de los dos vectores. Las referencias a elementos pasan a referirse al vector que ahora los contiene. Revisa las reglas si usas asignadores distintos.",
    },
    "std::basic_string": {
        "swap()": "Intercambia los caracteres de ambas cadenas. No presupongas que los punteros a sus caracteres siguen siendo válidos después del intercambio.",
    },
}


def additional_explanation(owner, member, signatures):
    if owner in {"std::allocator_traits", "std::allocator"} and member in ALLOCATORS:
        return ALLOCATORS[member]
    if owner in STREAMS:
        title = {
            "char_type": "Tipo de las unidades de carácter que procesa el flujo.",
            "traits_type": "Tipo de los rasgos que definen cómo compara y representa caracteres el flujo.",
            "int_type": "Tipo que representa un carácter o un valor especial como EOF sin confundirlos.",
            "off_type": "Tipo de un desplazamiento relativo dentro del flujo.",
            "pos_type": "Tipo que representa una posición del flujo. Puede incluir estado asociado a la codificación.",
            "ostream_type": "Tipo del flujo de salida al que se escribe cada valor.",
        }.get(member)
        if title:
            return title
    if owner == "std::mersenne_twister_engine":
        return RANDOM.get(member)
    if owner == "std::basic_regex":
        return REGEX.get(member)
    if owner == "std::bitset":
        return BITSET.get(member)
    if owner == "std::filesystem::path":
        return PATH.get(member)
    if owner in RANGES:
        return RANGES[owner].get(member)
    if owner != "std::pmr::memory_resource" and all("= delete" in signature for signature in signatures):
        return "La declaración está eliminada con = delete. El compilador rechaza una llamada o asignación que seleccione esta firma."
    return MISC.get(owner, {}).get(member) or remaining_explanation(owner, member)

INSERT_ADAPTORS = {"std::back_insert_iterator", "std::front_insert_iterator", "std::insert_iterator"}
INSERT_ADAPTOR_TYPES = {
    "container_type": "Tipo del contenedor al que inserta elementos este adaptador.",
    "difference_type": "Tipo de diferencia del iterador según la declaración. El adaptador es de salida y no admite calcular distancias por resta.",
    "iterator_category": "Identifica este adaptador como un iterador de salida. Los algoritmos escriben mediante una asignación, que se convierte en una inserción.",
    "pointer": "Tipo de puntero de los rasgos del iterador. Es void porque este adaptador no proporciona acceso a elementos mediante punteros.",
    "reference": "Tipo que declaran los rasgos del iterador para lectura. Es void porque el adaptador solo escribe.",
    "value_type": "Tipo de valor de lectura de los rasgos del iterador. Es void porque los algoritmos deben usar este adaptador como destino de escritura.",
}
ITERATOR_OPERATIONS = {
    "operator*()": "Accede al elemento de la posición actual. El iterador debe ser desreferenciable.",
    "operator+()": "Devuelve un iterador desplazado el número indicado de posiciones en el sentido de recorrido. No modifica el original.",
    "operator-()": "Devuelve un iterador desplazado hacia atrás cuando el argumento es un número de posiciones. La forma con dos iteradores calcula la distancia.",
    "operator++()": "Avanza una posición según el orden de recorrido del adaptador. La forma posfija usa la posición anterior conforme a las capacidades del iterador base.",
    "operator--()": "Retrocede una posición según el orden de recorrido del adaptador. La forma posfija devuelve el iterador previo al cambio.",
    "operator+=()": "Desplaza este iterador el número de posiciones indicado en el sentido de recorrido.",
    "operator-=()": "Desplaza este iterador el número de posiciones indicado en sentido contrario al recorrido.",
    "iter_swap()": "Intercambia los elementos a los que se refieren ambos iteradores. Conserva las posiciones de los iteradores.",
    "operator->()": "Permite acceder a un miembro del elemento mediante el operador flecha si el iterador base ofrece esa operación.",
    "operator==()": "Comprueba si ambos adaptadores representan la misma posición del recorrido.",
}
ITERATOR_DETAIL = {
    ("std::reverse_iterator", "operator*()"): "Accede al elemento inmediatamente anterior a base(). base() apunta a la posición siguiente al elemento que ves al desreferenciar el adaptador.",
    ("std::reverse_iterator", "operator++()"): "Avanza el recorrido inverso, decrementando el iterador subyacente. La forma posfija devuelve la posición que tenía antes de avanzar.",
    ("std::reverse_iterator", "operator--()"): "Retrocede en el recorrido inverso, incrementando el iterador subyacente.",
    ("std::reverse_iterator", "iter_swap()"): "Intercambia los elementos que preceden a las dos posiciones devueltas por base(). Los adaptadores conservan sus posiciones.",
    ("std::move_iterator", "operator*()"): "Aplica ranges::iter_move al iterador subyacente. Si el tipo lo admite, el resultado permite mover el valor en una construcción o asignación posterior.",
    ("std::counted_iterator", "operator++()"): "Avanza una posición en el rango y reduce en uno el recuento restante. No se avanza una vez agotado el recuento.",
    ("std::counted_iterator", "operator--()"): "Retrocede una posición e incrementa el recuento restante. La operación requiere un iterador base bidireccional.",
    ("std::counted_iterator", "operator==()"): "Compara los recuentos restantes. La comparación con default_sentinel comprueba si el recuento llegó a cero.",
    ("std::counted_iterator", "operator<=>()"): "Ordena dos iteradores del mismo rango a partir de sus recuentos restantes. Un recuento mayor corresponde a una posición anterior.",
    ("std::common_iterator", "operator==()"): "Compara dos posiciones del rango incluso cuando el final usa un centinela de otro tipo. Si ambos objetos almacenan un centinela, la comparación da true.",
    ("std::common_iterator", "operator-()"): "Calcula la distancia entre dos posiciones cuando los tipos admiten esa resta. Tiene en cuenta si cada adaptador almacena un iterador o un centinela.",
}
OUTPUT_ITERATOR_TYPES = {
    **INSERT_ADAPTOR_TYPES,
    "difference_type": "Tipo de diferencia de los rasgos del iterador. ostream_iterator es un iterador de salida y no define una operación de resta.",
    "iterator_category": "Categoría de iterador de salida. Al asignar un valor se escribe en el flujo asociado.",
    "pointer": "Tipo de puntero de los rasgos. Es void porque este iterador escribe y no expone un objeto por puntero.",
}

MORE = {
    "std::istream_iterator": {
        "istream_iterator()": "Sin flujo construye un iterador de fin. Con un flujo de entrada, lee el primer valor y lo guarda como valor actual.",
        "operator*()": "Devuelve una referencia de solo lectura al valor que se leyó y quedó almacenado en el iterador.",
        "operator++()": "Lee el valor siguiente con operator>>. Si la extracción no tiene éxito, el iterador pasa a representar el fin del rango.",
        "operator->()": "Devuelve un puntero al valor que el iterador conserva de la última extracción.",
        "operator=()": "Copia el estado del otro iterador. Ambos pueden seguir vinculados al mismo flujo de lectura.",
    },
    "std::sub_match": {
        "compare()": "Compara lexicográficamente el texto capturado con otra coincidencia o cadena. Devuelve un número negativo, cero o positivo según el orden.",
        "matched": "Indica si el patrón o subgrupo participó en la coincidencia. Una captura que sí coincide puede contener cero caracteres.",
        "iterator": "Tipo de los iteradores que delimitan el texto capturado.",
        "difference_type": "Tipo de la longitud o distancia entre los dos iteradores que delimitan la captura.",
        "string_type": "Tipo de cadena que devuelve str() al materializar el texto capturado.",
        "value_type": "Tipo de carácter al que apuntan los iteradores que delimitan la captura.",
    },
    "std::stack": {
        "container_type": "Tipo del contenedor que guarda los elementos por debajo del adaptador de pila.",
        "value_type": "Tipo de los elementos que puedes apilar.",
        "size_type": "Tipo que devuelve size() al indicar cuántos elementos hay en la pila.",
        "reference": "Tipo de referencia al elemento de arriba obtenido con top() sobre una pila no constante.",
        "const_reference": "Tipo de la referencia de solo lectura al elemento de arriba en una pila const.",
        "swap()": "Intercambia el contenedor interno de ambas pilas. La complejidad y las garantías dependen del intercambio de ese contenedor.",
    },
    "std::queue": {"swap()": "Intercambia el contenido de las dos colas al intercambiar sus contenedores internos."},
    "std::priority_queue": {"swap()": "Intercambia tanto los contenedores internos como los comparadores que determinan la prioridad."},
    "std::random_device": {
        "random_device()": "Crea una fuente de valores aleatorios. La implementación decide qué dispositivo o generador utiliza y qué significa un token de inicialización.",
        "operator()()": "Obtiene el siguiente entero de la fuente. La implementación decide cómo obtiene los datos y puede notificar un error si no puede producir un valor.",
        "result_type": "Tipo entero sin signo que devuelve la llamada al objeto.",
    },
    "std::ranges::basic_istream_view": {
        "basic_istream_view()": "Crea una vista sobre un flujo de entrada. Consume los valores al leer el flujo y no almacena una copia de todos ellos.",
        "begin()": "Extrae el primer valor con operator>> y devuelve el iterador de la vista.",
        "end()": "Devuelve el centinela que marca el final cuando el flujo ya no puede extraer un valor.",
    },
    "std::ranges::common_view": {
        "begin()": "Devuelve el comienzo del rango usando el mismo tipo que usa end(). Si es necesario, adapta el iterador de la vista original.",
        "end()": "Devuelve el final del rango usando el mismo tipo que usa begin(). Sirve para algoritmos que esperan ambos extremos del mismo tipo.",
    },
    "std::ranges::iota_view": {"end()": "Devuelve el iterador o centinela de la cota final. Una vista sin cota usa un centinela inalcanzable."},
    "std::chrono::time_point": {
        "operator+=()": "Desplaza este instante sumando el intervalo indicado desde el origen de su reloj.",
        "operator-=()": "Desplaza este instante restando el intervalo indicado desde el origen de su reloj.",
    },
    "std::chrono::system_clock": {
        "is_steady": "Indica si el reloj cumple el contrato de monotonicidad de C++. Comprueba su valor y usa steady_clock si necesitas medir duraciones sin saltos del reloj del sistema.",
        "now()": "Devuelve el instante actual del reloj del sistema. Sirve para obtener la hora civil, que puede ajustarse mientras el programa está en ejecución.",
    },
    "std::chrono::steady_clock": {"is_steady": "Tiene valor true. Las lecturas de este reloj no retroceden y sirven para medir intervalos."},
    "std::shared_ptr": {
        "element_type": "Tipo del elemento al que se accede. Para un tipo arreglo, se elimina su primera dimensión.",
        "weak_type": "Tipo std::weak_ptr asociado, que permite observar el objeto sin prolongar por sí solo su vida.",
    },
    "std::weak_ptr": {"element_type": "Tipo del elemento observado. Para un tipo arreglo, se elimina su primera dimensión."},
    "std::optional": {"value_type": "Tipo del valor que esta instancia puede contener. No indica si el objeto tiene actualmente un valor."},
    "std::reference_wrapper": {
        "type": "Tipo del objeto al que referencia el envoltorio.",
        "operator()()": "Invoca el objeto referenciado con std::invoke y reenvía los argumentos. Está disponible cuando el objeto admite esa llamada.",
    },
    "std::function": {
        "result_type": "Tipo de retorno de la firma que representa el envoltorio.",
        "operator()()": "Llama al objetivo almacenado y devuelve su resultado. Si el envoltorio está vacío, lanza std::bad_function_call.",
    },
    "std::list": {
        "remove()": "Borra todos los elementos que son iguales al valor indicado. En C++20 devuelve cuántos se eliminaron.",
        "remove_if()": "Borra todos los elementos que cumplen el predicado. En C++20 devuelve cuántos se eliminaron.",
    },
    "std::span": {
        "extent": "Número de elementos declarado en el tipo de la vista, o std::dynamic_extent si la longitud se decide en ejecución.",
        "~span()": "Destruye la vista sin destruir los elementos ni liberar su almacenamiento. El span no es propietario de la secuencia.",
    },
    "std::filesystem::directory_iterator": {
        "operator=()": "Sustituye la posición de este iterador por la del otro. El recorrido de directorio es de una sola pasada.",
        "~directory_iterator()": "Destruye el iterador y permite liberar sus recursos de recorrido. No elimina ninguna entrada del directorio.",
    },
    "std::basic_streambuf": {
        "pubsetbuf()": "Solicita al búfer que use el almacenamiento indicado llamando a setbuf(). La clase derivada decide qué efecto tiene esa solicitud.",
        "sgetn()": "Lee hasta el número solicitado de caracteres de la secuencia de entrada. Devuelve cuántos pudo copiar.",
    },
    "std::mutex": {"mutex()": "Construye un mutex desbloqueado. Un mismo hilo no debe intentar bloquearlo otra vez antes de liberarlo."},
    "std::recursive_mutex": {"recursive_mutex()": "Construye un mutex desbloqueado que permite varios bloqueos del mismo hilo. Cada bloqueo debe tener su desbloqueo correspondiente."},
    "std::shared_mutex": {"shared_mutex()": "Construye un mutex desbloqueado que admite tanto acceso exclusivo como acceso compartido."},
    "std::condition_variable": {"condition_variable()": "Construye una variable de condición sin hilos en espera. Se usa con un bloqueo y un predicado que describa cuándo debe continuar el hilo."},
    "std::barrier": {
        "barrier()": "Crea una barrera reutilizable para sincronizar fases. El número esperado indica cuántas llegadas completan la primera fase.",
        "arrival_token": "Tipo del valor devuelto al anunciar una llegada. Se entrega a wait() para esperar por la fase a la que corresponde.",
    },
    "std::packaged_task": {
        "operator()()": "Ejecuta el objeto invocable y deja su resultado o su excepción en el estado compartido que consulta el future.",
        "operator=()": "Transfiere la tarea y su estado compartido mediante movimiento. La tarea origen queda sin ese estado.",
    },
    "std::atomic": {"value_type": "Tipo del valor que almacena el objeto atómico. Las operaciones disponibles dependen de si se usa la plantilla general o una especialización."},
    "std::basic_string": {
        "reserve()": "Gestiona la capacidad reservada. Con un tamaño garantiza al menos esa capacidad si necesita crecer. La antigua forma sin argumentos solicita una reducción y está obsoleta en C++20.",
    },
    "std::basic_string_view": {"const_reverse_iterator": "Iterador de solo lectura que recorre los caracteres de la vista desde el último hasta el primero."},
    "std::match_results": {"match_results()": "Construye un objeto todavía sin resultados de búsqueda. ready() indica si una operación de expresiones regulares ya lo rellenó."},
    "std::unique_ptr": {"operator=()": "Sustituye el recurso que posee el puntero. Puede recibir la propiedad de otro unique_ptr por movimiento o liberar el objeto al asignar nullptr."},
    "std::allocator": {"operator=()": "Asigna un objeto std::allocator a partir de otro de su tipo. Los asignadores estándar del mismo tipo son equivalentes."},
    "std::pmr::polymorphic_allocator": {"value_type": "Tipo de elemento que asigna este adaptador sobre su memory_resource."},
    "std::set": {"value_compare": "Tipo del comparador de los elementos del conjunto. Como cada elemento es su propia clave, coincide con key_compare."},
    "std::multiset": {"value_compare": "Tipo del comparador de los elementos, que también son las claves. Los elementos equivalentes pueden aparecer más de una vez."},
    "std::basic_istream": {"basic_istream()": "Inicializa un flujo de entrada sobre un búfer asociado según la firma. Los tipos derivados también disponen de operaciones de construcción protegidas."},
    "std::basic_ostream": {"basic_ostream()": "Inicializa un flujo de salida sobre un búfer asociado según la firma. Es el búfer el que recibe los caracteres escritos."},
    "std::unique_lock": {"mutex_type": "Tipo de mutex asociado al bloqueo. Determina las operaciones de bloqueo que puede utilizar unique_lock."},
    "std::stop_token": {"operator==()": "Devuelve true si ambos tokens comparten el mismo estado de parada o si ninguno tiene estado."},
    "std::stop_source": {"operator==()": "Devuelve true si ambas fuentes controlan el mismo estado de parada o si ninguna tiene estado."},
    "std::stop_callback": {"callback_type": "Tipo del objeto invocable registrado para responder a una solicitud de parada."},
    "std::counting_semaphore": {"counting_semaphore()": "Construye un semáforo con el número inicial de permisos indicado. acquire() espera si no queda ninguno y release() repone permisos."},
    "std::latch": {"latch()": "Construye un contador de sincronización de un solo uso. Los hilos que esperan pueden continuar cuando el recuento llega a cero."},
}


def remaining_explanation(owner, member):
    if owner in INSERT_ADAPTORS:
        return INSERT_ADAPTOR_TYPES.get(member)
    if owner == "std::ostream_iterator":
        return OUTPUT_ITERATOR_TYPES.get(member)
    if owner in ITERATORS | {"std::common_iterator"}:
        return ITERATOR_DETAIL.get((owner, member), ITERATOR_OPERATIONS.get(member))
    if owner in {"std::uniform_int_distribution", "std::uniform_real_distribution"}:
        interval = "incluye ambos extremos" if owner == "std::uniform_int_distribution" else "incluye el límite inferior y excluye el superior"
        return {
            "a()": "Devuelve el límite inferior de la distribución.",
            "b()": "Devuelve el límite superior de la distribución.",
            "operator()()": f"Genera un valor a partir de un motor de números aleatorios. El intervalo de salida {interval}.",
            "param_type": "Tipo que agrupa los parámetros de la distribución. Permite usar temporalmente otros límites al generar un valor.",
            "result_type": "Tipo del número que devuelve la distribución.",
        }.get(member)
    if owner == "std::complex":
        operation = {"operator+=()": "suma", "operator-=()": "resta", "operator*=()": "multiplica", "operator/=()": "divide"}.get(member)
        if operation:
            return f"Actualiza el número complejo mediante una operación que {operation} usando el valor indicado, que puede ser real o complejo según la firma."
    if member == "native_handle_type" and owner in {
        "std::mutex", "std::recursive_mutex", "std::shared_mutex", "std::condition_variable",
        "std::thread", "std::jthread",
    }:
        return "Tipo del identificador nativo usado por la implementación. Su forma y disponibilidad dependen de la plataforma. Úsalo solo para interoperar con sus APIs."
    return MORE.get(owner, {}).get(member)
