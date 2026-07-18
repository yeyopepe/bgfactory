- **Nombre**: Botón de reajustar zoom para ver todos los elementos
- **Código**: 00021
- **Tipo**: change

## Prompt original del usuario

añadir en la barra superior un botón para reajustar el zoom de la mesa de manera que se vean todos los elementos existentes. Hazme varias propuestas visuales

## Descripción completa

Se añade un nuevo botón que reajusta la vista de la mesa infinita (posición y zoom) para que todos los elementos existentes queden visibles a la vez en la pantalla, sin tener que hacerlo manualmente arrastrando y haciendo zoom con la rueda del ratón.

El botón está disponible tanto en modo edición como en modo juego:
- En modo edición se añade a la barra de herramientas existente, junto a los botones "Salir del modo edición" y "Guardar".
- En modo juego, donde hoy no existe una barra de herramientas equivalente (solo el botón flotante "Entrar en modo edición"), se añade un botón flotante equivalente para poder reencuadrar la mesa también mientras se está jugando.

Al pulsar el botón, en cualquiera de los dos modos, la vista de la mesa cambia instantáneamente (sin animación de transición) para encuadrar todos los elementos, dejando un margen entre ellos y el borde de la pantalla para que no queden pegados al borde.

Casos límite:
- Si no hay ningún elemento en la mesa, el botón deja una vista neutra (zoom por defecto, centrada en el origen), en vez de no hacer nada.
- Si solo hay un elemento, o los elementos existentes son muy pequeños, el zoom se acerca como mucho hasta el límite máximo que ya existe hoy para el zoom manual (el mismo tope que aplica al hacer zoom con la rueda del ratón) — no se acerca más allá de ese límite aunque el contenido sea diminuto.
- El resultado del reajuste no se guarda entre sesiones, igual que el resto de la posición/zoom de la mesa hoy en día (se pierde al recargar la página).

Preguntas de alcance resueltas con el usuario:
- ¿Debía estar el botón solo en modo edición, o también en modo juego? Se confirmó que debe estar disponible en ambos modos.
- ¿Qué aspecto visual tiene el botón? Se eligió la variante "solo icono" (círculo/marco de encuadre, sin texto, con etiqueta accesible para lectores de pantalla y tooltip nativo) en ambos modos.
- ¿Dónde se ubica en cada modo? Se confirmó que debe verse en la misma posición de pantalla en los dos modos (extremo superior derecho del todo), para que el usuario no tenga que buscarlo en un sitio distinto al cambiar de modo: en modo edición, es el último botón de la barra de herramientas de edición (a la derecha de "Guardar"); en modo juego, flotante en esa misma esquina, a la derecha del botón "Entrar en modo edición" (no a su izquierda, ni en otra esquina de la pantalla).

## Apuntes técnicos

- La mesa infinita (`src/ui/table.js`) mantiene hoy el estado de cámara/zoom (`cameraX`, `cameraY`, `zoom`) a nivel de módulo, y se documenta explícitamente como "independiente del conocimiento de componentes" (no importa `state.js` ni conoce la lista de elementos). Cualquier solución para "ajustar a todos los elementos" necesitará que quien sí conoce los componentes (p.ej. `editModeToggle.js`, `main.js`, o los propios `playMode.js`/`editMode.js`) calcule el encuadre a partir de `getComponents()` (posiciones `x`/`y` y tamaños `width`/`height` de `src/core/component.js`, que pueden ser `null`) y se lo pase a una nueva función expuesta por `table.js`, en vez de que `table.js` empiece a leer el estado de componentes directamente.
- Límites de zoom ya existentes en `table.js`: `minZoom = 0.5`, `maxZoom = 2.5`.
- Barra de herramientas de edición ya existente: `src/ui/editModeToggle.js` (`renderEditToolbar`), clase `.edit-toolbar` en `src/styles/main.css`.
- En modo juego no existe hoy ninguna barra; el único elemento fijo visible en ese modo es el botón flotante `#mode-switcher` ("Entrar en modo edición"), estilado en `main.css`. El nuevo botón flotante de modo juego debería seguir un patrón visual coherente con ese botón (posición fija, mismo z-index relativo) sin ocupar su mismo hueco.
- Guía de estilo relevante: `design/docs/STYLE_BIBLE.md` — sin animaciones/transiciones en toda la app, paleta de tokens en `:root`, patrón de botones de la sección 9 (incluye el tratamiento específico para botones sobre fondo oscuro de toolbar, aplicable al botón de `edit-toolbar`).
