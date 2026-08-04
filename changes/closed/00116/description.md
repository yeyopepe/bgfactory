- **Nombre**: El bloque informativo de clicks del menú contextual no refleja interacciones desactivadas
- **Código**: 00116
- **Tipo**: fix

## Prompt original del usuario

En el modo de juego no se actualiza la información del menú contextual cuando se cambian las interacciones

## Descripción completa

En Modo Juego, el menú contextual de un componente (click derecho) incluye un bloque informativo con tres líneas fijas por tipo de componente: "Clic izquierdo: `<acción>`", "Doble clic izquierdo: `<acción o 'Ninguno'>`" y "Clic derecho: Abrir este menú". Para "Dado" la línea de "Clic izquierdo" dice "Lanzar el dado", para "Carta/Ficha" dice "Voltear la carta", para "Mazo" dice "Sacar la carta de arriba"; para "Cuadro de texto", "Tablero" y "Visor de documentos" dice "Ninguno". Este bloque es anterior al cambio 00115 ("Interacciones programadas").

El cambio 00115 añadió, en Modo Edición, la posibilidad de desactivar esa misma interacción de click eligiendo "Ninguna" en un combo de la pestaña "Generales". Al desactivarla, el click izquierdo sobre el componente en Modo Juego efectivamente deja de disparar la acción (eso ya funciona bien), pero el bloque informativo del menú contextual sigue mostrando el texto fijo de la interacción (p. ej. "Clic izquierdo: Lanzar el dado") en vez de reflejar que está desactivada — no se tuvo en cuenta al implementar el cambio 00115.

**Comportamiento esperado**: la línea "Clic izquierdo" debe mostrar "Ninguno" cuando esa interacción está desactivada para ese componente concreto (igual que ya muestran "Ninguno" los tipos que nunca tuvieron esa interacción), y debe seguir mostrando el texto de la acción cuando está activa (comportamiento actual, sin cambios). Las demás líneas ("Doble clic izquierdo", "Clic derecho") no se ven afectadas por este fix.

**Cómo reproducirlo**:
1. En Modo Edición, editar un componente "Dado" (o "Carta/Ficha" o "Mazo").
2. En la pestaña "Generales" → "Interacciones programadas", cambiar el combo a "Ninguna" y aceptar.
3. Cambiar a Modo Juego y hacer click derecho sobre ese componente.
4. El menú contextual sigue mostrando la línea de "Clic izquierdo" con el texto de la acción (p. ej. "Lanzar el dado"), en vez de "Ninguno".

**Preguntas de alcance resueltas con el usuario**:
- *¿Qué parte exacta del menú no se actualiza?* El bloque informativo "Clic izquierdo / Doble clic izquierdo / Clic derecho", no la línea de descripción "Tipo: id" ni el dato extra (nº de caras/tamaño/nº de cartas), que no tienen relación con esto.
- *¿Cómo se reproduce?* Cambiando la interacción a "Ninguna" en Modo Edición y comprobando el menú contextual en Modo Juego.

## Apuntes técnicos

- El bloque estático vive en `src/modes/play/playMode.js`, constante `interactionsByType` (mapa `type` → array de `{ label, value }` para "Clic izquierdo"/"Doble clic izquierdo"/"Clic derecho"), pasado tal cual como `interactionItems` a `openContextMenu` (`src/ui/contextMenu.js`) dentro del callback `onContextMenu`.
- No se detectó durante el análisis original del cambio 00115 (`ms-internal-tech-analysis` no exploró `playMode.js` en profundidad en aquel momento); es la causa raíz de este fix.
- El cambio 00115 ya expone `core/interactions.js` (`getInteractionsForType`, `isInteractionActive`) con el mismo mapeo de `type` → interacciones de click, que debería ser la fuente para decidir si la línea de "Clic izquierdo" muestra el nombre de la interacción o "Ninguno", en vez de (o combinado con) la tabla estática `interactionsByType`.
