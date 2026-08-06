**Fecha creación**: 2026-08-06

## (a) Anotaciones funcionales

Sin dudas técnicas nuevas que resolver con el usuario en esta fase — el alcance ya quedó cerrado durante `ms-new` (ver "Prompt original del usuario" en `description.md`, incluidas las dos aclaraciones posteriores). Resumen de lo ya decidido, para referencia rápida al implementar:

- El toggle "Sincronizado" afecta única y exclusivamente a `bloqueado`/`oculto`. Ningún otro campo de una copia se ve afectado: siguen sincronizándose siempre al 100%, sin excepción.
- Con "Sincronizado" marcado (por defecto): `bloqueado`/`oculto` de la copia reflejan siempre el valor actual del original, en modo solo lectura.
- Con "Sincronizado" desmarcado: `bloqueado`/`oculto` son propios de esa copia, editables, y no se tocan al cambiar el original.
- Al volver a marcar "Sincronizado": la copia adopta de inmediato `bloqueado`/`oculto` actuales del original.
- En modo juego, el menú contextual de clic derecho de una copia solo muestra "Bloquear"/"Desbloquear" si esa copia tiene `sincronizado: false`. Si `sincronizado: true`, esa entrada no aparece (nada más cambia en el menú). Un componente que no es copia no se ve afectado.
- Fuera de alcance: nada de esto toca el borrado en cascada, el renombrado de id al cambiar el original, ni la prohibición de copias de copias — se mantienen exactamente igual.

## (b) Solución técnica

1. **`src/core/component.js` — nuevo campo `sincronizado`**:
   - Añadir el parámetro `sincronizado = true` a `createComponent(...)` y devolverlo en el objeto creado, junto al resto de campos generales (mismo criterio que `copyOf`: se declara para todos los componentes aunque solo tenga sentido semántico en una copia).
   - En `createCopy(component, components)`, fijar explícitamente `sincronizado: true` en el objeto devuelto (una copia recién creada nace sincronizada, sin depender de que `...component` lo arrastre — el original nunca tiene este campo con significado).
   - Componentes ya guardados de antes de este cambio no tendrán el campo `sincronizado` en absoluto: no hace falta ninguna migración explícita al estilo `normalizeComponentGrupoIds` — basta con que todo el código que lo lea use el criterio "ausente = sincronizado" (`component.sincronizado !== false`), igual que ya hacen otros booleanos con default `true` en el proyecto.

2. **`src/core/component.js` — `syncCopyWithOriginal(copy, original)`**:
   - Añadir `bloqueado`/`oculto` al objeto devuelto, pero solo cuando `copy.sincronizado !== false`: `...(copy.sincronizado !== false ? { bloqueado: original.bloqueado, oculto: original.oculto } : {})`. Si `copy.sincronizado === false`, no se incluyen — el spread inicial `...copy` ya conserva el valor propio de la copia sin tocarlo.
   - Actualizar el comentario de la función (líneas ~135-142): ya no es cierto que `bloqueado`/`oculto` "queden siempre independientes" — ahora depende de `sincronizado`. Mantener la mención a que `x`, `y` y `order` sí siguen siendo siempre independientes (esto no cambia).
   - No hace falta tocar `src/core/state.js` (`replaceComponent`): ya itera sobre todas las copias del original actualizado y llama a `syncCopyWithOriginal(c, updatedComponent)` para cada una — el comportamiento condicional queda encapsulado enteramente en esa función pura.

3. **`src/ui/copyComponentModal.js` — controles nuevos**:
   - Cambiar la firma de `openCopyComponentModal({ component, onDelete })` a `openCopyComponentModal({ component, onAccept, onDelete })`, igual que `openComponentModal` de `componentModal.js`.
   - `workingComponent = { ...component }` (copia de trabajo, igual que hace `componentModal.js` con `isNew ? ... : { ...component }`).
   - Buscar el original actual: `const original = getComponents().find((c) => c.id === component.copyOf)` (import `getComponents` desde `../core/state.js`).
   - Insertar, entre el aviso existente y el campo "Elemento original":
     - Checkbox "Sincronizado" (`modal__field modal__field--checkbox`, mismo marcado que el resto de checkboxes de `componentModal.js`), estado inicial `workingComponent.sincronizado !== false`.
     - Un `fieldset.modal__section` con `legend.modal__section-title` "Bloqueado / Oculto" (sección meramente informativa dentro, no de tipo `--toggle`, porque quien activa/desactiva el grupo es el checkbox "Sincronizado" de fuera, no un checkbox propio de la leyenda — ver sección 12.6 de `STYLE_BIBLE.md`, caso "grupo de campos activable por un control externo" ya cubierto por el propio `.modal__section--disabled` sin exigir que el checkbox viva en la leyenda), conteniendo:
       - El mismo control `select` "Bloqueado" que `componentModal.js` (líneas ~371-396: mismas `BLOQUEADO_OPTIONS`, mismo `createHelpIcon` con el mismo texto de ayuda).
       - El mismo checkbox "Oculto" que `componentModal.js` (líneas ~398-415: mismo `createHelpIcon` con el mismo texto de ayuda).
   - Función `updateSyncedFieldsState()`: si el checkbox "Sincronizado" está marcado, deshabilita `moveSelect`/`hiddenCheckbox`, añade `modal__section--disabled` al fieldset, y fuerza sus valores mostrados a `original.bloqueado`/`original.oculto` (si `original` existe — ver caso límite más abajo); si está desmarcado, los habilita y deja los valores tal cual estén (los que tuviera `workingComponent` o los que el usuario vaya cambiando). Se llama al cargar la modal y en el listener `change` del checkbox "Sincronizado".
   - Caso límite — original no encontrado (no debería ocurrir en uso normal, pero por robustez): si `original` es `undefined` (p.ej. estado inconsistente), tratar como si "Sincronizado" no pudiera forzar valores — deshabilitar igualmente los controles pero dejando los valores actuales de `workingComponent` tal cual, sin lanzar error.
   - Botón "Aceptar": construir el componente final antes de llamar a `onAccept`:
     - `workingComponent.sincronizado = syncCheckbox.checked`.
     - Si `syncCheckbox.checked` y `original` existe: `workingComponent.bloqueado = original.bloqueado; workingComponent.oculto = original.oculto`.
     - Si no, `workingComponent.bloqueado`/`workingComponent.oculto` ya llevan el valor que el usuario haya fijado en los controles (actualizado en sus listeners `change`, igual que `moveSelect`/`hiddenCheckbox` en `componentModal.js`).
     - Llamar a `onAccept(workingComponent)` y cerrar (`overlay.remove()`), mismo patrón que el botón "Aceptar" de `componentModal.js`.
   - El resto de la modal (ID solo lectura, aviso, campo "Elemento original", botón "Eliminar", botón "Cancelar") no cambia.

4. **`src/modes/edit/editMode.js` — `openEditModalFor`**:
   - En la llamada a `openCopyComponentModal({ component, onDelete })` (líneas ~326-334), añadir `onAccept: (updated) => replaceComponent(component.id, updated)`, igual que ya hace la rama de `openComponentModal` justo debajo (línea 339).

5. **`src/modes/play/playMode.js` — menú contextual condicional**:
   - En `onContextMenu` (líneas ~173-249), donde hoy `generalItems` es un array literal con una única entrada (Bloquear/Desbloquear, líneas 239-247), construirlo condicionalmente: `const generalItems = (!component.copyOf || component.sincronizado === false) ? [{ icon: createLockIcon(bloqueado), label: ..., onClick: ... }] : [];`. Un componente que no es copia (`!component.copyOf`) sigue viendo la entrada siempre, igual que hoy. Una copia con `sincronizado !== false` (es decir, sincronizada) no la ve.

## (c) Cambios de arquitectura

Actualizar `design/docs/ARCHITECTURE.md`, sección "Copias vinculadas (`copyOf`)" (líneas ~105-112):

- Añadir a la lista de campos generales del componente (sección de arriba, línea ~74, junto a `copyOf`) el nuevo campo `sincronizado: boolean` (`true` por defecto), documentando que solo tiene efecto en componentes con `copyOf` no nulo.
- En la propia sección de "Copias vinculadas", sustituir la frase que dice que la copia "se sincroniza automáticamente con él mientras ambos existan" (línea 107) para matizar que la sincronización es total **salvo** `bloqueado`/`oculto`, que solo se sincronizan mientras `sincronizado` (nuevo campo, `true` por defecto) sea `true`; si el usuario lo desmarca desde la modal de la copia, `bloqueado`/`oculto` pasan a ser propios de esa copia hasta que se vuelva a marcar.
- Actualizar la descripción de "Modal reducida" (línea 112): ya no es cierto que no tenga "nada editable" — ahora tiene el checkbox "Sincronizado" y, condicionados a él, los controles de "Bloqueado"/"Oculto".
- Añadir una nota sobre el menú contextual de modo juego (`playMode.js`): la entrada "Bloquear"/"Desbloquear" de una copia solo aparece si esa copia tiene `sincronizado: false`.
