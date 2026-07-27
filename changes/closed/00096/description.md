- **Nombre**: Borde mal recortado en cartas con proporción hexagonal
- **Código**: 00096
- **Tipo**: fix

## Prompt original del usuario

cuando la carta es de tipo hexagonal, no se aplican correctamente los bordes. fíjate en la captura

## Descripción completa

En el "Editor de cartas", cuando la proporción de la carta es hexagonal ("Hexagonal (vértices arriba/abajo)" o "Hexagonal (vértices izquierda/derecha)"), el borde configurado (color y grosor) de la cara frontal y de la cara trasera no se aplica correctamente al contorno de la carta.

En vez de verse como un contorno de grosor uniforme que sigue las seis aristas rectas del hexágono, el borde aparece como una franja rectangular recortada de forma desigual: gruesa y recta en los lados verticales, y ausente o mal proporcionada junto a los vértices y aristas diagonales (según muestra la captura adjunta del usuario). El problema se ve tanto en la vista previa del editor de cartas como en el renderizado final de la carta ya colocada en el tablero.

Comportamiento esperado: el borde debe verse como un contorno de grosor uniforme que sigue fielmente las seis aristas del hexágono, tal y como ya sucede correctamente con el resto de proporciones (rectangulares, cuadrada y circular).

## Apuntes técnicos

- Documentación técnica revisada: `design/docs/stylebible/STYLE_BIBLE.md` y `design/docs/ARCHITECTURE.md` (ambos configurados en `.claude/ms-context.json`). No hay incongruencias entre documentación y código: `STYLE_BIBLE.md` y el comentario de `src/styles/main.css:788-795` ya documentan que las cartas hexagonales usan `clip-path` (no `border-radius`) y `filter: drop-shadow` en vez de `box-shadow` porque su silueta no es rectangular — el mismo razonamiento aplica al borde, pero el código actual no lo sigue para el borde.
- Causa raíz, duplicada en dos sitios con el mismo patrón:
  - `src/ui/componentRenderer.js:944` (renderizado en el tablero): `cartaContent.style.border = 'Npx solid color'` se aplica a un div rectangular que después se recorta con `cartaContent.style.clipPath = cartaClipPath` (línea 942), usando los polígonos definidos en `src/core/cardProportions.js:23-24` (`HEX_CLIP_PATHS['hex-vertical']` / `['hex-horizontal']`, vía `getCartaShapeCss`).
  - `src/ui/cardEditorModal.js:182-185` y `249-269` (vista previa del editor): mismo patrón — `canvas.style.border` (borde CSS rectangular) + `canvas.style.clipPath` (línea 184, mismo `getCartaShapeCss`).
  - Un `border` CSS se dibuja siempre paralelo a los lados de la caja rectangular del elemento. Al recortar esa caja con un `clip-path` hexagonal, el corte atraviesa el borde en ángulo: el resultado visible no es un contorno uniforme siguiendo las aristas del hexágono, sino restos de un marco rectangular cortados de forma desigual.
  - En las proporciones rectangulares/cuadrada esto no falla porque la caja del `border` coincide con la silueta visible (con o sin `border-radius`). En "Circular" tampoco falla: `border-radius: 50%` hace que el propio `border` siga la silueta circular sin necesitar `clip-path` (`getCartaShapeCss` devuelve `clipPath: 'none'` para circular). Los dos tipos hexagonales son los únicos que combinan `clipPath` real con un `border` rectangular, de ahí que el bug sea específico de ellos.
  - Ninguna otra proporción usa `clip-path`, así que el fix debe acotarse a cómo se pinta el borde cuando el `shape` es hexagonal, sin tocar el resto de proporciones.
