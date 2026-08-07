- **Fecha creación**: 2026-08-07

## (a) Anotaciones funcionales

**Fuera de alcance:** ningún otro comportamiento se toca. No se modifica la modal reducida de una Copia (`ui/copyComponentModal.js` u homólogo), que ya muestra el id de su original y no necesita esta sección. No se añade acción alguna sobre las copias desde esta lista (no hay "Editar"/"Eliminar" por fila) — es puramente informativa, igual que se acordó con el usuario.

**Dudas resueltas con el usuario:**
- ¿Dónde y cómo se muestra la lista de copias? → Al final de la sección "General" ya existente en la pestaña "Generales": una fila con el número de copias y un botón que abre una modal aparte con la lista completa de ids (no en línea, para no descontrolar el alto de la sección si el original tiene muchas copias).
- ¿Qué muestra cada copia en la lista? → Solo su id, sin interacción.

## (b) Solución técnica

1. **`src/ui/componentModal.js` — añadir fila de resumen de copias al final del fieldset `infoSection`.** Justo antes de `generalContent.appendChild(infoSection);` (línea 495), calcular `const linkedCopies = getComponents().filter((c) => c.copyOf === workingComponent.id);` (`getComponents` ya está importado). `workingComponent` en este punto de la construcción de la modal es siempre un Original (`openComponentModal` solo se invoca para componentes sin `copyOf`, ver `modes/edit/editMode.js` `openEditModalFor` — las Copias usan `openCopyComponentModal`), así que no hace falta comprobar `copyOf` del propio componente. Si `linkedCopies.length > 0`, crear y añadir a `infoSection` un bloque nuevo:
   - Contenedor `div.component-copies-summary` (nuevo bloque BEM).
   - Fila `div.component-copies-summary__row` con `span.component-copies-summary__label` (texto "Copias vinculadas") y `span.component-copies-summary__value` (texto `linkedCopies.length`).
   - Botón `button.btn-cancel` (reutiliza la excepción `.btn-*` ya documentada, mismo criterio que el botón "Ver contenido del mazo" de esta misma modal ~línea 1591-1596) con texto "Ver copias vinculadas...", `type="button"`, ancho completo (clase adicional `component-copies-summary__button` con `width: 100%` en CSS, no `style=` inline). Su listener llama a `openComponentCopiesModal({ originalId: workingComponent.id })` (nueva función, tarea 3).
   - Si `linkedCopies.length === 0`, no añadir nada (la sección "General" queda exactamente como hoy).
2. **`src/ui/componentModal.js` — import.** Añadir `import { openComponentCopiesModal } from './componentCopiesModal.js';` junto al resto de imports de sub-modales (cerca de `import { openMazoContentModal } from './mazoContentModal.js';`, línea 19).
3. **`src/ui/componentCopiesModal.js` (fichero nuevo) — modal de solo lectura con la lista de copias.** Mismo esqueleto que `openMazoContentModal` (`ui/mazoContentModal.js`): `overlay.modal-overlay` > `div.modal` con `div.modal__header`, `p.modal__hint`, `div.modal__content`, `div.modal__footer`; cierre con botón "Cerrar" (`.btn-cancel`) y al hacer click fuera (mismo patrón `mousedown`/`click` sobre el overlay que usa `mazoContentModal.js`, líneas 111-117, para no cerrar accidentalmente si el `mousedown` empezó dentro del modal y se soltó fuera).
   - Firma: `export function openComponentCopiesModal({ originalId })`. Relee siempre `getComponents()` en el momento de abrir (no recibe la lista por parámetro), igual que `mazoContentModal.js` — no necesita refrescarse tras abrirse (no hay acciones que cambien el conjunto de copias desde esta modal), así que no hace falta una función `renderBody` separada, basta con construir el contenido una vez.
   - `const original = getComponents().find((c) => c.id === originalId);` y `const copies = getComponents().filter((c) => c.copyOf === originalId);` — si `!original` (se borró justo antes de abrir esta modal, caso límite igual de improbable que el que ya contempla `mazoContentModal.js` para `!mazo`), no abrir nada (`return` antes de montar el overlay).
   - Cabecera (`modal__header`): texto fijo "Copias vinculadas".
   - `modal__hint`: `${formatComponentIdentifier(original)} — ${copies.length} copias` (`formatComponentIdentifier` ya exportado por `ui/componentRenderer.js`).
   - `modal__content`: `ul.component-copies-modal__list` con un `li.component-copies-modal__list-item` por copia, cada uno con un único `span.component-copies-modal__id` con `copy.id` como texto — sin miniatura ni botones de acción (a diferencia de `.mazo-contenido__item`).
   - `modal__footer`: único botón `.btn-cancel` "Cerrar" que hace `overlay.remove()`.
4. **`src/styles/main.css` — reglas nuevas para los dos bloques BEM introducidos.** Añadir cerca de las reglas de `.context-menu__info-*` (o de `.mazo-contenido__*`, agrupado con el resto de bloques de "modales secundarios de solo lectura"):
   ```css
   .component-copies-summary {
     margin-top: 1rem;
     padding-top: 0.75rem;
     border-top: 1px solid var(--border-neutral);
   }

   .component-copies-summary__row {
     display: flex;
     align-items: center;
     justify-content: space-between;
     padding: 0.25rem 0 0.75rem;
     font-size: 0.8125rem;
     color: var(--text-muted);
     gap: 1rem;
   }

   .component-copies-summary__label {
     font-weight: 500;
   }

   .component-copies-summary__value {
     color: var(--text-primary);
   }

   .component-copies-summary__button {
     width: 100%;
   }

   .component-copies-modal__list {
     list-style: none;
     margin: 0;
     padding: 0.5rem 0;
   }

   .component-copies-modal__list-item {
     padding: 0.5rem 1rem;
     font-size: 0.8125rem;
     color: var(--text-primary);
     border-bottom: 1px solid var(--border-neutral);
   }

   .component-copies-modal__list-item:last-child {
     border-bottom: none;
   }

   .component-copies-modal__id {
     font-family: ui-monospace, monospace;
   }
   ```
   `.component-copies-summary__label`/`__value` siguen el mismo criterio visual que `.context-menu__info-label`/`__value` (fila label/valor de solo lectura) sin reutilizar literalmente esas clases, porque viven fuera de `.context-menu` (regla de nomenclatura BEM: bloque distinto, mismo lenguaje visual). `.component-copies-modal__list-item` sigue el mismo criterio que `.mazo-contenido__item` (fila con `border-bottom`) simplificado, sin miniatura ni botón.

Orden de implementación: 1-2-3-4 (la fila en `componentModal.js` referencia la función nueva antes de que exista si se hiciera al revés).

## (d) Cambios en estilo

`design/docs/style/03-modales-menus.md`:
- Añadir un nuevo apartado (numerado tras el §12.6 "Secciones dentro de pestañas de propiedades", como sub-sección o punto nuevo del mismo estilo que el resto del fichero) documentando el patrón "número + botón que abre modal aparte" para listas potencialmente largas dentro de una sección de la modal de propiedades — mismo criterio que el ya usado por "Ver contenido del mazo", generalizado ahora a un segundo caso (copias vinculadas). Referenciar `.component-copies-summary`/`.component-copies-modal__list` como segundo uso del patrón junto a `mazoContentModal.js`.
- Añadir la entrada correspondiente en `design/docs/style/03-modales-menus.md` §12.4 solo si la nueva modal necesitara un ancho no estándar — no es el caso aquí (`.modal` por defecto, `max-width: 500px`, es suficiente para una lista de ids), así que no hace falta tocar esa tabla.

## (e) Verificación

1. Abrir la modal de propiedades de un componente Original sin ninguna copia vinculada: la sección "General" se ve exactamente igual que hoy (sin fila de "Copias vinculadas" ni botón nuevo).
2. Crear una o varias Copias de un componente y volver a abrir la modal de propiedades del Original: aparece la fila "Copias vinculadas" con el número correcto al final de la sección "General", seguida del botón "Ver copias vinculadas...".
3. Pulsar "Ver copias vinculadas...": se abre una modal nueva con cabecera "Copias vinculadas", un texto con el identificador del original y el número de copias, y la lista con el id exacto de cada copia (uno por fila, sin elementos interactivos).
4. Cerrar esa modal con el botón "Cerrar" y también haciendo click fuera de ella: ambas cierran correctamente y dejan visible la modal de propiedades original debajo, sin haber alterado ningún dato del componente.
5. Eliminar todas las copias de un componente y volver a abrir su modal de propiedades: la fila y el botón ya no aparecen.
6. Abrir la modal reducida de una Copia (no la de propiedades completa): sigue sin mostrar nada relacionado con esta funcionalidad, tal como antes.
