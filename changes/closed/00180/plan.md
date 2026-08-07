- **Fecha creación**: 2026-08-07

## (a) Anotaciones funcionales

**Fuera de alcance:** Ningún otro comportamiento se toca. En concreto, no se modifica `ui/copyComponentModal.js` (la ficha individual de una copia ya impide hoy dejar `oculto` divergiendo de `sincronizado`, ver Apuntes técnicos de `description.md`) ni el menú contextual de Modo Juego (`modes/play/playMode.js`), que no tiene esta acción ni la necesita.

**Dudas resueltas con el usuario:** Ninguna pregunta abierta en este paso — `description.md` ya recoge las decisiones de alcance (posición de la fila, etiqueta binaria, sin confirmación, siempre habilitada, desincronización automática de copias) bajo "Preguntas de alcance resueltas".

## (b) Solución técnica

1. **`src/modes/edit/editMode.js` — icono de la nueva fila.** Añadir función local `createHiddenIcon()`, mismo patrón que las ya existentes `createCloneIcon`/`createCopyIcon`/`createRemoveIcon` (líneas ~35-63: `document.createElementNS('http://www.w3.org/2000/svg', 'svg')`, `viewBox="0 0 24 24"`, `fill="none"`, `stroke="currentColor"`, `stroke-width="2"`). Su `innerHTML` reutiliza el mismo trazado que `createHiddenBadge()` en `src/ui/componentRenderer.js` (líneas 251-260) — ojo tachado — para no introducir un icono nuevo:
   ```
   '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="12" r="3"/><line x1="3" y1="21" x2="21" y2="3" stroke-linecap="round"/>'
   ```
2. **`src/modes/edit/editMode.js` — nueva fila "Ocultar"/"Mostrar" en `handleComponentContextMenu`.** En la construcción de `generalItems` (líneas ~480-506), insertar un nuevo elemento **antes** del objeto de "Clonar" (queda primero de la sección general, orden final Ocultar/Mostrar → Clonar → Copiar → Eliminar):
   - `label`: `affectedComponents.every((c) => c.oculto) ? 'Mostrar' : 'Ocultar'` (etiqueta binaria: "Mostrar" solo si **todos** los afectados ya están ocultos; "Ocultar" en cualquier otro caso, incluida selección vacía-de-ocultos o mixta).
   - `icon`: `createHiddenIcon()`.
   - Sin `disabled` (a diferencia de "Clonar"/"Copiar", esta fila está siempre disponible — omitir la clave por completo, igual que ya hace "Eliminar").
   - `onClick`: calcula `const newOculto = !affectedComponents.every((c) => c.oculto);` y, para cada `c` de `affectedComponents`, aplica el mismo patrón `replaceComponent`/`updateComponent` que ya usa "Añadir a grupo" (líneas ~513-517):
     ```js
     const changes = { oculto: newOculto };
     if (c.copyOf && c.sincronizado) changes.sincronizado = false;
     replaceComponent(c.id, updateComponent(c, changes));
     ```
     La condición `c.copyOf && c.sincronizado` cubre exactamente el caso que describe `description.md`: copia vinculada (`copyOf` no nulo) con sincronización activa — se desactiva (`sincronizado: false`) en el mismo gesto que cambia `oculto`, para que no pueda revertirse en silencio la próxima vez que se edite el original (`syncCopyWithOriginal`, `core/component.js:143-164`, solo se invoca desde `core/state.js` al actualizar el original, nunca de forma continua). No hace falta `showToast` ni ningún aviso adicional (igual que "Clonar"/"Copiar"/"Eliminar" en este mismo menú) — el cambio ya es visible al instante vía la insignia `showHiddenIndicator` existente.

Sin cambios en `ui/contextMenu.js` (`openContextMenu`): la fila usa la forma estándar `{ icon, label, onClick }` que ya soporta, sin necesitar ningún tipo de fila nuevo (no es `select`, como "Añadir a grupo").

## (c) Cambios de arquitectura

- **`design/docs/architecture/04-modes.md`**, sección "Menú contextual de elemento en modo edición" (líneas 35-42): ampliar la lista de la "Sección general" (línea 41) para incluir la nueva fila "Ocultar"/"Mostrar" — primera de la sección, etiqueta binaria según `affectedComponents.every(c => c.oculto)`, siempre habilitada, alterna `oculto` de cada afectado (patrón `replaceComponent`/`updateComponent`) y, si el afectado es una copia (`copyOf`) con `sincronizado: true`, desactiva la sincronización (`sincronizado: false`) en el mismo cambio.
- **`design/docs/architecture/01-component-model.md`**, sección "Copias vinculadas (`copyOf`)" (líneas 72-86): añadir una frase a la nota de "Modal reducida" (línea 84) o como punto propio indicando que, además de `ui/copyComponentModal.js`, la fila "Ocultar"/"Mostrar" del menú contextual de Modo Edición es la otra vía (la única fuera de esa modal) que puede tocar `oculto` de una copia — y que, a diferencia de la modal (que bloquea el campo mientras `sincronizado: true`), esta fila permite el cambio siempre y desactiva `sincronizado` automáticamente al aplicarlo sobre una copia sincronizada.

## (e) Verificación

1. En Modo Edición, clic derecho sobre un único elemento no oculto: el menú contextual muestra "Ocultar" como primera fila de la sección general (antes de "Clonar"), con el icono de ojo tachado. Al pulsarla, el elemento pasa a mostrar la insignia de "Oculto" en la mesa al instante, sin ningún aviso adicional.
2. Repetir sobre ese mismo elemento ya oculto: la fila ahora dice "Mostrar"; al pulsarla, la insignia desaparece.
3. Con selección múltiple mixta (algunos ocultos, otros no), la fila dice "Ocultar"; al pulsarla, **todos** los afectados (incluidos los que ya estaban ocultos) terminan ocultos con su insignia visible.
4. Con selección múltiple donde **todos** están ya ocultos, la fila dice "Mostrar"; al pulsarla, todos dejan de estar ocultos.
5. La fila nunca aparece deshabilitada, a diferencia de "Clonar"/"Copiar" cuando toda la selección son copias.
6. Sobre una copia vinculada con "Sincronizado" activo: aplicar "Ocultar"/"Mostrar" desde el menú contextual cambia su insignia de "Oculto" y, al abrir después su ficha individual (`ui/copyComponentModal.js`), el checkbox "Sincronizado" aparece ya desmarcado (y "Bloqueado"/"Oculto" editables como valor propio).
7. Tras ese mismo cambio, editar cualquier otro campo del original (p. ej. su nombre) no revierte el estado de "Oculto" de esa copia — queda como el usuario lo dejó.
8. Sobre una copia con "Sincronizado" ya desactivado de antemano, aplicar la acción cambia su `oculto` sin alterar nada más (el checkbox de su ficha sigue desmarcado, sin efecto colateral adicional).
