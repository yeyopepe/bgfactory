- **Nombre**: Alineación de texto en cuadros de texto de las caras de carta, y editor de cartas más grande
- **Código**: 00099
- **Tipo**: change

## Prompt original del usuario

Los textos que se añaden a las caras de las cartas hay que añadir, antes del tamaño de la fuente, unos botones para configurar la alineación horizontal (izquierda, derecha, centro) y vertical del texto (arriba, abajo, centro)

Añade también una configuración para especificar un margen (en px) aplicable a cada lateral

También quiero que, en la ventana del editor cartas, los espacios de diseño de cada cara sean mayores. Puedes hacer esa ventana más grande y agrandar también ambas caras.

## Descripción completa

### Parte 1: Alineación y márgenes del cuadro de texto

Al editar un cuadro de texto de una cara de carta, además de poder elegir su tipografía y tamaño de fuente, ahora se podrá configurar cómo se alinea el texto dentro de los límites del propio cuadro:

- **Alineación horizontal**: Izquierda, Centro o Derecha.
- **Alineación vertical**: Arriba, Centro o Abajo.

Los controles para elegir estas alineaciones se colocan en el formulario de edición del cuadro de texto, justo antes del campo "Tamaño de fuente" (después del campo de tipografía). Cada tipo de alineación (horizontal y vertical) se elige entre exactamente una de sus tres opciones a la vez — no son casillas independientes, sino una elección única por grupo, con la opción activa resaltada visualmente.

Al cambiar la alineación, el texto se reposiciona dentro del cuadro (que mantiene su ancho y alto configurados) tanto al editar la carta como al verla ya colocada en la mesa, en modo juego y en modo edición.

**Alcance**: esta funcionalidad es específica del texto dentro de las caras de las cartas. No afecta al tipo de componente "Texto" independiente que se puede colocar directamente sobre la mesa, que es un elemento distinto con su propia configuración. Solo está disponible en modo edición, como el resto de la configuración de una carta.

**Datos y persistencia**: la alineación elegida se guarda junto con el resto de la configuración de ese cuadro de texto (contenido, tipografía, tamaño, color...), por lo que persiste al recargar y al exportar/importar el proyecto, igual que cualquier otro ajuste de una carta.

**Casos límite**:
- Cuadros de texto nuevos: se crean con alineación Izquierda/Arriba por defecto.
- Cuadros de texto ya existentes, creados antes de esta funcionalidad: se comportan como si tuvieran alineación Izquierda/Arriba — es el aspecto que ya tenían (el texto se pintaba siempre pegado a la esquina superior izquierda del cuadro), así que no cambia nada visualmente para las cartas ya diseñadas hasta que alguien edite explícitamente su alineación.

#### Ampliación: margen por lateral

Además de la alineación, el formulario de edición del cuadro de texto permite configurar un margen (en píxeles) para cada uno de sus cuatro laterales (arriba, derecha, abajo, izquierda), de forma independiente entre sí. El margen reduce, por ese lado, el espacio disponible dentro del cuadro donde se coloca el texto — el cuadro en sí no cambia de tamaño, solo se reduce la zona interior utilizable. La alineación (horizontal y vertical) se aplica siempre dentro de esa zona ya reducida por los márgenes.

Los controles de margen se colocan justo debajo de los dos grupos de alineación, formando con ellos un mismo bloque de "posición del texto dentro del cuadro", también antes del campo "Tamaño de fuente".

**Casos límite**:
- Valor por defecto de los cuatro márgenes: `0` (sin margen), tanto para cuadros de texto nuevos como para los ya existentes antes de esta funcionalidad — no cambia nada visualmente hasta que alguien configure explícitamente un margen.
- No se admiten valores negativos.
- No hay un tope máximo específico más allá del que imponga en la práctica el tamaño del propio cuadro (un margen mayor que el cuadro deja la zona de texto sin espacio útil).

### Parte 2: Editor de cartas más grande (ventana y lienzos de cara)

La ventana del editor de cartas (donde se diseña el contenido de la cara frontal y trasera de una carta: imagen de fondo y cuadros de texto) se hace más grande, y dentro de ella el espacio de diseño de cada una de las dos caras también aumenta de tamaño, para trabajar con más precisión y comodidad al colocar/ajustar imagen y cuadros de texto.

Se mantiene todo el comportamiento actual del editor (mismas acciones, mismos controles, misma proporción de carta configurada por cara) — solo cambia el tamaño en el que se ve y se trabaja. En pantallas pequeñas la ventana sigue ajustándose para no desbordar el navegador (con scroll si el contenido no cabe en alto), solo que ahora con un tamaño máximo mayor que el actual.

**Preguntas de alcance resueltas**:
- Magnitud del aumento: se propuso pasar el ancho máximo de la ventana de ~1100px/90% del ancho de pantalla a ~1500px/95%, y el tamaño máximo del lienzo de cada cara de ~260px a ~380px de lado mayor (manteniendo siempre la proporción configurada de la carta). El usuario pidió ver primero una maqueta antes de confirmar la magnitud exacta.

**Compatibilidad entre ambas partes**: ambos cambios afectan al mismo modal/lienzo del editor de cartas pero no entran en conflicto entre sí — la Parte 1 añade controles y lógica de renderizado del `TextBox`, la Parte 2 solo cambia el tamaño del lienzo y de la ventana. La Parte 1 sigue viéndose y funcionando igual, solo que en un lienzo más grande.

## Apuntes técnicos

### Parte 1: alineación y márgenes

- Puntos de código relevantes: `src/ui/cardTextBoxModal.js` (modal de edición del cuadro de texto; los nuevos controles van antes del campo "Tamaño de fuente", en torno a la línea 84), modelo `TextBox` documentado en `ARCHITECTURE.md` sección 4 (tipo `'carta'`), `src/ui/componentRenderer.js` (líneas ~993-1016, renderizado del `TextBox` sobre la carta ya colocada en la mesa) y `src/ui/cardEditorModal.js` (líneas ~320-350, renderizado del `TextBox` en el editor de la carta, y creación del `TextBox` por defecto con `tamañoFuente: 16`).
- Modelo de datos propuesto: dos propiedades nuevas en `TextBox`, `alineacionHorizontal` (`'izquierda' | 'centro' | 'derecha'`) y `alineacionVertical` (`'arriba' | 'centro' | 'abajo'`), ambas opcionales/sin migración (un `TextBox` sin ellas se trata como `'izquierda'`/`'arriba'`), siguiendo el mismo criterio que otros campos opcionales de `TextBox` (p. ej. `bordeActivo`, `colorFondo`).
- Hoy el `TextBox` se renderiza como un `div` con `position: absolute`, sin `display: flex` ni `text-align`. Para soportar alineación vertical habrá que introducir layout flex (columna) con `justify-content` según la alineación vertical, y `text-align` según la horizontal — a valorar en la solución técnica (`ms-how`), aplicándolo en los dos puntos de renderizado (`componentRenderer.js` y `cardEditorModal.js`) para mantener consistencia.
- No hay ningún sistema de alineación de texto ya existente en el proyecto que reutilizar (comprobado en `ARCHITECTURE.md`/`STYLE_BIBLE.md` y por código): es una funcionalidad nueva. Como referencia de patrón visual más cercano, el proyecto ya usa un resaltado de "opción activa" tipo tab (azul de acento) para tabs de modal — podría servir de inspiración para el botón activo de cada grupo de alineación, a decidir en `ms-how`.
- Modelo de datos propuesto para el margen: cuatro propiedades numéricas nuevas en `TextBox` (`margenSuperior`, `margenDerecha`, `margenInferior`, `margenIzquierda`), en píxeles, `0` por defecto, sin migración (igual criterio que el resto de campos opcionales de `TextBox`). Al aplicarse dentro de un layout flex (ver punto anterior sobre alineación), estos márgenes probablemente se traduzcan en `padding` del contenedor flex del `TextBox`, uno por lado — a confirmar en `ms-how`.
- La `STYLE_BIBLE.md` (sección 8) documenta un patrón de fila para "campo de color + su grosor asociado" (dos campos en una misma fila con `flex:1` cada uno); los cuatro campos de margen son una extensión natural de esa misma idea (varios números relacionados en fila) pero con 4 valores en vez de 2 — a valorar en `ms-how` si conviene una fila de 4 o dos filas de 2 (p. ej. agrupados por eje: Arriba/Abajo y Derecha/Izquierda), y si se sigue tal cual el patrón de la sección 8 o se documenta como variante nueva.

### Parte 2: editor más grande

- Puntos de código relevantes: `src/ui/cardEditorModal.js` (constante `CANVAS_MAX_SIDE = 260`, línea 13, usada para calcular `previewScale` y el tamaño de cada lienzo — línea ~164) y `src/styles/main.css` (`.card-editor-modal`, línea 1053, `max-width: min(1100px, 90vw)`).
- Cambio puramente de tamaño/CSS y de la constante `CANVAS_MAX_SIDE`; no toca el modelo de datos (`TextBox`, `caraFrontal`/`caraTrasera`) ni ninguna otra lógica del editor.
