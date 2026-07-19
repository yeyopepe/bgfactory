- **Nombre**: Quitar las flechas del campo "Orden"
- **Código**: fast-invertir-flechas-orden-lista_20260719
- **Tipo**: fast
- **Fecha**: 2026-07-19

## Prompt original del usuario

haz que las flechas de la lista de componentes funcionen al revés: la de arriba resta, la de abajo suma

invierte la lógica de las flechas del campo Orden: la de abajo suma 1 y la de arriba resta 1

No funciona bien. Quita las flechas y que el usuario cambie los números él mismo

## Descripción completa

En el panel de "Componentes" del modo edición, el cuadro de texto numérico de la columna "Orden" (cambio 00027) mostraba las flechas de incremento/decremento nativas del `<input type="number">`. Tras varios intentos de invertir su sentido sin buen resultado, se ha optado por eliminarlas directamente: el usuario solo puede escribir el número a mano. El resto del comportamiento del campo no cambia (saneado de solo dígitos, confirmación en `change`, clamp a `[1, n]`, reordenamiento resultante).

## Cambios aplicados

- `src/ui/componentList.js`: se retira del listener `input` del cuadro "Orden" la lógica de inversión de flechas (variable `lastOrderValue` y comparación de delta), dejando solo el saneado de caracteres no numéricos.
- `src/styles/main.css`: en `.component-list__order-input` se añade `appearance: textfield` / `-moz-appearance: textfield` y se ocultan los botones de spinner (`::-webkit-outer-spin-button` / `::-webkit-inner-spin-button` con `-webkit-appearance: none`), quitando las flechas visualmente en todos los navegadores.
