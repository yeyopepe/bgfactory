**Fecha creación**: 2026-08-05

## (a) Anotaciones funcionales

Sin dudas técnicas pendientes de resolver con el usuario: el alcance ya quedó cerrado en `description.md` (agrupación puramente visual, sin cambios de comportamiento, opciones ni textos de los cuatro controles). Nada queda fuera de alcance porque el cambio ya es mínimo por sí mismo.

## (b) Solución técnica

Todo el cambio vive en `ui/componentModal.js`, dentro de la construcción de la pestaña `'general'` del modal de propiedades (aprox. líneas 249-459 en el estado actual del fichero).

1. **Crear el fieldset de la nueva sección "General"**, justo después de `generalContent.appendChild(idField)` (línea 267) y antes de la actual construcción de `sizeSection`. Sigue el mismo patrón que ya usan `sizeSection` y `groupSection` en el propio fichero (`STYLE_BIBLE.md` 12.6, tipo "meramente informativo": sin checkbox de activación entera, ya que los campos de dentro siempre están activos):
   ```js
   const infoSection = document.createElement('fieldset');
   infoSection.className = 'modal__section';
   const infoLegend = document.createElement('legend');
   infoLegend.className = 'modal__section-title';
   infoLegend.textContent = 'General';
   infoSection.appendChild(infoLegend);
   ```
2. **Mover dentro de `infoSection` los cuatro bloques de campo ya existentes**, sin tocar su lógica interna (construcción del control, listeners, icono de ayuda): `moveField` (Bloqueado), `hiddenField` (Oculto), `tooltipField` (Mostrar tooltip), `upOnMoveField` (Subir al mover/interactuar). En cada uno de los cuatro, cambiar únicamente el `appendChild` final:
   - Antes: `generalContent.appendChild(moveField)` / `hiddenField` / `tooltipField` / `upOnMoveField`.
   - Después: `infoSection.appendChild(moveField)` / `hiddenField` / `tooltipField` / `upOnMoveField`.
   El orden relativo entre ellos no cambia (Bloqueado → Oculto → Mostrar tooltip → Subir al mover/interactuar), tal como pide la descripción funcional.
3. **Añadir `infoSection` al DOM** con `generalContent.appendChild(infoSection)` inmediatamente después de construir los cuatro campos (en el punto donde hoy termina el bloque de `upOnMoveField`, línea ~438).
4. **Reordenar la sección `sizeSection`** para que se añada a `generalContent` después de `infoSection` en vez de antes: mover la línea `generalContent.appendChild(sizeSection);` (línea 351) a después del punto 3, justo antes de donde hoy empieza la construcción de `groupSection`. La construcción interna de `sizeSection` (fieldset, legend "Tamaño", campos alto/ancho, checkbox "Mantener proporción", listeners) no cambia en absoluto — solo cambia el momento en que se hace su `appendChild` a `generalContent`.
5. **No tocar nada más**: `idField`, `groupSection` y todo lo que viene después de la sección Grupos permanecen exactamente igual, tanto en construcción como en orden de `appendChild`.

Resultado del orden final de `appendChild` sobre `generalContent`: `idField` → `infoSection` (con los 4 campos ya dentro) → `sizeSection` → `groupSection` → resto sin cambios.

No hay cambios de modelo de datos (`workingComponent.bloqueado`/`oculto`/`mostrarTooltip`/`subirAlMoverInteractuar`/`width`/`height` se leen y escriben exactamente igual que hoy), ni de otros ficheros (`componentRenderer.js`, `state.js`, otros modales) — es un reordenamiento puro de construcción de DOM dentro de una única función.

No se han detectado tests automatizados que dependan del orden del DOM de este panel (`src/test` no contiene ningún test de `componentModal.js`), así que no hace falta actualizar ningún test.
