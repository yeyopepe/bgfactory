**Fecha creación**: 2026-08-06

## (a) Anotaciones funcionales

**Fuera de alcance** (ya fijado en `description.md`): el menú no se activa sobre filas del panel de listado de Componentes ni sobre la mesa vacía.

**Decisión de implementación no explícita en `description.md`**: si la selección afectada por "Clonar" o "Copiar" está compuesta *enteramente* por copias vinculadas (ninguna clonable), esa fila del menú se muestra deshabilitada en vez de quedarse activa sin hacer nada al pulsarla — mismo mecanismo `disabled` que ya usa la fila "Añadir a grupo" sin grupos. Si la selección es mixta (alguna copia, algún original), la fila permanece activa y actúa solo sobre los elementos clonables, tal como ya describe `description.md`.

**Incongruencia de documentación detectada** (`ms-internal-tech-analysis`): `design/docs/stylebible/STYLE_BIBLE.md` sección 12.8 dice que `.context-menu` usa `z-index: 500`, pero el CSS real (`src/styles/main.css`, regla `.context-menu`) tiene `z-index: 1050` desde el cambio 00124 (para quedar por delante de una modal ya abierta). El código manda; se corrige la biblia de estilo en este mismo cambio (ver (d)).

## (b) Solución técnica

1. **`src/ui/contextMenu.js` — soportar una fila de selección (`<select>`) en el menú genérico**, para que `editMode.js` pueda ofrecer "Añadir a grupo" sin salirse del componente compartido (`STYLE_BIBLE` 12.8 exige reutilizar este patrón en vez de crear uno ad-hoc):
   - Añadir una función interna `addSelectRow(menu, { label, options, value, disabled, onChange })` que crea un bloque `.context-menu__select-row` con una etiqueta (`.context-menu__select-row-label`) y un `<select>` (`.context-menu__select-row select`) con una opción inicial deshabilitada ("Elegir grupo…") más una `<option>` por cada `{ value, label }` de `options`. Mismo criterio ya usado por `ui/columnHeaderMenu.js` (`select.addEventListener('click', (e) => e.stopPropagation())` para no disparar el cierre por click-fuera al interactuar con el desplegable).
   - El `<select>` se deshabilita (`disabled = true`) si `disabled` es `true` o si `options.length === 0`.
   - En `change`, si el valor elegido no es el placeholder: invoca `onChange(select.value)` y cierra el menú (`closeCurrentMenu()`), igual que ya hace `addRow` tras un `onClick`.
   - En `openContextMenu`, extender el recorrido de `generalItems`/`specificItems`: si un item trae `select` (objeto `{ options, value, onChange }` en vez de `onClick`), llamar a `addSelectRow` con ese item; si no, seguir llamando a `addRow` como hasta ahora. No cambia la firma pública de `openContextMenu` (sigue recibiendo `generalItems`/`specificItems`), así que los usos existentes (`playMode.js`) no se ven afectados.

2. **`src/styles/main.css` — estilos de la nueva fila de selección**, reutilizando tokens ya existentes de la sección `.context-menu` y el mismo criterio que `.column-header-menu__filter`/`.column-header-menu__filter-label`/`.column-header-menu__filter select` (bloque con etiqueta arriba y `<select>` a todo lo ancho debajo, en vez de un `<select>` nativo suelto):
   - `.context-menu__select-row`: mismo padding que `.context-menu__item` (`0.5rem 0.75rem`), `cursor: default` (no es una fila clicable), separada de la fila anterior igual que el resto (`border-bottom` solo si no es la última — reutilizar la regla ya existente `.context-menu__item:not(:last-child)` ampliando su selector, o una regla equivalente para este bloque).
   - `.context-menu__select-row-label`: `font-size: 0.875rem`, `color: var(--text-primary)`, `margin-bottom: 0.35rem` (mismo tamaño que `.context-menu__item-label`).
   - `.context-menu__select-row select`: mismas reglas que `.column-header-menu__filter select` (ancho completo, `padding: 0.35rem 0.4rem`, `border: 1px solid var(--border-neutral)`, `border-radius: var(--radius-sm)`, `background: var(--bg-card)`, `font-size: 0.875rem`, `color: var(--text-primary)`), más `:disabled` con `background: var(--border-neutral)` y `cursor: not-allowed` (mismo criterio que otros controles deshabilitados de la app).

3. **`src/modes/edit/editMode.js` — conectar el menú contextual sobre la mesa**:
   - Nuevos imports: `openContextMenu` de `../../ui/contextMenu.js`, `sortByName` de `../../core/textSort.js`, `showToast` de `../../ui/toast.js`.
   - Tres funciones locales de icono SVG (`createCloneIcon`, `createCopyIcon`, `createRemoveIcon`), mismo patrón ya usado en `playMode.js` (`createLockIcon`, `createShuffleIcon`, etc. — SVGs `24x24` con `stroke="currentColor"`, sin fichero de iconos compartido en el proyecto).
   - En `renderTable()`, añadir `onContextMenu: handleComponentContextMenu` a las opciones pasadas a `renderComponentsOnTable` (el parámetro ya existe en `ui/componentRenderer.js`, hoy sin usar en modo edición).
   - Nueva función `handleComponentContextMenu(component, event)` dentro de `renderEditMode`, junto a `toggleSelect`/`selectGroup`:
     - Si `component.id` no está en `selectedComponentIds`: vacía el set y añade solo ese id (mismo criterio que la rama "reemplaza" de `toggleSelect`, sin toggle), y llama a `renderList()`/`renderTable()` para reflejar la nueva selección antes de abrir el menú.
     - Calcula `affectedIds = [...selectedComponentIds]` y `affectedComponents = getComponents().filter(c => affectedIds.includes(c.id))` — la lista de elementos sobre la que actuará el menú.
     - `generalItems`:
       - **Clonar**: `disabled` si ningún elemento de `affectedComponents` es clonable (todos tienen `copyOf`); si no, `onClick` clona uno a uno cada elemento sin `copyOf` (`for (const c of cloneables) { addComponent(cloneComponent(c, getComponents())); }`, recalculando `getComponents()` en cada vuelta para que `nextCloneId` vea los clones ya añadidos, igual que si se pulsara el botón "Clonar" del listado varias veces seguidas).
       - **Copiar**: misma lógica con `createCopy`.
       - **Eliminar**: `onClick: () => attemptDeleteComponents(affectedComponents)` — reutiliza tal cual la función ya existente (confirmación simple o modal de borrado en bloque según el tamaño de `affectedComponents`).
     - `specificItems`: un único item `{ label: 'Añadir a grupo', select: { options: sortByName(getGroups()).map(g => ({ value: g.id, label: g.name })), onChange: (groupId) => { ... } } }`.
       - `onChange`: para cada componente de `affectedComponents` que no tenga ya `groupId` en `grupoIds`, `replaceComponent(c.id, updateComponent(c, { grupoIds: [...c.grupoIds, groupId] }))`; al terminar, `showToast('Grupo añadido')` (mismo patrón que "Estilo copiado" en `componentModal.js`).
     - Llama a `openContextMenu({ x: event.clientX, y: event.clientY, generalItems, specificItems })` — sin `description` ni `interactionItems` (exclusivos del menú de Modo Juego) y sin `onClose` (la selección de Modo Edición ya es persistente por diseño, no hace falta limpiarla al cerrar el menú).

## (d) Cambios en estilo

- `design/docs/stylebible/STYLE_BIBLE.md` sección 12.8: corregir `z-index: 500` por `z-index: 1050` (el código real usa este valor desde el cambio 00124, para quedar por delante de una modal ya abierta — incongruencia detectada durante este análisis, no introducida por este cambio).
- `design/docs/stylebible/STYLE_BIBLE.md` sección 12.8: documentar la nueva fila de selección del menú contextual (`.context-menu__select-row`, cambio 00170) como una quinta sección posible del patrón, junto a la línea de descripción/sección general/sección específica/sección informativa ya documentadas — con el mismo criterio visual que `.column-header-menu__filter` (sección 12.7, cambio 00165: etiqueta arriba + `<select>` a todo lo ancho debajo) en vez de un tratamiento nuevo.
