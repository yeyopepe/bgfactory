## (a) Anotaciones funcionales

- Fuera de alcance (confirmado con el usuario en `description.md`): capa de datos (`core/state.js`, `core/component.js`) y `ui/componentList.js` se mantienen intactas y sin tocar; no se reintroduce ningún formulario ni listado editable en modo edición; el modo no se persiste en `localStorage`; no se añaden roles/permisos.
- Todas las dudas de alcance planteadas en `description.md` (puntos 1-7) quedan resueltas ahí mismo por el usuario; no ha surgido ninguna duda técnica adicional durante el análisis de este plan.

## (b) Solución técnica

1. **`src/core/state.js`**: sin cambios. `MODES`, `getState`, `setMode` (con su evento `mode:changed`) ya cubren exactamente lo que necesita el flujo de entrar/salir; no hace falta ningún estado nuevo.

2. **Sustituir `src/ui/modeSwitcher.js` por `src/ui/editModeToggle.js`**: elimina el fichero actual (selector de dos botones intercambiables) y créalo de nuevo con dos funciones exportadas, ambas idempotentes respecto al modo activo (limpian su contenedor si no aplica):
   - `renderEnterEditButton(container)`: si `getState().mode === MODES.PLAY`, renderiza un único botón "Entrar en modo edición" (`click` → `setMode(MODES.EDIT)`); si el modo es `EDIT`, deja el contenedor vacío (el botón desaparece).
   - `renderEditToolbar(container)`: si `getState().mode === MODES.EDIT`, renderiza la franja de herramientas (`div.edit-toolbar`) con el botón "Salir del modo edición" (`click` → `setMode(MODES.PLAY)`); si el modo es `PLAY`, deja el contenedor vacío (la franja desaparece).
   
   Se separan en dos funciones porque vive en dos contenedores distintos del DOM (ver punto 4): el botón de entrada permanece en la zona superior actual (`#mode-switcher`), la barra de edición es una franja propia y visualmente diferenciada.

3. **`src/modes/edit/editMode.js`**: elimina el formulario de alta/edición (`buildForm`, `startEditing`, el `editingId` y las importaciones de `core/component.js` y `core/state.js`/`ui/componentList.js` que solo servían a ese formulario) y el listado editable. `renderEditMode(container)` pasa a limpiar el contenedor y renderizar únicamente un placeholder: `<p>Modo edición — próximamente</p>` (o similar), tal como confirma el punto 4 de `description.md`.

4. **`src/index.html`**: añade un contenedor propio para la barra de herramientas de edición, `<div id="edit-toolbar"></div>`, como primer hijo de `<body>` (antes de `<h1>`), para que pueda pintarse como franja de ancho completo en la parte superior de la pantalla, independiente del contenido centrado (`max-width: 720px`) del resto de la página. El contenedor `#mode-switcher` se mantiene donde está (ahora solo alojará el botón "Entrar en modo edición").

5. **`src/main.js`**: cambia el `import` de `renderModeSwitcher` por `{ renderEnterEditButton, renderEditToolbar }` desde `./ui/editModeToggle.js`. Añade `const toolbarEl = document.getElementById('edit-toolbar');`. En `renderAll()`, sustituye la llamada a `renderModeSwitcher(switcherEl)` por `renderEnterEditButton(switcherEl)` seguido de `renderEditToolbar(toolbarEl)`. El resto del flujo (`renderActiveMode`, suscripciones a `mode:changed`/`components:changed`, autoguardado) no cambia.

6. **`src/styles/main.css`**: elimina `.mode-switcher` y `.mode-switcher__button.is-active` (ya no existen esas clases). Añade estilos para el nuevo flujo:
   - Un estilo simple de botón para "Entrar en modo edición" en `#mode-switcher` (reutilizando la tipografía general, sin clase especial extra — un `<button>` normal es suficiente dado que solo hay un botón).
   - `.edit-toolbar`: franja de ancho completo (`width: 100%`), fondo visualmente diferenciado del resto de la página (p.ej. un color de acento sólido), `position: sticky; top: 0;` para que se mantenga visible en la parte superior de la pantalla al hacer scroll, con padding y el botón "Salir del modo edición" alineado dentro.

## (c) Cambios de arquitectura

En `design/docs/design_technical.md`, sección "3. Modo juego vs modo edición", la línea `- ui/modeSwitcher.js permite alternar el modo activo (...)` deja de ser cierta: ya no hay un selector de dos opciones, sino un flujo de entrar/salir con dos piezas de UI distintas. Sustituir esa línea por una que describa `ui/editModeToggle.js` con sus dos funciones (`renderEnterEditButton`, visible en modo juego; `renderEditToolbar`, franja fija visible en modo edición con el botón de salida), manteniendo la mención a que ambas siguen operando sobre `setMode()` / evento `mode:changed` de `core/state.js` sin cambios en esa capa.
