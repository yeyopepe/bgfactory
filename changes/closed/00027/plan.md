## (a) Anotaciones funcionales

Fuera de alcance:
- No se añade arrastrar-y-soltar filas para reordenar (solo el cuadro de texto numérico "Orden", como pide la descripción).
- No se toca `modes/play/playMode.js` explícitamente: consume el mismo `renderComponentsOnTable` que `editMode.js`, así que el nuevo criterio de apilado por `order` le llega automáticamente sin cambios propios.

Dudas resueltas con el usuario (ya incorporadas a `description.md` en una revisión previa de esta misma entrada):
- **Algoritmo de desplazamiento**: al mover un componente a una posición ya ocupada, se saca primero de su posición actual (compactando a los que iban detrás) y luego se inserta en la posición indicada (desplazando hacia abajo a los que estén en esa posición o después) — resultado siempre una permutación válida de 1..n.
- **Momento de aplicar el cambio**: al confirmar (`change`: blur/Enter), no en cada tecla (`input`).
- **Caracteres permitidos**: el campo solo admite teclear dígitos (sin punto/coma), saneado al vuelo.

Duda técnica adicional resuelta en este análisis (no afecta a la definición funcional, es una consecuencia mecánica de la arquitectura ya existente): los guardados de `localStorage` hechos con la misma `CURRENT_VERSION` pero antes de esta funcionalidad (cambios se acumulan bajo la misma versión hasta que se ejecuta `ms-version`, ver `core/persistence.js` — `parseState` solo invalida el guardado si `version` no coincide) tendrán componentes sin campo `order`. Se resuelve igual que otros campos añadidos progresivamente al estado (`resources`, `panelState`): al cargar, si falta o no es válido, se asigna a partir del orden actual del array (orden de inserción), preservando el apilado visual que ya tenían.

## (b) Solución técnica

1. **`src/core/component.js`** — añadir `order: null` a los campos que devuelve `createComponent()` (parámetro opcional, por defecto `null`). El valor real siempre lo asigna `core/state.js` al añadir el componente al estado (no se puede calcular dentro de `createComponent`, que no conoce el resto de la lista). `updateComponent()` no necesita cambios (el orden no se edita a través de la modal).

2. **`src/core/state.js`** — aquí vive toda la lógica de orden, junto a los mutadores que ya disparan `components:changed`:
   - Añadir una función interna `compactOrders(components)` que, dada una lista, la ordena por su `order` actual (o por posición en el array si `order` falta/no es un número válido) y reasigna `1..n` de forma contigua, mutando cada componente.
   - `addComponent(component)`: antes de hacer `push`, asignar `component.order = state.components.length + 1` (queda al fondo del todo).
   - `removeComponent(id)`: tras filtrar, invocar `compactOrders(state.components)` para que los órdenes restantes vuelvan a ser consecutivos de 1 a n.
   - Nueva función exportada `reorderComponent(id, rawOrder)`:
     - Localizar el componente y su `oldOrder` actual; `n = state.components.length`.
     - Clampear `rawOrder` a `[1, n]`.
     - Si `rawOrder === oldOrder`, no hacer nada (emitir igualmente `components:changed` no es necesario).
     - En caso contrario: sacar al componente de su hueco (todo lo que tenía `order > oldOrder` resta 1) y luego insertarlo en `rawOrder` (todo lo que tenga `order >= rawOrder`, tras el paso anterior, suma 1); asignar `rawOrder` al componente movido.
     - Emitir `components:changed`.
   - `loadComponents(components)`: antes de asignarlos a `state.components`, pasarlos por `compactOrders(...)` para migrar guardados sin `order` (o con valores inválidos) asignándoles el orden de inserción actual, sin romper el apilado visual que ya tenían.

3. **`src/ui/componentList.js`** (`renderComponentList`):
   - Ordenar `components` por `order` ascendente antes de pintar filas (no asumir que ya llega ordenado).
   - Añadir `<th>Orden</th>` como primera columna de la cabecera.
   - Por cada fila, añadir como primera celda un `<input type="number" min="1" max="{n}">` con el `order` del componente:
     - Saneado de teclas: en el evento `input`, igual que el campo "Id" de `componentModal.js` (línea ~152), sustituir cualquier carácter que no sea dígito por nada (`value.replace(/\D+/g, '')`).
     - En el evento `change` (blur/Enter): si el campo queda vacío, restaurar `input.value` al `order` actual del componente (descartar el cambio); si no, `parseInt`, clampear a `[1, n]`, y llamar a `onReorder(component, valorClamped)` si se ha pasado esa opción.
   - Añadir `onReorder` a la firma de opciones de `renderComponentList` y pasarlo a la construcción de cada fila.

4. **`src/ui/componentRenderer.js`** (`renderComponentsOnTable`): antes del bucle que dibuja cada componente, construir una copia ordenada por `order` **descendente** (`[...components].sort((a, b) => (b.order ?? 0) - (a.order ?? 0))`) e iterar sobre esa copia en vez del array recibido tal cual. Como cada `appendChild` posterior queda por encima visualmente, esto hace que el componente con `order = n` (el más "de fondo") se dibuje primero y el de `order = 1` el último (encima de todos), sustituyendo el criterio implícito de orden de inserción.

5. **`src/modes/edit/editMode.js`** — en `renderList()`, importar `reorderComponent` de `core/state.js` y pasar `onReorder: (component, newOrder) => reorderComponent(component.id, newOrder)` a `renderComponentList(...)`, junto al resto de callbacks ya existentes.

No hay cambios en `src/core/persistence.js`: el campo `order` viaja como cualquier otra propiedad del componente dentro de `components`, sin tocar el esquema de guardado/exportado a fichero.

## (c) Cambios de arquitectura

`design/docs/ARCHITECTURE.md` sección 4 (modelo de datos de componente): añadir el campo `order: number` al listado de campos del componente, con una nota sustituyendo la mención implícita de "orden de inserción" como criterio de apilado por el nuevo campo explícito, y documentar brevemente `reorderComponent`/`compactOrders` en `core/state.js` como el punto donde vive la lógica de reordenar/compactar. También actualizar la sección 5 (`ui/componentRenderer.js`) para reflejar que `renderComponentsOnTable` ahora dibuja según `order` (descendente) en vez del orden del array recibido, y la sección 5 (`ui/componentList.js`) para mencionar la nueva columna "Orden" y su callback `onReorder`.
