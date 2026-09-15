- **Name**: Quitar el redondeado de esquinas del SVG del reverso de las cartas
- **Code**: 00277
- **Type**: fast
- **Creation date**: 2026-09-15

## Full description

El recurso del reverso de las cartas (el patrón de rombos azul y blanco compartido por las 54 cartas de la baraja) tenía las esquinas redondeadas en su propio dibujo. Esto era incorrecto porque el redondeado de esquinas de una carta ya lo aplica el diseño general de la carta (el marco/recorte que usa el renderizador de componentes), así que el recurso del reverso lo estaba aplicando dos veces de forma redundante.

Se ha corregido para que el recurso del reverso se genere con esquinas rectas, dejando que sea únicamente el diseño de la carta el que redondee las esquinas al mostrarlo.

## Technical notes

`src/core/svgTemplates.js`, función `renderCardBackSvg()`: los dos `<rect>` del SVG generado llevaban un atributo `rx` (`rx="7"` en el rect exterior, `rx="4"` en el rect interior del patrón de rombos). Se ha eliminado `rx` de ambos, dejando las esquinas rectas en el propio SVG. El redondeado visual de la carta lo sigue aplicando `componentRenderer.js` (ver comentario en `src/styles/main.css:1411`, "aristas rectas, ver componentRenderer.js").

## Applied changes

- `src/core/svgTemplates.js`: en `renderCardBackSvg()`, eliminado el atributo `rx="7"` del `<rect>` exterior (fondo azul) y `rx="4"` del `<rect>` interior (patrón de rombos). Ambos rects quedan con esquinas rectas.
- Verificado con `npm run test:all`: 391/391 tests OK, build regenerado sin errores.
