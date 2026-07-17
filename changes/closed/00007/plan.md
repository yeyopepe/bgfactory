# Plan: selección de componente no se resalta (lista ni mesa)

## (a) Anotaciones funcionales

Fuera de alcance (no se toca):
- La superposición de componentes en la mesa cuando comparten la misma posición — no aplica: el fix 00006 (implementado antes que este) le dio a cada componente su propia `x`/`y` independiente, así que ese factor ya no interviene en este bug.
- Cualquier otro comportamiento de la lista/panel de componentes (colapso, scroll, alta/edición/borrado) — no relacionado con la causa raíz de este fix, se deja tal cual.

Dudas resueltas con el usuario: el clic problemático es sobre la fila del panel flotante (no sobre la representación del componente en la mesa) — confirmado con `AskUserQuestion` antes de documentar el fix.

Causa raíz (reverificada leyendo `src/styles/main.css`, `src/ui/componentList.js` y `src/ui/componentRenderer.js`): en `main.css`, tanto `.component-list__row--selected` (línea 180) como `.text-box--selected` (línea 333) son selectores de una sola clase (especificidad `0-1-0`), mientras que `.component-list__row:hover` (línea 176) y `.text-box--selectable:hover` (línea 329) combinan una clase con una pseudoclase (especificidad `0-2-0`). Como `:hover` tiene mayor especificidad, sus reglas ganan siempre sobre las de `--selected` cuando ambas aplican a la vez — situación habitual justo después de hacer clic, porque el cursor queda sobre el elemento que se acaba de seleccionar. El resultado es que el resaltado de selección queda visualmente oculto tanto en la fila de la lista como en el componente de la mesa. No es un bug de lógica: `componentList.js` (línea 53-55) y `componentRenderer.js` (línea 36-38) sí aplican correctamente la clase `--selected` según `selectedId`; el problema es puramente de especificidad CSS.

## (b) Solución técnica

1. **`src/styles/main.css` — subir la especificidad de las reglas `--selected` para que ganen a `:hover`**
   - `.component-list__row--selected` → cambiar el selector a `.component-list__row.component-list__row--selected` (especificidad `0-2-0`, igual que `.component-list__row:hover`; al mantenerla declarada después de la regla `:hover` en el fichero, el empate de especificidad se resuelve por orden de aparición a favor de la selección).
   - `.text-box--selected` → mismo tratamiento: `.text-box--selectable.text-box--selected` (especificidad `0-2-0`, igual que `.text-box--selectable:hover`, y ya está declarada después en el fichero). En modo edición ambas clases siempre coexisten en el componente seleccionado (`componentRenderer.js` añade `text-box--selectable` cuando hay `onSelect`, y `editMode.js` pasa siempre `onSelect` junto con `selectedId`), así que el selector compuesto no cambia qué elementos quedan afectados, solo su prioridad frente al hover.
   - No se toca ninguna otra regla, ni el orden de las declaraciones existentes, ni el JS: es un cambio contenido a dos selectores en `main.css`.
