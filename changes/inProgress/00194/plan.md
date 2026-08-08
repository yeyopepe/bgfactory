- **Fecha creación**: 2026-08-08

## (a) Anotaciones funcionales

**Fuera de alcance:** la modal de solo lectura "Ver copias vinculadas..." (`ui/componentCopiesModal.js`) no incorpora ninguna acción de conversión por fila — se mantiene tal cual, sin cambios.

**Dudas resueltas con el usuario:**
- P: Si la copia que se convierte está guardada dentro de un mazo (referenciada por id en `properties.cartaIds`), ¿qué pasa con esa referencia al cambiarle el id?
  R: Se actualiza automáticamente — el `cartaIds` del mazo sustituye el id antiguo por el nuevo en el mismo momento de la conversión, la carta sigue dentro del mazo en la misma posición de la pila. No se saca del mazo ni se revela en la mesa.

## (b) Solución técnica

1. **`src/core/component.js` — nueva función pura `convertCopyToOriginal(copy, components)`.** Análoga a `cloneComponent`/`createCopy` (mismo fichero, líneas ~56-130): construye el objeto resultante de romper el vínculo de una copia con su original, reutilizando `nextCloneId` (ya existente) para el nuevo id.
   ```js
   // Copia convertida en elemento independiente: mismo mecanismo de id que
   // cloneComponent (comparte familia/numeración `(n)` con los clones del
   // original), pero conservando tal cual el resto de campos de la copia —
   // no hay reseteo ni recálculo de propiedades, solo se rompe el vínculo.
   export function convertCopyToOriginal(copy, components) {
     return {
       ...copy,
       id: nextCloneId(copy.copyOf, components),
       copyOf: null,
     };
   }
   ```
   Importante: el `baseComponentId` que recibe `nextCloneId` es `copy.copyOf` (id del original), no `copy.id` (formato `-COPY-XXX`, incompatible con la regexp de `nextCloneId`) — ver nota ya existente en `description.md`/Apuntes técnicos.

2. **`src/core/state.js` — nueva función orquestadora `applyCopyToOriginalConversion(copyId)`.** Sigue el mismo patrón que `sacarCartaDeMazo` (mismo fichero, líneas ~126-135): combina la función pura de `core/component.js` con `replaceComponent` para aplicar el cambio al estado central, incluyendo el arreglo de la referencia del mazo (duda resuelta en (a)).
   ```js
   import { convertCopyToOriginal as buildConvertedOriginal } from './component.js';
   // (añadir al import ya existente de './component.js' en la cabecera del fichero)

   // Convierte la copia `copyId` en un elemento original independiente (nuevo
   // id, `copyOf: null`). Si algún mazo la referenciaba por id en
   // `properties.cartaIds`, esa referencia se actualiza al nuevo id en el
   // mismo momento (la carta sigue dentro del mazo, misma posición de pila).
   export function convertCopyToOriginal(copyId) {
     const copy = state.components.find((c) => c.id === copyId);
     if (!copy || !copy.copyOf) return;
     const converted = buildConvertedOriginal(copy, state.components);
     const oldId = copy.id;
     const newId = converted.id;
     for (const mazo of state.components.filter((c) => c.type === 'mazo' && c.properties?.cartaIds?.includes(oldId))) {
       replaceComponent(mazo.id, updateComponent(mazo, {
         properties: { cartaIds: mazo.properties.cartaIds.map((id) => (id === oldId ? newId : id)) },
       }));
     }
     replaceComponent(oldId, converted);
   }
   ```
   Nombre exportado igual en ambos ficheros a propósito (mismo patrón que otros pares núcleo/orquestación de este proyecto) — se importa con alias (`buildConvertedOriginal`) dentro de `state.js` para evitar colisión local; los consumidores externos (paso 3, 4, 5) importan `convertCopyToOriginal` desde `core/state.js`, nunca desde `core/component.js` directamente.

3. **`src/ui/componentModal.js` — botón "Convertir copias en originales" en la pestaña "Copias".** El bloque que puebla hoy esa pestaña (líneas ~731-814) se ejecuta una sola vez al abrir la modal; como esta acción cambia el número de copias (de N a 0), la pestaña necesita poder re-renderizarse tras la conversión — igual que ya hace `renderSpecificTab()` (línea ~816, invocada al final en la línea ~1806) para la pestaña "Específicas".
   - Envuelve el contenido de ese bloque en una función `renderCopiasTab()` (limpiando `copiasContent.innerHTML = ''` al principio, igual que `renderSpecificTab`), y llámala una vez junto a `renderSpecificTab()` al final del fichero.
   - Añade el nuevo botón entre "Sincronizar todas las copias" y el `fieldset` "Desincronizar todas las copias" (mismo orden que `design_pestana-copias-original.html`), reutilizando la clase `btn-eliminar` (acción destructiva/irreversible, mismo lenguaje visual que "Eliminar" en el pie de esta y otras modales) y ancho completo como `syncAllBtn`:
     ```js
     const convertAllBtn = document.createElement('button');
     convertAllBtn.className = 'btn-eliminar';
     convertAllBtn.type = 'button';
     convertAllBtn.textContent = 'Convertir copias en originales';
     convertAllBtn.style.width = '100%';
     convertAllBtn.addEventListener('click', () => {
       const copies = getComponents().filter((c) => c.copyOf === workingComponent.id);
       if (confirm(`¿Convertir las ${copies.length} copias de "${workingComponent.id}" en elementos originales independientes? Esta acción no se puede deshacer.`)) {
         for (const copy of copies) convertCopyToOriginal(copy.id);
         showToast('Copias convertidas');
         renderCopiasTab();
       }
     });
     copiasContent.appendChild(convertAllBtn);
     ```
   - Importa `convertCopyToOriginal` desde `../core/state.js` (añadir al import ya existente de ese módulo en la cabecera del fichero).
   - Nota de iteración: recorre el array `copies` calculado **antes** de empezar a convertir (snapshot, igual que hace ya el bucle de "Sincronizar todas las copias") — cada llamada a `convertCopyToOriginal` dentro del bucle consulta el estado ya actualizado por las conversiones previas (vía `getComponents()`/`nextCloneId` internos), así que los nuevos ids del mismo lote nunca colisionan entre sí sin lógica adicional.

4. **`src/ui/copyComponentModal.js` — sección "Convertir en original".** Añade una nueva sección al final del `content`, justo antes del bloque `originalField`... en realidad después de él (mismo orden que `design_modal-copia-convertir.html`: tras el campo "Elemento original"), con el texto de ayuda y el botón:
   ```js
   const convertSection = document.createElement('div');
   convertSection.className = 'convert-section';
   const convertHint = document.createElement('p');
   convertHint.className = 'convert-section__hint';
   convertHint.textContent = 'Convierte esta copia en un elemento independiente, con id propio, que deja de sincronizarse con el original.';
   convertSection.appendChild(convertHint);
   const convertBtn = document.createElement('button');
   convertBtn.className = 'btn-eliminar';
   convertBtn.type = 'button';
   convertBtn.textContent = 'Convertir en original';
   convertBtn.addEventListener('click', () => {
     if (confirm(`¿Convertir "${component.id}" en un elemento original independiente? Esta acción no se puede deshacer.`)) {
       if (onConvert) onConvert(component);
       overlay.remove();
     }
   });
   convertSection.appendChild(convertBtn);
   content.appendChild(convertSection);
   ```
   - Añade `onConvert` a la firma de `openCopyComponentModal({ component, onAccept, onDelete, onConvert })` (parámetro nuevo, opcional por coherencia con `onDelete`).
   - La modal se cierra al convertir (`overlay.remove()`), igual que hace hoy tras "Eliminar" — una vez convertido, este componente ya no es una copia y esta modal reducida deja de tener sentido para él.
   - No añade estilos CSS nuevos: reutiliza `.btn-eliminar`/`.modal__hint`/`fieldset` ya presentes en la hoja de estilos del proyecto (`.convert-section`/`.convert-section__hint` de la maqueta son solo separación visual — puede resolverse con un `<hr>`/margen existente o una clase equivalente ya presente en el proyecto; comprobar en `styleBibleDocDir` antes de introducir clases CSS nuevas, ver (d)).

5. **`src/modes/edit/editMode.js` — conectar `onConvert`.** En `openEditModalFor` (líneas ~386-398), añade al objeto pasado a `openCopyComponentModal`:
   ```js
   onConvert: (component) => {
     convertCopyToOriginal(component.id);
   },
   ```
   Importa `convertCopyToOriginal` desde `../../core/state.js` (añadir al import ya existente de ese módulo). No hace falta tocar `selectedComponentIds`: el proyecto ya tiene el mismo comportamiento hoy cuando el id de un componente cambia por otra vía (edición manual del campo "ID del componente" en `ui/componentModal.js`) — la selección no se actualiza a propósito, no es una regresión introducida por este cambio.

Ordena la implementación tal como está numerada arriba: 1 y 2 son la base (`core/*`) que 3, 4 y 5 consumen.

## (c) Cambios de arquitectura

- **`design/docs/architecture/01-component-model.md`**:
  - Sección "Copias vinculadas (`copyOf`)" (línea ~72 en adelante): añadir un punto nuevo documentando que `copyOf` ya no es irreversible — `core/component.js` → `convertCopyToOriginal(copy, components)` y `core/state.js` → `convertCopyToOriginal(copyId)` rompen el vínculo, reutilizando `nextCloneId` con `copy.copyOf` como base (comparte familia de numeración `(n)` con los clones del original) y actualizando `properties.cartaIds` de cualquier mazo que referenciara la copia por su id antiguo.
  - Línea ~84 (descripción de `ui/copyComponentModal.js`): añadir la nueva sección/botón "Convertir en original" a la enumeración de controles de esa modal.
  - Aprovechar esta actualización para corregir también la incongruencia ya detectada por `ms-new` (Apuntes técnicos de `description.md`): documentar la pestaña "Copias" de `ui/componentModal.js` (hoy solo se mencionan "Generales"/"Específicas" en `05-ui-layer.md`, ver debajo) — resumen "Copias: N", "Ver copias vinculadas...", "Sincronizar todas las copias", "Desincronizar todas las copias", y el nuevo botón "Convertir copias en originales" de esta implementación.
- **`design/docs/architecture/05-ui-layer.md`**: entrada de `ui/componentModal.js` (línea ~30): corregir "dos tabs (\"Generales\" y \"Específicas\")" a las tres reales ("Generales", "Específicas", "Copias" — esta última solo visible/poblada con copias vinculadas), y mencionar el nuevo botón "Convertir copias en originales".

## (d) Cambios en estilo

Ningún elemento visual nuevo: reutiliza clases ya existentes en el proyecto (`.btn-eliminar`, `.modal__hint`, `.modal__section`/`fieldset`). Si al implementar el paso 4 no existe ya una clase de separación equivalente a `.convert-section` de la maqueta, resolverlo con las utilidades/márgenes ya establecidos en `styleBibleDocDir` en vez de introducir una clase nueva — no se prevé que haga falta actualizar la biblia de estilo.

## (e) Verificación

1. En la pestaña "Copias" de un componente Original con copias vinculadas, el botón "Convertir copias en originales" aparece entre "Sincronizar todas las copias" y "Desincronizar todas las copias".
2. Al pulsarlo, aparece un `confirm()` indicando el número exacto de copias y que la acción es permanente; al cancelar, no cambia nada.
3. Al confirmar, todas las copias de ese original desaparecen de golpe de su pestaña "Copias" (que pasa a mostrar "Este objeto no tiene copias.") sin cerrar la modal, y del listado "Ver copias vinculadas...".
4. Cada copia convertida en masa recibe un id `original(n)` distinto, sin colisiones entre sí ni con clones ya existentes del mismo original.
5. Tras la conversión masiva, cada elemento resultante aparece en el panel de Componentes con todas las acciones normales (Editar/Clonar/Copiar/Eliminar).
6. Al editar un componente que es una Copia, la modal reducida muestra la nueva sección "Convertir en original" tras el campo "Elemento original", con su botón.
7. Al pulsar "Convertir en original" y confirmar, la modal se cierra, el componente pasa a comportarse como uno normal (acciones completas en el panel de Componentes) y conserva todos los valores que tenía justo antes de convertirse (incluidos los propios de "Bloqueado"/"Oculto" si estaba desincronizada).
8. Cancelar cualquiera de los dos `confirm()` no produce ningún cambio de estado.
9. Si una copia de tipo `'carta'` está dentro de un mazo (`properties.cartaIds` del mazo la referencia) en el momento de convertirla (individual o en masa), sigue apareciendo en la misma posición de la pila del mazo tras la conversión, ahora bajo su nuevo id — sin sacarla del mazo ni revelarla en la mesa.
10. La incongruencia de documentación señalada por `ms-new` (pestaña "Copias" ausente en `05-ui-layer.md`/`01-component-model.md`) queda corregida en la actualización de documentación de este cambio.
