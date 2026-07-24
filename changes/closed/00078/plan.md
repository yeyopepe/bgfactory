- **Código**: 00078

## (a) Anotaciones funcionales

**Fuera de alcance**: sin cambios respecto a `description.md` — no se introduce ninguna acción/confirmación/validación nueva, solo atajos de teclado equivalentes a botones ya existentes. Diálogos nativos del navegador (`confirm()`) quedan fuera, el navegador ya gestiona su propio ESC/INTRO.

**Dudas resueltas**: todas las dudas de alcance ya están resueltas en `description.md` (sección "Dudas de alcance resueltas con el usuario"); no ha hecho falta resolver ninguna duda técnica adicional con el usuario durante esta planificación.

## (b) Solución técnica

Contexto reunido vía `ms-internal-tech-analysis` (no hay incongruencias entre `ARCHITECTURE.md` y el código en esta área; sí se ha detectado un matiz relevante no documentado, ver más abajo):

- Las 19 modales de `src/ui/*.js` siguen sin excepción el mismo patrón DOM: `overlay` (`.modal-overlay`, `position: fixed`, sin `z-index` propio) → `.modal` → `.modal__footer` con los botones de acción. Todas hacen `document.body.appendChild(overlay)` al abrirse, nunca anidadas dentro de otra modal en el DOM (incluso las sub-modales abiertas desde dentro de otra, como `imageAdjustModal` desde `cardEditorModal`, se anexan igual a `document.body`). Como comparten el mismo `position: fixed` sin `z-index`, el **último `.modal-overlay` hijo directo de `document.body`** es siempre la modal visualmente "más encima" — esto da una forma fiable de localizarla sin mantener ninguna pila propia.
- **Matiz importante no documentado**: la clase `.btn-cancel` no es exclusiva del botón "Cancelar"/"Cerrar" del pie — se reutiliza como clase de botón secundario genérico en varios sitios *dentro del cuerpo* de algunas modales (p. ej. `componentModal.js`: "Configurar fondo" línea 509, "Elegir tipografía" línea 680, "Elegir imagen"/"Ajustar imagen…" líneas 979/984, "Crear" (mazo nuevo) línea 1093, "Editar diseño de la carta" línea 1176). Por tanto, **no se puede** buscar `.btn-cancel`/`.btn-accept`/`.btn-eliminar` en toda la modal — hay que acotar la búsqueda a `.modal__footer`, que sí es exclusivo del pie de botones de acción en las 19 modales sin excepción (verificado).
- Selección de componente en modo edición: variable de módulo `selectedComponentId` en `modes/edit/editMode.js:32` (no exportada), gestionada por `toggleSelect()` (línea 257). El borrado ya existente desde la fila de la tabla (`ui/componentList.js:132-144`) pide confirmación con `confirm()` **en el propio `componentList.js`** antes de invocar `onRemove(component)`, que en `editMode.js:285-287` llama directamente a `removeComponent(component.id)` (sin resetear `selectedComponentId` aunque coincida — comportamiento ya existente, no se toca).
- `main.js` es la única capa que puede depender simultáneamente de `ui/*` y `modes/*` (`ARCHITECTURE.md` sección 2); un módulo nuevo en `ui/` no puede importar nada de `modes/edit/editMode.js` sin romper la dirección de dependencias. Por eso el nuevo listener se reparte en dos piezas:
  1. Un módulo genérico y agnóstico del dominio en `ui/` que solo conoce el patrón de modales (localiza el `.modal-overlay` top y dispara clicks en su `.modal__footer`) y expone un hueco de callback para el caso "SUPR sin modal abierta".
  2. `main.js`, que conecta ese callback con `modes/edit/editMode.js` y `core/state.js` (`MODES`/`getState().mode`), igual que ya conecta el resto de capas.

Tareas, en orden:

1. **`modes/edit/editMode.js`**: exportar una nueva función `deleteSelectedComponent()` a nivel de módulo (junto a `renderEditMode`), que reutiliza la variable de módulo ya existente `selectedComponentId`:
   - Si `selectedComponentId` es `null`, no hace nada (devuelve `false` o similar, para que el caller sepa que no había nada que borrar — no es imprescindible pero es barato y evita ambigüedad).
   - Si hay un componente seleccionado, busca el componente en `getComponents()`, pide `confirm(`¿Eliminar el componente "${component.id}"?`)` (mismo texto que ya usa `ui/componentList.js:139` para el mismo componente, mismo criterio que "reutilizar el mismo camino") y, si se confirma, llama a `removeComponent(component.id)` — igual que el `onRemove` de la fila (`editMode.js:285-287`), sin resetear `selectedComponentId` (mismo comportamiento que ese camino ya existente, para no introducir una diferencia de comportamiento nueva entre borrar desde la fila y borrar con SUPR).
   - Si el componente seleccionado ya no existe en `getComponents()` (caso borde, no debería ocurrir en uso normal), no hace nada.

2. **Nuevo módulo `src/ui/globalShortcuts.js`**: expone `initGlobalShortcuts({ isEditMode, onDeleteSelected })` (recibe callbacks, no importa nada de `modes/`, respetando que `ui/` solo depende de `core/`; en este caso ni siquiera necesita `core/`, es puro DOM). Añade un único listener `document.addEventListener('keydown', handler)` al inicializarse (una sola vez, desde `main.js`). El handler:
   - Ignora el evento si `event.defaultPrevented` ya es `true` (por si algún día algún control interno decide marcarlo explícitamente; no ocurre hoy, pero es una guarda barata y estándar antes de reaccionar a un atajo global).
   - Calcula `topOverlay = document.querySelector(':scope > .modal-overlay:last-of-type')` sobre `document.body` (en la práctica, `Array.from(document.body.children).filter(el => el.classList.contains('modal-overlay')).pop()`, más robusto que un selector CSS con múltiples niveles de anidación potencial de hijos no-modal entre medias).
   - **ESC** (`event.key === 'Escape'`): si hay `topOverlay`, busca `topOverlay.querySelector('.modal__footer .btn-cancel')`; si existe, `preventDefault()` y `.click()`. Si no hay `topOverlay`, no hace nada (no hay atajo de ESC fuera de una modal, por diseño de `description.md`).
   - **INTRO** (`event.key === 'Enter'`): si `document.activeElement` es un `<textarea>`, no hace nada (deja el salto de línea normal). Si hay `topOverlay`, busca `topOverlay.querySelector('.modal__footer .btn-accept')`; si existe y no está `disabled`, `preventDefault()` y `.click()`. Si no hay `topOverlay`, no hace nada (no hay atajo de INTRO fuera de una modal).
   - **SUPR** (`event.key === 'Delete'`): si `document.activeElement` es un `<input>` o `<textarea>`, no hace nada (deja borrar caracteres con normalidad — cubre tanto los campos dentro de una modal como el campo "Orden" de `ui/componentList.js`, que no está dentro de ninguna modal). Si no, y hay `topOverlay`, busca `topOverlay.querySelector('.modal__footer .btn-eliminar')`; si existe, `preventDefault()` y `.click()`. Si no hay `topOverlay`, y `isEditMode()` devuelve `true`, llama a `onDeleteSelected()` (que hará `preventDefault()` internamente solo si procede — en la práctica siempre, ya que no hay ningún otro uso de SUPR en la página fuera de este flujo).

3. **`main.js`**: importar `initGlobalShortcuts` de `ui/globalShortcuts.js` y `deleteSelectedComponent` de `modes/edit/editMode.js`. Al arrancar (junto al resto de wiring inicial, cerca de las suscripciones `on(...)`), llamar una vez:
   ```js
   initGlobalShortcuts({
     isEditMode: () => getState().mode === MODES.EDIT,
     onDeleteSelected: () => deleteSelectedComponent(),
   });
   ```
   (`getState`/`MODES` ya están importados en `main.js`.)

No hace falta tocar ningún fichero de modal individual (`src/ui/*Modal.js`): el listener global opera puramente sobre las clases ya existentes, sin necesidad de que cada modal se entere de los atajos.

## (c) Cambios de arquitectura

`ARCHITECTURE.md` sección 2 no necesita ningún cambio de fondo (el listener respeta la dirección de dependencias existente: el módulo nuevo vive en `ui/` sin depender de `modes/`, y es `main.js` quien los conecta, igual que ya hace con el resto de capas). Solo conviene añadir una mención breve del nuevo módulo `ui/globalShortcuts.js` en la sección 5 (listado de módulos de `ui/`), con una frase describiendo su propósito (atajos de teclado ESC/INTRO/SUPR equivalentes a los botones de la modal top y, para SUPR sin modal abierta, al borrado del componente seleccionado en modo edición) y la convención de la que depende (`.modal-overlay` como último hijo de `document.body` = modal visible más encima; `.modal__footer .btn-cancel/.btn-accept/.btn-eliminar` como único sitio fiable donde buscar esos botones, ya que `.btn-cancel` se reutiliza también como botón secundario genérico dentro del cuerpo de varias modales).
