- **Nombre**: Tooltip de identificación de componentes en modo juego
- **Código**: 00032
- **Tipo**: change

## Prompt original del usuario

en el modo de juego, al colocar el cursor encima de un elemento, debe aparecer el tooltip con la información: <tipo de elemento>: <id de elemento>

añade que en el modo edición, en lugar de tooltip, el recuadro azul que aparece para diferenciar cada elemento, debe incluir también una pequeña etiqueta en la parte superior izquierda con esa misma información: tipo de lemento e id del elemento, con el mismo formato

## Descripción completa

En el modo juego, al colocar el cursor sobre cualquier componente de la mesa (un texto, un tablero o un dado), debe aparecer un tooltip con el formato "<Tipo de elemento>: <id de elemento>", para que el usuario pueda identificar qué es y cuál es cada elemento sin necesidad de abrirlo.

Preguntas de alcance resueltas con el usuario:

- **Estilo del tooltip**: se usa el tooltip nativo del navegador (el que aparece automáticamente al dejar el ratón quieto sobre un elemento con atributo `title`), no un tooltip visual propio con estilos a medida. Se descarta reutilizar el tooltip visual ya existente en la app para la ayuda contextual (el icono "?"), ya que ese está reservado a mensajes de ayuda, no a identificación de elementos.
- **Texto del "tipo de elemento"**: se muestra con un nombre legible y capitalizado en español — "Texto", "Tablero", "Dado" — en vez del valor interno en minúsculas que usa el dato del componente.
- **Texto del "id de elemento"**: se muestra el identificador interno del componente tal cual, sin acortar ni transformar. Hoy ese identificador es una cadena larga (un UUID), no un código corto legible; se acepta mostrarlo así porque es literalmente el identificador que tiene cada componente, y no se crea un identificador nuevo solo para este tooltip.
- **Alcance**: el tooltip solo aparece en modo juego. En modo edición no debe aparecer este tooltip.
- **Qué componentes lo tienen**: los tres tipos de componente que existen hoy en la mesa (texto, tablero, dado). Cubre toda el área ocupada por el componente.
- **Convivencia con lo existente**: no interfiere con arrastrar un componente, ni con el click para lanzar un dado, ni con el doble click para ver el resultado grande del dado — el tooltip es solo información pasiva al pasar el ratón, no una interacción nueva.
- **Casos límite**: no aplica a otros elementos de la pantalla (la mesa en sí, la barra de herramientas, los modales), solo a los componentes de juego. No hay datos nuevos que guardar ni comportamiento distinto al recargar: la información del tooltip se calcula siempre a partir de los datos ya existentes del componente en el momento de mostrarlo.

### Ampliación: etiqueta de identificación en modo edición

En modo edición, los componentes ya muestran hoy un contorno azul discontinuo para diferenciarlos: uno más fino al pasar el ratón por encima, y uno más grueso (con algo de separación respecto al borde del elemento) cuando el elemento está seleccionado. Esta ampliación añade, junto a ese mismo contorno, una pequeña etiqueta anclada en la esquina superior izquierda del elemento con el mismo texto que el tooltip de modo juego: "<Tipo de elemento>: <id de elemento>" (mismo nombre legible capitalizado y mismo id interno tal cual).

Preguntas de alcance resueltas con el usuario:

- **Cuándo aparece**: en cualquiera de los dos momentos en los que hoy se ve el contorno azul — al pasar el ratón por encima y cuando el elemento está seleccionado —, no solo en uno de los dos casos.
- **Comportamiento si el texto no cabe**: como el id interno es una cadena larga, la etiqueta puede sobresalir del ancho del propio elemento en vez de recortarse o partirse en varias líneas; es una ayuda visual del editor, no una pieza de arte final del juego.
- **Alcance**: aplica a los tres tipos de componente (texto, tablero, dado), igual que el contorno azul ya existente.
- **Convivencia con lo existente**: la etiqueta no debe interferir con arrastrar, redimensionar ni seleccionar el elemento que tiene debajo — es solo información visual pasiva superpuesta.
- **Color de la etiqueta**: fondo azul oscuro (no el gris/negro de otros elementos flotantes de la app) con el texto en un color claro que mantenga buen contraste sobre ese azul.
- En modo juego esta etiqueta no aplica: ahí la misma información se sigue mostrando como tooltip nativo al pasar el ratón (ver más arriba), no como etiqueta fija.

## Apuntes técnicos

- El renderizado de los componentes sobre la mesa (los tres tipos: `texto`, `tablero`, `dado`) vive en `ui/componentRenderer.js`, función `renderComponentsOnTable`, compartida por `modes/play/playMode.js` y `modes/edit/editMode.js`. Para que el tooltip aparezca solo en modo juego, la función necesita una nueva opción que solo pase `playMode.js` al invocarla — mismo patrón que ya usan hoy `onDiceResult`/`onDiceOpenResult`, que solo pasa `playMode.js` y no `editMode.js`.
- El identificador interno de cada componente (`component.id`) se genera con `crypto.randomUUID()` en `core/component.js`; no existe hoy ningún id corto/legible alternativo en el modelo de datos.
- El valor interno del tipo (`component.type`) es hoy `'texto'`, `'tablero'` o `'dado'` (minúsculas); la traducción a nombre legible capitalizado ("Texto", "Tablero", "Dado") es solo de presentación, no cambia el dato almacenado.
- El contorno azul discontinuo de modo edición ya existe hoy en `src/styles/main.css` (`.text-box--selectable:hover`, `.board--selectable:hover`, `.dice--selectable:hover` con 2px, y sus variantes `--selected` con 3px y `outline-offset: 4px`), aplicado vía las clases que ya asigna `renderComponentsOnTable` en `ui/componentRenderer.js` según `onSelect`/`selectedId`. La nueva etiqueta se puede anclar como elemento hijo posicionado en la esquina superior izquierda de cada contenedor de componente (`text-box`, `board`, `dice`), mostrado/ocultado con el mismo criterio CSS de hover/selected que ya usa el contorno, y con `pointer-events: none` para no interceptar el arrastre/selección del elemento.
