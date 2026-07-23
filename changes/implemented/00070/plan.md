# Plan — 00070 Patrón de tablero sin remate en el borde derecho e inferior

## (a) Anotaciones funcionales

- Fuera de alcance: la forma hexagonal (dibujada con `<svg>`/`renderHexGrid`) no tiene este problema — cada hexágono se dibuja como polígono cerrado con su propio `stroke`, no depende de un `background-image` repetido, así que no se toca.
- No hay dudas de alcance nuevas que resolver con el usuario: el bug y el comportamiento esperado ya quedan claros en `description.md` y la captura adjunta.

## (b) Solución técnica

**Causa raíz** (confirmada con `ms-tech-analysis`, sin incongruencias entre documentación y código): en `src/ui/componentRenderer.js` (~líneas 419-424), el fondo de patrón cuadrado/rectangular se dibuja con dos `linear-gradient` (`to right`, `to bottom`) que se repiten en tiles de tamaño `cellWidth`×`cellHeight` (`background-size`, `background-repeat` por defecto `repeat`). Cada gradiente pinta una línea solo en la posición 0 de cada tile (el borde izquierdo/superior de cada celda). Como los tiles se repiten desde `(0,0)` hasta cubrir exactamente `width`/`height` (`cellWidth = width/columnas`, `cellHeight = height/filas`), no existe ningún tile cuyo borde izquierdo/superior caiga en `x=width` o `y=height` — por eso el borde derecho e inferior del conjunto de la cuadrícula se queda sin línea.

1. **`src/ui/componentRenderer.js`** (bloque `fondoTipo !== 'imagen'`, forma cuadrada, ~líneas 419-424): añadir dos capas de `linear-gradient` adicionales, no repetidas, que dibujen explícitamente la línea que falta en el borde derecho (`to left`, color desde el 0% que en ese sentido corresponde al borde derecho) y en el borde inferior (`to top`, análogo para el borde inferior), del mismo `patronColor`/`patronGrosor` que las líneas existentes:
   - `board.style.backgroundImage` pasa a incluir 4 capas (orden: derecha repetida, abajo repetida, cierre derecho, cierre inferior):
     ```js
     board.style.backgroundImage =
       `linear-gradient(to right, ${patronColor} ${patronGrosor}px, transparent ${patronGrosor}px), ` +
       `linear-gradient(to bottom, ${patronColor} ${patronGrosor}px, transparent ${patronGrosor}px), ` +
       `linear-gradient(to left, ${patronColor} ${patronGrosor}px, transparent ${patronGrosor}px), ` +
       `linear-gradient(to top, ${patronColor} ${patronGrosor}px, transparent ${patronGrosor}px)`;
     ```
   - `board.style.backgroundSize` pasa a tener 4 valores, uno por capa en el mismo orden — las dos primeras mantienen el tamaño de celda ya existente, las dos nuevas cubren el 100% del tablero (una sola línea de cierre, no repetida):
     ```js
     board.style.backgroundSize = `${cellWidth}px ${cellHeight}px, ${cellWidth}px ${cellHeight}px, 100% 100%, 100% 100%`;
     ```
   - Se añade `board.style.backgroundRepeat = 'repeat, repeat, no-repeat, no-repeat';` (antes no se fijaba explícitamente porque el valor por defecto `repeat` ya era el deseado para las dos únicas capas existentes; ahora hace falta distinguir capa por capa).
2. No se toca nada más: `hexGridToRender`, `renderHexGrid`, ni ningún otro fichero (`boardPatternModal.js`, `componentModal.js`) están involucrados en la causa raíz.

No aplica sección (c) — no cambia arquitectura ni modelo de datos, solo corrige el cálculo de un `background-image` ya existente.

No aplica sección (d) — no introduce ninguna convención de estilo nueva ni cambia una existente; solo corrige un defecto de renderizado para que el patrón se vea como su descripción funcional (`FEATURES.md`) ya decía que debía verse (cuadrícula completa, sin recortes ni lados sin remate).
