- **Nombre**: Check "Biselado en el borde" en Tablero simple y Tablero personalizado
- **Código**: 00154
- **Tipo**: change
- **Fecha creación**: 2026-08-05

## Prompt original del usuario

"en las propiedades específicas del tablero simple y del tablero personalizado, añade un check para indicar si se debe aplicar el biselado o dibujarlo totalmente plano.
Sección nueva llamada "Visual" y dentro el check "Biselado en el borde". Siempre true por defecto"

## Descripción completa

Hoy, el borde de "Tablero simple" y "Tablero personalizado" siempre se dibuja con un efecto de bisel/relieve: dos tonos (uno más claro, uno más oscuro) derivados del color de borde elegido, dando sensación de pieza física con volumen — mismo lenguaje visual que comparten Dado y el resto de piezas del juego.

Se añade una nueva sección de propiedades llamada **"Visual"**, en las propiedades específicas de ambos tipos de tablero, con un único checkbox: **"Biselado en el borde"**, marcado (activado) por defecto.

- **Marcado** (comportamiento actual, por defecto): el borde se sigue dibujando con el bisel de dos tonos de siempre.
- **Desmarcado**: el borde se dibuja totalmente plano, de un único color (el mismo color de borde ya configurado), sin relieve ni degradado de tonos — mismo grosor que el configurado.

### Alcance

Este check aplica únicamente a "Tablero simple" y "Tablero personalizado". No afecta a "Dado" (mantiene siempre su acabado actual) ni a "Carta/Ficha" (que ya usa un borde de línea simple sin relieve, ajeno a este check).

### Ubicación

- **Tablero simple**: la sección "Visual" aparece la primera dentro de la modal de propiedades específicas, antes que la sección "Borde" ya existente (color y grosor del borde).
- **Tablero personalizado**: la sección "Visual" aparece también la primera dentro de la modal de propiedades específicas, antes que el botón "Editar diseño del tablero" — y no dentro del Editor visual donde se configuran color y grosor del borde, que sigue siendo el único punto de configuración de esos dos valores.

### Casos límite y convivencia

- Si el grosor del borde es `0`, no hay borde visible en ningún caso — el check no cambia ese comportamiento existente.
- Tableros creados antes de este cambio, sin la nueva propiedad guardada, se comportan igual que si el check estuviera marcado (biselado) — sin ningún cambio visual en partidas ya existentes al abrirlas.
- El valor del check se guarda como cualquier otra propiedad del componente y viaja con el resto del estado del tablero al exportar/importar como JSON, sin tratamiento especial.
- Disponible para editarse en modo edición; el efecto (biselado o plano) se ve tanto en modo juego como en modo edición.

## Apuntes técnicos

- **Tablero simple**: propiedades específicas en `src/ui/componentModal.js` → `renderBoardSpecificFields` (fieldset "Borde": `props.bordeColor`, `props.bordeGrosor`). El bisel se pinta en `src/ui/componentRenderer.js` (rama `component.type === 'tableroSimple'`, líneas ~664-672) usando `shadeColor()` de `src/core/colorUtils.js` para los cuatro lados del borde (`borderTopColor`/`borderLeftColor` más claros, `borderBottomColor`/`borderRightColor` más oscuros).
- **Tablero personalizado**: en `componentModal.js` → `renderTableroPersonalizadoSpecificFields` solo hay el botón "Editar diseño del tablero" (abre `openVisualEditorModal` con `borderStyle: 'bisel'`); color/grosor de borde (`props.cara.bordeColor`/`props.cara.bordeGrosor`) se configuran dentro de `src/ui/visualEditorModal.js` (sección "Borde" del editor, líneas ~767-815). El bisel se pinta en dos sitios que deben mantenerse coherentes: `componentRenderer.js` (rama `component.type === 'tableroPersonalizado'`, líneas ~854-866, para el render en mesa) y `visualEditorModal.js` (`applyCanvasBorder()`, líneas ~659-684, para la previsualización dentro del propio editor).
- El nuevo check debería vivir como propiedad de nivel de componente (p.ej. `props.biselado` en `tableroSimple`, y una propiedad equivalente en el nivel de `properties` de `tableroPersonalizado`, no dentro de `props.cara`, ya que la petición es que aparezca en las "propiedades específicas" gestionadas por `componentModal.js`, no dentro del Editor visual).
- `DEFAULT_BOARD_PROPERTIES` y `DEFAULT_TABLERO_PERSONALIZADO_PROPERTIES` (ambos en `componentModal.js`) son el sitio natural para fijar el valor por defecto (`true`).
- Existe ya un patrón de fieldset con título reutilizable (`className: 'modal__section'` + `<legend class="modal__section-title">`) usado por la sección "Borde" de `renderBoardSpecificFields`, a reutilizar para la nueva sección "Visual".
- STYLE_BIBLE.md sección 13 documenta el criterio de bisel de dos tonos compartido por Tablero simple/Dado/Tablero personalizado — quedaría desactualizada para el caso "biselado desmarcado" y `ms-how` debería tenerlo en cuenta al planificar.
