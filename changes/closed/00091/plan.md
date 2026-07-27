# Plan — 00091: Sección de interacciones en el menú contextual de modo juego

## (a) Anotaciones funcionales

- **Fuera de alcance**: nada más allá de lo descrito en `description.md`. En particular, no se guarda esta información en el modelo de datos (`core/component.js`/`core/state.js`) — es texto fijo derivado del `type`, calculado al construir el menú. Tampoco aplica a modo edición: `ui/contextMenu.js` (`openContextMenu`) solo lo invoca hoy `modes/play/playMode.js`, así que la sección nueva solo puede aparecer donde ya aparece el menú contextual actual (modo juego).
- **Dudas resueltas**: todas las dudas de alcance (mostrar siempre vs. solo si hay interacción, mención del arrastre, ubicación dentro del menú, si es interactiva) ya quedaron resueltas con el usuario en `description.md` — no ha surgido ninguna duda técnica adicional al analizar la solución.
- Verificado contra el código real (`ui/contextMenu.js`, `modes/play/playMode.js`, `ui/componentRenderer.js`) que el mapeo por tipo descrito en **Apuntes técnicos** de `description.md` es exacto: no hay ninguna incongruencia entre esa documentación y el código.

## (b) Solución técnica

1. **`src/ui/contextMenu.js`** — añadir un nuevo parámetro `interactionItems` a `openContextMenu` (array fijo de 3 `{ label, value }`: Clic izquierdo, Doble clic izquierdo, Clic derecho). Después de pintar `generalItems` y, si los hay, `specificItems` (con su separador condicional ya existente), insertar **siempre** un separador (`.context-menu__separator`) seguido de un bloque nuevo `.context-menu__info`:
   - Un encabezado `.context-menu__info-title` con el texto "Interacciones".
   - Una fila `.context-menu__info-row` por cada `interactionItem`, con `.context-menu__info-label` (el nombre del click) y `.context-menu__info-value` (el efecto); cuando el valor sea "Ninguno", añadir también la clase `.context-menu__info-value--none` para el tratamiento visual tenue/cursiva.
   - Este bloque no lleva ningún `addEventListener` ni usa `addRow`/`onClick`: es una función de render aparte (p.ej. `addInfoSection`), puramente texto, sin hover ni cursor de acción (`cursor: default`).

2. **`src/modes/play/playMode.js`** — añadir una tabla de mapeo `type → interactionItems`, con los 6 tipos de componente existentes:
   - `texto`, `tablero`, `documento`, `ficha`: Clic izquierdo "Ninguno" · Doble clic izquierdo "Ninguno" · Clic derecho "Abrir este menú".
   - `dado`: Clic izquierdo "Lanzar el dado" · Doble clic izquierdo "Ver el resultado en grande" · Clic derecho "Abrir este menú".
   - `carta`: Clic izquierdo "Voltear la carta" · Doble clic izquierdo "Ninguno" · Clic derecho "Abrir este menú".

   Dentro del handler `onContextMenu` ya existente, pasar `interactionItems: interactionsByType[component.type]` a la llamada a `openContextMenu`, junto a `generalItems` (sin tocar `specificItems`, que sigue sin usarse).

3. **`src/styles/main.css`** — junto a las reglas `.context-menu*` ya existentes (bloque "Context menu", cambio 00088), añadir las reglas del bloque nuevo: `.context-menu__info` (`cursor: default`, sin hover), `.context-menu__info-title` (tipografía pequeña, mayúsculas, `color: var(--text-muted)`), `.context-menu__info-row` (fila flex con label a la izquierda y valor a la derecha), `.context-menu__info-label`, `.context-menu__info-value`, `.context-menu__info-value--none` (tono más tenue + cursiva, para "Ninguno"). Tomar como referencia de aspecto (no de marcado) el mockup `design_menu-contextual-interacciones.html` de esta misma carpeta, reutilizando el mismo lenguaje visual del resto de `.context-menu*` (colores/bordes ya fijados en la sección 12.8 de `STYLE_BIBLE.md`).

## (d) Cambios en estilo

Actualizar la sección **12.8 Menú contextual de componente** de `design/docs/stylebible/STYLE_BIBLE.md`: documentar que, además de las secciones de acciones (`generalItems`/`specificItems`), el menú admite ahora una tercera sección fija de solo lectura (`interactionItems`, clases `.context-menu__info*`), siempre visible, separada por su propio `.context-menu__separator`, con tipografía más pequeña/tenue que las filas de acción y sin hover/cursor de acción — precisando que esta sección no sigue el patrón interactivo (icono + hover azul) del resto del menú, sino uno puramente informativo.
