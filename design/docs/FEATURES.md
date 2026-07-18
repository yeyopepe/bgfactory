# Features

## Mesa de juego

### Mesa infinita con navegación pan/zoom

Superficie de juego navegable arrastrando (pan) y con la rueda del ratón (zoom, acotado a un rango razonable), donde se renderizan los componentes de la partida. La posición y el zoom se mantienen tal como los deja el usuario durante toda la sesión, incluida cualquier acción que refresque la pantalla (mover/editar/añadir/eliminar un componente); no se persisten entre recargas de página.

- **Disponible en**: modo juego y modo edición.
- **Código**: 00002, 00016.

### Alta/edición/borrado de componentes con modal de tabs

Modal con dos pestañas ("Generales" con el `id` editable, y "Específicas" según el tipo de componente) para crear o editar un componente, con validación de `id` no vacío y único. Al editar un componente ya existente (no al crear uno nuevo), la modal incluye además un botón "Eliminar" en el extremo izquierdo de la zona de botones, con el mismo estilo destructivo (rojo) que el resto de acciones de borrado de la app; pide confirmación igual que el borrado desde el panel flotante y, si se confirma, borra el componente y cierra la modal (limpiando también la selección en el editor si el componente eliminado era el seleccionado). Es un camino alternativo al borrado desde el panel flotante, no lo sustituye.

La pestaña "Generales" incluye también el checkbox "Bloqueado" (marcado por defecto), que determina si ese componente concreto queda fijo o puede arrastrarse libremente por la mesa durante el modo juego (ver [Posición independiente, arrastre y redimensionado de componentes](#posición-independiente-arrastre-y-redimensionado-de-componentes)). Junto a su etiqueta hay un icono de ayuda "?" que muestra, al pasar el ratón por encima, una breve explicación de qué hace el checkbox — patrón de ayuda contextual reutilizable en toda la app (tooltip para textos cortos, ventana modal para textos largos o con formato).

- **Disponible en**: modo edición — desde el panel flotante de componentes o haciendo doble click directamente sobre la representación del componente en la mesa.
- **Código**: 00002, 00003, 00004, 00013, 00015, 00018.

### Panel flotante de componentes, con selección, resaltado, arrastre y redimensionado

Panel flotante sobre la mesa (por defecto en la esquina superior derecha), colapsable, con el listado de componentes en tabla (columnas Id, Tipo, Acciones). El botón "Editar" abre la modal de edición; "Eliminar" borra el componente, pidiendo confirmación previa. Al hacer click sobre una fila, o directamente sobre la representación del componente en la mesa, se selecciona (selección única, con toggle al volver a hacer click en cualquiera de los dos sitios) y se resalta con un contorno discontinuo la representación del componente en la mesa. La tabla soporta scroll vertical si el contenido supera la altura disponible.

El panel puede arrastrarse por la pantalla agarrando su cabecera (restringido al área visible de la mesa) y redimensionarse en ancho arrastrando un manejador en su esquina inferior derecha (entre 290 y 600px, o la mitad del ancho del viewport si es menor, sin salir tampoco del área de la mesa) — funciona igual expandido o colapsado. La posición, el ancho y el estado colapsado/expandido del panel se guardan automáticamente (ver [Autoguardado en el navegador](#autoguardado-en-el-navegador)) y se recuperan al recargar la página. La selección de fila es la única parte de este panel que no se persiste: es estado momentáneo de la sesión de edición en curso y se pierde al recargar.

- **Disponible en**: modo edición.
- **Código**: 00005, 00007, 00009, 00014.

### Posición independiente, arrastre y redimensionado de componentes

Cada componente tiene su propia posición (`x`, `y`) en la mesa, y opcionalmente un tamaño explícito (`width`, `height`; automático según contenido mientras no se fije). Al crear un componente nuevo desde el modo edición, se le asigna automáticamente una posición inicial que no se solapa con los componentes ya existentes. En modo edición, cada componente puede arrastrarse individualmente sobre la mesa (independiente del pan/zoom de la mesa y de los demás componentes); la nueva posición se guarda de inmediato.

Además, cuando un componente de tipo "cuadro de texto" está seleccionado (haciendo click en él sobre la mesa, o en su fila del panel), muestra un manejador de redimensionado en su esquina inferior derecha (mismo patrón que el del panel de componentes) que ajusta el ancho y el alto de la caja (mínimo 40×24px, sin máximo) — el tamaño de la fuente no cambia; si el contenido no cabe en el nuevo tamaño, se recorta. El tamaño resultante se guarda de inmediato, igual que la posición.

En modo juego, cada componente puede tener desmarcado individualmente el checkbox "Bloqueado" (marcado por defecto, ver [Alta/edición/borrado de componentes con modal de tabs](#altaediciónborrado-de-componentes-con-modal-de-tabs)). Cuando está desmarcado, ese componente puede arrastrarse libremente por toda la mesa también durante la partida, sin ninguna restricción de zona; el cursor cambia a indicador de arrastre al pasar el ratón sobre él. Los componentes con este checkbox marcado permanecen fijos en modo juego.

- **Disponible en**: modo edición (arrastre y redimensionado siempre disponibles); modo juego (arrastre solo para los componentes con "Bloqueado" desmarcado). La posición y el tamaño resultantes se reflejan en ambos modos.
- **Código**: 00006, 00009, 00015, 00018.

### Componente "cuadro de texto"

Primer tipo de componente concreto: un bloque de texto con contenido, tamaño de fuente, color de texto y color de fondo configurables (fondo transparente por defecto). Se precarga automáticamente una instancia solo si no hay ningún estado guardado que recuperar (ni en el navegador ni embebido en el propio fichero) — ver [Persistencia y guardado](#persistencia-y-guardado).

- **Disponible en**: renderizado sobre la mesa en modo juego y modo edición.
- **Código**: 00002.

## Persistencia y guardado

### Autoguardado en el navegador

Cada alta, edición, movimiento, redimensionado o borrado de un componente se guarda automáticamente en `localStorage`, sin ninguna acción del usuario. Al reabrir la aplicación en el mismo navegador se recupera tal cual el último estado guardado; si nunca se ha guardado nada, arranca con la semilla embebida en el propio fichero (ver más abajo) o, en su defecto, con el componente de ejemplo. Si el estado guardado resulta corrupto o de una versión incompatible, se avisa brevemente y se arranca igualmente con ese mismo comportamiento de respaldo, sin bloquear la carga.

Además de los componentes, se guarda igual de automático el estado del panel flotante de componentes del modo edición (posición, ancho y colapsado/expandido — ver [Panel flotante de componentes](#panel-flotante-de-componentes-con-selección-resaltado-arrastre-y-redimensionado)), cada vez que cambia. Si el guardado existente es de una versión anterior a esta funcionalidad y no incluye este dato, el panel arranca con sus valores por defecto (expandido, posición y ancho por defecto), igual que si nunca se hubiera guardado nada.

El guardado es un único slot por navegador/perfil (no aislado por fichero): si se abren varias copias descargadas distintas en el mismo navegador, prevalece el último estado autoguardado sobre el contenido propio de la copia que se abra, salvo que sea la primera vez que se abre cualquier copia en ese navegador.

- **Disponible en**: automático, en cualquier modo (el estado del panel, solo en modo edición, que es donde existe).
- **Código**: 00011, 00014.

### Guardar a fichero

En modo edición, junto al botón de salir de ese modo (ambos alineados al extremo derecho de la barra), un botón "Guardar" descarga una copia autocontenida del HTML actual con el estado presente ya embebido, pidiendo el nombre de fichero (precargado con el del fichero abierto, editable). El fichero descargado, al abrirse, arranca directamente con ese contenido (salvo que el navegador ya tenga otro estado autoguardado, ver arriba).

- **Disponible en**: modo edición.
- **Código**: 00011.
