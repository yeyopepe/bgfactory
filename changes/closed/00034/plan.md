## (a) Anotaciones funcionales

Sin dudas técnicas pendientes: el `description.md` ya deja resuelto el alcance (los tres tipos de componente, valor por defecto `false`, solo afecta a Modo Juego, mismo contenido de tooltip que hoy). Nada queda fuera de alcance más allá de lo ya descrito.

## (b) Solución técnica

1. **`src/core/component.js`** — añadir el parámetro `mostrarTooltip = false` a `createComponent`, siguiendo exactamente el mismo patrón que `bloqueado`, e incluirlo en el objeto devuelto. `updateComponent` no necesita cambios: ya copia cualquier campo vía spread.

2. **`src/ui/componentModal.js`** — en la pestaña "Generales" (`generalContent`), justo debajo del bloque `moveField` (checkbox "Bloqueado", líneas 131-148), añadir un nuevo bloque `tooltipField` con la misma estructura (`modal__field modal__field--checkbox`):
   - Checkbox con `checked = workingComponent.mostrarTooltip ?? false`.
   - Label "Mostrar tooltip".
   - Listener `change` que asigna `workingComponent.mostrarTooltip = tooltipCheckbox.checked`.
   - `createHelpIcon` con un texto equivalente al de "Bloqueado", explicando que activa el tooltip nativo del componente en Modo Juego (p.ej. "Si está marcado, este componente muestra su identificador como tooltip al pasar el ratón por encima, pero solo en Modo Juego. Desmarcado por defecto.").

3. **`src/ui/componentRenderer.js`** — en `renderComponentsOnTable`, las tres líneas que hoy condicionan el tooltip solo a `identifyMode === 'tooltip'` (texto: línea 249, tablero: línea 343, dado: línea 479) deben condicionarse también a la propiedad del componente:
   ```js
   if (identifyMode === 'tooltip' && component.mostrarTooltip) textBox.title = formatComponentIdentifier(component);
   ```
   (mismo cambio para `board` y `dice`). No se toca `identifyMode === 'label'` (Modo Edición no cambia).

4. Componentes ya existentes en partidas guardadas antes de este cambio no tendrán el campo `mostrarTooltip` en sus datos — como el chequeo es `&& component.mostrarTooltip`, un `undefined` se evalúa como falsy, así que se comportan igual que si estuviera desactivado (comportamiento por defecto correcto, sin necesidad de migración de datos).

No hace falta tocar `src/modes/play/playMode.js` ni `src/modes/edit/editMode.js`: siguen pasando `identifyMode: 'tooltip'` y `identifyMode: 'label'` respectivamente, sin cambios.
