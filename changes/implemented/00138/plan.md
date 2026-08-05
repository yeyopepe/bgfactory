- **Fecha creación**: 2026-08-05

## (a) Anotaciones funcionales

**Fuera de alcance:**
- No se toca ninguna otra propiedad general del componente (Oculto, Mostrar tooltip, Subir al mover/interactuar, Grupo).
- No se añade ninguna restricción nueva sobre redimensionar, editar vía modal, eliminar ni seleccionar un componente — solo el arrastre.
- No se introduce ningún mecanismo formal de "versión de guardado"; la migración de datos sigue el mismo patrón best-effort ya existente en `core/state.js` (`migrateFichas`, `migrateDeckIdToGrupo`).

**Dudas resueltas con el usuario** (ya recogidas en `description.md`, resumidas aquí para referencia rápida del plan):
- "Todos los modos" bloquea también el arrastre en Modo Edición (no otras acciones).
- La insignia de candado se muestra con "Solo modo juego" o "Todos los modos"; se oculta con "Ninguno".
- El toggle del menú contextual de Modo Juego sigue siendo binario: "Bloquear" → "Solo modo juego", "Desbloquear" → "Ninguno" (pierde el matiz "Todos los modos" si lo tenía).
- El campo no se sincroniza entre una Copia y su original (igual que hoy).
- Valor por defecto de un componente nuevo: "Ninguno", para los 6 tipos por igual (se retira la excepción especial de `'carta'`).

## (b) Solución técnica

1. **`core/component.js` — modelo de datos**
   - Cambiar el campo `bloqueado: boolean` por un campo de 3 valores string: `'ninguno'` | `'juego'` | `'todos'`. Mantener el nombre `bloqueado` (evita tocar todos los demás puntos de consumo por un simple rename) pero documentar el cambio de tipo en el comentario del modelo.
   - `createComponent({ ..., bloqueado = 'ninguno', ... })`: cambiar el valor por defecto del parámetro de `true` a `'ninguno'`.
   - `syncCopyWithOriginal(copy, original)`: no requiere ningún cambio — `bloqueado` ya queda fuera del objeto de campos sincronizados (se preserva vía `...copy`), y ese comportamiento no depende del tipo del campo. Actualizar solo el comentario de la línea 126 ("`bloqueado` y `oculto` de la copia tampoco se tocan") si hiciera falta precisar que ahora es un string, no un booleano (contenido ya correcto, no requiere cambio funcional).

2. **`ui/componentModal.js` — sustituir el checkbox por el desplegable**
   - Sustituir el bloque `moveField`/`moveCheckbox` (líneas ~231-248) por un `<select>` dentro de `modal__field` (mismo patrón que el resto de `<select>` de esta modal, p.ej. el desplegable "Grupo"), con las 3 `<option>` en este orden: `Ninguno` (`value="ninguno"`), `Solo modo juego` (`value="juego"`), `Todos los modos` (`value="todos"`). Selecciona `workingComponent.bloqueado` al construirlo; en su `change`, `workingComponent.bloqueado = select.value`.
   - Mantener el `createHelpIcon` junto al campo, con el texto ya acordado: "Indica en qué modo(s) este componente no se puede mover. 'Todos los modos' lo fija también en Modo Edición; 'Solo modo juego' lo fija únicamente durante la partida (comportamiento por defecto anterior); 'Ninguno' permite arrastrarlo libremente en ambos."
   - Eliminar la asignación especial `component.bloqueado = false` de `createDefaultComponent(type === 'carta')` (línea ~141): deja de ser necesaria porque el nuevo valor por defecto general (`'ninguno'`) ya es igual para todos los tipos.
   - Actualizar el bloque "Copiar/Pegar estilo" de la pestaña específica de `'carta'` (líneas ~1046-1118): sustituir la referencia `moveCheckbox.checked = workingComponent.bloqueado` (línea 1101) por `select.value = workingComponent.bloqueado` (adaptar al nuevo control); el resto de ese flujo (`data.generales.bloqueado`, `clip.generales.bloqueado`) sigue funcionando igual al tratarse ya de una simple copia de valor, sin lógica booleana específica.

3. **`ui/componentRenderer.js` — insignia de candado**
   - En los 6 puntos donde hoy se comprueba `if (showLockIndicator && component.bloqueado) ...appendChild(createLockBadge())` (textBox, board, dice, documentViewer, carta, mazo), cambiar la condición a `component.bloqueado !== 'ninguno'` (se muestra con `'juego'` o `'todos'`, se oculta con `'ninguno'`).
   - No se toca el parámetro `canMove` en sí (sigue siendo genérico, ver punto 4) — este fichero solo decide la insignia visual, la lógica de bloqueo de arrastre en sí vive en cada modo que invoca `renderComponentsOnTable`.

4. **`modes/play/playMode.js` — arrastre y menú contextual en Modo Juego**
   - `canMove: (component) => component.bloqueado !== true` (línea ~148) → `canMove: (component) => component.bloqueado === 'ninguno'` (en Modo Juego se puede arrastrar solo si el valor es "Ninguno"; tanto "Solo modo juego" como "Todos los modos" lo bloquean).
   - Fila general "Bloquear"/"Desbloquear" del menú contextual (líneas ~172-235): cambiar `const bloqueado = component.bloqueado === true` por `const bloqueado = component.bloqueado !== 'ninguno'` (para la etiqueta/icono, que solo necesitan saber si está bloqueado en Modo Juego o no). El toggle en sí (línea ~235, `replaceComponent(component.id, updateComponent(component, { bloqueado: !bloqueado }))`) cambia a `updateComponent(component, { bloqueado: bloqueado ? 'ninguno' : 'juego' })` — es decir, si estaba bloqueado en algún grado (`'juego'` o `'todos'`) pasa a `'ninguno'`; si no lo estaba, pasa a `'juego'`.

5. **`modes/edit/editMode.js` — nueva restricción de arrastre en Modo Edición**
   - `renderTable()` (línea ~396) invoca hoy `renderComponentsOnTable` sin pasar `canMove` (por eso el arrastre en edición nunca ha estado restringido, usa el default `() => true` de `ui/componentRenderer.js`). Añadir `canMove: (component) => component.bloqueado !== 'todos'` a esa llamada — reutiliza el mismo mecanismo genérico que ya usa `playMode.js`, sin tocar `ui/componentRenderer.js` ni el resto de callbacks (`onMove`, `onResize`, `onSelect`, etc., que no cambian).

6. **`core/state.js` — migración de datos guardados**
   - Añadir una función `migrateBloqueado(components)`, mismo patrón best-effort que `migrateFichas`/`migrateDeckIdToGrupo` (línea ~150): recorre `components` y, para cada uno donde `typeof component.bloqueado === 'boolean'`, sustituye `component.bloqueado = component.bloqueado ? 'juego' : 'ninguno'`. Un componente sin el campo en absoluto (guardado muy antiguo) no coincide con `typeof === 'boolean'` y queda para el fallback de creación por defecto — no hace falta tratarlo aparte, ya que en la práctica todo componente guardado con este framework ya ha pasado por `createComponent()` y siempre ha tenido el campo.
   - Invocar `migrateBloqueado(components)` dentro de `loadComponents()` (línea ~161), junto a `migrateFichas`/`migrateDeckIdToGrupo`, antes de `compactOrders`.

7. **Orden de implementación recomendado**: 1 (modelo) → 6 (migración) → 4 y 5 (consumo en ambos modos) → 3 (insignia) → 2 (UI de la modal), para poder probar cada capa según se añade sin dejar el campo en un estado intermedio inconsistente.

## (c) Cambios de arquitectura

Actualizar `design/docs/ARCHITECTURE.md`:

- **Sección 4 (Modelo de datos de componente), línea 67**: cambiar la definición `bloqueado: boolean, // si el componente NO se puede mover en modo juego (true por defecto)` por algo equivalente a `bloqueado: 'ninguno' | 'juego' | 'todos', // en qué modo(s) el componente NO se puede mover ('ninguno' por defecto)`.
- **Párrafo posterior a la sección 4** (el que hoy explica `bloqueado` inicializado a `true`, editable desde "Generales", controla si `modes/play/playMode.js` habilita el arrastre): actualizar para reflejar el nuevo valor por defecto (`'ninguno'`), el desplegable de 3 opciones, y que ahora también condiciona el arrastre en `modes/edit/editMode.js` cuando vale `'todos'`.
- **Sección 3, líneas 42-43** ("Indicador de candado"): actualizar la condición descrita (`component.bloqueado` activo) para reflejar que ahora se basa en `bloqueado !== 'ninguno'`, sin cambiar el resto de la descripción (sigue siendo solo en Modo Edición, sigue sin mostrarse en Modo Juego).
- **Sección "Copias vinculadas" (`syncCopyWithOriginal`)**: revisar la frase que menciona `bloqueado` entre los campos no sincronizados — sigue siendo cierta, solo confirmar que no necesita reformularse por el cambio de tipo (no es obligatorio tocarla si el texto ya es genérico).

También actualizar `design/docs/FEATURES.md`:
- Sección "Alta/edición/borrado de componentes con modal de tabs": el checkbox "Bloqueado, marcado por defecto para cualquier tipo salvo Carta/Ficha" pasa a describirse como el nuevo desplegable de 3 opciones, con "Ninguno" como valor por defecto para todos los tipos (retirando la excepción de "Carta/Ficha").
- Sección "Posición independiente, arrastre y redimensionado de componentes": reescribir el párrafo que describe "Bloqueado" como checkbox que solo afecta a Modo Juego, incluyendo ahora el comportamiento de "Todos los modos" sobre Modo Edición, y el nuevo criterio de visibilidad de la insignia de candado.
- Sección "Elementos tipo Copia...": confirmar que la mención de "Bloqueado" entre los campos no sincronizados sigue siendo válida tal cual (sin cambio de contenido necesario, ya que el criterio no cambia).
