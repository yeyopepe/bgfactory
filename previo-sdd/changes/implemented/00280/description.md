- **Name**: Letra de esquina de figuras (J/Q/K) y As más pegada al lateral y separada del borde superior/inferior
- **Code**: 00280
- **Type**: fast
- **Creation date**: 2026-09-15

## Full description

Tras el cambio 00279 (que agrandó el tamaño de la letra de esquina), en las cartas J, Q, K y As esa letra queda demasiado pegada al borde superior/inferior de la carta y, en comparación, algo alejada del borde lateral más cercano. Se ajusta su posición para que quede más "en la esquina": un poco más separada del borde superior/inferior y un poco más cerca del borde lateral.

Las cartas numéricas 2-10 no se ven afectadas por este ajuste: mantienen la posición de esquina que ya tenían.

## Technical notes

- La posición de la letra de esquina se define en `renderCorner(label, colorHex, fontSize)` (`src/core/svgTemplates.js`), con coordenadas `x="7" y="19"` fijas sobre un `viewBox="0 0 100 140"`. Esta función es compartida por `renderNormalFace` (2-10), `renderAceFace` (As) y `renderFigureFace` (J/Q/K).
- Como el ajuste debe aplicar solo a As y figuras (no a 2-10), `renderCorner` necesita aceptar también `x`/`y` como parámetros (o una variante), en vez de las coordenadas fijas actuales.
- Valores acordados con el usuario: `x="4" y="24"` para As y figuras J/Q/K (frente a `x="7" y="19"` que mantienen las cartas 2-10).

## Applied changes

- **`src/core/svgTemplates.js`** — `renderCorner(label, colorHex, fontSize, x = 7, y = 19)` gana dos parámetros opcionales `x`/`y` (por defecto los valores previos `7`/`19`, que mantienen sin cambios a `renderNormalFace`, cartas 2-10). Las llamadas a `renderCorner` dentro de `renderAceFace` y `renderFigureFace` pasan ahora `4, 24` como esos dos últimos argumentos, moviendo la letra de esquina de As y figuras (J/Q/K) más cerca del lateral y más lejos del borde superior/inferior.
