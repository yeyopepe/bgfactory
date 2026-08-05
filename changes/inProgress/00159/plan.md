**Fecha creación**: 2026-08-05

## (a) Anotaciones funcionales

- **Fuera de alcance**: no se toca el redimensionado interactivo con el manejador de esquina (`ui/resizeHandle.js`, `clamp`) ni el patrón equivalente de `'mazo'` (`formaSelect`, líneas ~1543-1550 de `componentModal.js`, que iguala ancho/alto al pasar a forma circular) — ninguno de los dos está implicado en el bug reportado ni en la reproducción confirmada por el usuario.
- **No se toca la sincronización visual de los campos "Ancho (px)"/"Alto (px)"** con el alto recalculado al cambiar de proporción (desde el `<select>` "Proporción" o al pegar estilo): ese desajuste entre el valor mostrado en el input y `workingComponent.height` ya existía antes de este fix y no forma parte del bug reportado (que es sobre el tamaño final de la carta, no sobre qué muestran esos inputs mientras la modal sigue abierta).
- **Duda resuelta con el usuario**: se confirmó por chat que el bug se dispara específicamente al abrir el editor visual de la carta y aceptar — no al aceptar las propiedades directamente sin pasar por el editor. Esto acota la causa raíz real al callback `onAccept` de `openVisualEditorModal` en `componentModal.js`.
- **Segunda precisión del usuario, tras más pruebas**: el problema ocurre únicamente con la proporción `'libre'` — cualquier carta con esa proporción empieza a sufrirlo, en cualquier momento en que se acepte el editor (no hace falta que la proporción "acabe de cambiar" a libre, basta con que la carta ya esté en `'libre'`). Con proporciones fijas no se ha detectado el problema. Por tanto el fix se acota estrictamente a que la proporción `'libre'` nunca dispare un recálculo de alto — **no** se introduce ninguna comprobación de "si la proporción ha cambiado" para las proporciones fijas, para no tocar un comportamiento que no está roto y que no ha sido reportado (ampliaría el alcance más allá de la causa raíz confirmada).

## (b) Solución técnica

Los tres puntos de `src/ui/componentModal.js` (dentro de `renderCartaSpecificFields`) que recalculan `workingComponent.height = width / getProporcionRatio(proporcion)` lo hacen incondicionalmente, sin comprobar si la proporción resultante es `'libre'` — la única que, por definición, no tiene ningún ratio que imponer sobre el alto. Se corrige cada uno para que el recálculo se salte por completo cuando la proporción (la que queda tras la acción, ya sea porque se acaba de elegir o porque la carta ya la tenía) es `'libre'`. Las proporciones fijas no cambian de comportamiento.

1. **Listener `change` del `<select>` "Proporción"** (~línea 1382-1387):
   ```js
   proporcionSelect.addEventListener('change', () => {
     props.proporcion = proporcionSelect.value;
     if (props.proporcion !== 'libre') {
       const width = workingComponent.width || DEFAULT_CARTA_WIDTH;
       workingComponent.width = width;
       workingComponent.height = width / getProporcionRatio(props.proporcion);
     }
   });
   ```

2. **`onAccept` del editor visual ("Editar diseño de la carta")** (~línea 1399-1420) — **causa raíz confirmada por el usuario**: este callback se ejecuta siempre que se acepta el editor, incluso si la proporción ya era `'libre'` antes de abrirlo y sigue siéndolo (no hace falta que "cambie" a libre, basta con que la carta esté en libre en el momento de aceptar):
   ```js
   onAccept: ({ proporcion, esquinasRedondeadas, caraFrontal, caraTrasera }) => {
     props.proporcion = proporcion;
     props.esquinasRedondeadas = esquinasRedondeadas;
     props.caraFrontal = caraFrontal;
     props.caraTrasera = caraTrasera;
     proporcionSelect.value = proporcion;
     if (proporcion !== 'libre') {
       const width = workingComponent.width || DEFAULT_CARTA_WIDTH;
       workingComponent.width = width;
       workingComponent.height = width / getProporcionRatio(proporcion);
     }
   },
   ```

3. **Botón "Pegar estilo"** (~línea 1497-1504), misma causa raíz que el punto 2:
   ```js
   if (clip.proporcion) {
     props.proporcion = clip.proporcion;
     props.esquinasRedondeadas = clip.esquinasRedondeadas ?? true;
     proporcionSelect.value = clip.proporcion;
     if (clip.proporcion !== 'libre') {
       const width = workingComponent.width || DEFAULT_CARTA_WIDTH;
       workingComponent.width = width;
       workingComponent.height = width / getProporcionRatio(clip.proporcion);
     }
   }
   ```

No se toca `src/core/cardProportions.js`: el `ratio: 5/7` de `'libre'` puede seguir existiendo tal cual como valor de repuesto (lo sigue usando `visualEditorModal.js` internamente para calcular `designHeight` al abrir el editor si `component.height` fuera `null`), ya que con la corrección de los tres puntos de arriba deja de usarse para pisar un alto ya fijado por el usuario.

## Verificación

Reproducir exactamente los pasos del bug tras el fix:
1. Proporción "Libre", Ancho 180 / Alto 360 → abrir editor, cambiar algo, aceptar → el tamaño final debe seguir siendo 180×360.
2. Repetir el punto 1 una segunda vez sobre la misma carta (ya en "Libre", ya con un alto/ancho fijados) → abrir editor de nuevo, cambiar algo, aceptar → el tamaño debe seguir respetándose (no solo la primera vez).
3. Elegir una proporción fija (p. ej. "Cuadrada (1:1)") desde el `<select>` de propiedades → el alto se ajusta a esa proporción (comportamiento ya existente, se preserva).
4. Con esa proporción fija ya aplicada, abrir el editor sin tocar la proporción dentro de él y aceptar → el alto se sigue recalculando desde la proporción fija (comportamiento ya existente para proporciones no libres, no reportado como roto, se preserva tal cual).
