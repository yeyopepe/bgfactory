## (a) Anotaciones funcionales

Fuera de alcance:
- No se toca `ui/groupModal.js` ni el borrado de grupos (cambio 00131, ya en `inProgress` con su propio `description.md`, es una entrada distinta que amplía la modal de edición de grupo — no se solapa con los ficheros que toca este plan, `ui/groupList.js`/`modes/edit/editMode.js`).
- No se añade ningún reparto/offset especial para varias cartas que salgan del mismo mazo a la vez: quedan apiladas en el mismo punto, igual que ya hace `sacarCartaDeMazo` para una sola carta (decisión ya tomada en `description.md`, punto 5).

Dudas ya resueltas en `description.md` (no se repiten aquí): puntos 1–9, en particular el punto 4 (resaltado de fila ligado al foco real del navegador, no a un estado JS de "grupo activo" — decisión tomada explícitamente por el usuario frente a la alternativa de un estado persistente).

## (b) Solución técnica

1. **`core/group.js`** — sin cambios. `getComponentsUsingGroup(groupId, components)` ya devuelve directamente un array de **ids** (no de objetos componente) filtrando por `component.grupoId === groupId`; se reutiliza tal cual.

2. **`modes/edit/editMode.js`** — nueva función `selectGroup(group)`, junto a `toggleSelect` (no reutiliza esa función porque su semántica es de toggle/aditivo con Ctrl, mientras que esta es un reemplazo total incondicional):
   - `const ids = getComponentsUsingGroup(group.id, getComponents());`
   - `selectedComponentIds.clear();` y añadir cada `id` de `ids` al set — se hace **antes** de sacar ninguna carta de su mazo, para que los remontados de `renderEditMode()` que dispara cada `sacarCartaDeMazo` (vía `components:changed`, ver punto siguiente) ya pinten esas cartas como seleccionadas en cuanto aparecen en la mesa.
   - Para cada `id` de `ids`: si `id` está en `getCartaIdsEnAlgunMazo(getComponents())` (import ya existente en el fichero, usado en `renderTable`), localizar el mazo que la referencia (`getComponents().find(c => c.type === 'mazo' && c.properties?.cartaIds?.includes(id))`) y llamar a `sacarCartaDeMazo(mazoId, id)` (`core/state.js`, nuevo import). Cada llamada dispara `components:changed` → `main.js` remonta `renderEditMode()` por completo (mismo patrón ya asumido hoy por el arrastre en bloque de `onMove`, que también hace varios `replaceComponent` seguidos en un bucle sin tratamiento especial) — no hace falta ninguna otra sincronización.
   - Al final, llamar a `renderList()` y `renderTable()` explícitamente (mismo cierre que ya hace `toggleSelect`), necesario para el caso en que ningún miembro estuviera dentro de un mazo (sin eso no habría ningún evento `components:changed` que repintara la nueva selección).

3. **`modes/edit/editMode.js` → `renderGroupPanel()`** — pasar el nuevo callback `onSelectGroup: selectGroup` a `renderGroupList`.

4. **`ui/groupList.js`**:
   - `renderGroupList` y `renderBody` aceptan un nuevo parámetro `onSelectGroup`.
   - Cada `<tr>` de `renderBody` añade `tabindex="0"` y un listener `click` que llama a `onSelectGroup(group)` (si está definido) — mismo patrón que `row.addEventListener('click', (event) => onSelectRow(component, event))` de `ui/componentList.js`, pero sin necesidad de pasar el `event` (no hay lógica de Ctrl que consultar: el reemplazo es incondicional).
   - Los listeners de `editButton`/`removeButton` añaden `event.stopPropagation()` al principio (mismo patrón que los botones de acción de `ui/componentList.js`), para que pulsar "Editar"/"Eliminar" no dispare también la selección del grupo.
   - Añadir clase `group-list__row` al `<tr>` (hoy no tiene ninguna) para poder engancharle estilo en `main.css`.

5. **`src/styles/main.css`** — añadir, junto a las reglas ya existentes de `.group-list` (línea ~2079):
   ```css
   .group-list__row {
     cursor: pointer;
   }
   .group-list__row:hover {
     background: var(--bg-hover);
   }
   .group-list__row:focus {
     outline: none;
     background: rgba(44, 125, 216, 0.15);
   }
   ```
   Reutiliza el mismo color de fondo que ya usa `.component-list__row--selected` (`rgba(44, 125, 216, 0.15)`) para que el resaltado se lea como el mismo lenguaje visual de "fila activa", pero aplicado vía `:focus` en vez de una clase JS — se apaga solo al mover el foco fuera de la fila (click en la mesa, en otro panel, tab a otro elemento), sin lógica adicional. `outline: none` porque el propio cambio de fondo ya es la señal visual (mismo criterio que el resto de filas seleccionadas de la app, ninguna usa el `outline` por defecto del navegador).

## (c) Cambios de arquitectura

`design/docs/ARCHITECTURE.md`, sección 3, párrafo del panel "Grupos" (el que describe `ui/groupList.js`): la frase actual dice textualmente "sin fila seleccionable/resaltada sobre la mesa (los grupos no tienen representación visual propia)". Con este cambio deja de ser cierto que la fila no es seleccionable — sigue siendo cierto que el grupo no tiene representación visual propia *sobre la mesa*, pero ahora clicar su fila selecciona en bloque a sus componentes miembros (reemplazando cualquier selección previa, sacando primero de su mazo cualquier carta miembro que estuviera guardada dentro de uno) y la propia fila se resalta mientras conserva el foco. Hay que:
- Sustituir esa frase por una nueva que documente el comportamiento: click en una fila de grupo → `selectedComponentIds` pasa a ser exactamente el conjunto de miembros del grupo (con extracción previa de cartas guardadas en mazo vía `sacarCartaDeMazo`), resaltado en mesa/lista de Componentes igual que la selección múltiple manual, más el resaltado de la propia fila ligado al foco real (`:focus`, `main.css`).
- Seguir dejando claro que el grupo en sí no tiene representación visual propia sobre la mesa (eso no cambia).
