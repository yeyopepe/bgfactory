- **Fecha creación**: 2026-08-07

## (a) Anotaciones funcionales

**Fuera de alcance:** no se toca `ui/copyComponentModal.js` (edición individual de una copia, con su checkbox "Sincronizado" propio) ni el mecanismo de sincronización en vivo campo-a-campo ya existente en `core/state.js`/`core/component.js`. No se introduce ningún campo nuevo en el modelo de datos: reutiliza `copyOf`/`sincronizado`/`oculto` ya existentes.

**Hallazgo relevante para el diseño (no una incongruencia doc/código, sino contexto que `description.md` no tenía):** parte de "el total de copias" y "ver listado de copias" **ya está implementado** hoy, pero dentro de la pestaña "Generales" en vez de en una pestaña propia:
- `ui/componentModal.js` (líneas ~498-528): bloque `.component-copies-summary` — cuenta de copias vinculadas + botón "Ver copias vinculadas..." —, solo se muestra si `linkedCopies.length > 0` (sin mensaje si no tiene copias).
- `ui/componentCopiesModal.js` (`openComponentCopiesModal`): modal de solo lectura que abre ese botón, listando únicamente el id de cada copia (sin columna de sincronizado).
- Documentado ya en `design/docs/style/03-modales-menus.md` §12.6.1 ("Número + botón que abre modal aparte", primer uso = este mismo bloque).

La solución de este cambio consiste en **trasladar y ampliar** esa UI ya existente a la pestaña "Copias" nueva, no en construirla desde cero.

**Decisiones técnicas tomadas (no requieren confirmación adicional del usuario):**
- Se mantiene el texto ya existente del botón, "Ver copias vinculadas...", y el título ya existente de la modal de listado, "Copias vinculadas" — son sinónimos exactos de "ver listado de copias" que ya usa la app hoy; no se introduce un texto nuevo para el mismo concepto.
- `componentModal.js` solo se abre para componentes con `copyOf` nulo (`modes/edit/editMode.js` → `openEditModalFor` enruta a `openCopyComponentModal` en caso contrario) — la pestaña "Copias" no necesita ninguna comprobación adicional de "no soy una copia": la garantía ya la da quien abre la modal.
- "Sincronizar todas las copias" y el checkbox "Oculto" de "Desincronizar todas las copias" actúan siempre sobre el componente **ya guardado** en `core/state.js` (`getComponents().find(...)`), nunca sobre los valores todavía sin confirmar de `workingComponent` dentro de esta misma modal abierta — mismo criterio que ya usa "Ver contenido del mazo" en esta misma modal (`sacarCartaDeMazo` opera siempre sobre el estado real, no sobre el borrador). Si se sincronizara contra el borrador y el usuario after cancelara la modal, las copias quedarían con valores que el original nunca llegó a tener.

**Dudas resueltas con el usuario:** ver `description.md` (ubicación de la pestaña, contenido del listado, alcance de "Sincronizar todas las copias", estado del componente nuevo, navegación del listado, confirmación y valor inicial del checkbox "Oculto").

## (b) Solución técnica

1. **`src/ui/componentModal.js` — crear la pestaña "Copias".** Justo después de `createTab('specific', 'Específicas');` (línea 756), añadir `createTab('copias', 'Copias');` y `const copiasContent = tabContents.get('copias').content;`. Sigue el mismo patrón de pestaña que "Generales"/"Específicas" (`modal__tabs` + `modal__tab`, contenido en `modal__content`).

2. **`src/ui/componentModal.js` — trasladar el resumen de copias desde "Generales" a "Copias".** Quitar el bloque completo de las líneas ~498-528 (`const linkedCopies = ...` hasta el `infoSection.appendChild(copiesSummary);` incluido) de dentro de la construcción de `infoSection` en la pestaña "Generales". Reconstruirlo dentro del nuevo `copiasContent`, con estas diferencias:
   - `const linkedCopies = getComponents().filter((c) => c.copyOf === workingComponent.id);` se recalcula igual, ahora al construir `copiasContent`.
   - Si `linkedCopies.length === 0`: añadir un único elemento con clase nueva `.component-copies-tab__empty` y texto "Este objeto no tiene copias." — nada más en la pestaña.
   - Si `linkedCopies.length > 0`: mismo bloque `.component-copies-summary` que ya existe hoy (fila `label`/`value` con el total, botón `.component-copies-summary__button` con texto "Ver copias vinculadas..." que sigue llamando a `openComponentCopiesModal({ originalId: workingComponent.id })`), sin el `border-top`/`margin-top` que tenía como separador respecto a los campos de "Generales" (ya no hace falta: es el primer contenido de una pestaña propia, no el cierre de una sección) — quitar esas dos reglas de `.component-copies-summary` en el CSS (ver tarea 6) y aplicarlas solo cuando el bloque siga viviendo dentro de otra pestaña (no es el caso tras este cambio, así que se simplifican directamente).
   - Seguido del botón "Sincronizar todas las copias" (tarea 3) y de la sección "Desincronizar todas las copias" (tarea 4), ambos también dentro de este mismo `if (linkedCopies.length > 0)`.

3. **`src/ui/componentModal.js` — botón "Sincronizar todas las copias".** Debajo del bloque `.component-copies-summary` (dentro del mismo `if`), añadir un botón (`class="btn-accept"`, ancho completo igual que `.component-copies-summary__button`) con texto "Sincronizar todas las copias". Al pulsarlo:
   ```js
   if (confirm(`¿Sincronizar las ${linkedCopies.length} copias de "${workingComponent.id}"?`)) {
     const original = getComponents().find((c) => c.id === workingComponent.id);
     for (const copy of getComponents().filter((c) => c.copyOf === workingComponent.id)) {
       replaceComponent(copy.id, syncCopyWithOriginal({ ...copy, sincronizado: true }, original));
     }
     showToast('Copias sincronizadas');
   }
   ```
   Recalcula `getComponents().filter(...)` en el momento de aplicar (no reutiliza la constante `linkedCopies` capturada al construir la pestaña), por si algo cambió mientras la modal seguía abierta. Requiere importar `replaceComponent` y `syncCopyWithOriginal` en este fichero (`replaceComponent` desde `../core/state.js`, ya se importa `getComponents`/`getResources`/etc. de ahí — añadirlo a esa misma línea de import; `syncCopyWithOriginal` desde `../core/component.js`, donde ya se importan `createComponent`/`updateComponent` — añadirlo a esa misma línea).

4. **`src/ui/componentModal.js` — sección "Desincronizar todas las copias".** Debajo del botón anterior, un `<fieldset class="modal__section">` con `<legend class="modal__section-title">Desincronizar todas las copias</legend>` (sección meramente informativa, patrón `12.6` de la guía de estilo) conteniendo un único campo `.modal__field.modal__field--checkbox` con checkbox "Oculto":
   - Valor inicial: `const original = getComponents().find((c) => c.id === workingComponent.id); ocultoCheckbox.checked = original?.oculto ?? false;` (se calcula una sola vez al construir la pestaña, no se vuelve a leer después).
   - Icono de ayuda (`createHelpIcon`, ya importado) junto al checkbox, mismo patrón que el resto de checkboxes de la modal: texto tipo "Al marcar o desmarcar, todas las copias de este objeto se desincronizan y su 'Oculto' pasa a este valor de inmediato."
   - Listener `change`:
     ```js
     const original = getComponents().find((c) => c.id === workingComponent.id);
     for (const copy of getComponents().filter((c) => c.copyOf === workingComponent.id)) {
       replaceComponent(copy.id, updateComponent(copy, { sincronizado: false, oculto: ocultoCheckbox.checked }));
     }
     showToast('Copias desincronizadas');
     ```
     Sin `confirm()` (a diferencia de la tarea 3): es una acción reversible con un nuevo click del mismo checkbox. `updateComponent` ya está importado en este fichero.

5. **`src/ui/componentCopiesModal.js` — añadir columna "Sincronizada" al listado.** Dentro del bucle `for (const copy of copies)`, tras `idSpan`, añadir un segundo `<span class="component-copies-modal__sync">` con texto `copy.sincronizado !== false ? 'Sincronizada' : 'No sincronizada'` (mismo criterio de "sincronizado por defecto `true`" que usa el resto del modelo, `01-component-model.md`), y una clase modificadora (`--yes`/`--no`) para diferenciarlas visualmente (ver tarea 6). Cambiar `item.appendChild(idSpan);` por añadir ambos spans, y envolver ambos en un contenedor de fila si hace falta para separarlos visualmente (`display:flex; justify-content:space-between` en el propio `.component-copies-modal__list-item`, sin nuevo elemento).

6. **`src/styles/main.css` — ajustes de estilo.**
   - `.component-copies-summary`: quitar `margin-top: 1rem; padding-top: 0.75rem; border-top: 1px solid var(--border-neutral);` (ya no hace falta separador de la pestaña "Generales" — ver tarea 2).
   - Nueva clase `.component-copies-tab__empty`: mismas reglas que `.mazo-contenido__empty` (`padding: 1.5rem 0.5rem; text-align: center; color: var(--text-muted); font-size: 0.875rem;`) — no reutilizar literalmente esa clase de otro bloque (BEM, `INDEX.md` style §7).
   - `.component-copies-modal__list-item`: añadir `display: flex; align-items: center; justify-content: space-between; gap: 1rem;` para acomodar el id a la izquierda y el estado de sincronización a la derecha.
   - Nueva clase `.component-copies-modal__sync` con modificadores `.component-copies-modal__sync--yes` (`color: var(--text-muted)`, ya es el caso implícito por defecto del texto) y `.component-copies-modal__sync--no` (`color: var(--text-muted)` igual, sin necesidad de un color de estado nuevo — ninguna paleta de éxito/error está documentada para este uso concreto; usar `font-style: italic` en `--no` para diferenciarlo sin introducir un color nuevo fuera de catálogo).
   - Ningún estilo nuevo para el botón "Sincronizar todas las copias" ni para la sección "Desincronizar todas las copias": reutilizan `.btn-accept`/`.component-copies-summary__button` (ancho completo) y `.modal__section`/`.modal__field--checkbox` tal cual, sin excepción.

## (c) Cambios de arquitectura

Ninguno: `copyOf`/`sincronizado`/`oculto` ya están documentados en `design/docs/architecture/01-component-model.md` y no cambian de significado ni de forma de calcularse.

## (d) Cambios en estilo

`design/docs/style/03-modales-menus.md` §12.6.1 ("Número + botón que abre modal aparte"): actualizar la frase "Primer uso: `.component-copies-summary` → `.component-copies-modal`..." para reflejar que ese bloque vive ahora en su propia pestaña "Copias" de `ui/componentModal.js` (no ya dentro de la pestaña "Generales"), y añadir una nota breve sobre el patrón nuevo de columna de estado (`.component-copies-modal__sync--yes/--no`) como referencia para futuros listados de solo lectura con un estado por fila.

## (e) Verificación

1. Abrir las propiedades de un componente sin copias: la pestaña "Copias" existe, muestra "Este objeto no tiene copias." y ningún botón.
2. Crear un componente nuevo (sin guardar todavía) y abrir su pestaña "Copias": mismo mensaje vacío que el punto anterior.
3. Copiar un componente dos o tres veces desde el panel de Componentes, abrir las propiedades del original: la pestaña "Copias" muestra el total correcto, y ya no aparece ningún resumen de copias en la pestaña "Generales".
4. Pulsar "Ver copias vinculadas...": se abre la modal de listado por encima, con un id por copia y su estado "Sincronizada"/"No sincronizada" correcto para cada una (probar con al menos una copia con "Sincronizado" desmarcado desde su propia modal reducida, para ver "No sincronizada").
5. Cambiar "Bloqueado"/"Oculto" del original guardado (fuera de esta modal, o en una edición previa ya aceptada) y luego pulsar "Sincronizar todas las copias" en su pestaña "Copias": tras confirmar, todas las copias pasan a "Sincronizada" en el listado y su "Bloqueado"/"Oculto" coincide con el del original.
6. Cancelar la confirmación de "Sincronizar todas las copias": ninguna copia cambia de estado.
7. Marcar el checkbox "Oculto" de "Desincronizar todas las copias" sin confirmar nada: todas las copias pasan a "No sincronizada" en el listado, y su "Oculto" individual (comprobable abriendo cada copia desde el panel de Componentes) coincide con el nuevo valor del checkbox. Desmarcarlo y comprobar que vuelve a aplicarse igual (con `oculto: false`).
8. Tras "Sincronizar todas las copias" o el checkbox de "Desincronizar todas las copias", comprobar que el resto de campos de cada copia no vinculados a esta acción (posición en la mesa, `order`, resultado de dado/cara de carta si aplica) no ha cambiado.
