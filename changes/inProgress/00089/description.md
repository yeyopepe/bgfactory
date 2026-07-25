- **Nombre**: Proporciones de carta hexagonales
- **Código**: 00089
- **Tipo**: change

## Prompt original del usuario

añadir una opción más a las proporciones de cartas: hexagonal

(ampliación en la misma conversación) divide esto en dos proporciones:
- hexagonal (vértices arriba/abajo)
- hexagonal (vértices izquierda/derecha)

(ampliación en la misma conversación) para mantenerlo todo coherente, añade también estas dos posibilidades del tipo hexagonal en los patrones del tablero

## Descripción completa

El componente "Carta" tiene hoy seis proporciones disponibles en su propiedad "Proporción" (Poker estándar vertical 5:7, Poker estándar horizontal 7:5, Tarot estándar vertical, Tarot estándar horizontal, Cuadrada 1:1 y Circular). Se añaden dos proporciones nuevas al mismo desplegable, sin sustituir ni afectar a ninguna de las ya existentes ni a ninguna carta ya creada con otra proporción distinta:

- **"Hexagonal (vértices arriba/abajo)"**: hexágono regular orientado con un vértice arriba y otro abajo, más alto que ancho.
- **"Hexagonal (vértices izquierda/derecha)"**: hexágono regular orientado con un vértice a la izquierda y otro a la derecha, más ancho que alto.

Ambas se comportan como una proporción fija más, igual que las cuatro rectangulares y la cuadrada, y a diferencia de "Circular" (la única que hoy permite estirado libre en ambos ejes hasta convertirse en óvalo): al redimensionar la carta en la mesa arrastrando su manejador, el ratio se mantiene siempre fijo; solo cambia editando explícitamente la propiedad "Proporción" en la modal de la carta.

Visualmente, la carta con proporción hexagonal se recorta con la silueta exacta del hexágono (polígono de 6 aristas rectas, sin curvas), en vez del rectángulo de esquinas ligeramente redondeadas que usan las proporciones rectangulares/cuadrada, o el círculo/óvalo de "Circular". Los vértices del hexágono quedan agudos, sin ningún bisel ni redondeo. Este recorte se aplica de forma consistente en todos los sitios donde ya se aplica hoy el de "Circular":

- Renderizado de la carta sobre la mesa, en modo juego y en modo edición.
- El editor de cartas, en el lienzo de cada cara (frontal y trasera).
- El editor de ajuste de imagen por cara (la máscara de recorte que se ve al mover/hacer zoom la imagen de fondo de una cara).

Ambas opciones están disponibles en los mismos dos sitios donde ya se elige la proporción hoy: la modal de configuración del componente "Carta" y el desplegable de proporción del editor de cartas, ambos en modo edición.

### Coherencia con los patrones del tablero

El componente "Tablero" ya tiene hoy, dentro de la configuración de su fondo ("Color y patrón"), una "Forma de casilla" con dos valores: Cuadrada y Hexagonal. Para mantener el mismo criterio que en las proporciones de carta, esa única opción "Hexagonal" se divide igual en dos:

- **"Hexagonal (vértices arriba/abajo)"**: la rejilla de casillas hexagonales del tablero se dibuja con hexágonos orientados con un vértice arriba y otro abajo (casillas más altas que anchas).
- **"Hexagonal (vértices izquierda/derecha)"**: la rejilla se dibuja con hexágonos orientados con un vértice a la izquierda y otro a la derecha (casillas más anchas que altas) — es la orientación que ya dibuja hoy la única opción "Hexagonal" existente.

El resto de la configuración del patrón (color, grosor de línea, número de filas y columnas) se comporta exactamente igual con cualquiera de las dos orientaciones, sin cambios en su rango ni su significado. Un tablero guardado antes de este cambio con "Forma de casilla" = Hexagonal conserva el mismo aspecto visual al abrirlo: se interpreta como "Hexagonal (vértices izquierda/derecha)", sin que el usuario tenga que volver a configurarlo.

Esta opción está disponible en el mismo sitio donde ya se elige la forma de casilla hoy: la sub-modal "Color y patrón" del fondo del tablero, abierta desde la pestaña "Específicas" de la modal de configuración del componente "Tablero".

## Apuntes técnicos

La proporción se define hoy en `src/core/cardProportions.js` (catálogo `CARD_PROPORTIONS`, cada entrada con `value`/`label`/`ratio`) y se consume en:

- `src/ui/componentModal.js` — desplegable de selección de proporción.
- `src/ui/componentRenderer.js` (~línea 985: `cartaBorderRadius`; ~línea 1123: clamp de redimensionado que distingue `'circular'` de las proporciones fijas usando `getProporcionRatio`).
- `src/ui/cardEditorModal.js` (~línea 112: `faceShape`; ~línea 164: `borderRadius` del lienzo de cada cara).
- `src/ui/imageAdjustModal.js` (~línea 105: `borderRadius` de la máscara de recorte).

Todos estos puntos usan hoy `border-radius` (0%/8px/50%) para dar forma a rectángulo/círculo. Para el hexágono hará falta un recorte por polígono (p. ej. `clip-path`) en los mismos puntos, ya que `border-radius` no puede producir una silueta hexagonal de aristas rectas. No es una incongruencia entre documentación y código (ambas fuentes coinciden en el comportamiento actual), sino una nota de implementación derivada del análisis, a resolver por `ms-how` al diseñar la solución técnica.

En cuanto al patrón del tablero, `properties.patronForma` (`'cuadrada' | 'hexagonal'`) se define y edita en `src/ui/boardPatternModal.js` (desplegable "Forma de casilla", líneas ~31 y ~82-92) y se consume en `src/ui/componentRenderer.js`: la comprobación `props.patronForma === 'hexagonal'` (línea ~439) decide si se delega en `renderHexGrid` (línea ~51) en vez del `linear-gradient` usado para la rejilla cuadrada. `renderHexGrid` ya dibuja hexágonos regulares por polígono SVG (no usa `border-radius`); la orientación actual (vértices izquierda/derecha) viene fija en el cálculo de `angle = 60 * i` (línea ~75, empieza en 0°) junto con el desfase por columna (`colOffsetY`, línea ~70). Para soportar ambas orientaciones hará falta parametrizar tanto el ángulo de partida del polígono como el eje de desfase de la rejilla (por columna para vértices izquierda/derecha, por fila para vértices arriba/abajo) — cambiar solo el ángulo sin invertir el desfase dejaría huecos/solapes en la rejilla. Migración del valor antiguo: un `patronForma` guardado como `'hexagonal'` a secas (antes de este cambio) debe tratarse como el nuevo valor equivalente a "vértices izquierda/derecha", a resolver por `ms-how` (p. ej. normalizando el valor al leerlo, o manteniendo `'hexagonal'` como alias de esa orientación en el catálogo de valores).
