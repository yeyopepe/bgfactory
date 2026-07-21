## (a) Anotaciones funcionales

- **Fuera de alcance**: no se modifica el comportamiento de "Editar", "Eliminar" ni "+ Añadir componente"; no aplica en modo juego.
- **Duda resuelta con el usuario**: si se clona un componente que ya es un clon (p. ej. "abc(1)"), ¿el id del nuevo clon se calcula sobre el id raíz sin sufijo ("abc" → "abc(3)") o se anida sobre el id completo ("abc(1)(1)")? → Se calcula sobre el id raíz sin sufijo: se ignora cualquier sufijo `(n)` final ya existente al derivar el id base, de forma que todos los clones de una misma familia comparten el mismo id raíz y el hueco numérico se reutiliza de forma consistente aunque se clonen clones.
- **Nota de reanálisis (paso 0.1)**: esta entrada (00043) es anterior a otras que ya avanzaron más en el flujo (hay códigos en `implemented`/`closed` más altos). El análisis de este plan se ha hecho desde cero, verificando el estado actual del código (`src/core/state.js`, `src/core/component.js`, `src/ui/componentList.js`, `src/modes/edit/editMode.js`) sin dar nada por sentado del `description.md`.
- El fichero `design_boton-clonar-lista-componentes.html` de esta carpeta se ha usado solo como referencia de que existe un tercer botón "Clonar" junto a "Editar"/"Eliminar" en la celda de acciones; no se reutiliza su marcado, colores ni estructura. El estilo del nuevo botón sigue la convención ya existente en `component-list__action-btn` (mismo azul que "Editar"): la biblia de estilo (`STYLE_BIBLE.md`, sección 9) solo documenta variante primaria (azul) y destructiva (`--danger`, rojo); como clonar no es ni una acción destructiva ni introduce una nueva categoría de acción documentada, no se crea una variante de color nueva.

## (b) Solución técnica

1. **`src/core/component.js`** — añadir una función `nextCloneId(baseComponentId, components)` que:
   - Calcula el id raíz quitando cualquier sufijo final `(n)` del id recibido (regex `/\(\d+\)$/`).
   - Busca entre `components` los ids que coincidan exactamente con `{raíz}(n)` y determina el menor entero positivo `n` no usado todavía.
   - Devuelve `${raíz}(${n})`.
   - Añadir también `cloneComponent(component, components)` que construye el objeto clon: copia profunda de `properties`, mismo `type`/`image`/`width`/`height`/`bloqueado`/`mostrarTooltip`, `id` calculado con `nextCloneId`, posición desplazada (`x: component.x + 30`, `y: component.y + 30`, mismo criterio de offset fijo que ya usa `openAddModal` en `editMode.js` para distinguir visualmente sin superponerse exactamente), y `order: null` (se recalculará al insertarlo).

2. **`src/core/state.js`** — añadir `insertComponentAfter(component, newComponent)`:
   - Asigna `newComponent.order = component.order + 0.5` (posición fraccionaria, justo debajo del original en el orden).
   - Empuja `newComponent` a `state.components`.
   - Llama a `compactOrders(state.components)` (ya existente) para renormalizar todos los `order` a enteros contiguos 1..n, dejando el clon inmediatamente después del original y desplazando en +1 al resto de componentes que estuvieran por debajo.
   - Emite `components:changed` igual que el resto de mutaciones de esta lista.

3. **`src/ui/componentList.js`** — añadir un nuevo callback `onClone` a `renderComponentList` (parámetro junto a `onEdit`/`onRemove`), y un botón "Clonar" en `actionsCell`, entre "Editar" y "Eliminar", con la misma clase `component-list__action-btn` que "Editar" (sin modificador `--danger`), sin confirmación previa (a diferencia del botón "Eliminar"):
   ```js
   if (onClone) {
     const cloneButton = document.createElement('button');
     cloneButton.type = 'button';
     cloneButton.className = 'component-list__action-btn';
     cloneButton.textContent = 'Clonar';
     cloneButton.addEventListener('click', (event) => {
       event.stopPropagation();
       onClone(component);
     });
     actionsCell.appendChild(cloneButton);
   }
   ```

4. **`src/modes/edit/editMode.js`** — en `renderList()`, pasar `onClone` a `renderComponentList`:
   ```js
   onClone: (component) => {
     const clone = cloneComponent(component, getComponents());
     insertComponentAfter(component, clone);
   },
   ```
   - Importar `cloneComponent` de `../../core/component.js` e `insertComponentAfter` de `../../core/state.js`.
   - No se abre ningún modal tras clonar (a diferencia de `openAddModal`): el clon queda creado y visible en la lista y en la mesa; el usuario puede pulsar "Editar" sobre él si quiere modificarlo.

Orden de implementación: 1 → 2 → 3 → 4 (de más interno/aislado a más integrado), verificando manualmente en el navegador tras el paso 4 que clonar, clonar un clon, y eliminar clones funciona como se espera.
