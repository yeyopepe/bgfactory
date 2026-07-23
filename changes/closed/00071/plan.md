- **Nombre**: Proporción circular para el componente "carta"
- **Código**: 00071

## (a) Anotaciones funcionales

- Fuera de alcance: nada distinto de lo ya acotado en `description.md` (no se toca ninguna otra proporción existente, ni mazos/volteo/bloqueado/"subir al mover"/otros tipos de componente).
- No hubo dudas nuevas que resolver con el usuario durante la planificación — las tres dudas de alcance ya están resueltas en `description.md`.

## (b) Solución técnica

1. **`src/core/cardProportions.js`**: añadir una entrada `{ value: 'circular', label: 'Circular', ratio: 1 }` a `CARD_PROPORTIONS`. Con `ratio: 1`, `getDesignSize('circular')` da un lienzo cuadrado (300×300) — correcto, ya que el recorte redondo se aplica visualmente (border-radius), no cambiando el ratio del lienzo de diseño. No hace falta tocar `getProporcionRatio` ni `getDesignSize`: ya funcionan por catálogo.

2. **`src/ui/componentRenderer.js`** (rama `component.type === 'carta'`):
   - Adelantar la lectura de `const props = component.properties || {};` antes de crear el elemento `carta` (hoy se lee más abajo, en la línea 984), para poder decidir el `border-radius` correcto desde el principio.
   - `carta.style.borderRadius` (hoy fijo `'8px'`, línea 968) y `cartaContent.style.borderRadius` (hoy fijo `'8px'`, línea 978): condicionar a `props.proporcion === 'circular' ? '50%' : '8px'`. Esto cubre tanto modo juego como modo edición, ya que `componentRenderer.js` es compartido por ambos modos.
   - `attachResizeHandle` de la carta (líneas 1081-1098): el `clamp` actual siempre fuerza `ratio = getProporcionRatio(props.proporcion)`. Cuando `props.proporcion === 'circular'`, sustituir por un clamp de resize libre — mismo patrón que usa `'ficha'` (líneas 942-945): `{ width: Math.max(width, MIN_CARTA_WIDTH), height: Math.max(height, MIN_CARTA_HEIGHT) }`, sin forzar ningún ratio. No hace falta tocar `attachResizeHandle`/`resizeHandle.js`: el forzado de 1:1 con Shift ya es genérico para `axis: 'both'` (líneas 26-31 de `resizeHandle.js`, calcula `delta` igual en ambos ejes cuando `e.shiftKey`), independiente de lo que haga el `clamp` después.

3. **`src/ui/componentModal.js`**: no requiere cambios de lógica — el `<select>` de proporción (líneas 1006-1026) ya itera `CARD_PROPORTIONS` genéricamente y ya recalcula `workingComponent.height = width / getProporcionRatio(props.proporcion)` al cambiar de proporción (línea 1022), lo que para `'circular'` (ratio 1) da automáticamente un círculo perfecto (ancho = alto) al crearse/cambiar a esta proporción, tal como pide `description.md`.

4. **`src/ui/cardEditorModal.js`**:
   - `canvas.style.borderRadius` (hoy fijo `'8px'`, línea 158, dentro de `renderFace`): condicionar a `working.proporcion === 'circular' ? '50%' : '8px'`, igual que en `componentRenderer.js`. Como `renderFace` ya se vuelve a invocar en cada `renderFaces()` (incluida la llamada tras cambiar `proporcionSelect`, línea 66-69), el lienzo de cada cara refleja el recorte circular en cuanto se elige esa proporción.
   - `openAdjustSession()`: las dos entradas `faces` (líneas 114 y 123) pasan hoy `shape: 'cuadrada'` fijo. Cambiar a `shape: working.proporcion === 'circular' ? 'circular' : 'cuadrada'`, para que `openImageAdjustModal` (`src/ui/imageAdjustModal.js`, que ya soporta `shape: 'circular'` con `border-radius: 50%` en su máscara de previsualización — precedente de `'ficha'`, sin cambios necesarios ahí) recorte también en redondo la vista previa de ajuste de imagen de cada cara cuando la carta es circular.

No hace falta tocar `src/ui/imageAdjustModal.js`: ya es agnóstico del tipo de componente y ya soporta la forma `'circular'` genéricamente (usado hoy por `'ficha'`).

## (c) Cambios de arquitectura

En `design/docs/ARCHITECTURE.md`, sección 4 ("Tipos de componente implementados"), entrada `'carta'`:

- Corregir la incongruencia ya detectada (código manda): la frase "Al redimensionar en la mesa siempre se mantiene la proporción configurada... la única forma de cambiar la proporción es editando esa propiedad, no arrastrando el manejador" deja de ser cierta para todas las proporciones — añadir la excepción: cuando `proporcion === 'circular'`, el redimensionado en la mesa es libre en ambos ejes (como `'ficha'`/`'tablero'`/`'documento'`), con Shift forzando 1:1 durante el arrastre, y nace con ancho = alto al crearse/cambiar a esta proporción.
- Actualizar el listado de valores de `proporcion` (catálogo de `CARD_PROPORTIONS`) añadiendo `'circular'` (`'Circular'`) a los cinco ya listados.
- Añadir una frase sobre el recorte visual condicional: `border-radius: 8px` (esquinas redondeadas) salvo `proporcion === 'circular'`, que usa `50%` (recorte redondo completo, círculo u óvalo según ancho/alto), aplicado tanto en `ui/componentRenderer.js` (mesa) como en `ui/cardEditorModal.js` (lienzo del editor) y en `ui/imageAdjustModal.js` (máscara de ajuste de imagen de cada cara).

## (d) Cambios en estilo

No aplica: esta solución no introduce ninguna convención de estilo nueva — reutiliza el mismo patrón de recorte circular (`border-radius: 50%`) que ya usa `'ficha'` (`STYLE_BIBLE.md` no tiene ninguna excepción registrada para eso, es el comportamiento CSS estándar ya empleado).

(Fuera del alcance de este plan pero pendiente, según ya apuntó `description.md`: `design/docs/FEATURES.md`, sección "Componente carta", describe un catálogo de proporciones que no coincide con el real desde antes de este cambio. Se corregirá como parte de la actualización de documentación funcional tras implementar — sección 4.1 de `ms-implement` —, listando las 5 proporciones reales más "Circular".)
