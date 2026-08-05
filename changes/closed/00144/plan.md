- **Fecha creación**: 2026-08-05

## (a) Anotaciones funcionales

Fuera de alcance: no se toca `ui/resizeHandle.js` ni `ui/componentRenderer.js` — el arrastre del tirador en la mesa sigue siendo libre en alto/ancho, tal como se confirmó en `description.md`.

Dudas resueltas durante `ms-new` (ya reflejadas en `description.md`, resumidas aquí para referencia rápida de la solución):
- Convivencia con el desplegable "Proporción" de Carta/Ficha → mecanismos independientes, sin relación entre ellos.
- Componente sin tamaño fijado todavía (`width`/`height` a `null`) → los campos muestran el tamaño real actual; el modelo solo se fija al editar, no solo por abrir la modal.
- Alcance del checkbox "Mantener proporción" → solo los dos campos numéricos de esta sección, no el tirador de la mesa.

## (b) Solución técnica

Todo el cambio vive en `src/ui/componentModal.js` (única modal de configuración, compartida por los 6 tipos de componente — no hace falta tocar `core/component.js` ni el modelo de datos, `width`/`height` ya existen como `number | null`).

1. **Helper de tamaño efectivo (`getEffectiveWidth`/`getEffectiveHeight` o una única `getEffectiveSize(component)`)**, definido a nivel de módulo junto a los demás helpers de tamaño (cerca de `DEFAULT_*`):
   - Si `component.width`/`component.height` no son `null`, devolverlos tal cual.
   - Si son `null` (hoy solo ocurre en la práctica con `type === 'texto'` recién creado, ver `createDefaultComponent` — los otros 5 tipos siempre fijan `width`/`height` al crearse): medir el tamaño natural del texto construyendo una réplica oculta del nodo que pinta `ui/componentRenderer.js` para `'texto'` (líneas ~511-524): `div` con `position: absolute; visibility: hidden; pointer-events: none` (para no afectar layout ni ser visible), mismo `padding: 0.5rem`, `font-size: ${properties.tamañoFuente || 16}px`, `white-space: pre-wrap`, `word-break: break-word`, `textContent = properties.contenido || ''`; se añade a `document.body`, se lee `offsetWidth`/`offsetHeight`, y se elimina inmediatamente. Sin `fuenteResourceId` ni `line-height` propios que replicar (confirmado: `.text-box` en `main.css` no define ninguno, y el tipo `'texto'` no usa fuente custom, a diferencia de los `textBoxes` de carta).
   - Si por algún motivo el tipo no es `'texto'` y aun así `width`/`height` son `null` (no debería ocurrir hoy, pero es una red de seguridad), usar como *fallback* el tamaño por defecto ya existente para ese tipo (`DEFAULT_BOARD_SIZE`, `DEFAULT_DADO_SIZE`, etc., ya definidos en este mismo fichero).
   - Redondear siempre a entero (`Math.round`).

2. **Nueva sección "Tamaño"** en la pestaña "Generales" (`generalContent`), insertada justo después del bloque `idField` (línea ~229) y antes de `moveField` ("Bloqueado", línea ~231):
   - `fieldset.modal__section` con `legend.modal__section-title` = "Tamaño" (patrón de STYLE_BIBLE.md 12.6, variante meramente informativa — sin checkbox de des/activar toda la sección).
   - Dentro, una fila `div` (`display:flex; gap:0.5rem`, patrón de STYLE_BIBLE.md sección 8 "N campos numéricos relacionados") con dos `div.modal__field` (`flex:1`): "Alto" y "Ancho", cada uno con un `<input type="number" min="1" step="1">`.
   - Debajo de la fila, un `div.modal__field.modal__field--checkbox` con el checkbox "Mantener proporción", `checked = true` siempre al construir la modal (estado local a esta apertura, ninguna propiedad de `workingComponent` ni del modelo — se declara como variable JS normal, no se lee/escribe en `workingComponent`).
   - Los inputs de Alto/Ancho **no** se enlazan a `workingComponent.width`/`height` en la inicialización (para no fijar un tamaño automático solo por abrir la modal, ver anotación funcional): su `value` inicial se calcula con `getEffectiveSize(workingComponent)`, sin escribir nada en `workingComponent` todavía.

3. **Listeners de los inputs** (evento `input`, para feedback inmediato mientras se escribe, igual que otros campos numéricos de la app):
   - En el input "Alto": si el valor no es un entero ≥ 1, no hacer nada (se ignora hasta que sea válido, mismo criterio permisivo que el resto de inputs numéricos de esta modal, que no muestran validación inline). Si es válido:
     1. Capturar `prevWidth`/`prevHeight` = `getEffectiveSize(workingComponent)` (antes de aplicar el cambio — así la proporción usada es siempre la vigente en ese instante, encadenando correctamente ediciones sucesivas).
     2. `workingComponent.height = nuevoAlto`.
     3. Si el checkbox "Mantener proporción" está marcado y `prevHeight > 0`: `workingComponent.width = Math.max(1, Math.round(nuevoAlto * prevWidth / prevHeight))`, y reflejar ese valor en el input "Ancho" (`anchoInput.value = ...`).
   - En el input "Ancho": simétrico, fijando `workingComponent.width` y, si aplica, recalculando `workingComponent.height` con la misma fórmula invertida.
   - Este es el único punto donde `workingComponent.width`/`height` se escriben desde esta sección — así "editar el valor fija explícitamente el tamaño" (igual que ya hace hoy el tirador de redimensionado) y aceptar la modal sin tocar estos campos dejar el tamaño exactamente como estaba (incluido `null` si lo era).

4. **Sin cambios en el flujo de guardado**: al pulsar "Aceptar", `workingComponent` ya lleva `width`/`height` actualizados (o intactos si no se tocó la sección), y sigue el mismo camino existente (`updateComponent`/`addComponent` vía `onAccept`) sin ninguna modificación adicional.

Nota de reutilización: no hace falta ningún nuevo campo en `core/component.js` ni migración de datos — `width`/`height` ya son `number | null` para los 6 tipos.
