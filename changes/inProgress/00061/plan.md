## (a) Anotaciones funcionales

- **Fuera de alcance**: no se añade ninguna interacción de juego nueva a ningún tipo de componente. "Subir al mover/interactuar" solo se engancha en las interacciones que ya existen hoy en Modo Juego (arrastre para cualquier tipo, volteo para "carta", lanzamiento para "dado"); tipos sin interacción propia más allá del arrastre ("cuadro de texto", "tablero", "visor de documentos", "ficha") solo se benefician del caso de arrastre, igual que el resto.
- **Fuera de alcance**: no se actualizan los ficheros de ejemplo `src/test/*.json`. La revisión de "ficheros de prueba" de la sección 8 de `ARCHITECTURE.md` aplica quando se añade un **tipo** de componente nuevo; este cambio añade un campo a los tipos ya existentes, no un tipo nuevo.
- **Duda técnica resuelta durante este análisis**: el campo interno no tiene por qué llamarse igual que la etiqueta visible. Se usará `subirAlMoverInteractuar` (booleano), siguiendo el mismo estilo camelCase que `bloqueado`/`mostrarTooltip`, y describiendo sin ambigüedad que cubre tanto el arrastre como la interacción propia del tipo.
- El resto de dudas de alcance (mapeo "figuras" → tipo `'ficha'`; campo por componente, no configuración global compartida; el bloqueo no impide las interacciones propias; componentes ya guardados sin el campo se comportan como desmarcados) ya quedaron resueltas en `description.md` y no requieren nuevo análisis aquí.

## (b) Solución técnica

1. **`core/component.js`** — añadir el parámetro `subirAlMoverInteractuar = false` a `createComponent({ ... })`, con el mismo patrón que `bloqueado`/`mostrarTooltip` (parámetro con valor por defecto, devuelto tal cual en el objeto creado).

2. **`ui/componentModal.js`**:
   - En `createDefaultComponent(type)`, en las ramas de `'carta'`, `'ficha'` y `'dado'`, forzar `component.subirAlMoverInteractuar = true` — mismo mecanismo que ya usa esa función para forzar `component.bloqueado = false` en `'ficha'`/`'carta'`.
   - En la pestaña "Generales", añadir un tercer campo justo debajo del bloque de "Mostrar tooltip": mismo marcado (`div.modal__field.modal__field--checkbox` con `input[type=checkbox]` + `label` + `createHelpIcon`), inicializando el checkbox con `workingComponent.subirAlMoverInteractuar ?? false`, actualizando `workingComponent.subirAlMoverInteractuar` en su evento `change`, con etiqueta "Subir al mover/interactuar" y texto de ayuda: *"Si está marcado, este componente se coloca automáticamente encima de todos los demás cada vez que se mueve o se interactúa con él (voltear, lanzar) en Modo Juego."*

3. **`modes/play/playMode.js`** — importar también `reorderComponent` desde `../../core/state.js` (junto a `getComponents`/`replaceComponent`, ya importados). Tras cada uno de los tres puntos que ya llaman a `replaceComponent`, si `component.subirAlMoverInteractuar` es verdadero, invocar además `reorderComponent(component.id, 1)`:
   - `onMove`, después de `replaceComponent(component.id, updateComponent(component, { x, y }))`.
   - `onDiceResult`, después de `replaceComponent(component.id, updateComponent(component, { properties: { resultadoActual: resultado } }))`.
   - `onCartaFlip`, después de `replaceComponent(component.id, updateComponent(component, { properties: { caraActual: nuevaCara } }))`.

   `reorderComponent` ya clampa y no emite ningún cambio si el componente ya está en orden 1 (`if (newOrder === oldOrder) return;`), así que no hace falta comprobarlo aparte antes de invocarlo. Como opera buscando por `id` directamente sobre `state.components`, debe llamarse **después** de `replaceComponent` (para que ya exista en el estado la versión actualizada del componente que se está reordenando).

4. **`modes/edit/editMode.js`** — no se toca. Su propio `onMove` (arrastre en Modo Edición) queda exactamente igual: esta funcionalidad es exclusiva de Modo Juego.

5. **`core/persistence.js` / `core/fileExport.js`** — no se tocan. Al ser un campo plano más del objeto `component` (no una colección nueva de `state.js`), ya viaja con el resto de sus propiedades en el autoguardado, "Guardar a fichero" y "Exportar" sin ningún cambio adicional.

6. Un componente ya guardado antes de este cambio no tiene el campo (`undefined`), que se evalúa como falso en las comprobaciones de los tres handlers de `playMode.js` — se comporta como desmarcado de forma natural, sin necesitar ninguna migración explícita (mismo criterio ya usado por `mostrarTooltip`).

## (c) Cambios de arquitectura

Actualizar `design/docs/ARCHITECTURE.md`:

- **Sección 4 (modelo de datos de componente)**: añadir `subirAlMoverInteractuar: boolean` al bloque de forma del componente, junto a `bloqueado`/`mostrarTooltip`, y una frase en la prosa que sigue a ese bloque explicando: se inicializa a `false` por defecto (`true` para `'carta'`/`'ficha'`/`'dado'`, forzado por `createDefaultComponent()` igual que `bloqueado`); editable desde la pestaña "Generales" de `ui/componentModal.js`; en Modo Juego (`modes/play/playMode.js`), cuando está a `true`, cada arrastre (`onMove`), volteo de carta (`onCartaFlip`) o lanzamiento de dado (`onDiceResult`) invoca `reorderComponent(component.id, 1)` para dejar el componente arriba del todo; un componente sin este campo (guardados anteriores a este cambio) se comporta como si estuviera desmarcado.
- **Sección 5 (`ui/componentModal.js`)**: mencionar el tercer checkbox "Subir al mover/interactuar" junto a "Bloqueado" en la descripción de la pestaña "Generales".

Actualizar `design/docs/FEATURES.md`:

- Añadir una nueva subsección "Subir al mover/interactuar" en el área "Mesa de juego", justo después de "Orden de apilado en la mesa" (con la que está directamente relacionada): explica el checkbox, su ubicación en "Generales", su comportamiento (arrastre/volteo/lanzamiento en Modo Juego lo suben al orden 1), que es independiente de "Bloqueado", y el valor por defecto (marcado para "Carta"/"Ficha"/"Dado", desmarcado para el resto). Incluye "Disponible en" y "Código: 00061".
- Añadir una frase breve en "Alta/edición/borrado de componentes con modal de tabs" (junto a la que ya menciona "Bloqueado") señalando la existencia del tercer checkbox, con enlace a la nueva subsección, y añadir `00061` a su lista de "Código".
