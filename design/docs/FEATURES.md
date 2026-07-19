# Features

## Mesa de juego

### Mesa infinita con navegación pan/zoom

Superficie de juego navegable arrastrando (pan) y con la rueda del ratón (zoom, acotado a un rango razonable), donde se renderizan los componentes de la partida. La posición y el zoom se mantienen tal como los deja el usuario durante toda la sesión, incluida cualquier acción que refresque la pantalla (mover/editar/añadir/eliminar un componente); no se persisten entre recargas de página.

Un botón "Ajustar zoom" (solo icono, con etiqueta accesible y tooltip nativo) reencuadra la vista al instante (sin animación) para que todos los componentes existentes queden visibles a la vez, con margen respecto al borde de la pantalla. Está disponible en el extremo superior derecho en ambos modos: como último botón de la barra de edición en modo edición, y como botón flotante junto a "Entrar en modo edición" en modo juego. Si no hay ningún componente, deja la vista neutra por defecto (zoom 1, centrada en el origen); si el contenido es muy pequeño o hay un único componente, el zoom se acerca como mucho hasta el límite máximo ya existente para el zoom manual. El resultado no se persiste, igual que el resto de posición/zoom de la mesa.

- **Disponible en**: modo juego y modo edición.
- **Código**: 00002, 00016, 00021.

### Alta/edición/borrado de componentes con modal de tabs

Modal con dos pestañas ("Generales" con el `id` editable, y "Específicas" según el tipo de componente) para crear o editar un componente, con validación de `id` no vacío y único. Al editar un componente ya existente (no al crear uno nuevo), la modal incluye además un botón "Eliminar" en el extremo izquierdo de la zona de botones, con el mismo estilo destructivo (rojo) que el resto de acciones de borrado de la app; pide confirmación igual que el borrado desde el panel flotante y, si se confirma, borra el componente y cierra la modal (limpiando también la selección en el editor si el componente eliminado era el seleccionado). Es un camino alternativo al borrado desde el panel flotante, no lo sustituye.

Al pulsar "+ Añadir componente" se muestra antes una modal previa con la lista de tipos disponibles ("Cuadro de texto" o "Tablero", cada uno en una fila seleccionable) y botones "Cancelar"/"Aceptar". Al aceptar, el componente se crea y se añade de inmediato con los valores por defecto de ese tipo, y a continuación se abre esta misma modal de configuración ya sobre ese componente para ajustar sus propiedades — el tipo, una vez elegido, no se puede cambiar.

La pestaña "Generales" incluye también el checkbox "Bloqueado" (marcado por defecto), que determina si ese componente concreto queda fijo o puede arrastrarse libremente por la mesa durante el modo juego (ver [Posición independiente, arrastre y redimensionado de componentes](#posición-independiente-arrastre-y-redimensionado-de-componentes)). Junto a su etiqueta hay un icono de ayuda "?" que muestra, al pasar el ratón por encima, una breve explicación de qué hace el checkbox — patrón de ayuda contextual reutilizable en toda la app (tooltip para textos cortos, ventana modal para textos largos o con formato).

- **Disponible en**: modo edición — desde el panel flotante de componentes o haciendo doble click directamente sobre la representación del componente en la mesa.
- **Código**: 00002, 00003, 00004, 00013, 00015, 00018, 00019.

### Panel flotante de componentes, con selección, resaltado, arrastre y redimensionado

Panel flotante sobre la mesa (por defecto en la esquina superior derecha), colapsable, con el listado de componentes en tabla (columnas Id, Tipo, Acciones). El botón "Editar" abre la modal de edición; "Eliminar" borra el componente, pidiendo confirmación previa. Al hacer click sobre una fila, o directamente sobre la representación del componente en la mesa, se selecciona (selección única, con toggle al volver a hacer click en cualquiera de los dos sitios) y se resalta con un contorno discontinuo la representación del componente en la mesa. La tabla soporta scroll vertical si el contenido supera la altura disponible.

El panel puede arrastrarse por la pantalla agarrando su cabecera (restringido al área visible de la mesa) y redimensionarse en ancho arrastrando un manejador en su esquina inferior derecha (entre 290 y 600px, o la mitad del ancho del viewport si es menor, sin salir tampoco del área de la mesa) — funciona igual expandido o colapsado. La posición, el ancho y el estado colapsado/expandido del panel se guardan automáticamente (ver [Autoguardado en el navegador](#autoguardado-en-el-navegador)) y se recuperan al recargar la página. La selección de fila es la única parte de este panel que no se persiste: es estado momentáneo de la sesión de edición en curso y se pierde al recargar.

La tabla incluye además una primera columna "Orden" con un cuadro de texto numérico por fila (ver [Orden de apilado en la mesa](#orden-de-apilado-en-la-mesa)).

- **Disponible en**: modo edición.
- **Código**: 00005, 00007, 00009, 00014, 00027.

### Orden de apilado en la mesa

Cada componente tiene un orden explícito (1 = el más arriba de todos en la mesa de juego, n = el más abajo, siendo n el número total de componentes) que determina su apilado visual, sustituyendo al orden de inserción/creación usado anteriormente. Se controla desde la columna "Orden" del panel flotante de componentes (ver [Panel flotante de componentes](#panel-flotante-de-componentes-con-selección-resaltado-arrastre-y-redimensionado)): el cuadro de texto de cada fila solo admite dígitos, y al confirmar (perder el foco o pulsar Enter) reordena la lista y actualiza el apilado en la mesa. Si el valor introducido coincide con el de otro componente, ese componente y los que había detrás se desplazan un puesto para dejarle hueco; los valores fuera de rango (menor que 1 o mayor que n) se ajustan al límite más cercano, y un valor vacío al confirmar descarta el cambio y restaura el anterior.

Al crear un componente nuevo se le asigna automáticamente el último puesto (queda por debajo de todos). Al eliminar un componente, los órdenes restantes se recalculan para seguir siendo consecutivos de 1 a n, sin huecos. El orden se guarda como parte del estado del componente (ver [Autoguardado en el navegador](#autoguardado-en-el-navegador)), igual que el resto de sus propiedades.

- **Disponible en**: modo edición (control del orden); el apilado resultante se refleja en modo juego y modo edición.
- **Código**: 00027.

### Posición independiente, arrastre y redimensionado de componentes

Cada componente tiene su propia posición (`x`, `y`) en la mesa, y opcionalmente un tamaño explícito (`width`, `height`; automático según contenido mientras no se fije). Al crear un componente nuevo desde el modo edición, se le asigna automáticamente una posición inicial que no se solapa con los componentes ya existentes. En modo edición, cada componente puede arrastrarse individualmente sobre la mesa (independiente del pan/zoom de la mesa y de los demás componentes); la nueva posición se guarda de inmediato.

Además, cuando un componente está seleccionado (haciendo click en él sobre la mesa, o en su fila del panel), muestra un manejador de redimensionado en su esquina inferior derecha (mismo patrón que el del panel de componentes) que ajusta el ancho y el alto de la caja. Para "cuadro de texto" (mínimo 40×24px, sin máximo): el tamaño de la fuente no cambia, y si el contenido no cabe en el nuevo tamaño, se recorta. Para "tablero" (mínimo 40×40px, sin máximo): se crea siempre con un tamaño cuadrado por defecto (200×200px) pero puede redimensionarse a cualquier proporción, no solo cuadrada. El tamaño resultante se guarda de inmediato, igual que la posición.

En modo juego, cada componente puede tener desmarcado individualmente el checkbox "Bloqueado" (marcado por defecto, ver [Alta/edición/borrado de componentes con modal de tabs](#altaediciónborrado-de-componentes-con-modal-de-tabs)). Cuando está desmarcado, ese componente puede arrastrarse libremente por toda la mesa también durante la partida, sin ninguna restricción de zona; el cursor cambia a indicador de arrastre al pasar el ratón sobre él. Los componentes con este checkbox marcado permanecen fijos en modo juego.

- **Disponible en**: modo edición (arrastre y redimensionado siempre disponibles); modo juego (arrastre solo para los componentes con "Bloqueado" desmarcado). La posición y el tamaño resultantes se reflejan en ambos modos.
- **Código**: 00006, 00009, 00015, 00018, 00019.

### Componente "cuadro de texto"

Primer tipo de componente concreto: un bloque de texto con contenido, tamaño de fuente, color de texto y color de fondo configurables (fondo transparente por defecto). Se precarga automáticamente una instancia solo si no hay ningún estado guardado que recuperar (ni en el navegador ni embebido en el propio fichero) — ver [Persistencia y guardado](#persistencia-y-guardado).

- **Disponible en**: renderizado sobre la mesa en modo juego y modo edición.
- **Código**: 00002.

### Componente "tablero"

Segundo tipo de componente: un elemento cuadrado (redimensionable a cualquier proporción, ver [Posición independiente, arrastre y redimensionado de componentes](#posición-independiente-arrastre-y-redimensionado-de-componentes)) con borde y fondo configurables, pensado para representar el tablero físico de la partida. El borde tiene color y grosor configurables (1–20px) y se dibuja con un ligero efecto de bisel/relieve (tonos más claro/oscuro derivados del color elegido) para diferenciarlo visualmente de un elemento plano — única excepción del lenguaje visual, deliberadamente plano, del resto de la app.

El fondo se elige entre dos opciones, configurables desde una modal propia ("Configurar fondo") sin perder la configuración de la opción no activa al alternar entre ellas:

- **Color y patrón**: una cuadrícula (casillas cuadradas/rectangulares o hexagonales, a elegir) del color elegido, con el número de filas/columnas configurado (1–50 cada uno). Las casillas se ajustan siempre de tamaño (nunca de cantidad) para llenar el máximo espacio posible del tablero sin recortarse, adaptándose automáticamente cada vez que el tablero se redimensiona; para hexagonales puede quedar un margen mínimo inevitable sin casillas en los bordes.
- **Imagen**: se elige una imagen entre las ya disponibles en el panel "Recursos" del modo edición (sin ninguna función para subir imágenes nuevas desde esta modal), mostrada cubriendo todo el tablero y recortada si no coincide su proporción.

- **Disponible en**: renderizado sobre la mesa en modo juego y modo edición; alta eligiendo "Tablero" en la modal previa de tipo al pulsar "+ Añadir componente" (ver [Alta/edición/borrado de componentes con modal de tabs](#altaediciónborrado-de-componentes-con-modal-de-tabs)).
- **Código**: 00019.

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

### Exportar/importar componentes en JSON

Junto a "Guardar", dos botones "Exportar" e "Importar" permiten guardar y recuperar únicamente los datos de los componentes (y los recursos que usan), en un fichero JSON ligero pensado para sobrevivir a cambios de versión de la aplicación — a diferencia de "Guardar", que fija una copia completa a la versión en la que se generó.

- **Exportar**: pide el nombre de fichero (mismo patrón que "Guardar") y descarga un JSON con los componentes actuales, los recursos (imágenes/tipografías) que esos componentes referencian, y la versión de la aplicación con la que se generó. No incluye la configuración del panel flotante de edición.
- **Importar**: abre un selector de fichero limitado a `.json`. A diferencia del guardado automático del navegador, un fichero de una versión distinta a la actual se acepta igualmente — es el caso de uso principal. Si el fichero no es válido (vacío, JSON corrupto, o sin listado de componentes reconocible), se muestra el error con el [modal de error común](#notificación-de-errores). Si es válido, se pide confirmación antes de reemplazar por completo los componentes actuales (no se fusionan) por los del fichero; los recursos del fichero que no existan ya en la app (por id) se añaden a la galería.

- **Disponible en**: modo edición.
- **Código**: 00024.

## Notificación de errores

### Modal de error común a toda la app

Cualquier error de la aplicación (recuperación de estado fallida, formato de fichero no soportado, recurso en uso al intentar eliminarlo, importación de componentes inválida, etc.) se comunica siempre con el mismo elemento: una ventana modal con el detalle del error y un botón "Cerrar", en vez de un aviso breve tipo toast. Así, cualquier error se ve y se comporta igual en toda la app, con independencia de dónde ocurra.

Los avisos que no son de error (confirmaciones de éxito, como "Guardado como...") siguen mostrándose como un aviso breve (toast), sin cambios.

- **Disponible en**: toda la app, cualquier modo.
- **Código**: 00024.
