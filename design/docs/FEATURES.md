# Features

## Mesa de juego

### Mesa infinita con navegación pan/zoom

Superficie de juego navegable arrastrando (pan) y con la rueda del ratón (zoom, acotado a un rango razonable), donde se renderizan los componentes de la partida. La posición y el zoom se mantienen tal como los deja el usuario durante toda la sesión, incluida cualquier acción que refresque la pantalla (mover/editar/añadir/eliminar un componente); no se persisten entre recargas de página.

Un botón "Ajustar zoom" (solo icono, con etiqueta accesible y tooltip nativo) reencuadra la vista al instante (sin animación) para que todos los componentes existentes queden visibles a la vez, con margen respecto al borde de la pantalla. Está disponible en el extremo superior derecho en ambos modos: como último botón de la barra de edición en modo edición, y como botón flotante junto a "Entrar en modo edición" en modo juego. Si no hay ningún componente, deja la vista neutra por defecto (zoom 1, centrada en el origen); si el contenido es muy pequeño o hay un único componente, el zoom se acerca como mucho hasta el límite máximo ya existente para el zoom manual. El resultado no se persiste, igual que el resto de posición/zoom de la mesa.

- **Disponible en**: modo juego y modo edición.
- **Código**: 00002, 00016, 00021.

### Alta/edición/borrado de componentes con modal de tabs

Modal con dos pestañas ("Generales" con el `id` editable, y "Específicas" según el tipo de componente) para crear o editar un componente, con validación de `id` no vacío y único. Al editar un componente ya existente (no al crear uno nuevo), la modal incluye además un botón "Eliminar" en el extremo izquierdo de la zona de botones, con el mismo estilo destructivo (rojo) que el resto de acciones de borrado de la app; pide confirmación igual que el borrado desde el panel flotante y, si se confirma, borra el componente y cierra la modal (limpiando también la selección en el editor si el componente eliminado era el seleccionado). Es un camino alternativo al borrado desde el panel flotante, no lo sustituye.

Al pulsar "+ Añadir componente" se muestra antes una modal previa con la lista de tipos disponibles ("Cuadro de texto", "Tablero", "Dado", "Visor de documentos" o "Carta/Ficha", cada uno en una fila seleccionable) y botones "Cancelar"/"Aceptar". Al aceptar, el componente se crea y se añade de inmediato con los valores por defecto de ese tipo, y a continuación se abre esta misma modal de configuración ya sobre ese componente para ajustar sus propiedades — el tipo, una vez elegido, no se puede cambiar.

La pestaña "Generales" incluye también el checkbox "Bloqueado" (marcado por defecto para cualquier tipo salvo "Carta/Ficha", ver [Componente "carta"](#componente-carta)), que determina si ese componente concreto queda fijo o puede arrastrarse libremente por la mesa durante el modo juego (ver [Posición independiente, arrastre y redimensionado de componentes](#posición-independiente-arrastre-y-redimensionado-de-componentes)); el checkbox "Mostrar tooltip" (ver [Identificación de componentes al pasar el ratón](#identificación-de-componentes-al-pasar-el-ratón)); y el checkbox "Subir al mover/interactuar" (ver [Subir al mover/interactuar](#subir-al-moverinteractuar)). Junto a la etiqueta de cada uno hay un icono de ayuda "?" que muestra, al pasar el ratón por encima, una breve explicación de qué hace el checkbox — patrón de ayuda contextual reutilizable en toda la app (tooltip para textos cortos, ventana modal para textos largos o con formato).

- **Disponible en**: modo edición — desde el panel flotante de componentes o haciendo doble click directamente sobre la representación del componente en la mesa.
- **Código**: 00002, 00003, 00004, 00013, 00015, 00018, 00019, 00020, 00029, 00053, 00061, 00087.

### Panel flotante de componentes, con selección, resaltado, arrastre y redimensionado

Panel flotante sobre la mesa (por defecto en la esquina superior derecha), colapsable, con el listado de componentes en tabla (columnas Id, Tipo, Acciones). El botón "Editar" abre la modal de edición; "Clonar" (entre "Editar" y "Eliminar") crea de inmediato, sin pedir confirmación, una copia completa e independiente del componente; "Eliminar" borra el componente, pidiendo confirmación previa. Al hacer click sobre una fila, o directamente sobre la representación del componente en la mesa, se selecciona (selección única, con toggle al volver a hacer click en cualquiera de los dos sitios) y se resalta con un contorno discontinuo la representación del componente en la mesa. La tabla soporta scroll vertical si el contenido supera la altura disponible.

Al clonar: el id del clon se construye a partir del id del original quitándole cualquier sufijo `(n)` que ya tuviera (para que los clones de un clon compartan la misma familia) y añadiéndole `(n)` con el siguiente entero libre para esa raíz (p. ej. "abc" → "abc(1)"; si "abc(1)" ya existe → "abc(2)"; si se elimina "abc(1)" y no queda otro clon de esa raíz, el hueco "abc(1)" se reutiliza). El clon se coloca siempre en el primer puesto del orden de apilado (queda por encima de todos, igual que un componente creado desde cero — ver [Orden de apilado en la mesa](#orden-de-apilado-en-la-mesa)) y aparece en la mesa con un pequeño desplazamiento respecto a la posición del original, mismo criterio que al añadir un componente nuevo, para no quedar superpuesto. Tras clonar no se abre ninguna modal: el clon queda ya creado y visible, y puede editarse después con "Editar" como cualquier otro componente.

El panel puede arrastrarse por la pantalla agarrando su cabecera (restringido al área visible de la mesa) y redimensionarse arrastrando un único manejador combinado en su esquina inferior derecha, que ajusta a la vez ancho y alto (mínimo 290px de ancho y el alto mínimo justo para ver la cabecera de la tabla más una fila; sin límite máximo en ninguno de los dos ejes salvo no salirse del área de la mesa por la derecha o por abajo) — funciona igual expandido o colapsado, aunque estando colapsado no hay zona de listado visible y solo se ajusta el ancho. Al cambiar el alto, lo que crece o decrece es la zona de listado (la tabla); la cabecera y el pie mantienen siempre su alto. Además, el ancho de cada columna de la tabla puede ajustarse manualmente arrastrando el borde derecho de su cabecera (mínimo 60px por columna, sin límite máximo); si la suma de anchos de columna supera el ancho visible del panel, la tabla muestra scroll horizontal. La posición, el ancho y el alto del panel, el estado colapsado/expandido y el ancho de cada columna se guardan automáticamente (ver [Autoguardado en el navegador](#autoguardado-en-el-navegador)) y se recuperan al recargar la página, incluso tras colapsar y expandir de nuevo el panel. La selección de fila es la única parte de este panel que no se persiste: es estado momentáneo de la sesión de edición en curso y se pierde al recargar.

La tabla incluye además una primera columna "Orden" con un cuadro de texto numérico por fila (ver [Orden de apilado en la mesa](#orden-de-apilado-en-la-mesa)).

- **Disponible en**: modo edición.
- **Código**: 00005, 00007, 00009, 00014, 00027, 00043, 00064, 00066, 00083.

### Panel flotante de recursos, con filtro de texto

Panel flotante en modo edición (análogo al panel de componentes: colapsable, arrastrable por su cabecera, redimensionable en ancho y alto con el mismo manejador combinado en su esquina inferior derecha, sin límite máximo salvo el mínimo de 290px de ancho y el mínimo de alto para ver la cabecera de la tabla más una fila, y con el ancho de columna ajustable manualmente igual que en el panel de componentes) con el listado de recursos disponibles (imágenes y tipografías) en tabla (columnas Nombre, Tipo, Acciones), usado desde las modales de componentes que permiten elegir una imagen o tipografía (ver [Componente "tablero"](#componente-tablero), [Componente "dado"](#componente-dado) y [Componente "carta"](#componente-carta)).

Cuando hay al menos un recurso, la cabecera del panel muestra un cuadro de texto de filtro ("Filtrar recursos…"). Al escribir, la tabla se actualiza en vivo (carácter a carácter) mostrando solo los recursos cuyo nombre, tipo mostrado ("Imagen"/"Tipografía") o identificador interno coincidan parcialmente con el texto escrito, de forma insensible a mayúsculas/minúsculas y a tildes. Si no hay coincidencias, la tabla se sustituye por un mensaje indicándolo. El texto del filtro es estado transitorio de la sesión de edición: no se guarda y se resetea al recargar la página.

- **Disponible en**: modo edición.
- **Código**: 00042, 00064, 00083.

### Panel flotante de mazos, con edición y borrado

Panel flotante en modo edición (análogo a los paneles de componentes y recursos: colapsable, arrastrable por su cabecera, redimensionable en ancho y alto con el mismo manejador combinado en su esquina inferior derecha, sin límite máximo salvo el mínimo de 290px de ancho y el mínimo de alto para ver la cabecera de la tabla más una fila), apilado por defecto debajo del panel de Recursos, con el listado de mazos en tabla (columnas Nombre, Acciones) — sin columna "Tipo" (los mazos no tienen), sin cuadro de filtro de texto, sin acción de clonar y sin fila seleccionable/resaltada sobre ninguna mesa (los mazos no tienen representación visual propia).

El botón "+ Añadir mazo" abre una ventana mínima con un único campo "Nombre" (no se acepta vacío ni names que ya estén en uso por otro mazo, comparación recortada y sin distinguir mayúsculas/minúsculas) y botones Cancelar/Aceptar. El botón "Editar" de cada fila abre la misma ventana con el nombre ya prellenado (único campo editable) y añade además un botón "Eliminar" dentro de la propia ventana — mismo doble camino de borrado (desde la fila y desde dentro de la ventana de edición) que ya ofrecen Componentes y Recursos. El botón "Eliminar" (en la fila o en la ventana de edición) comprueba primero si el mazo está siendo usado por alguna carta:

- **Si no está en uso**: pide la confirmación estándar ya usada en el resto de la app ("¿Eliminar el mazo X?") y, si se acepta, borra el mazo directamente.
- **Si está en uso**: a diferencia del bloqueo de borrado de Recursos, aquí se muestra una ventana de confirmación con la lista de las cartas afectadas (sus identificadores), avisando de que se borrará el mazo y esas cartas quedarán sin mazo asignado ("Sin mazo"). Si se acepta, se borra el mazo y esas cartas pasan a "Sin mazo"; si se cancela, no se hace ningún cambio.

Renombrar un mazo no afecta a ninguna carta que lo tenga asignado: solo cambia el nombre visible, la carta sigue apuntando al mismo mazo. El mazo puede seguir creándose al vuelo desde la modal de configuración de una carta (ver [Componente "carta"](#componente-carta)), exactamente igual que antes de este panel: es un camino adicional de gestión, no un reemplazo. Si no hay ningún mazo creado todavía, se muestra "No hay mazos todavía."

- **Disponible en**: modo edición.
- **Código**: 00079, 00081, 00083.

### Subida múltiple y por carpeta de recursos

El botón "+ Añadir recurso" del panel de recursos despliega un menú con tres formas de añadir recursos a la galería, que conviven entre sí sin sustituirse:

- **Subir fichero**: comportamiento original, un único fichero mediante el selector de fichero del sistema.
- **Subir varios ficheros**: el mismo selector permitiendo marcar varios ficheros a la vez; todos los ficheros válidos elegidos se añaden como recursos independientes, igual que si se hubieran subido uno a uno.
- **Subir carpeta**: selector de carpeta del sistema de ficheros; se añaden como recursos todos los ficheros válidos que estén directamente dentro de ella — solo el primer nivel, sin entrar en subcarpetas (aviso junto a esta opción del menú recordándolo).

A diferencia de la subida de un único fichero (que corta con un aviso de error si el fichero no es válido, sin añadir nada), en una subida de varios ficheros o de una carpeta se suben todos los ficheros válidos y se omiten los no válidos: al terminar se muestra siempre un aviso resumen con el recuento de recursos añadidos y, si los hay, el detalle de los omitidos por formato no soportado (tabla con el nombre de cada fichero) y el recuento de los omitidos por estar dentro de una subcarpeta. Si una carpeta elegida no tiene ningún elemento válido en su primer nivel (vacía, solo con subcarpetas, o sin ningún formato soportado), se muestra en su lugar un aviso informativo indicando que no se ha encontrado ningún recurso válido, y no se añade nada. Los duplicados por nombre no se comprueban en ninguna de las tres vías, igual que ya ocurría con la subida individual.

- **Disponible en**: modo edición.
- **Código**: 00076.

### Conversión automática a WebP al subir imágenes

Al subir una imagen a la galería de recursos — tanto al dar de alta un recurso nuevo desde el panel "Recursos" en modo edición, como al reemplazar el fichero de un recurso ya existente desde su modal de edición — la imagen se convierte automáticamente a formato WebP antes de guardarse (compresión con pérdida, calidad muy alta, imperceptible a la vista), para reducir el espacio que ocupa en el autoguardado del navegador, en el HTML exportado y en el JSON de exportar/importar componentes. El flujo de subida no cambia en nada: mismo selector de fichero, mismos pasos, sin ningún indicador de carga adicional.

Solo se convierten los formatos de origen PNG, JPG y JPEG; si el fichero subido ya es WebP no se reconvierte, y los SVG (vectoriales) y GIF (pueden ser animados) se guardan siempre tal cual, sin conversión. Si la conversión no puede realizarse por cualquier motivo, el fichero original se guarda sin transformar, sin bloquear la subida ni mostrar ningún error. Esta conversión solo afecta a subidas nuevas a partir de esta funcionalidad; las imágenes ya guardadas no se tocan ni se reconvierten automáticamente — los 38 recursos de imagen por defecto de la galería (ver [Panel flotante de recursos](#panel-flotante-de-recursos-con-filtro-de-texto)) sí se migraron a WebP como parte puntual de esta implementación.

- **Disponible en**: modo edición.
- **Código**: 00073.

### Búsqueda de imagen en el modal "Elegir imagen"

La modal "Elegir imagen" (galería en grid de miniatura + nombre, usada al configurar el fondo "Imagen" de [Componente "tablero"](#componente-tablero) y al elegir la imagen de cada cara de [Componente "carta"](#componente-carta)) muestra un cuadro de texto de búsqueda ("Buscar imagen…") encima de la galería, solo cuando hay al menos una imagen disponible. El filtrado ocurre en tiempo real según se escribe, comparando el texto con el nombre de cada imagen de forma insensible a mayúsculas/minúsculas y a tildes (mismo criterio de normalización que el filtro del panel de recursos, ver sección anterior). Si ninguna imagen coincide, la galería se sustituye por un mensaje indicándolo. Si había una imagen ya seleccionada y el filtro la oculta, la selección se mantiene internamente: "Aceptar" la sigue aplicando si no se cambia de selección. El cuadro de búsqueda se reinicia vacío cada vez que se abre la modal.

- **Disponible en**: modo edición.
- **Código**: 00055.

### Orden de apilado en la mesa

Cada componente tiene un orden explícito (1 = el más arriba de todos en la mesa de juego, n = el más abajo, siendo n el número total de componentes) que determina su apilado visual, sustituyendo al orden de inserción/creación usado anteriormente. Se controla desde la columna "Orden" del panel flotante de componentes (ver [Panel flotante de componentes](#panel-flotante-de-componentes-con-selección-resaltado-arrastre-y-redimensionado)): el cuadro de texto de cada fila solo admite dígitos, y al confirmar (perder el foco o pulsar Enter) reordena la lista y actualiza el apilado en la mesa. Si el valor introducido coincide con el de otro componente, ese componente y los que había detrás se desplazan un puesto para dejarle hueco; los valores fuera de rango (menor que 1 o mayor que n) se ajustan al límite más cercano, y un valor vacío al confirmar descarta el cambio y restaura el anterior.

Al crear un componente nuevo, o al clonar uno ya existente (ver [Panel flotante de componentes](#panel-flotante-de-componentes-con-selección-resaltado-arrastre-y-redimensionado)), se le asigna automáticamente el primer puesto (queda por encima de todos), desplazando un puesto hacia abajo a los que ya hubiera. Al eliminar un componente, los órdenes restantes se recalculan para seguir siendo consecutivos de 1 a n, sin huecos. El orden se guarda como parte del estado del componente (ver [Autoguardado en el navegador](#autoguardado-en-el-navegador)), igual que el resto de sus propiedades.

- **Disponible en**: modo edición (control del orden); el apilado resultante se refleja en modo juego y modo edición.
- **Código**: 00027, 00082, 00084.

### Subir al mover/interactuar

Cada componente tiene, en la pestaña "Generales" de su modal de configuración (junto a "Bloqueado" y "Mostrar tooltip"), un checkbox "Subir al mover/interactuar" con su propio icono de ayuda. Marcado por defecto para "Carta/Ficha" y "Dado" (tipos pensados para piezas que se mueven o se usan activamente durante la partida); desmarcado por defecto para el resto — un componente guardado antes de que existiera este checkbox se comporta como si estuviera desmarcado.

Cuando está marcado, cada vez que el componente se mueve (arrastre) o resuelve su propia interacción de juego (voltear una carta, lanzar un dado) estando en Modo Juego, se coloca automáticamente encima de todos los demás componentes de la mesa (equivalente al orden "1", ver [Orden de apilado en la mesa](#orden-de-apilado-en-la-mesa)). Si está desmarcado, no hay ningún cambio: el componente conserva la posición de apilado que ya tuviera. Este comportamiento es exclusivo de Modo Juego — moverlo en modo edición nunca lo reordena por este checkbox — y es independiente de "Bloqueado": un componente bloqueado sigue sin poder arrastrarse, pero sus interacciones propias (voltear, lanzar) pueden seguir disparando este reordenamiento aunque esté bloqueado, igual que ya ocurre con esas interacciones respecto al bloqueo.

- **Disponible en**: modo juego (efecto del reordenamiento); modo edición (checkbox editable en la modal de configuración, pestaña "Generales").
- **Código**: 00061.

### Posición independiente, arrastre y redimensionado de componentes

Cada componente tiene su propia posición (`x`, `y`) en la mesa, y opcionalmente un tamaño explícito (`width`, `height`; automático según contenido mientras no se fije). Al crear un componente nuevo desde el modo edición, se le asigna automáticamente una posición inicial que no se solapa con los componentes ya existentes. En modo edición, cada componente puede arrastrarse individualmente sobre la mesa (independiente del pan/zoom de la mesa y de los demás componentes); la nueva posición se guarda de inmediato.

Además, cuando un componente está seleccionado (haciendo click en él sobre la mesa, o en su fila del panel), muestra un manejador de redimensionado en su esquina inferior derecha (mismo patrón que el del panel de componentes) que ajusta el ancho y el alto de la caja. Para "cuadro de texto" (mínimo 40×24px, sin máximo): el tamaño de la fuente no cambia, y si el contenido no cabe en el nuevo tamaño, se recorta. Para "tablero" (mínimo 40×40px, sin máximo): se crea siempre con un tamaño cuadrado por defecto (200×200px) pero puede redimensionarse a cualquier proporción, no solo cuadrada. Para "dado" (mínimo 40×40px, sin máximo): se crea con un tamaño cuadrado por defecto (100×100px) y, a diferencia del resto, mantiene siempre la proporción cuadrada al redimensionarlo (ancho = alto), con o sin Shift. Para "Visor de documentos" (mínimo 80×80px, sin máximo): se crea con un tamaño por defecto en proporción vertical de hoja (240×320px) y puede redimensionarse a cualquier proporción, igual que el tablero. Para "Carta/Ficha" (mínimo 60×60px, sin máximo): se crea con un tamaño por defecto de 180px de ancho en la proporción configurada (2:3 — vertical, tipo póker — por defecto) y, a diferencia de todos los demás salvo "dado", mantiene siempre la proporción configurada al redimensionarla (no necesariamente cuadrada, pero sí fija salvo que se cambie explícitamente la propiedad "Proporción" en su modal, ver [Componente "carta"](#componente-carta)) — **excepto** con la proporción "Circular", donde el redimensionado es libre en ambos ejes, igual que "tablero"/"Visor de documentos". En "tablero", "Visor de documentos", "Carta/Ficha" con proporción "Circular" y "cuadro de texto", redimensionar manteniendo pulsada la tecla Shift (cambio 00049) fuerza un aspecto 1:1 (cuadrado) mientras se arrastra, reevaluado en cada movimiento del ratón (si se suelta o se pulsa Shift a mitad de arrastre, el resto del arrastre cambia de comportamiento en el acto, sin ningún indicador visual adicional); sin Shift, el redimensionado sigue siendo libre como hasta ahora. El tamaño resultante se guarda de inmediato, igual que la posición.

En modo juego, cada componente puede tener desmarcado individualmente el checkbox "Bloqueado" (marcado por defecto para cualquier tipo salvo "Carta/Ficha", que se crea con él desmarcado — pensado para poder arrastrarse de inmediato en partida, ver [Alta/edición/borrado de componentes con modal de tabs](#altaediciónborrado-de-componentes-con-modal-de-tabs)). Cuando está desmarcado, ese componente puede arrastrarse libremente por toda la mesa también durante la partida, sin ninguna restricción de zona; el cursor cambia a indicador de arrastre al pasar el ratón sobre él. Los componentes con este checkbox marcado permanecen fijos en modo juego.

En modo juego, cada componente sobre la mesa muestra siempre uno de tres cursores según la interacción disponible en ese momento: indicador de arrastre si se puede mover, dedo de "se puede pulsar" si solo responde a un click (p. ej. un dado bloqueado, que siempre se puede lanzar, o una carta bloqueada, que siempre se puede voltear, aunque ninguno de los dos se pueda mover), o el de la propia mesa al arrastrarla para desplazar la vista. Esta misma convención de mostrar el cursor de dedo en cualquier elemento pulsable de la app (botones, pestañas, filas de listado, checkboxes...) que no tenga ya un cursor más específico aplica también al resto de la interfaz, en ambos modos.

En modo edición, cualquier componente con "Bloqueado" marcado muestra además una pequeña insignia de candado superpuesta en una esquina, para poder identificar de un vistazo qué componentes quedarán fijos en la partida sin necesidad de abrir su modal de configuración. En modo juego no se muestra esta insignia (el estado de bloqueo solo se percibe ahí a través del menú contextual, ver [Menú contextual de componente en modo juego](#menú-contextual-de-componente-en-modo-juego)).

- **Disponible en**: modo edición (arrastre y redimensionado siempre disponibles; insignia de candado sobre los componentes bloqueados); modo juego (arrastre solo para los componentes con "Bloqueado" desmarcado, lo que incluye siempre a "Carta/Ficha" salvo que se marque a mano). La posición y el tamaño resultantes se reflejan en ambos modos; el cursor de dedo en elementos pulsables, en toda la app.
- **Código**: 00006, 00009, 00015, 00018, 00019, 00020, 00029, 00031, 00049, 00053, 00087, 00088.

### Componente "cuadro de texto"

Primer tipo de componente concreto: un bloque de texto con contenido, tamaño de fuente, color de texto y color de fondo configurables (fondo transparente por defecto). Se precarga automáticamente una instancia solo si no hay ningún estado guardado que recuperar (ni en el navegador ni embebido en el propio fichero) — ver [Persistencia y guardado](#persistencia-y-guardado).

- **Disponible en**: renderizado sobre la mesa en modo juego y modo edición.
- **Código**: 00002.

### Componente "tablero"

Segundo tipo de componente: un elemento cuadrado (redimensionable a cualquier proporción, ver [Posición independiente, arrastre y redimensionado de componentes](#posición-independiente-arrastre-y-redimensionado-de-componentes)) con borde y fondo configurables, pensado para representar el tablero físico de la partida. El borde tiene color y grosor configurables (1–20px) y se dibuja con un ligero efecto de bisel/relieve (tonos más claro/oscuro derivados del color elegido), además de una sombra de contacto suave que lo asienta sobre la mesa — mismo lenguaje visual de "pieza física" que comparten el resto de piezas de juego (Dado, Carta/Ficha).

El fondo se elige entre dos opciones, configurables desde una modal propia ("Configurar fondo") sin perder la configuración de la opción no activa al alternar entre ellas:

- **Color y patrón**: una cuadrícula (casillas cuadradas/rectangulares o hexagonales, a elegir) del color y grosor de línea elegidos (grosor 1–20px, `1` por defecto), con el número de filas/columnas configurado (1–50 cada uno). Las casillas se ajustan siempre de tamaño (nunca de cantidad) para llenar el máximo espacio posible del tablero sin recortarse, adaptándose automáticamente cada vez que el tablero se redimensiona; para hexagonales puede quedar un margen mínimo inevitable sin casillas en los bordes.
- **Imagen**: se elige una imagen entre las ya disponibles en el panel "Recursos" del modo edición (sin ninguna función para subir imágenes nuevas desde esta modal), mostrada cubriendo todo el tablero y recortada si no coincide su proporción.

- **Disponible en**: renderizado sobre la mesa en modo juego y modo edición; alta eligiendo "Tablero" en la modal previa de tipo al pulsar "+ Añadir componente" (ver [Alta/edición/borrado de componentes con modal de tabs](#altaediciónborrado-de-componentes-con-modal-de-tabs)).
- **Código**: 00019, 00063, 00068.

### Componente "dado"

Tercer tipo de componente: un dado con representación 2D plana (sin perspectiva ni vista isométrica), con color del cuerpo y color de los números configurables de forma independiente, y una tipografía a elegir entre las disponibles en la galería de recursos (con muestra de texto en la propia fuente; si no hay ninguna disponible, se usa la tipografía por defecto de la app). El número de resultados posibles se configura de dos formas alternables sin perder la configuración de la que no está activa:

- **Número máximo de caras**: entre 2 y 100; cada tirada da un número al azar entre 1 y ese máximo.
- **Lista de valores**: texto libre separado por comas (mínimo 2 valores no vacíos); cada tirada da uno de esos valores literales al azar, no necesariamente numéricos.

La silueta frontal del dado varía según la cantidad de resultados posibles configurada: triángulo (4), cuadrado liso (6), rombo (8), o una esfera facetada (decágono dividido en un abanico de triángulos) para 9 o más y como respaldo genérico para cualquier otra cantidad (2, 3, 5 o 7). Tiene un leve efecto de profundidad (silueta duplicada en un tono más oscuro, ligeramente desplazada detrás) y un contorno fino oscuro de acabado — misma familia de recurso que el bisel del tablero, sin degradados difuminados —, además de una sombra de contacto suave que sigue el contorno de la silueta y lo asienta sobre la mesa, igual que el resto de piezas de juego.

En modo juego, un click sobre el dado lo lanza: durante ~1 segundo muestra un parpadeo de resultados aleatorios entre los posibles, mientras el propio dado tiembla ligeramente (pequeño desplazamiento aleatorio, sin rotación) para reforzar la sensación de que está en juego, y al terminar fija el resultado final y deja de temblar (los clicks durante la tirada se ignoran); un doble click abre una modal con el resultado actual a tamaño grande. En modo edición no hay lanzamiento: el dado se comporta como cualquier otro componente (selección, edición, movimiento, redimensionado siempre cuadrado). El checkbox "Bloqueado" solo afecta a si se puede arrastrar, nunca a si se puede lanzar. Al crear el dado, o si la configuración de caras cambia de forma que el resultado actual deje de ser válido, se fija automáticamente como resultado el primero de los posibles según la configuración vigente.

- **Disponible en**: renderizado sobre la mesa en modo juego y modo edición; alta eligiendo "Dado" en la modal previa de tipo al pulsar "+ Añadir componente" (ver [Alta/edición/borrado de componentes con modal de tabs](#altaediciónborrado-de-componentes-con-modal-de-tabs)); lanzamiento, temblor y modal de resultado grande solo en modo juego.
- **Código**: 00020, 00031, 00063.

### Componente "Visor de documentos"

Cuarto tipo de componente: una hoja con fondo blanco, borde fino y una sombra de contacto suave que la asienta sobre la mesa (como un papel apoyado encima), que muestra contenido renderizado, pensada para notas, reglas o material de referencia de la partida. El contenido siempre se ajusta al ancho del componente (nunca aparece scroll horizontal); si es más alto que el tamaño fijado, aparece scroll vertical dentro de ese tamaño.

El tipo de contenido se elige entre dos opciones, configurables sin perder la configuración de la que no está activa:

- **Texto**: un cuadro de texto multilínea donde pegar el contenido, junto con un selector de formato (Markdown, por defecto, o HTML) que indica cómo interpretarlo antes de mostrarlo. En formato Markdown se admite CommonMark + GitHub Flavored Markdown completo (encabezados, negrita/cursiva, citas anidadas, listas ordenadas/sin ordenar anidadas y con contenido enriquecido dentro de un elemento, tablas, texto tachado, listas de tareas `- [ ]`/`- [x]` mostradas como casilla deshabilitada de solo lectura, bloques de código, reglas horizontales, enlaces/auto-enlaces/referencias, imágenes, y HTML embebido dentro del propio texto). El HTML resultante (el pegado directamente, el generado a partir del Markdown, o el HTML embebido dentro de él) se sanitiza siempre antes de mostrarse (se elimina cualquier `<script>`, manejador de evento inline y enlace `javascript:`), ya que el estado de la partida se guarda y puede exportarse como un único fichero HTML autocontenido. Si el contenido pegado está mal formado, se muestra tal cual lo interprete el navegador o el conversor, sin validación ni aviso.
- **URL**: un campo de texto con la dirección de una página HTML externa, que se muestra embebida. Si el sitio de destino bloquea ser embebido, se muestra superpuesto el aviso "No se pudo cargar el contenido" (detección best-effort, no garantizada al 100% en todos los sitios/navegadores).

Un componente sin contenido (texto vacío, o antes de configurar nada) muestra simplemente la hoja en blanco, sin ningún aviso.

- **Disponible en**: renderizado sobre la mesa en modo juego y modo edición; alta eligiendo "Visor de documentos" en la modal previa de tipo al pulsar "+ Añadir componente" (ver [Alta/edición/borrado de componentes con modal de tabs](#altaediciónborrado-de-componentes-con-modal-de-tabs)).
- **Código**: 00036, 00037, 00038, 00039, 00040, 00063.

### Componente "carta"

Quinto tipo de componente, con la etiqueta visible "Carta/Ficha" (cambio 00087 — absorbe también el caso de uso del antiguo tipo "Ficha": piezas/tokens simples; ver [Migración de fichas antiguas a Carta/Ficha](#migración-de-fichas-antiguas-a-cartaficha)): un rectángulo de proporción configurable (a elegir entre las más habituales del mercado de juegos de cartas — Poker estándar vertical 5:7 por defecto, Poker estándar horizontal 7:5, Tarot estándar vertical, Tarot estándar horizontal, Cuadrada 1:1 — o "Circular", ver más abajo) con las esquinas ligeramente redondeadas y una sombra de contacto suave que la asienta sobre la mesa (mismo lenguaje visual que el resto de piezas de juego), cuyo aspecto se diseña con un editor dedicado (ver más abajo). A diferencia de todos los demás tipos salvo "dado", mantiene siempre la proporción configurada al redimensionarla en la mesa (no se puede cambiar arrastrando el manejador, solo editando la propiedad "Proporción") — **excepto** con la proporción "Circular" (ver más abajo). Es el único tipo que se crea con el checkbox "Bloqueado" desmarcado por defecto, para poder moverse de inmediato en modo juego.

**Proporción "Circular"**: a diferencia de las cinco proporciones rectangulares, no fuerza ningún ratio al redimensionar en la mesa — se puede estirar libremente en ambos ejes, pudiendo convertirse en un óvalo si ancho y alto dejan de coincidir (mismo comportamiento de redimensionado libre que "Tablero"/"Visor de documentos"), con la tecla Shift forzando un aspecto 1:1 (círculo perfecto) mientras se arrastra el manejador. Al crear una carta con esta proporción (o cambiar a ella), nace con ancho = alto (círculo perfecto). Visualmente, la carta se recorta como una forma redonda completa (círculo u óvalo) en vez del rectángulo de esquinas ligeramente redondeadas del resto de proporciones, tanto en modo juego como en modo edición; el editor de cartas y su ajuste de imagen de fondo por cara reflejan igualmente ese recorte circular en su lienzo/previsualización.

La carta tiene siempre dos caras, frontal y trasera, y muestra una de las dos a la vez — empieza mostrando la **trasera** por defecto, tanto en modo juego como en modo edición. En modo juego, un click sobre la carta voltea entre cara frontal y trasera; esta interacción está siempre disponible, con independencia de si "Bloqueado" está marcado o no ("Bloqueado" solo afecta a si se puede arrastrar, nunca a si se puede voltear). Cada volteo (en cualquiera de los dos sentidos) da un pequeño feedback visual: la carta se levanta y vuelve a bajar rápidamente, un efecto propio y distinto del que ya usa el arrastre de piezas (ver [Posición independiente, arrastre y redimensionado de componentes](#posición-independiente-arrastre-y-redimensionado-de-componentes)) — confirma que el click ha volteado la carta, sin necesidad de fijarse en si la imagen ha cambiado. Sin ningún diseño (antes de usar el editor de cartas, o si una cara se deja vacía), esa cara se muestra en blanco con la proporción configurada, sin ningún aviso.

La modal de configuración de la carta incluye, además de "Bloqueado", tres campos propios: la proporción; "Mazo" (ver más abajo); y un botón "Editar diseño de la carta" que abre el editor de cartas.

**Mazos**: cada carta puede pertenecer, como mucho, a un único mazo (o a ninguno, "Sin mazo" por defecto), elegido en un desplegable que lista los mazos ya creados y permite además escribir un nombre nuevo para crear un mazo al vuelo sin salir de la modal de la carta (el nombre no puede estar vacío ni estar ya en uso por otro mazo, misma validación que el panel flotante de mazos, comparación recortada y sin distinguir mayúsculas/minúsculas). Los mazos son una entidad propia (nombre + identificador), pensada para en el futuro incorporar mecánica de juego propia (barajar, robar carta) — esta versión deja el modelo de datos preparado para ello, pero esa mecánica queda fuera de esta funcionalidad. Renombrar, editar o borrar un mazo ya creado se gestiona desde el panel flotante "Mazos" (ver [Panel flotante de mazos](#panel-flotante-de-mazos-con-edición-y-borrado)); no hay filtro por mazo en el panel de componentes.

**Editor de cartas**: una ventana modal amplia (más superficie de trabajo que el resto de modales de la app), disponible solo en modo edición, que muestra las dos caras a la vez, una junto a otra, permitiendo editar cada una por separado sin cambiar de vista. Incluye un desplegable para cambiar la proporción de la carta (cambiarla no borra los elementos ya añadidos a ninguna cara, aunque puede dejar alguno fuera del área visible si no se reposiciona a mano). Por cada cara, permite:

- **Imagen de fondo**: una única imagen, elegida de la galería de recursos ya existente en la app (sin poder subir imágenes nuevas desde aquí, igual que en "tablero"), con un botón "Elegir imagen…" propio de cada cara.
- **Cuadros de texto**: se pueden añadir tantos como se quiera por cara (con el botón "+ Texto"), cada uno con su propio contenido, tipografía (de la misma galería de tipografías que usa "Dado"), tamaño, color, borde y color de fondo. Se mueven y redimensionan arrastrando directamente sobre el lienzo de esa cara, con el mismo patrón de arrastre/redimensionado del resto de la app. Un doble click sobre un cuadro de texto abre una ventana para editar todos esos parámetros y el contenido, con un botón "Eliminar" propio para borrar ese cuadro de texto. El borde (desactivado por defecto, con un check "Activar borde" que conserva la configuración de color/grosor/tipo de línea aunque esté desmarcado) admite color, grosor (1–20px) y tipo de línea (continua o punteada); el color de fondo (vacío = transparente por defecto) se aplica detrás del texto. Ambos son propios de cada cuadro de texto, independientes entre sí y del resto de cuadros de texto de la carta.

Cada cara admite además, independiente de la otra: un **borde propio de la carta completa** (color y grosor en píxeles, `0` por defecto = sin borde; basta subir el grosor por encima de `0` para que aparezca, sin perder el color configurado, línea simple sin bisel ni relieve).

Debajo de las dos caras hay un único botón "Ajustar imagen…" (no uno por cara), deshabilitado solo si ninguna de las dos tiene imagen elegida. Al pulsarlo se abre el editor reutilizable de ajuste de imagen (mover/hacer zoom sobre una forma; pensado para que futuros tipos de componente con fondo de imagen puedan apoyarse en el mismo editor) mostrando las dos caras a la vez, cada una en una posición fija (frontal siempre a la izquierda, trasera siempre a la derecha) bajo su propio título fijo ("Frontal"/"Trasera") que nunca cambia de texto ni de sitio. Una de las dos está enfocada en cada momento (al abrir, la frontal si tiene imagen elegida, si no la trasera), distinguida con un borde de acento; arrastrar para mover la imagen, el control de zoom y el control de transparencia afectan solo a la cara enfocada, mientras la otra se ve atenuada pero permanece visible en su sitio. Un click sobre cualquiera de las dos caras, si tiene una imagen elegida, cambia el foco a esa cara al instante (sin cerrar ni reabrir la ventana); si no tiene imagen elegida, se ve su hueco vacío y no responde a click ni puede recibir el foco. Al aceptar se guarda el ajuste final de ambas caras, se hayan enfocado o no durante la sesión; al cancelar se descartan los cambios de ajuste de las dos. El control de zoom de esta pantalla tiene, debajo del deslizador, un cuadro de texto con el valor numérico (100-300) sincronizado en ambos sentidos: mover el deslizador actualiza el número, y escribir un valor en el cuadro (confirmado con Intro o al salir del campo) mueve el deslizador y aplica el zoom; un valor fuera de rango se ajusta al mínimo o máximo permitido, y uno no numérico se descarta. Debajo hay un control de transparencia idéntico (deslizador 0–100%, cuadro de texto sincronizado) que ajusta solo la opacidad de la imagen de esa cara enfocada, de forma independiente entre caras.

El diseño de cada cara (imagen, su ajuste, y los cuadros de texto) se guarda como parte de esa carta en concreto — no hay plantillas compartidas entre cartas, cada una tiene su propio diseño independiente.

**Convivencia con la galería de recursos**: al intentar borrar una imagen o tipografía de la galería que esté en uso por el diseño de alguna carta, se bloquea el borrado igual que ya ocurre con otros tipos, y el aviso indica además el identificador del componente (o los componentes) que lo está usando — esta identificación en el aviso de bloqueo aplica ahora a cualquier tipo de componente, no solo a "carta".

- **Disponible en**: renderizado sobre la mesa en modo juego y modo edición; alta eligiendo "Carta/Ficha" en la modal previa de tipo al pulsar "+ Añadir componente" (ver [Alta/edición/borrado de componentes con modal de tabs](#altaediciónborrado-de-componentes-con-modal-de-tabs)); volteo de cara solo en modo juego; editor de cartas y gestión de mazos solo en modo edición.
- **Código**: 00053, 00058, 00060, 00063, 00071, 00072, 00075, 00079, 00087.

### Migración de fichas antiguas a Carta/Ficha

El tipo de componente independiente "Ficha" (piezas/tokens simples, cuadrados o circulares, con borde y fondo configurables) se ha retirado: su caso de uso queda cubierto por "Carta/Ficha" con proporción "Cuadrada" o "Circular" (ver más arriba). Ya no se puede dar de alta ningún componente "Ficha" nuevo, pero cualquier ficha guardada de una partida anterior sigue estando disponible: se convierte automáticamente a "Carta/Ficha" (forma cuadrada → proporción "Cuadrada", forma circular → proporción "Circular"; borde, imagen de fondo con su ajuste, o texto centrado — como un único cuadro de texto que ocupa toda la carta — se trasladan tal cual; un color de fondo sólido sin imagen ni texto no tiene equivalente y se pierde, quedando la carta en blanco con el borde migrado, igual que cualquier otra carta sin diseño) mostrando de entrada la cara frontal (con el diseño migrado, en vez de la trasera en blanco de una carta nueva) y sin mazo asignado.

Esta conversión ocurre de forma automática y sin ningún aviso al abrir la app, tanto si el guardado viene del propio navegador como de un fichero HTML exportado con estado embebido — mismo criterio ya seguido con otras migraciones silenciosas de datos de versiones anteriores.

Al **importar** un fichero JSON de componentes sobre una partida ya abierta (ver [Exportar/importar componentes en JSON, con selección](#exportarimportar-componentes-en-json-con-selección)), si alguna de las fichas incluidas no se puede convertir por tener datos corruptos o inesperados (por ejemplo, una forma no reconocida, o le falta información imprescindible de su diseño), la importación no se completa en silencio: antes de aplicar ningún cambio a la partida actual se muestra un aviso con el listado de las fichas afectadas y el motivo de cada error, con dos opciones:

- **Continuar sin esas fichas**: la importación se completa con normalidad, salvo que las fichas con error quedan excluidas (no se importan); el resto de componentes, recursos y mazos seleccionados sí se incorporan.
- **Abortar importación**: no se aplica ningún cambio a la partida actual, como si se hubiera cancelado la importación desde el principio.

- **Disponible en**: arranque de la app (migración silenciosa) e importación explícita de componentes (con aviso de errores).
- **Código**: 00087.

### Identificación de componentes al pasar el ratón

Cualquier componente de la mesa (cuadro de texto, tablero, dado, visor de documentos o carta) puede mostrar su tipo y su identificador al pasar el ratón por encima, sin necesidad de abrirlo, con el formato "Tipo: id".

En modo edición, la etiqueta identificativa se muestra siempre, para cualquier componente, sin poder desactivarse. En modo juego, en cambio, cada componente tiene en sus propiedades generales (modal de edición, pestaña "Generales") un checkbox "Mostrar tooltip", desactivado por defecto: solo si está activado ese componente muestra el tooltip identificativo en modo juego; si está desactivado (el caso por defecto, y el de cualquier componente creado antes de que existiera este checkbox), no se muestra ningún tooltip en modo juego para ese componente.

- **Disponible en**: modo juego (tooltip nativo del navegador al dejar el ratón quieto sobre el componente, solo si el componente tiene "Mostrar tooltip" activado) y modo edición (una pequeña etiqueta propia anclada en la esquina superior izquierda del componente, visible en los mismos momentos en que ya se resalta con el contorno azul discontinuo: al pasar el ratón por encima o cuando está seleccionado, sin depender de ningún checkbox).
- **Código**: 00032, 00034.

### Menú contextual de componente en modo juego

En modo juego, pulsar el botón derecho del ratón sobre un componente de la mesa lo selecciona (resaltado con el mismo contorno discontinuo que ya usa el modo edición) y abre, junto al cursor, un menú contextual con una fila "Bloquear"/"Desbloquear" (el texto refleja la acción disponible según si el componente está bloqueado o no en ese momento), cada una con su icono. El menú queda preparado para admitir en el futuro acciones específicas según el tipo de componente, separadas de esta por una línea divisoria, pero por ahora solo incluye esta acción general.

Pulsar el botón derecho sobre otro componente mientras hay un menú abierto cierra el anterior, cambia la selección al nuevo y abre el menú sobre este. El menú (y la selección asociada) se cierra al hacer click fuera de él, al pulsar ESC, o al elegir la acción disponible. Esta selección es estado momentáneo de la sesión de juego en curso, igual que la de modo edición: no se persiste, se pierde al recargar la página.

- **Disponible en**: modo juego.
- **Código**: 00088.

### Atajos de teclado en modo edición

Tres atajos de teclado generales, equivalentes directos de botones ya existentes — no añaden ninguna acción, confirmación ni validación nueva, solo un disparador rápido de lo que ya existe:

- **ESC**: equivale al botón "Cancelar" (o "Cerrar", en ventanas que solo tienen ese botón de cierre) de la ventana modal que esté abierta en ese momento. Con varias modales abiertas a la vez (una lanzada desde dentro de otra), solo afecta a la última abierta, sin cerrar las de debajo.
- **INTRO**: equivale al botón "Aceptar" de la modal abierta, si la tiene y no está deshabilitado (p. ej. por una validación no superada) — en ventanas que solo tienen "Cerrar" no hace nada, al no existir botón "Aceptar". Con el foco en un cuadro de texto de varias líneas (p. ej. el contenido de un documento), Intro sigue insertando un salto de línea con normalidad en vez de disparar "Aceptar".
- **SUPR**: equivale al botón "Suprimir"/"Eliminar" de la modal abierta, si la tiene; si no hay ninguna modal abierta pero hay un componente seleccionado en el panel flotante o en la mesa, lo elimina directamente (mismo efecto que su botón "Eliminar" habitual, con la misma confirmación previa). Con el foco en cualquier campo de texto no interfiere con borrar caracteres mientras se escribe.

Cuando el botón equivalente no existe en el contexto actual (p. ej. INTRO en una ventana que solo tiene "Cerrar", o SUPR sin ninguna modal abierta y sin ningún componente seleccionado), la tecla no hace nada. Todas las vías de borrado siguen pidiendo la misma confirmación que ya pedían sus botones equivalentes.

- **Disponible en**: modo edición.
- **Código**: 00078.

## Persistencia y guardado

### Autoguardado en el navegador

Cada alta, edición, movimiento, redimensionado o borrado de un componente se guarda automáticamente en `localStorage`, sin ninguna acción del usuario. Al reabrir la aplicación en el mismo navegador se recupera tal cual el último estado guardado; si nunca se ha guardado nada, arranca con la semilla embebida en el propio fichero (ver más abajo) o, en su defecto, con el componente de ejemplo. Si el estado guardado resulta corrupto o de una versión incompatible, se avisa brevemente y se arranca igualmente con ese mismo comportamiento de respaldo, sin bloquear la carga.

Además de los componentes, se guarda igual de automático el estado de los tres paneles flotantes del modo edición (Componentes, Recursos y Mazos: posición, ancho y colapsado/expandido; el ancho de cada columna de su tabla, solo en Componentes y Recursos — el panel de Mazos no tiene columnas redimensionables, ver [Panel flotante de componentes](#panel-flotante-de-componentes-con-selección-resaltado-arrastre-y-redimensionado) y [Panel flotante de mazos](#panel-flotante-de-mazos-con-edición-y-borrado)), cada vez que cambia. Si el guardado existente es de una versión anterior a esta funcionalidad y no incluye algún dato, ese aspecto del panel arranca con sus valores por defecto (expandido, posición, ancho y ancho de columna por defecto), igual que si nunca se hubiera guardado nada. Los mazos creados desde la modal de "Carta" (ver [Componente "carta"](#componente-carta)) o desde el panel "Mazos" se guardan con el mismo criterio; un guardado anterior a esta funcionalidad simplemente arranca sin ningún mazo.

El guardado es un único slot por navegador/perfil (no aislado por fichero): si se abren varias copias descargadas distintas en el mismo navegador, prevalece el último estado autoguardado sobre el contenido propio de la copia que se abra, salvo que sea la primera vez que se abre cualquier copia en ese navegador.

- **Disponible en**: automático, en cualquier modo (el estado de los paneles, solo en modo edición, que es donde existen).
- **Código**: 00011, 00014, 00053, 00064, 00079.

### Guardar a fichero

En modo edición, junto al botón de salir de ese modo (ambos alineados al extremo derecho de la barra), un botón "Guardar" descarga una copia autocontenida del HTML actual con el estado presente ya embebido, pidiendo el nombre de fichero (precargado con el del fichero abierto, editable). El fichero descargado, al abrirse, arranca directamente con ese contenido (salvo que el navegador ya tenga otro estado autoguardado, ver arriba).

- **Disponible en**: modo edición.
- **Código**: 00011.

### Exportar/importar componentes en JSON, con selección

Junto a "Guardar", dos botones "Exportar" e "Importar" permiten guardar y recuperar un subconjunto elegible de los elementos del juego (componentes, recursos y mazos) en un fichero JSON ligero pensado para sobrevivir a cambios de versión de la aplicación — a diferencia de "Guardar", que fija una copia completa a la versión en la que se generó.

- **Exportar**: abre una modal con el nombre de fichero (mismo valor por defecto que antes) y una lista de todos los componentes/recursos/mazos actuales, agrupados en tres bloques (Componentes, Recursos, Mazos). Cada bloque tiene su propio checkbox "seleccionar todo el bloque" y un check individual por elemento (todos marcados por defecto); el botón "Exportar" queda deshabilitado si no queda ningún elemento marcado en ningún bloque. El fichero descargado solo contiene los elementos marcados (junto con la versión de la aplicación con la que se generó); no valida ni avisa si algún componente exportado queda referenciando un recurso o mazo que no viaja en la selección. No incluye la configuración del panel flotante de edición.
- **Importar**: abre un selector de fichero limitado a `.json`. A diferencia del guardado automático del navegador, un fichero de una versión distinta a la actual se acepta igualmente — es el caso de uso principal. Si el fichero no es válido (vacío, JSON corrupto, o sin listado de componentes reconocible), se muestra el error con el [modal de error común](#notificación-de-errores). Si es válido, el flujo continúa en dos modales:
  1. **Selección de elementos**: misma lista agrupada en tres bloques que en "Exportar", mostrando esta vez los elementos que trae el fichero, todos marcados por defecto (botón "Continuar" deshabilitado si no queda ninguno marcado).
  2. **Confirmación final**: dos desplegables — "Modo de importación" (`Añadir a lo existente`, por defecto, que conserva el contenido actual y le suma lo seleccionado; o `Sobrescribir todo el juego`, que borra primero todo el contenido actual y deja el juego solo con lo seleccionado) y "Comportamiento ante id duplicado" (solo aplica en modo "Añadir", ya que en "Sobrescribir" no puede haber duplicados al partir de vacío): `Sobrescribir el existente` (por defecto, el elemento nuevo reemplaza al que ya tenía ese id) o `Mantener ambos` (el elemento importado se conserva con un id nuevo, el original con el sufijo `-imported`, o `-imported(2)`, `-imported(3)`... si ese id renombrado también choca). Este comportamiento se aplica de forma independiente a cada elemento y cada tipo (componentes, recursos y mazos tienen cada uno su propio espacio de ids).

  Si entre los componentes seleccionados hay alguna ficha del extinto tipo "Ficha" que no se pueda convertir a "Carta/Ficha" (ver [Migración de fichas antiguas a Carta/Ficha](#migración-de-fichas-antiguas-a-cartaficha)), antes de aplicar nada de lo anterior se muestra el aviso con la lista de fichas afectadas y su motivo, con las opciones "Continuar sin esas fichas" o "Abortar importación".

  Tras aplicar la selección y la fusión: si un componente importado queda referenciando un recurso ausente del estado final, se añade igualmente sin ese recurso (referencia descartada, igual que ya tolera la app un recurso borrado en uso); si referencia un mazo ausente, se crea automáticamente un mazo con ese mismo id (una sola vez por id, aunque varios componentes lo referencien), salvo que ya exista en el juego actual un mazo con el mismo nombre (comparación recortada y sin distinguir mayúsculas/minúsculas) — en ese caso, se reutiliza ese mazo existente sin crear uno nuevo. Los mazos importados cuyo nombre (normalizado de la misma forma) colisiona con otro mazo del mismo fichero o con uno ya existente en el juego se renombran automáticamente con un sufijo " (importado)" (o " (importado n)" si ese nombre con sufijo también colisiona). Si se ha dado alguno de estos tres casos (recurso ausente, mazo autocreado, mazo renombrado por colisión de nombre), se muestra al terminar una modal de informe con una tabla ("Componente afectado", "Error", "Solución", "Elemento erróneo/faltante") con una fila por cada aviso — un mismo componente puede aparecer en varias filas.

- **Disponible en**: modo edición.
- **Código**: 00024, 00059, 00065, 00081, 00087.

## Notificación de errores

### Modal de error común a toda la app

Cualquier error de la aplicación (recuperación de estado fallida, formato de fichero no soportado, recurso en uso al intentar eliminarlo, importación de componentes inválida, etc.) se comunica siempre con el mismo elemento: una ventana modal con el detalle del error y un botón "Cerrar", en vez de un aviso breve tipo toast. Así, cualquier error se ve y se comporta igual en toda la app, con independencia de dónde ocurra.

Los avisos que no son de error (confirmaciones de éxito, como "Guardado como...") siguen mostrándose como un aviso breve (toast), sin cambios.

- **Disponible en**: toda la app, cualquier modo.
- **Código**: 00024.
