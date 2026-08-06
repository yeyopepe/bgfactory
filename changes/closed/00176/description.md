- **Nombre**: Aumentar un 10% el ancho por defecto de las ventanas del modo edición
- **Código**: 00176
- **Tipo**: fast
- **Fecha creación**: 2026-08-06

## Prompt original del usuario

las ventanas del modo edición tienen un ancho por defecto un 10% más que el actual

## Descripción completa

Las tres ventanas flotantes del modo edición (lista de componentes, galería de recursos y lista de grupos) tienen actualmente un ancho por defecto de 400px cuando el usuario no las ha redimensionado manualmente. Se pide aumentar ese ancho por defecto un 10%, quedando en 440px.

No cambia ningún comportamiento, flujo ni interacción: el usuario sigue pudiendo redimensionar cada ventana libremente, y su ancho personalizado (si lo ha ajustado antes) se sigue respetando igual que hasta ahora. Solo cambia el ancho inicial con el que aparecen esas ventanas quienes no las hayan tocado nunca.

## Apuntes técnicos

- El ancho por defecto está fijado en `src/styles/main.css`, en tres reglas: `.component-panel-container`, `.resource-panel-container` y `.group-panel-container` (`width: 400px`).
- Se aplica solo cuando `panelState.width`/`resourcePanelState.width`/`groupPanelState.width` (en `src/core/state.js`) es `null` — si el usuario ya redimensionó el panel, `editMode.js` aplica el width guardado vía `style.width`, ignorando el CSS.
- `design/docs/stylebible/STYLE_BIBLE.md` (sección 10, línea 137) documenta este valor como constante (`400px`). Al ser un ajuste fast-track, esta entrada no actualiza ese documento — quedará una incongruencia menor documentada como pendiente hasta que se sincronice en un cambio futuro.

## Cambios aplicados

- `src/styles/main.css`: cambiado `width: 400px` → `width: 440px` en las tres reglas `.component-panel-container`, `.resource-panel-container` y `.group-panel-container`.
