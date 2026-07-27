## (a) Anotaciones funcionales

- Fuera de alcance: no se toca `src/ui/cardEditorModal.js` ni `src/ui/imageAdjustModal.js` — en ambos, el `clip-path`/`border-radius` de la proporción hexagonal se aplica sobre un único elemento (el lienzo de la cara, o la máscara de ajuste) que no tiene ningún hijo superpuesto (etiqueta, insignia, manejador de resize) ni recibe listeners de arrastre/selección sobre zonas fuera del hexágono — no reproducen este síntoma, tal y como ya determinó el análisis del fix 00094.
- No han surgido dudas de alcance que resolver con el usuario: la causa raíz y el fix son directos y confirmados por análisis de código.

## (b) Solución técnica

Causa raíz: en `src/ui/componentRenderer.js`, dentro del bloque `component.type === 'carta'`, el fix 00094 quitó `clip-path` del elemento exterior `carta` para que la etiqueta identificativa, la insignia de candado y el manejador de resize (hijos de `carta`) no se recortaran, y para que toda su caja rectangular siguiera siendo sensible al click/arrastre. Ese cambio fue correcto en sí mismo, pero dejó sin resolver que **el relleno visible de la carta** (`carta.style.backgroundColor = '#ffffff'` y `carta.style.border = ...`, líneas ~950-951) se sigue pintando sobre `carta`, que ya no tiene `clip-path`. Como `cartaBorderRadius` vale `'0'` para proporción hexagonal (no produce silueta por sí solo), el fondo blanco y el borde de la carta se muestran como un rectángulo liso sin ningún recorte — solo el hijo `cartaContent` (que no tiene fondo ni borde propios, solo la imagen/texto de la cara) sigue recortado en hexágono. De ahí el síntoma: la silueta hexagonal deja de percibirse salvo en la imagen.

La solución consiste en trasladar la pintura del fondo y el borde de la carta desde `carta` (elemento exterior, sensible al click, sin recorte) a `cartaContent` (elemento interior, ya recortado con `clip-path`/`border-radius` según la proporción activa), dejando `carta` como una caja transparente que solo aporta posición/tamaño, hit-testing y los elementos superpuestos (etiqueta, insignia, manejador).

1. **`src/ui/componentRenderer.js`** (bloque `component.type === 'carta'`):
   - Eliminar `carta.style.backgroundColor = '#ffffff';` y `carta.style.border = (cara?.bordeGrosor ?? 0) > 0 ? ... : 'none';` del elemento `carta` (líneas ~950-951).
   - Añadir esas mismas dos asignaciones sobre `cartaContent` en su lugar (justo después de fijar `cartaContent.style.clipPath`, línea ~937, ya que `cara` se resuelve más abajo — hay que mover el cálculo de `cara`/`caraActual` por delante de la creación de `cartaContent`, o simplemente asignar `cartaContent.style.backgroundColor`/`border` en el mismo punto donde hoy se asignan a `carta`, ya que `cartaContent` ya existe en ese momento del código).
   - Añadir `cartaContent.style.boxSizing = 'border-box';` para que el borde trasladado se pinte hacia dentro del área ya delimitada por `inset: 0`, sin desplazar la imagen/texto respecto a su posición actual (mismo criterio que ya tenía `carta` con `box-sizing: border-box` para su borde).
   - `carta.style.borderRadius = cartaBorderRadius;` (línea ~926) no se toca: sigue sin producir efecto visible distinto por sí sola (ya no hay fondo/borde en `carta` que redondear), pero tampoco estorba.

Con este cambio: para las proporciones rectangulares/circular, el resultado visual es idéntico al actual (el `border-radius` que ya llevaba `cartaContent` coincide con el de `carta`, y el fondo/borde se ven exactamente igual al estar ambos elementos superpuestos con el mismo tamaño). Para las proporciones hexagonales, el fondo blanco y el borde quedan recortados por el `clip-path` de `cartaContent`, recuperando la silueta hexagonal completa — mientras que `carta` (sin `clip-path`, con la etiqueta/insignia/manejador como hijos) sigue siendo la caja rectangular completa sensible al click/arrastre/redimensionado, tal y como dejó el fix 00094.

No hace falta ningún cambio en `core/cardProportions.js` (`getCartaShapeCss` no cambia su contrato), ni en `ui/cardEditorModal.js`/`ui/imageAdjustModal.js` (fuera de alcance, ver (a)).

## (c) Cambios de arquitectura

No aplica: no cambia ningún comportamiento documentado en `ARCHITECTURE.md` (la carta con proporción hexagonal sigue recortándose con `clip-path` en los mismos tres puntos ya documentados; solo cambia, dentro de `componentRenderer.js`, qué elemento interno pinta el fondo/borde, un detalle de implementación no descrito a ese nivel de detalle en el documento).

## (d) Cambios en estilo

No aplica: no cambia ninguna convención de `STYLE_BIBLE.md` — la nota de la sección 13 ("Recorte hexagonal de Carta") sigue siendo correcta tal cual: el resultado visual final (fondo, borde e imagen recortados al polígono exacto del hexágono) es el que ya describe, este fix solo corrige que ese resultado no se estaba produciendo realmente sobre el fondo/borde.
