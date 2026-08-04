## (a) Anotaciones funcionales

- Fuera de alcance: cualquier cambio en el flujo de borrado de grupo (`attemptDeleteGroup`, `groupDeleteConfirmModal.js`) — sigue igual, sin confirmación añadida ni quitada.
- Fuera de alcance: cambios en `ui/groupList.js` (columna "Elementos" del panel) — su recálculo tras cerrar la modal ya funciona hoy sin tocar nada, porque `components:changed` remonta `renderEditMode()` completo (ver (b), tarea 3).
- Sin dudas pendientes con el usuario: la petición y los ficheros de diseño (`design_modal-editar-grupo.html`, `design_navigation_editar-grupo.md`) ya fijan formato de fila ("Tipo: Id"), orden alfabético por id, mensaje de lista vacía, ausencia de confirmación al sacar, y que la sección no aparece en modo alta.

## (b) Solución técnica

1. **`src/ui/groupModal.js` — nueva sección "Elementos del grupo" dentro de `openGroupModal`.**
   - Ampliar la firma a `openGroupModal({ group = null, onAccept, onDelete, onRemoveFromGroup })`: nuevo callback `onRemoveFromGroup(group, componentId)`, sin nuevo parámetro `components` — en su lugar, importar `getComponents` desde `../core/state.js` (además de lo ya importado de `core/group.js`/`core/state.js`) y leerlo en el momento de pintar/repintar, exactamente como hace `mazoContentModal.js` con `getComponents()` en su `renderBody()` (nunca recibir una copia por parámetro, para poder refrescarse sola tras cada "Sacar" sin cerrarse). Esto simplifica el `p.ej.` de los apuntes técnicos de la entrada (que sugerían pasar `components` como parámetro) alineándolo con el patrón ya existente de `mazoContentModal.js`, que es el precedente directo señalado para esta modal.
   - Solo cuando `group` es truthy (edición de un grupo existente; en alta — `group === null` — no se muestra nada de esto, igual que ya ocurre con el botón "Eliminar"), añadir tras `nameField` y antes de `footer` un nuevo bloque `elementsField` (`class="modal__field"`) con:
     - Un `<label class="group-modal__elements-label">` cuyo texto es `Elementos del grupo (${n})`, actualizado en cada repintado.
     - Un contenedor donde se pinta o bien la lista (`.group-modal__elements-list`, con un `.group-modal__element-item` por componente) o bien el mensaje vacío (`.group-modal__elements-empty`, texto "No hay elementos en este grupo.").
   - Función interna `renderElements()` (mismo patrón que `renderBody()` de `mazoContentModal.js`): calcula `getComponentsUsingGroup(group.id, getComponents())`, resuelve cada id a su componente (omitiendo en silencio cualquier referencia huérfana, igual que `mazoContentModal.js` con cartas), ordena por `id` (`localeCompare`), y por cada uno pinta un `.group-modal__element-item` con:
     - `<span class="group-modal__element-id">` con el texto `${getComponentTypeLabel(component.type)}: ${component.id}` (importar `getComponentTypeLabel` desde `./componentTypeModal.js`, mismo uso que ya hace `groupDeleteConfirmModal.js`).
     - Un `<button class="btn-sacar">Sacar</button>` que, al pulsarse, llama a `onRemoveFromGroup(group, component.id)` y después vuelve a invocar `renderElements()` para repintar la lista al instante (sin confirmación, sin cerrar la modal) — mismo patrón exacto que el botón "Sacar" de `mazoContentModal.js` (`onSacar(cartaId); renderBody();`).
     - Si la lista queda vacía tras sacar el último elemento, `renderElements()` ya lo resuelve solo (longitud 0 → rama del mensaje vacío), sin lógica especial adicional.
   - Llamar a `renderElements()` una vez al construir la modal (tras montar `elementsField`), igual que `mazoContentModal.js` llama a `renderBody()` antes de montar el footer.

2. **`src/modes/edit/editMode.js` — proveer `onRemoveFromGroup` en el punto de llamada de edición.**
   - En `renderGroupPanel()` → `onEdit`, añadir a la llamada existente a `openGroupModal({ group, onAccept, onDelete })` el nuevo callback:
     ```js
     onRemoveFromGroup: (g, componentId) => {
       const component = getComponents().find((c) => c.id === componentId);
       if (component) replaceComponent(componentId, updateComponent(component, { grupoId: null }));
     },
     ```
     Mismo patrón exacto que el bucle ya existente dentro de `attemptDeleteGroup` (línea ~300) para desvincular componentes de un grupo que se borra — aquí se aplica a un único componente en vez de a todos los afectados.
   - No hace falta ningún cambio en la llamada a `openGroupModal` del caso "+ Añadir grupo" (`onAdd`, sin `group`): al no pasar `group`, la nueva sección no se muestra y `onRemoveFromGroup` no se usa nunca en ese flujo.
   - No hace falta tocar `renderGroupPanel`, `renderGroupList` ni ningún otro punto: `replaceComponent` ya emite `components:changed`, que ya dispara el remontado completo de `renderEditMode()` (`main.js`) y por tanto un nuevo `renderGroupPanel()` con el contador "Elementos" recalculado — la modal, montada aparte en `document.body` (no dentro del contenedor que remonta `renderEditMode()`), sobrevive a ese remontado sin cerrarse, y su propia lista interna ya se refresca de forma independiente vía `renderElements()` en el paso anterior.

3. **`src/styles/main.css` — nuevas clases para la sección, sin CSS nuevo para el botón.**
   - Añadir, junto al bloque existente de `.mazo-contenido__*` (línea ~900) o cerca de los estilos de `groupModal`/`.modal__field`, las clases nuevas usadas en la maqueta (`design_modal-editar-grupo.html`): `.group-modal__elements-label`, `.group-modal__elements-list` (scroll con `max-height`, mismo criterio que `.mazo-contenido__list`), `.group-modal__element-item` (con `:hover`), `.group-modal__element-id` (con el `span.type` en color atenuado) y `.group-modal__elements-empty` — mismos valores de la maqueta (radios, colores, espaciados ya definidos como variables CSS existentes: `--radius-sm`, `--border-neutral`, `--bg-hover`, `--text-muted`).
   - `.btn-sacar` ya existe (línea ~952) y se reutiliza tal cual, sin modificarlo.

## (c) Cambios de arquitectura

No aplica: no se modifica la arquitectura por capas ni el modelo de datos (`grupoId` ya existe y ya se desvincula con el mismo patrón `replaceComponent`/`updateComponent` usado en otros puntos). Es una ampliación de una modal de `ui/` existente y su punto de llamada en `modes/edit/`, sin tocar `core/`.

## (d) Cambios en estilo

No aplica: las clases nuevas siguen el mismo patrón BEM y las mismas variables ya documentadas/usadas por el precedente `.mazo-contenido__*`, y `.btn-sacar` ya está declarado como excepción admitida en `STYLE_BIBLE.md` sección 7 — no introduce ningún patrón nuevo que documentar.
