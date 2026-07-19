# Plan — 00028: Aumentar el ancho por defecto de los paneles flotantes del modo edición

## (a) Anotaciones funcionales

- Fuera de alcance: los límites de redimensionado manual (`MIN_PANEL_WIDTH = 290`, `MAX_PANEL_WIDTH = 600`, duplicados en `src/ui/componentList.js` y `src/ui/resourceList.js`) no se tocan.
- Fuera de alcance: cualquier otro comportamiento de arrastre/colapso de los paneles.
- Fuera de alcance: recalcular dinámicamente la posición de Recursos según el estado colapsado/expandido de Componentes (confirmado con el usuario) — es un hueco fijo de partida, calculado asumiendo Componentes expandido.
- Verificación de causa raíz (primer análisis de esta entrada): el ancho por defecto del panel de Componentes (`.component-panel-container`, `src/styles/main.css`) era 300px, y el de Recursos (`.resource-panel-container`) era 320px (no 300px como se asumía originalmente) — ya subidos ambos a 350px en una implementación anterior de esta misma entrada. Esta ampliación parte de ahí.
- Preguntas de alcance resueltas con el usuario (ampliación):
  - ¿Orden del apilado? → Componentes arriba (mantiene su posición actual), Recursos justo debajo, mismo lado (derecha).
  - ¿Recalcular el hueco según colapso/expansión de Componentes? → No, hueco fijo asumiendo Componentes expandido.
  - ¿Aplica el mismo criterio que el ancho (solo si no hay posición ya guardada)? → Sí.

## (b) Solución técnica

1. `src/styles/main.css`, `.component-panel-container`: `width: 350px` → `width: 400px`.
2. `src/styles/main.css`, `.resource-panel-container`: `width: 350px` → `width: 400px`.
3. `src/styles/main.css`, `.resource-panel-container`: cambiar el anclaje de `left: 1rem` a `right: 1rem` (para quedar en el mismo lado que Componentes), y subir `top` de `1rem` a un valor fijo mayor que deje hueco para Componentes expandido a 400px de ancho sin solapar — `top: 28rem` (448px: cubre holgadamente el caso peor de Componentes expandido con el body de la tabla en su `max-height` de 320px, más cabecera/pie/borde, más un margen de separación visual entre ambos paneles).
4. No se toca `src/modes/edit/editMode.js` ni `src/core/state.js`: el `left`/`top`/`width` inline de ambos paneles ya solo se aplica cuando `panelState.position`/`width` o `resourcePanelState.position`/`width` no son `null` (confirmado en el primer análisis de esta entrada); si son `null`, el contenedor hereda la posición/ancho de su regla CSS. Por eso basta con los cambios de CSS anteriores para que las partidas ya guardadas con posición y/o ancho personalizados no se vean afectadas.
5. No se tocan `MIN_PANEL_WIDTH`/`MAX_PANEL_WIDTH` en `src/ui/componentList.js` ni `src/ui/resourceList.js`.

## (d) Cambios en estilo

- `design/docs/STYLE_BIBLE.md`, sección 10 ("Layout"), línea 111: actualizar "Paneles laterales de ancho fijo: `350px`..." a `400px`.
- `design/docs/STYLE_BIBLE.md`, sección 10 ("Layout"): añadir una línea documentando la nueva convención de posición por defecto de los paneles flotantes del modo edición: ambos anclados al lado derecho, apilados verticalmente (Componentes arriba, Recursos debajo), como posición de partida (el usuario puede arrastrarlos libremente después).
