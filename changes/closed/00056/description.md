- **Nombre**: Cambiar la proporción de una carta no redimensiona la carta
- **Código**: 00056
- **Tipo**: fix

## Prompt original del usuario

Ningun formato funciona, no cambia la carta a las proporciones indicadas

## Descripción completa

Al elegir un formato distinto en el desplegable "Proporción" de una carta (tanto desde la modal de configuración del componente como desde el editor de diseño de la carta), el valor se guarda pero la carta no cambia de forma en la mesa: se queda con el tamaño y proporción que tenía antes. Solo se ve reflejado el nuevo formato si el usuario, además, redimensiona la carta a mano arrastrando la esquina inferior derecha.

Se espera que, en el momento en que se elige un formato distinto, la carta cambie de forma inmediatamente para reflejarlo — sin necesidad de redimensionarla a mano — manteniendo el ancho que ya tuviera y ajustando el alto a la nueva proporción (mismo criterio que ya se aplica cuando se redimensiona manualmente: el ancho o alto que el usuario mueve manda, y el otro se recalcula para respetar la proporción elegida).

## Apuntes técnicos

- `src/ui/componentModal.js` línea ~986: el listener `proporcionSelect.addEventListener('change', ...)` solo hace `props.proporcion = proporcionSelect.value;`, sin tocar `workingComponent.width`/`workingComponent.height`.
- `src/ui/componentModal.js` línea ~1074: el `onAccept` de `openCardEditorModal` (botón "Editar diseño de la carta") aplica `proporcion`/`caraFrontal`/`caraTrasera` a `props`, pero tampoco recalcula `workingComponent.width`/`height`.
- Ambos puntos deberían usar `getProporcionRatio` (ya importado en `componentModal.js` desde `core/cardProportions.js`) para recalcular `height = width / ratio`, manteniendo el `width` actual (o `DEFAULT_CARTA_WIDTH` si el componente todavía no tiene uno fijado).
- `src/ui/cardEditorModal.js` solo cambia el tamaño del lienzo de previsualización (`getDesignSize`) al cambiar de proporción — no toca el componente real, por lo que no necesitaría cambios si el fix se aplica en el punto donde se aplica el resultado final (`componentModal.js`).
