## (a) Anotaciones funcionales

- Fuera de alcance: extraer un helper común de normalización de texto compartido entre `resourceList.js` y `componentList.js`. Se confirmó (búsqueda `normalize(` / `NFD` en `src/`) que hoy solo existe esa lógica en `resourceList.js`; el resto de utilidades de UI (`resizeHandle.js`, etc.) solo se extraen cuando hay un patrón de comportamiento no trivial, no una función de 2 líneas. Duplicar `normalize()`/`matchesFilter()` en `componentList.js` es coherente con cómo ya están hoy estos dos paneles (cada uno self-contained, con su propio drag/resize wiring ya idéntico y no extraído). Si en el futuro aparece un tercer buscador, entonces sí valdría la pena extraerlo.
- Preguntas ya resueltas con el usuario (recogidas en `description.md`): campos de búsqueda = Id y Tipo (sin "nombre", que no existe en componentes); resto del comportamiento (filtrado en vivo, sin distinguir mayúsculas/acentos, no persistente, mismos textos adaptados) = igual que en recursos.

## (b) Solución técnica

Fichero único a modificar: `src/ui/componentList.js` (más el CSS en `src/styles/main.css`). Réplica del patrón ya implementado en `src/ui/resourceList.js` (change 00042), adaptado a las diferencias estructurales entre ambos módulos.

1. **Estado de módulo `filterText`**: añadir `let filterText = '';` a nivel de módulo en `componentList.js`, igual que en `resourceList.js` línea 19.

2. **Helpers `normalize()` y `matchesFilter()`**: copiar tal cual `normalize(str)` de `resourceList.js` (líneas 21-23). Añadir `matchesFilter(component, query)` adaptado a los dos campos de componente: `component.id` y `component.type` (sin mapeo a etiqueta legible, ya que la tabla ya muestra `component.type` en bruto):
   ```js
   function matchesFilter(component, query) {
     const normalizedQuery = normalize(query);
     return (
       normalize(component.id).includes(normalizedQuery) ||
       normalize(component.type).includes(normalizedQuery)
     );
   }
   ```

3. **Extraer el render de la tabla/vacío a una función `renderBody()`**: a diferencia de `resourceList.js`, hoy `componentList.js` no tiene una función `renderBody` separada — la lógica de tabla/vacío está inline dentro de `renderComponentList` (líneas 89-201). Hay que extraerla a una función `renderBody(body, displayedComponents, total, { onEdit, onClone, onRemove, onSelectRow, onReorder, selectedId })` que:
   - Reciba **dos listas relacionadas**: `displayedComponents` (ya filtrados y ordenados, los que se pintan como filas) y `total` (el número total de componentes sin filtrar, `components.length`) — esto es necesario porque el campo `Orden` de cada fila (`orderInput.min/max`) debe seguir acotándose al total real de componentes, no al subconjunto filtrado visible; si se recalculara `total` sobre la lista filtrada, reordenar con el filtro activo produciría valores de orden incoherentes con las filas ocultas.
   - Gestione los tres estados de vacío:
     - Sin componentes en absoluto (`components.length === 0`, sin filtro activo posible porque el cuadro no se muestra en este caso — ver punto 4): mensaje actual `"No hay componentes todavía."` (clase `component-list__empty`), sin cambios.
     - Con componentes pero el filtro no da coincidencias (`displayedComponents.length === 0` y `filterText.trim() !== ''`): nuevo mensaje `` `No hay componentes que coincidan con «${filterText}».` `` con nueva clase `component-list__empty-filter`.
     - Con coincidencias: tabla igual que hoy, pero iterando `displayedComponents` en vez de `sortedComponents` (el `sort` por `order` se sigue aplicando antes de filtrar, o se filtra sobre la lista ya ordenada — el orden de aparición debe seguir siendo por `order` ascendente).
   - El resto de la lógica de fila (inputs de orden, botones Editar/Clonar/Eliminar, selección de fila) se mantiene igual, solo cambiando `total` para que venga como parámetro en vez de `sortedComponents.length`.

4. **Cuadro de filtro en `renderComponentList`**: dentro del bloque `if (!collapsed)`, antes de crear `body`, añadir el mismo patrón condicional que `resourceList.js` líneas 172-190:
   - Si `components.length > 0`: crear `filterBar` (`div.component-panel__filter`) con un `input[type="text"]` (placeholder `'Filtrar componentes…'`, `value = filterText`), listener `input` que actualiza `filterText` y vuelve a invocar `renderBody(body, ...)` con la lista recalculada (filtrada + ordenada) y `total = components.length`.
   - Si `components.length === 0`: resetear `filterText = ''` (para que no quede un texto residual invisible si luego se añade el primer componente).
   - `panel.appendChild(filterBar)` va **antes** de `panel.appendChild(body)`, para que quede entre la cabecera y la tabla, igual que en recursos.
5. **Llamada inicial a `renderBody`**: sustituir el bloque inline actual (líneas 89-201) por: calcular `sortedComponents = [...components].sort(...)` (se mantiene, ordenar siempre sobre el total antes de filtrar), luego `renderBody(body, sortedComponents.filter((c) => matchesFilter(c, filterText)), components.length, { onEdit, onClone, onRemove, onSelectRow, onReorder, selectedId })`.

6. **CSS** (`src/styles/main.css`): añadir junto a las reglas ya existentes de `.component-panel*` (línea ~903-957) dos reglas nuevas, calcadas de las de recursos (líneas 999-1017 y 1056-1059) pero con el prefijo `component`:
   ```css
   .component-panel__filter {
     padding: 0.5rem 1rem;
     border-bottom: 1px solid #ddd;
   }

   .component-panel__filter input[type="text"] {
     width: 100%;
     box-sizing: border-box;
     padding: 0.5rem;
     border: 1px solid #ddd;
     border-radius: 4px;
     font-family: inherit;
     font-size: 0.875rem;
   }

   .component-panel__filter input[type="text"]:focus {
     outline: none;
     border-color: var(--accent-blue);
   }
   ```
   y junto a `.component-list__empty` (línea ~161-165):
   ```css
   .component-list__empty-filter {
     color: var(--text-muted);
     text-align: center;
     padding: 1rem;
   }
   ```

7. **Verificación manual**: abrir `src/index.html` en modo edición, con componentes de varios tipos añadidos, comprobar filtrado en vivo por id y por tipo (con y sin acentos/mayúsculas), mensaje de "sin coincidencias", que el campo de orden sigue acotado al total real con el filtro activo, y que arrastrar/redimensionar/colapsar/seleccionar fila siguen funcionando igual.
