- **Nombre**: Carta hexagonal no muestra su forma (queda cuadrada) tras el fix 00094
- **Código**: 00095
- **Tipo**: fix

## Prompt original del usuario

no funciona nada del cambio 00089 y 00094. Después del 00089 funcionaba todo, pero no se veía el id de la carta y no se podía redimensionar. Después del 00094 no cambia la forma de la carta a hexagonal, se queda en cuadrada

## Descripción completa

El componente "Carta" con proporción hexagonal ("Hexagonal (vértices arriba/abajo)" o "Hexagonal (vértices izquierda/derecha)", introducidas en el cambio 00089) ha tenido, en modo edición, dos síntomas relacionados a lo largo de su historial:

1. Tal como quedó tras el cambio 00089: la etiqueta identificativa ("Carta: <id>") salía cortada, y las esquinas de la carta (fuera de la silueta hexagonal, dentro de su caja rectangular) no respondían al click, impidiendo seleccionar, arrastrar o redimensionar la carta desde ahí. Esto se documentó y se corrigió con el fix 00094.
2. Tras aplicarse el fix 00094: el síntoma anterior desaparece, pero aparece uno nuevo — la carta con proporción hexagonal ya no muestra ninguna silueta hexagonal visible. El fondo blanco y el borde de la carta se siguen dibujando como un rectángulo normal, sin recortarse en hexágono; solo la imagen de la cara (si la hay) se ve recortada en hexágono, pero el fondo y el borde de la carta no se ven afectados — visualmente la carta parece cuadrada/rectangular.

**Comportamiento esperado**: con proporción hexagonal, tanto en modo edición como en modo juego, y también en el editor de cartas y en la máscara de ajuste de imagen, la carta debe verse con su silueta hexagonal completa (fondo, borde e imagen recortados al polígono exacto del hexágono, vértices agudos, sin bisel ni redondeo) **y al mismo tiempo** la etiqueta identificativa debe verse completa sin recortarse, y toda la caja rectangular delimitadora de la carta debe seguir siendo clicable para seleccionar/arrastrar/redimensionar el componente (igual que ya logra el fix 00094 para este segundo aspecto). Ambos comportamientos — silueta visual completa y zona sensible al click completa — deben cumplirse a la vez: no vale recuperar uno rompiendo el otro, como ha ocurrido en cada uno de los dos pasos anteriores.

## Apuntes técnicos

En `src/ui/componentRenderer.js` (bloque `component.type === 'carta'`, líneas ~914-964): el elemento exterior `carta` (con `position`/`left`/`top`/`width`/`height`, `backgroundColor: '#ffffff'`, `border`, y los listeners de click/drag/resize, además de ser el padre directo de la etiqueta identificativa, la insignia de candado y el manejador de redimensionado) tiene `borderRadius = cartaBorderRadius`, pero desde el fix 00094 ya no tiene `clipPath` aplicado (se quitó para que la etiqueta/manejador no se recortaran y las esquinas siguieran siendo clicables). El hijo `cartaContent` (absoluto, `overflow: hidden`, sin `background`/`border` propios, solo contiene la imagen/texto de la cara) sí conserva `clipPath = cartaClipPath`.

Para proporción hexagonal, `cartaBorderRadius` vale `'0'` (no produce ninguna silueta hexagonal por sí solo — solo `clip-path` puede, según `getCartaShapeCss()` en `src/core/cardProportions.js`, que distingue `shape: 'hex-vertical'/'hex-horizontal'` de `shape: 'rect'/'circular'`). Como el fondo blanco y el borde viven en `carta` (que ya no tiene `clip-path`), el relleno visible de la carta se sigue mostrando como rectángulo aunque `cartaContent` sí esté recortado en hexágono — de ahí que la silueta hexagonal ya no se perciba visualmente salvo en la imagen de la cara.

No es una incongruencia entre documentación y código: `ARCHITECTURE.md` y `STYLE_BIBLE.md` (sección 13, "Recorte hexagonal de Carta") documentan el `clip-path` como mecanismo de recorte, pero no contemplan el matiz de que el fondo/borde visibles y la zona sensible al click necesitan tratarse en capas distintas para que ambos requisitos (silueta visual completa + hit-testing completo de toda la caja) convivan a la vez. Es una nota de implementación a resolver por `ms-how` al diseñar la solución técnica, no una incongruencia de documentación a corregir aparte.
