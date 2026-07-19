- **Nombre**: Aumentar el ancho por defecto de los paneles flotantes del modo edición
- **Código**: 00028
- **Tipo**: change

## Prompt original del usuario

ms-fast aumenta el ancho de la lista de componentes del modo edición en 50px

## Descripción completa

En el modo edición, el panel flotante de "Componentes" (lista con columnas Orden/Id/Tipo/Acciones) pasa a tener un ancho por defecto de 350px en vez de los 300px actuales. El panel flotante de "Recursos" (galería de imágenes y tipografías), que hasta ahora compartía el mismo ancho por defecto que el de Componentes, sube igualmente a 350px, para que ambos paneles laterales del modo edición mantengan el mismo ancho por defecto entre sí.

### Alcance del cambio

- **Ancho mínimo de redimensionado manual**: se mantiene en 290px para ambos paneles, igual que hoy. El usuario sigue pudiendo estrechar cualquiera de los dos paneles manualmente por debajo del nuevo ancho por defecto (350px), hasta ese mínimo.
- **Ancho máximo de redimensionado manual**: no cambia (sigue siendo el límite ya existente).
- **Partidas ya guardadas**: si el usuario ya había redimensionado manualmente alguno de los dos paneles (tiene un ancho propio guardado), ese ancho personalizado se respeta tal cual — el nuevo valor de 350px por defecto solo se aplica cuando no hay ningún ancho guardado todavía (sesión nueva, o guardado anterior a esta funcionalidad).
- **Posición y comportamiento**: no cambia nada más de cómo se arrastran, colapsan o redimensionan estos paneles, solo su ancho de partida.

### Preguntas de alcance resueltas

- **¿Afecta solo al panel de Componentes o también al de Recursos?**: a ambos, para que compartan el mismo ancho por defecto entre sí, en vez de dejar al de Componentes como una excepción aislada frente a la convención de ancho de panel ya documentada.
- **¿Se toca el ancho mínimo de redimensionado (290px)?**: no, se mantiene igual.
- **¿Se fuerza el nuevo ancho en partidas guardadas que ya tenían uno personalizado?**: no, se respeta el ancho ya guardado por el usuario; el nuevo valor por defecto solo aplica cuando no hay ninguno guardado.

## Apuntes técnicos

- Ancho por defecto actual (300px) fijado en `src/styles/main.css`, regla `.component-panel-container` (panel de Componentes). El panel de Recursos usa previsiblemente una regla análoga (`.resource-panel-container` o similar) con el mismo valor — confirmar y actualizar ambas.
- `STYLE_BIBLE.md` sección 10 ("Layout") documenta explícitamente "Paneles laterales de ancho fijo: 300px (`.component-list`, `.edit-mode-panel`)" como convención compartida — hay que actualizar ese valor a 350px ahí también, ya que este cambio lo modifica.
- Los límites de redimensionado manual (`MIN_PANEL_WIDTH = 290`, `MAX_PANEL_WIDTH = 600`) están duplicados como constantes en `src/ui/componentList.js` y `src/ui/resourceList.js`; no se tocan en este cambio (solo el ancho por defecto vía CSS, no estas constantes).
- El ancho por defecto solo se refleja en el DOM cuando `panelState.width` (o `resourcePanelState.width`, `src/core/state.js`) es `null`: `src/modes/edit/editMode.js` solo fija `listContainer.style.width` / `resourceListContainer.style.width` de forma inline si `panelWidth != null`; si es `null`, el contenedor hereda el ancho de la regla CSS de `.component-panel-container`/`.resource-panel-container`. Por eso basta con cambiar el valor en `main.css` (y `STYLE_BIBLE.md`) para que los guardados ya existentes con ancho personalizado no se vean afectados.
