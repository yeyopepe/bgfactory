- **Name**: Costura de trama entre título e Importar/Exportar
- **Code**: 00289
- **Type**: fast
- **Creation date**: 2026-09-15

## Full description

Regresión persistente tras el cambio 00288 (mismo día): aunque el título y la franja de "Importar"/"Exportar" en modo edición ya compartían color, trama de fondo y ausencia de sombra propia, seguía viéndose una línea/costura divisoria entre ambas zonas. Debía verse como una única cabecera, sin ninguna separación perceptible.

El usuario propuso como alternativa fusionar ambos elementos en uno solo (extender el título y superponer los botones de Importar/Exportar con fondo transparente). Se optó por un ajuste más acotado y de igual efecto visual: fijar la trama en coordenadas de pantalla en vez de fusionar los elementos.

## Applied changes

- `src/test/functional/top-controls.test.js` — nuevo caso `FT-039-10` (carga la hoja de estilos real, monta modo edición y el título, comprueba que la capa de trama de `h1#app-title` y la de `.edit-toolbar` llevan `background-attachment: fixed`). Verificado que falla si esa propiedad se quita (vuelve al valor por defecto `scroll`) y pasa con el fix aplicado.
- `src/styles/main.css` — causa raíz: cada elemento (`h1.app-title-bar--edit` y `.edit-toolbar`) pinta su propio `repeating-linear-gradient` en las coordenadas de su propia caja; al tener alturas distintas, el patrón de rayas no continúa en fase de un elemento a otro y la discontinuidad se percibe como una línea divisoria, pese a compartir color, trama y ausencia de sombra (00287/00288). Se añadió `background-attachment: fixed` a la capa de la trama en ambos elementos (en `h1` solo a esa capa, no al degradado base, que sigue ligado a la caja mediante `scroll`): con `fixed`, el patrón se pinta en coordenadas de pantalla en vez de coordenadas de caja, por lo que mantiene una única fase continua entre ambos elementos sin necesidad de fusionarlos en un solo nodo del DOM. Verificado visualmente (captura de pantalla real en Chromium, incluyendo un recorte ampliado de la zona de contacto): la trama fluye sin corte visible de un elemento a otro. `npm run test:all` → 405/405 tests pasando, build check OK.
