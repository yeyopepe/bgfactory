**Fecha creación**: 2026-08-04

## (a) Anotaciones funcionales

**Fuera de alcance:** cualquier cambio al tipo de componente `'mazo'` (su propio campo `forma: 'rectangular'|'circular'` no se toca) y a cualquier otro tipo de componente.

**Dudas resueltas durante `ms-new` (recogidas de `description.md`), sin nuevas dudas técnicas surgidas al planificar:**
- Geometría: triángulo con vértice arriba / vértice abajo, caja contenedora cuadrada (ratio 1:1) — confirmado con el usuario y validado visualmente en `design_formas_triangulares.html`.
- Redimensionado con ratio fijo (no libre) y sin "esquinas redondeadas" — confirmado.
- Borde y sombra siguiendo el mismo mecanismo que las proporciones hexagonales — confirmado.

**Precisión geométrica sobre "equilátero":** `description.md` habla de "triángulo equilátero", pero la maqueta validada por el usuario (`design_formas_triangulares.html`) dibuja un triángulo isósceles que ocupa el ancho y el alto completos de la caja cuadrada (vértices en `50%,0% / 100%,100% / 0%,100%` para "vértice arriba"), no un triángulo estrictamente equilátero (que dejaría un hueco vertical en una caja 1:1, ya que su altura real es `0.866×base`). La maqueta ya validada es la referencia de aspecto a seguir — se implementa la silueta exacta de la maqueta, no un triángulo equilátero literal.

## (b) Solución técnica

1. **`core/cardProportions.js`** — punto único de datos, ya preparado para ampliarse sin tocar su forma general:
   - Añadir dos entradas a `CARD_PROPORTIONS`: `{ value: 'triangulo', label: 'Triángulo', ratio: 1, shape: 'triangulo' }` y `{ value: 'triangulo-invertido', label: 'Triángulo invertido', ratio: 1, shape: 'triangulo-invertido' }` (mismo patrón que las dos entradas hexagonales).
   - Añadir un diccionario `TRIANGLE_CLIP_PATHS` análogo a `HEX_CLIP_PATHS`, con los mismos polígonos que ya están validados en la maqueta:
     - `'triangulo'`: `'polygon(50% 0%, 100% 100%, 0% 100%)'`
     - `'triangulo-invertido'`: `'polygon(0% 0%, 100% 0%, 50% 100%)'`
   - `getCartaShapeCss(value, esquinasRedondeadas)`: extender la condición que hoy solo mira `HEX_CLIP_PATHS[shape]` para que también compruebe `TRIANGLE_CLIP_PATHS[shape]` (o fusionar ambos diccionarios en una única búsqueda) — en ambos casos `borderRadius: '0'` y el `clipPath` correspondiente. Sin cambio de firma.
   - `isRectShape(value)` no necesita cambios: ya devuelve `false` para cualquier `shape !== 'rect'`, y `'triangulo'/'triangulo-invertido'` no son `'rect'`.
   - **Borde de grosor uniforme** (nueva función `getTriangleInnerClipPath(proporcionValue, width, height, bordePx)`, hermana de `getHexInnerClipPath`, no una generalización de esta): a diferencia del hexágono regular (cuyo incentro coincide con el centro de la caja, `50%,50%`, y cuyo inradio es simplemente `width/2` o `height/2`), el incentro de este triángulo **no** está en el centro de la caja — hay que escalar desde el incentro real, no desde `50%,50%`. Con la caja siempre cuadrada (ratio 1, `width === height`, análogo a por qué el hexágono puede usar directamente `width`/`height` en píxeles), los valores exactos (verificados con las fórmulas estándar de incentro/inradio de un triángulo, en porcentaje del lado de la caja) son:
     - `'triangulo'` (vértice arriba): incentro `(50%, 69.0983%)`, inradio `30.9017%` del lado.
     - `'triangulo-invertido'` (vértice abajo): incentro `(50%, 30.9017%)`, inradio `30.9017%` del lado (mismo valor, por simetría vertical).
     - Fórmula: `inradioPx = 0.309017 * ladoPx` (siendo `ladoPx` el `width` de la carta, igual al `height` al ser ratio 1); `scale = Math.max(0, 1 - bordePx / inradioPx)`; cada vértice `(x, y)` del polígono base se transforma a `(incentroX + scale * (x - incentroX), incentroY + scale * (y - incentroY))`, igual que hace hoy `getHexInnerClipPath` pero sustituyendo el centro fijo `50,50` por el incentro de cada variante. Devuelve `null` si `bordePx` no es `> 0`, mismo criterio que la función hexagonal.
   - No hace falta tocar `getProporcionRatio` (ya funciona por búsqueda genérica en el catálogo) ni `getDesignSize` (deriva de `getProporcionRatio`).

2. **`ui/componentRenderer.js`** (pintado de la carta en la mesa, función que gestiona `component.type === 'carta'`, hoy en torno a la línea 1198):
   - Extender la detección `isHexCarta` con una nueva constante `isTriangleCarta = props.proporcion === 'triangulo' || props.proporcion === 'triangulo-invertido'`.
   - `carta.classList.toggle('carta--hex', isHexCarta)` → añadir además `carta.classList.toggle('carta--triangle', isTriangleCarta)` (nueva clase CSS, ver punto 5).
   - En el bloque que hoy calcula `hexInnerClipPath` y decide entre `cartaContent`/`cartaInner` (líneas ~1237-1256): generalizar la condición `isHexCarta` a `isHexCarta || isTriangleCarta`, y elegir la función de borde correspondiente (`getHexInnerClipPath` si es hexagonal, `getTriangleInnerClipPath` si es triángulo) al calcular el `innerClipPath`. El resto del bloque (relleno de `cartaContent` con el color de borde, capa `cartaInner` con el contenido recortado) es agnóstico a la forma concreta y no necesita cambios.
   - El resize (`clampCartaSize`, línea ~1358): ya funciona sin cambios — la condición especial es solo para `'circular'`; cualquier otra proporción (incluidas las nuevas) cae en la rama genérica de `getProporcionRatio`, que con `ratio: 1` fuerza `width === height` igual que hace hoy con las hexagonales.

3. **`ui/cardEditorModal.js`** (editor de cartas):
   - El desplegable "Proporción" (línea ~289) ya itera `CARD_PROPORTIONS` genéricamente — las dos entradas nuevas aparecen automáticamente, sin tocar ese bloque.
   - El checkbox "Esquinas redondeadas" (línea ~320) ya usa `isRectShape(working.proporcion)` — se oculta automáticamente para las proporciones nuevas, sin cambios.
   - El lienzo de cada cara (bloque `canvasShape`/`isHexCanvas`, líneas ~526-565): mismo patrón que en `componentRenderer.js` — añadir `isTriangleCanvas` análogo a `isHexCanvas`, extender la condición del recorte/relleno y usar `getTriangleInnerClipPath` cuando corresponda para el borde.
   - El bloque `faceShape` que se pasa a `ui/imageAdjustModal.js` (líneas ~366-371): añadir `'triangulo'`/`'triangulo-invertido'` a la lista de valores que se propagan tal cual (hoy solo `circular`/`hex-vertical`/`hex-horizontal`; el resto colapsa a `'cuadrada'`).

4. **`ui/imageAdjustModal.js`** (máscara de ajuste de imagen de fondo, vocabulario de `shape` propio y deliberadamente duplicado, sin importar `cardProportions.js`):
   - Añadir las dos claves nuevas al diccionario de recorte local (hoy `HEX_CLIP_PATHS`, líneas ~46-47): mismos polígonos que en `core/cardProportions.js` (`'polygon(50% 0%, 100% 100%, 0% 100%)'` / `'polygon(0% 0%, 100% 0%, 50% 100%)'`).
   - Línea ~116-117 (`mask.style.borderRadius`/`mask.style.clipPath`): ya generaliza correctamente por búsqueda en el diccionario (`HEX_CLIP_PATHS[entry.shape] || 'none'`) — con las dos claves añadidas al diccionario, funciona sin más cambios. Este componente no dibuja borde de grosor uniforme (es solo una máscara de recorte, no una superposición con borde), así que no necesita ningún equivalente a `getTriangleInnerClipPath`.

5. **`src/styles/main.css`**:
   - Extender el selector `.carta--hex` (líneas 827-830) a `.carta--hex, .carta--triangle` — misma regla (`box-shadow: none` + `filter: drop-shadow(...)`), sin duplicar declaraciones: la sombra de contacto de un triángulo tampoco puede ser `box-shadow` (seguiría la caja cuadrada, no el triángulo recortado), por el mismo motivo ya documentado para hexagonal.

**Orden recomendado de implementación:** 1 (datos/geometría) → 2 (mesa) → 3 (editor) → 4 (máscara de imagen) → 5 (CSS), verificando visualmente contra `design_formas_triangulares.html` al terminar 2 y 3.

## (c) Cambios de arquitectura

En `design/docs/ARCHITECTURE.md`, sección "Tipos de componente implementados" → `'carta'`, en la enumeración de `proporcion` (línea que empieza `- \`proporcion\` (string, uno de los valores de \`CARD_PROPORTIONS\`...`): añadir las dos entradas nuevas a la lista (`'triangulo'`/`'triangulo-invertido'`, triángulo equilátero-aproximado con vértice arriba/abajo respectivamente, caja cuadrada) y mencionar que `getCartaShapeCss` las traduce a `clip-path` igual que las hexagonales, sin afectarles `esquinasRedondeadas`.

## (d) Cambios en estilo

En `design/docs/stylebible/STYLE_BIBLE.md`, sección 13 ("Qué NO hacer"), añadir un párrafo nuevo análogo a "Recorte hexagonal de Carta" y "Borde de Carta en las proporciones hexagonales", explicando que las proporciones `'triangulo'`/`'triangulo-invertido'` siguen exactamente el mismo mecanismo que las hexagonales (recorte por `clip-path`, borde mediante doble `clip-path` anidado vía `getTriangleInnerClipPath`, sombra de contacto con `filter: drop-shadow` vía la clase compartida `.carta--hex, .carta--triangle`), con la única diferencia técnica de que el punto de escalado del borde interior es el incentro real del triángulo (no el centro de la caja, a diferencia del hexágono) — para que quede documentado por qué existe una función geométrica separada en vez de reutilizar `getHexInnerClipPath` sin más.
