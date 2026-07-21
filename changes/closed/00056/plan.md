## (a) Anotaciones funcionales

Fuera de alcance: no se toca `ui/cardEditorModal.js` más allá de lo estrictamente necesario — su desplegable de proporción ya recalcula correctamente el tamaño del lienzo de previsualización (`getDesignSize`) para las dos caras dentro del propio editor; el bug está únicamente en que ese cambio de proporción no se traslada al `width`/`height` real del componente cuando se aplica el resultado. Tampoco se toca el comportamiento de redimensionado manual (`ui/resizeHandle.js`), que ya funciona correctamente y sirve de referencia para la fórmula a aplicar aquí.

Sin dudas de alcance pendientes de resolver con el usuario.

## (b) Solución técnica

1. **`src/ui/componentModal.js`, listener de `proporcionSelect` (línea ~986)**: al cambiar de proporción, además de `props.proporcion = proporcionSelect.value`, recalcular el tamaño real del componente manteniendo el ancho actual:
   ```js
   proporcionSelect.addEventListener('change', () => {
     props.proporcion = proporcionSelect.value;
     const width = workingComponent.width || DEFAULT_CARTA_WIDTH;
     workingComponent.width = width;
     workingComponent.height = width / getProporcionRatio(props.proporcion);
   });
   ```
   `getProporcionRatio` y `DEFAULT_CARTA_WIDTH` ya están disponibles en el fichero (import existente y constante en línea 21).

2. **`src/ui/componentModal.js`, `onAccept` de `openCardEditorModal` (línea ~1074, botón "Editar diseño de la carta")**: aplicar el mismo recálculo cuando la proporción cambia desde el editor de diseño, ya que ese flujo también puede dejar `props.proporcion` distinto del que tenía el componente al abrir el editor:
   ```js
   onAccept: ({ proporcion, caraFrontal, caraTrasera }) => {
     props.proporcion = proporcion;
     props.caraFrontal = caraFrontal;
     props.caraTrasera = caraTrasera;
     proporcionSelect.value = proporcion;
     const width = workingComponent.width || DEFAULT_CARTA_WIDTH;
     workingComponent.width = width;
     workingComponent.height = width / getProporcionRatio(proporcion);
   },
   ```

3. Verificar manualmente (o razonando sobre el código) que `workingComponent` es el mismo objeto que se aplica al aceptar la modal completa (`onAccept(workingComponent, isNew)`, línea ~1116) y que la mesa (`ui/componentRenderer.js`) ya redibuja el componente con su `width`/`height` reales sin cambios adicionales — no hace falta tocar el renderer, ya lee `component.width`/`component.height` directamente.

No se modifica `getProporcionRatio`, `CARD_PROPORTIONS` ni ningún otro punto de `core/cardProportions.js`: el fix es puramente de aplicar el ratio ya existente en el momento en que cambia la selección, replicando la misma fórmula que ya usa el clamp de `ui/resizeHandle.js` para el redimensionado manual.

## (d) Cambios en estilo

No aplica: no se introduce ni modifica ninguna convención visual, solo se corrige un cálculo que faltaba.
