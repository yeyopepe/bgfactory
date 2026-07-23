- **Nombre**: Ajuste manual de columnas y redimensionado sin límite en paneles de edición
- **Código**: 00064
- **Tipo**: change

## Prompt original del usuario

en las ventanas de la lista de componentes y lista de recursos del modo edición, debe poder ajustarse manualmente el ancho de sus columnas y las ventanas deben poder redimensionarse sin límite máximo (mantén el límite mínimo)

## Descripción completa

En modo edición, las dos ventanas flotantes "Lista de componentes" y "Lista de recursos" ganan dos capacidades nuevas de ajuste manual:

**1. Ancho de columnas ajustable.** En ambas tablas (Orden/Id/Tipo/Acciones para componentes; Nombre/Tipo/Acciones para recursos), el usuario puede arrastrar el borde derecho de cada cabecera de columna para ajustar su ancho manualmente, con un ancho mínimo razonable por columna para que el texto o los botones de "Acciones" no se solapen. Aplica a todas las columnas, incluida "Acciones". Si la suma de anchos de columna supera el ancho visible del panel, la tabla muestra scroll horizontal interno sin romper el layout del panel ni desbordar sobre el resto de la pantalla. El ancho de cada columna se persiste en el autoguardado, igual que ya se persiste el ancho/posición/colapso del propio panel — de forma independiente por panel (componentes y recursos no comparten anchos de columna).

**2. Redimensionado del panel sin límite máximo.** El redimensionado horizontal del panel completo (mismo manejador de esquina inferior derecha que ya existe hoy) deja de estar limitado a un ancho máximo fijo (600px) ni a la mitad del ancho de la ventana. El único límite superior que se mantiene es no salirse por el borde derecho de la pantalla (comportamiento ya existente). El límite mínimo (290px) no cambia.

### Casos límite

- Al recargar la página, cada panel recupera tanto su ancho general como el ancho de sus columnas desde el último guardado; si no hay datos guardados (sesión nueva o guardado anterior a este cambio), se usan los anchos de columna por defecto actuales.
- Si el usuario ensancha el panel hasta un tamaño muy grande (sin tope salvo el borde de pantalla), las columnas no se reajustan automáticamente — mantienen su ancho fijado manualmente (o el de por defecto si no se ha tocado), dejando el espacio sobrante vacío en la tabla si corresponde.
- El redimensionado de columna no afecta al redimensionado del panel (son interacciones independientes) ni viceversa.

### Convivencia con lo existente

No sustituye nada, añade dos capacidades nuevas sobre el mecanismo de tablas y de redimensionado de panel ya existentes. No hay ningún otro punto de la app con tablas o resize de columnas, así que no hay conflicto con otra funcionalidad.

### Alcance de los datos

Los anchos de columna se guardan en el mismo autoguardado que el resto del estado del proyecto (localStorage / exportación a fichero), igual que el resto del estado de cada panel — por tanto ligados a la partida/proyecto guardado, no a la sesión de navegador.

### Quién puede usarlo

Cualquier usuario en modo edición (no hay roles ni restricciones adicionales en el proyecto).

### Definición visual de alto nivel

Cada cabecera de columna incorpora una pequeña zona de arrastre en su borde derecho (cursor de redimensionado horizontal al pasar el ratón), consistente con el patrón visual ya usado para el resize del panel (línea/zona sutil que se resalta en hover). No se añaden elementos nuevos aparte de esa zona de arrastre por columna.

### Preguntas de alcance resueltas con el usuario

- **Límite máximo del panel**: se elimina el tope fijo (600px) y el de "mitad de ventana"; el único límite superior restante es no salirse del borde derecho de la pantalla.
- **Persistencia del ancho de columnas**: sí, se persiste igual que el resto de datos del panel.
- **Columnas afectadas**: todas, incluida "Acciones".
- **Overflow de la tabla**: scroll horizontal interno dentro del panel si la suma de anchos de columna supera el ancho visible.

## Apuntes técnicos

- `ui/componentList.js` y `ui/resourceList.js` ya usan `attachResizeHandle` (`ui/resizeHandle.js`) para el resize horizontal del panel completo, con `clamp` propio en cada fichero: `MIN_PANEL_WIDTH = 290`, `MAX_PANEL_WIDTH = 600`, y `maxByViewport = Math.min(MAX_PANEL_WIDTH, window.innerWidth / 2)`, `maxByRightEdge = parentWidth - container.offsetLeft`. Para "sin límite máximo salvo borde de pantalla", el clamp pasa a `Math.max(width, MIN_PANEL_WIDTH)` limitado solo por `maxByRightEdge` (eliminar `MAX_PANEL_WIDTH` y `maxByViewport`), en ambos ficheros.
- Ambas tablas son `<table>` HTML reales (`ui/componentList.js` línea ~43, `ui/resourceList.js` línea ~51) con `<thead>`/`<tbody>` generados en JS. No existe hoy ningún mecanismo de resize de columnas en la app (no hay precedente que reutilizar) — es funcionalidad nueva a construir, previsiblemente sobre `ui/resizeHandle.js` o un patrón de arrastre análogo pero orientado a borde de columna (`axis: 'x'` sobre el `<th>`, sin manejador visual de esquina sino de borde).
- Persistencia existente de referencia: `core/state.js` mantiene `panelState` (componentes) y `resourcePanelState` (recursos), ambos con shape `{ collapsed, position, width }` y eventos `panelState:changed`/`resourcePanelState:changed`. El ancho de columnas necesitará un campo nuevo análogo (p. ej. `columnWidths`) en cada uno de esos dos estados, siguiendo el mismo patrón de persistencia/evento.
- El sistema de estilo actual solo documenta un patrón de redimensionado (`ui/resizeHandle.js`, esquina inferior derecha, `STYLE_BIBLE.md` sección 11) — el resize de columna es un patrón visual distinto (borde vertical, cursor de redimensionado horizontal) y debe documentarse como una entrada nueva en `STYLE_BIBLE.md` al implementarlo, no reutilizar la sección 11 tal cual.
