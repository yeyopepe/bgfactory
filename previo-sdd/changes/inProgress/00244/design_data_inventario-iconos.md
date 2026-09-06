# Inventario de iconos — definición funcional

Lista completa de los iconos de la aplicación: nombre común (clave semántica), significado, dónde se usa hoy, icono de Lucide asignado y tamaño al que se muestra.

> **Alcance estricto.** Para cada entrada de esta tabla, lo único que cambia es **el dibujo del icono**. Cada icono se queda **en el mismo sitio, en el mismo orden y con la misma disposición** que hoy: no se mueve ningún botón, no se reordena ninguna barra ni menú, no se añade ni se quita ningún elemento de pantalla, no cambia ningún texto ni ninguna interacción. La columna "Dónde se usa hoy" describe una ubicación que **no se toca**.

- **Tamaño**: `toolbar` = 20 px, `menu` = 16 px, `zoom` = 18 px. El lienzo de referencia de todos es el mismo (24×24); "tamaño" es a qué medida se ve — **el mismo al que se ve hoy en cada sitio**, no se reescala nada.
- **Color**: todos heredan el color de su entorno (`currentColor`). Ninguno lleva color fijo.
- **Grosor de trazo**: estándar de Lucide para todos (ajustable de forma global si tras verlo se prefiere más fino).
- **Origen del dibujo**: `Lucide` = se copia tal cual de la librería; `Lucide + retoque` = se parte de un icono de Lucide y se ajusta un detalle manteniendo el estilo.

## Barra de herramientas y cambio de modo

| Clave semántica | Significado | Dónde se usa hoy | Icono Lucide | Tamaño | Origen |
|---|---|---|---|---|---|
| `fit-view` | Ajustar el zoom para ver todo | Botón "Ajustar zoom" (barra superior, ambos modos) | `maximize-2` | toolbar | Lucide |
| `settings` | Configuración | Botón de engranaje (barra superior) | `settings` | toolbar | Lucide |
| `import` | Importar un juego desde archivo | Botón "Importar" (barra de edición y barra de juego) | `upload` | toolbar | Lucide |
| `export` | Exportar el juego a archivo | Botón "Exportar" (barra de edición y barra de juego). El propio botón despliega sus opciones al pulsarlo, exactamente como hoy | `download` | toolbar | Lucide |
| `chevron-down` | Indicar que "Exportar" tiene desplegable | Flechita **dentro** del botón "Exportar", pegada al icono (no es un botón aparte). Igual que hoy | `chevron-down` | menu (≈14 px) | Lucide |
| `mode-play` | Salir de edición hacia el juego | Botón "Modo Juego" (barra de edición) | `log-out` | toolbar | Lucide |

## Paneles flotantes (componentes, recursos, etiquetas) y título

| Clave semántica | Significado | Dónde se usa hoy | Icono Lucide | Tamaño | Origen |
|---|---|---|---|---|---|
| `clear` | Limpiar el campo de filtro | Aspa dentro del buscador de los 3 paneles flotantes | `x` | menu | Lucide |
| `filter` | Columna con orden/filtro disponible | Embudo junto al nombre de columna (menús de columna de los 3 paneles) | `filter` | menu | Lucide |
| `edit-title` | Editar el título de la aplicación | Lápiz que aparece al pasar el ratón sobre el título (modo edición) | `pencil` | menu | Lucide |

## Tipos de componente (modal de "Añadir componente")

| Clave semántica | Significado | Dónde se usa hoy | Icono Lucide | Tamaño | Origen |
|---|---|---|---|---|---|
| `type-texto` | Componente de tipo texto | Fila "Texto" del listado de tipos | `align-left` | toolbar | Lucide |
| `type-tablero-simple` | Tablero con rejilla | Fila "Tablero simple" | `grid-3x3` | toolbar | Lucide |
| `type-tablero-personalizado` | Tablero editable | Fila "Tablero personalizado" | `layout-dashboard` | toolbar | Lucide |
| `type-dado` | Dado | Fila "Dado" | `dice-5` | toolbar | Lucide |
| `type-documento` | Documento | Fila "Documento" | `file-text` | toolbar | Lucide |
| `type-carta` | Carta / ficha | Fila "Carta/Ficha" | `credit-card` | toolbar | Lucide |
| `type-mazo` | Mazo de cartas | Fila "Mazo" | `layers` | toolbar | Lucide |

## Editor de texto de carta (alineación y estilo)

| Clave semántica | Significado | Dónde se usa hoy | Icono Lucide | Tamaño | Origen |
|---|---|---|---|---|---|
| `align-left` | Alinear el texto a la izquierda | Grupo de alineación horizontal | `align-left` | menu | Lucide |
| `align-center` | Centrar el texto | Grupo de alineación horizontal | `align-center` | menu | Lucide |
| `align-right` | Alinear el texto a la derecha | Grupo de alineación horizontal | `align-right` | menu | Lucide |
| `align-top` | Alinear el texto arriba | Grupo de alineación vertical | `align-vertical-justify-start` | menu | Lucide |
| `align-middle` | Centrar el texto verticalmente | Grupo de alineación vertical | `align-vertical-justify-center` | menu | Lucide |
| `align-bottom` | Alinear el texto abajo | Grupo de alineación vertical | `align-vertical-justify-end` | menu | Lucide |
| `bold` | Negrita | Grupo de estilo de texto | `bold` | menu | Lucide |
| `italic` | Cursiva | Grupo de estilo de texto | `italic` | menu | Lucide |
| `underline` | Subrayado | Grupo de estilo de texto | `underline` | menu | Lucide |

## Formas geométricas de carta

| Clave semántica | Significado | Dónde se usa hoy | Icono Lucide | Tamaño | Origen |
|---|---|---|---|---|---|
| `shape-circle` | Forma circular | Selector de forma | `circle` | menu | Lucide |
| `shape-square` | Forma cuadrada | Selector de forma | `square` | menu | Lucide |
| `shape-rounded` | Forma cuadrada con esquinas redondeadas | Selector de forma | `square` (esquinas redondeadas) | menu | Lucide + retoque |

## Controles de zoom (modal de recurso imagen)

| Clave semántica | Significado | Dónde se usa hoy | Icono Lucide | Tamaño | Origen |
|---|---|---|---|---|---|
| `zoom-in` | Acercar | Botón "+" sobre la vista previa | `zoom-in` | zoom | Lucide |
| `zoom-out` | Alejar | Botón "−" sobre la vista previa | `zoom-out` | zoom | Lucide |
| `zoom-reset` | Restablecer el zoom | Botón de flecha circular sobre la vista previa | `rotate-ccw` | zoom | Lucide |

## Distintivos sobre las piezas de la mesa (modo edición)

| Clave semántica | Significado | Dónde se usa hoy | Icono Lucide | Tamaño | Origen |
|---|---|---|---|---|---|
| `locked` | El componente está bloqueado | Distintivo en la esquina de la pieza | `lock` | menu | Lucide |
| `hidden` | El componente está oculto | Distintivo en la esquina de la pieza | `eye-off` | menu | Lucide |

## Menú contextual — acciones (modo edición)

| Clave semántica | Significado | Dónde se usa hoy | Icono Lucide | Tamaño | Origen |
|---|---|---|---|---|---|
| `hide` / `show` | Ocultar / mostrar el componente | Fila "Ocultar" / "Mostrar" | `eye-off` / `eye` | menu | Lucide |
| `clone` | Clonar el componente | Fila "Clonar" | `copy` | menu | Lucide |
| `copy-style` | Copiar el estilo | Fila "Copiar estilo" | `clipboard-copy` | menu | Lucide |
| `delete` | Eliminar el componente | Fila "Eliminar" | `trash-2` | menu | Lucide |
| `group` | Agrupar la selección | Fila "Agrupar" | `group` | menu | Lucide |
| `ungroup` | Desagrupar | Fila "Desagrupar" | `ungroup` | menu | Lucide |
| `flip` | Voltear la cara de la carta | Fila "Voltear cara" | `refresh-cw` | menu | Lucide |
| `add-to-tag` | Añadir a una etiqueta | Fila "Añadir a etiqueta" (encabezado de la fila con desplegable) | `tag` | menu | Lucide |

## Menú contextual — acciones (modo juego)

| Clave semántica | Significado | Dónde se usa hoy | Icono Lucide | Tamaño | Origen |
|---|---|---|---|---|---|
| `shuffle` | Barajar el mazo | Fila "Barajar" | `shuffle` | menu | Lucide |
| `view-contents` | Ver el contenido del mazo | Fila "Ver contenido…" | `eye` | menu | Lucide |
| `insert-into-deck` | Meter la carta en un mazo | Fila "Meter en mazo…" | `between-vertical-start` | menu | Lucide |
| `lock` / `unlock` | Bloquear / desbloquear | Fila "Bloquear" / "Desbloquear" | `lock` / `lock-open` | menu | Lucide |

## Editor visual (barra de cada cuadro de texto / forma, y cabecera del modal)

| Clave semántica | Significado | Dónde se usa hoy | Icono Lucide | Tamaño | Origen |
|---|---|---|---|---|---|
| `bring-to-front` | Traer al frente | Botón sobre el cuadro/forma seleccionado | `bring-to-front` | menu | Lucide |
| `send-to-back` | Enviar atrás | Botón sobre el cuadro/forma seleccionado | `send-to-back` | menu | Lucide |
| `rotate` | Rotar | Botón sobre el cuadro/forma seleccionado | `rotate-cw` | menu | Lucide |
| `copy` | Copiar el cuadro/forma | Botón sobre el cuadro/forma seleccionado | `copy` | menu | Lucide |
| `paste` | Pegar el cuadro/forma | Botón de la barra del editor | `clipboard-paste` | menu | Lucide |
| `delete` | Eliminar el cuadro/forma | Botón sobre el cuadro/forma seleccionado | `trash-2` | menu | Lucide |
| `maximize` | Maximizar el modal | Botón en la cabecera del editor visual | `maximize` | menu | Lucide |
| `restore` | Restaurar el tamaño del modal | Botón en la cabecera del editor visual (alterna con `maximize`) | `minimize` | menu | Lucide |

## Notas

- **`add-to-tag` (`tag`)**: hoy esa fila del menú contextual de edición no lleva icono (es una fila con `<select>`). Se propone añadirle el icono `tag` por coherencia con el resto de filas; si se prefiere dejarla sin icono, se marca como "sin icono" y no entra en el módulo. **A confirmar.**
- **`flip` (`refresh-cw`)**: el dibujo actual es una carta con flechas de giro. `refresh-cw` transmite "voltear/rotar"; alternativa `flip-horizontal` (más literal de "espejo"). **A confirmar cuál en el mockup.**
- **`insert-into-deck` (`between-vertical-start`)**: el nombre exacto del icono Lucide se afina en la fase técnica; el gesto buscado es "insertar un elemento dentro de una pila".
- **Iconos descartados del inventario** (el plan base los daba como esperados, pero hoy no existen como opción de menú): "tirar dado", "subir/bajar capa", "sacar de mazo". Si en el futuro se añaden esas acciones, se añadirán entonces `dice-5`, `arrow-up`/`arrow-down` y `between-vertical-end` (o equivalentes).
- **Total**: ~40 claves semánticas (varias comparten el mismo icono Lucide: `copy`, `eye`, `eye-off`, `trash-2`, `lock` se reutilizan en más de un sitio). El módulo define cada icono Lucide una sola vez; las claves semánticas pueden apuntar al mismo dibujo.
