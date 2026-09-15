- **Name**: Números de esquina más grandes en cartas 2-10 y palo grande en lugar de corona en figuras J/Q/K
- **Code**: 00279
- **Type**: change
- **Creation date**: 2026-09-15

## Full description

Ajustes visuales en el diseño de las cartas de la baraja francesa estándar (el conjunto de 54 cartas generado por el preset "Baraja Francesa"):

1. **Cartas numéricas 2-10**: el número que aparece en las esquinas de la carta (arriba a la izquierda y abajo a la derecha) debe verse un 65% más grande que el tamaño actual.

2. **Cartas de figura J, Q, K**: el elemento decorativo grande que hoy aparece en el centro de la carta (una corona estilizada, con el símbolo del palo pequeño debajo) se sustituye por el símbolo del palo (picas, corazones, diamantes o tréboles) en un tamaño 3 veces mayor que el que tenía ese símbolo pequeño hasta ahora, en el mismo color que corresponde a ese palo. El centro de la carta ya no lleva ninguna letra — la identificación de la figura (J/Q/K) queda solo en las esquinas, cuyo tamaño en estas cartas se agranda más que el del resto del mazo (más que el +65% del punto 1), para compensar que ya no hay letra en el centro. Esa letra de esquina se dibuja como un trazo negro sólido, igual que en el resto de la baraja, sin ningún tratamiento adicional (ni contorno ni fondo).

No se ven afectados por este cambio: el As (que ya muestra el símbolo del palo en grande y centrado, sin corona ni letra central, y no se menciona en la petición), el Joker, el reverso de las cartas, ni el borde de las cartas.

### Dudas funcionales resueltas

- **¿Se reposiciona el número de esquina al agrandarlo, o solo se aumenta su tamaño?** Solo se aumenta el tamaño; la posición se mantiene igual que ahora. Si al implementarlo se detecta que el número queda recortado o demasiado pegado al borde de la carta, se valorará un ajuste de posición en ese momento.
- **¿En qué color y con qué protagonismo se dibuja el símbolo del palo en las figuras J/Q/K?** En el mismo color que ya se usa para ese palo en el resto de la carta (negro o rojo según corresponda). Tras varias iteraciones sobre la propuesta visual, el tamaño final acordado es 3 veces el que tenía el símbolo pequeño que hoy aparece debajo de la corona.
- **¿Lleva alguna letra el centro de la carta, además del símbolo del palo?** No. Se descartó la idea intermedia de superponer la letra dentro del símbolo: el centro queda solo con el símbolo del palo en grande.
- **¿Se mantiene la letra pequeña en las esquinas de J/Q/K, y con qué tamaño?** Sí se mantiene, con un tamaño mayor que el del resto de cartas (que solo suben un 65%): en las figuras J/Q/K, al no haber ninguna letra en el centro, la letra de esquina se agranda más para seguir identificando claramente la figura.
- **¿Llevan las esquinas de J/Q/K algún tratamiento visual adicional (marco, contorno, fondo)?** No. Tras probar y descartar un contorno negro con relleno blanco, se decidió que la letra de esquina de J/Q/K se dibuje igual que en el resto de la baraja: un trazo negro sólido, sin marco ni fondo, solo con el tamaño mayor ya descrito.

## Technical notes

- El SVG de la cara frontal de cada carta se genera en `src/core/svgTemplates.js`.
- El tamaño del número/letra de esquina se define en `renderCorner(label, colorHex)` (líneas 25-29), como `font-size="14"` sobre un `viewBox="0 0 100 140"`. Esta función es compartida por todos los `designKind` salvo `joker` (`renderNormalFace` para 2-10, `renderAceFace` para el As, `renderFigureFace` para J/Q/K). Como ahora J/Q/K necesita un tamaño de esquina distinto (mayor) al de 2-10/As, `renderCorner` ya no puede aplicar un único tamaño fijo global — necesita recibir el tamaño de fuente como parámetro (o una variante específica para figuras), en vez del `font-size="14"` fijo actual.
- Tamaños de esquina a aplicar: 2-10 y As, `font-size` 14 → 23 (+65%); J/Q/K, un tamaño mayor aún (a determinar por `pv-how`/`pv-do` dentro de un rango razonable respecto al +65% general, ya que el usuario solo pidió "más grande" sin cifra exacta para esta diferencia).
- El elemento central de J/Q/K se genera en `renderFigureFace({ symbol, colorHex, label })` (líneas 43-51): actualmente dibuja una corona estilizada (un `<path>` en zigzag con 3 `<circle>` a modo de joyas) seguida del símbolo del palo (`<text>`, `font-size="32"`, en `x=50 y=105`). Esta corona fue una decisión de diseño intencional del cambio original 00236 (`previo-sdd/changes/implemented/00236/`, que pedía "un elemento visual diferenciador simplificado... p. ej. una corona estilizada"). Pasa a eliminarse el `<path>`/`<circle>` de la corona, y el símbolo del palo sube de `font-size="32"` a aproximadamente `font-size="96"` (x3), recentrado en el medio de la carta.
- Catálogo de datos de las cartas (rank, label, designKind) en `src/data/cardTemplates.js`.
- No existen entradas de documentación funcional (`design/docs/features`) ni técnica (`design/docs/architecture`) específicas sobre el diseño de las cartas; el único rastro de la intención de diseño original está en el cambio 00236 (ya implementado y cerrado, no en curso).
