## (a) Anotaciones funcionales

- Fuera de alcance: no se revisa ni se toca ningún otro aspecto de las proporciones hexagonales (cambio 00089) más allá de esta causa raíz concreta — en particular, no se amplía el `clip-path` a ningún otro elemento nuevo ni se revisa el resto de puntos de recorte (editor de cartas, máscara de ajuste de imagen), que no presentan este problema al no tener hijos superpuestos sobre el elemento recortado.
- No han surgido dudas de alcance que resolver con el usuario: la causa raíz y el fix son directos.

## (b) Solución técnica

Causa raíz: en `src/ui/componentRenderer.js`, dentro del bloque `component.type === 'carta'`, el `clip-path` calculado por `getCartaShapeCss()` (cambio 00089) se aplica tanto a `cartaContent` (el contenedor del contenido visual — imagen/texto de la cara, correcto) como al elemento exterior `carta` (línea ~927). `carta` es también el padre directo de la etiqueta identificativa (`createIdentifierLabel`, línea ~942), la insignia de candado (`createLockBadge`, línea ~943) y el elemento sobre el que se engancha el manejador de redimensionado (`attachResizeHandle`, más abajo en el mismo bloque) — y es además el propio elemento que recibe los listeners de `click`/`dblclick`/`contextmenu` para seleccionar/arrastrar. A diferencia de `border-radius` (usado para el resto de proporciones y para "Circular"), que no recorta visualmente a los hijos ni afecta al hit-testing de zonas fuera del radio, `clip-path` sí hace ambas cosas sobre el elemento al que se aplica y su subárbol — de ahí que, con proporción hexagonal, la etiqueta quede cortada (recorte visual de un hijo posicionado en una esquina fuera del polígono) y las esquinas de la caja rectangular dejen de responder a click/arrastre/redimensionado (esas zonas quedan fuera de la zona de hit-testing de `carta`).

1. **`src/ui/componentRenderer.js`** (bloque `component.type === 'carta'`): eliminar la línea `carta.style.clipPath = cartaClipPath;` (línea ~927) — el `clip-path` deja de aplicarse al elemento exterior `carta`. Se mantiene sin cambios en `cartaContent` (línea ~938), que es el único elemento cuyo contenido visual debe recortarse con la silueta hexagonal. `carta.style.borderRadius = cartaBorderRadius;` (línea ~926) no se toca: no causa ninguno de los dos síntomas (border-radius no recorta hijos ni afecta al hit-testing), y mantenerlo a `'0'` para proporción hexagonal no tiene efecto visible distinto de quitarlo.

Con este único cambio, la caja rectangular completa de `carta` vuelve a ser la zona sensible al click/arrastre/redimensionado (igual que ya ocurre con el resto de proporciones, incluida "Circular"), y sus hijos (etiqueta, insignia de candado, manejador de redimensionado) dejan de recortarse, ya que solo `cartaContent` sigue recortado a la silueta hexagonal exacta.

No hace falta tocar ningún otro fichero: `core/cardProportions.js` (`getCartaShapeCss`), `ui/cardEditorModal.js` y `ui/imageAdjustModal.js` no tienen hijos superpuestos sobre el elemento recortado (el lienzo del editor y la máscara de ajuste de imagen no anclan ninguna etiqueta/badge/manejador encima), por lo que no reproducen ninguno de los dos síntomas.

## (c) Cambios de arquitectura

No aplica: no cambia ningún comportamiento documentado en `ARCHITECTURE.md` (el recorte de silueta hexagonal sigue produciendo el mismo resultado visual sobre el contenido de la carta; solo se corrige que también afectaba, por error, a la zona sensible al puntero y a los hijos superpuestos).

## (d) Cambios en estilo

No aplica: no cambia ninguna convención de `STYLE_BIBLE.md` — la nota ya añadida en el cambio 00089 sobre el recorte por `clip-path` de "Carta" sigue siendo correcta tal cual.
