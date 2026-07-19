- **Nombre**: Aumentar el ancho por defecto de los paneles flotantes del modo edición
- **Código**: 00028
- **Tipo**: change

## Prompt original del usuario

ms-fast aumenta el ancho de la lista de componentes del modo edición en 50px

Añade otros 50px más (ampliación): 50px más de ancho inicial, y las ventanas del modo edición pasan a tener una posición inicial alineadas una debajo de otra a la derecha (en vez de una a cada lado como hoy).

## Descripción completa

En el modo edición, el panel flotante de "Componentes" (lista con columnas Orden/Id/Tipo/Acciones) pasa a tener un ancho por defecto de 400px en vez de los 300px actuales. El panel flotante de "Recursos" (galería de imágenes y tipografías), que hasta ahora compartía el mismo ancho por defecto que el de Componentes, sube igualmente a 400px, para que ambos paneles laterales del modo edición mantengan el mismo ancho por defecto entre sí.

Además, la posición inicial de ambos paneles cambia: en vez de aparecer uno en cada esquina superior (Componentes a la derecha, Recursos a la izquierda, como hoy), ambos aparecen apilados en el lado derecho — Componentes arriba, en su posición actual, y Recursos justo debajo.

### Alcance del cambio

- **Ancho mínimo de redimensionado manual**: se mantiene en 290px para ambos paneles, igual que hoy. El usuario sigue pudiendo estrechar cualquiera de los dos paneles manualmente por debajo del nuevo ancho por defecto (400px), hasta ese mínimo.
- **Ancho máximo de redimensionado manual**: no cambia (sigue siendo el límite ya existente).
- **Partidas ya guardadas (ancho)**: si el usuario ya había redimensionado manualmente alguno de los dos paneles (tiene un ancho propio guardado), ese ancho personalizado se respeta tal cual — el nuevo valor de 400px por defecto solo se aplica cuando no hay ningún ancho guardado todavía (sesión nueva, o guardado anterior a esta funcionalidad).
- **Orden de apilado**: Componentes arriba (mantiene su posición actual, esquina superior derecha), Recursos justo debajo, mismo lado.
- **Solape con el panel de arriba colapsado/expandido**: la posición inicial de Recursos es un hueco fijo, calculado asumiendo el panel de Componentes expandido; no se recalcula dinámicamente según si Componentes está colapsado o expandido. Es solo la posición de partida — el usuario puede arrastrar cualquiera de los dos paneles si no le encaja.
- **Partidas ya guardadas (posición)**: mismo criterio que el ancho — si el usuario ya había arrastrado alguno de los dos paneles a una posición propia (tiene una posición guardada), esa posición personalizada se respeta tal cual; la nueva posición apilada por defecto solo se aplica cuando no hay ninguna posición guardada todavía.
- **Comportamiento**: no cambia nada más de cómo se arrastran, colapsan o redimensionan estos paneles, solo su ancho y posición de partida.

### Preguntas de alcance resueltas

- **¿Afecta solo al panel de Componentes o también al de Recursos?**: a ambos (ancho y posición), para que compartan el mismo ancho por defecto entre sí, en vez de dejar al de Componentes como una excepción aislada frente a la convención de ancho de panel ya documentada.
- **¿Se toca el ancho mínimo de redimensionado (290px)?**: no, se mantiene igual.
- **¿Se fuerza el nuevo ancho/posición en partidas guardadas que ya tenían uno/a personalizado/a?**: no, se respeta lo ya guardado por el usuario; el nuevo valor por defecto solo aplica cuando no hay ninguno guardado.
- **¿Qué panel queda arriba en el apilado?**: Componentes arriba (mantiene su posición actual), Recursos debajo.
- **¿Se recalcula la posición de Recursos según el estado colapsado/expandido de Componentes?**: no, hueco fijo asumiendo Componentes expandido.

## Apuntes técnicos

- Un primer análisis/implementación de esta entrada ya subió el ancho por defecto de 300px a 350px (confirmado que `.resource-panel-container` estaba realmente en 320px, no en 300px como se asumía al principio) en `src/styles/main.css` (`.component-panel-container` línea ~596, `.resource-panel-container` línea ~660) y en `STYLE_BIBLE.md` sección 10. Esta ampliación parte de ese estado (ambos ya en 350px) para subir a 400px.
- Los límites de redimensionado manual (`MIN_PANEL_WIDTH = 290`, `MAX_PANEL_WIDTH = 600`) están duplicados como constantes en `src/ui/componentList.js` y `src/ui/resourceList.js`; no se tocan en este cambio (solo el ancho por defecto vía CSS, no estas constantes).
- El ancho por defecto solo se refleja en el DOM cuando `panelState.width` (o `resourcePanelState.width`, `src/core/state.js`) es `null`: `src/modes/edit/editMode.js` solo fija `listContainer.style.width` / `resourceListContainer.style.width` de forma inline si `panelWidth != null`; si es `null`, el contenedor hereda el ancho de la regla CSS de `.component-panel-container`/`.resource-panel-container`. Por eso basta con cambiar el valor en `main.css` (y `STYLE_BIBLE.md`) para que los guardados ya existentes con ancho personalizado no se vean afectados.
- Posición: hoy, `.component-panel-container` fija `top: 1rem; right: 1rem;` y `.resource-panel-container` fija `top: 1rem; left: 1rem;` (ambas en `src/styles/main.css`), y en `src/modes/edit/editMode.js` (líneas ~46-69) el `left`/`top` inline solo se aplica si `panelPosition`/`resourcePanelPosition` (de `getPanelState()`/`getResourcePanelState()`, `src/core/state.js`) no es `null` — igual que con el ancho. Para apilar Recursos debajo de Componentes por defecto sin tocar partidas con posición ya guardada, previsiblemente hay que: (a) cambiar `.resource-panel-container` para anclarse también a la derecha (`right: 1rem` en vez de `left: 1rem`) y (b) darle un `top` por defecto mayor que el de Componentes, fijo (sin recalcular según colapsado/expandido), suficiente para no solapar con el panel de Componentes expandido a 400px de ancho. `ms-implement` debe concretar el valor exacto de ese `top` a partir de la altura real del panel de Componentes expandido.
