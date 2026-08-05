- **Nombre**: Nuevas formas de carta — Triángulo y Triángulo invertido
- **Código**: 00134
- **Tipo**: change
- **Fecha creación**: 2026-08-04

## Prompt original del usuario

(Idea apuntada previamente en `changes/todo/13tcx/description.md`, convertida a change sin refinar más)

> Agregar nuevas formas de cartas más allá de las actuales (rectángulo, círculo, etc.). Específicamente:
> - Triángulo
> - Triángulo invertido
>
> Esto amplía las opciones de diseño visual de las cartas.

## Descripción completa

Hoy, al configurar una carta desde el editor de cartas, se puede elegir su forma entre varias proporciones: rectangular (varios formatos, incluidos tamaños estándar tipo póker o tarot), cuadrada, circular y hexagonal (con dos orientaciones). Este cambio añade dos formas nuevas a esa misma lista: **Triángulo** y **Triángulo invertido**.

- **Triángulo**: silueta triangular equilátera con el vértice apuntando hacia arriba y la base abajo.
- **Triángulo invertido**: la misma silueta pero girada, con el vértice apuntando hacia abajo y la base arriba.

Ambas formas se comportan, en todo lo demás, igual que el resto de formas no rectangulares ya existentes (como la hexagonal):

- Se seleccionan desde el mismo desplegable donde ya se elige la forma/proporción de la carta, sin ningún control ni pantalla nueva.
- Al redimensionar la carta en la mesa, la silueta mantiene siempre su proporción (no se puede estirar libremente en un solo eje), igual que las formas hexagonales.
- No tienen la opción de "esquinas redondeadas" (esa opción es exclusiva de las formas rectangulares/cuadrada) — los vértices del triángulo son siempre agudos.
- El diseño de la carta (imagen de fondo, cuadros de texto, figuras, borde) se recorta siguiendo el contorno triangular, tanto en la carta ya colocada en la mesa como en el propio editor de cartas y en la herramienta de ajuste de la imagen de fondo.
- La sombra que proyecta la carta sobre la mesa sigue también el contorno triangular, no un rectángulo invisible alrededor.

**Casos límite y convivencia:**
- No afecta a ninguna carta ya creada: las cartas existentes siguen teniendo la forma que tuvieran, sin ningún cambio ni migración.
- No afecta al tipo de componente "Mazo" (la pila de cartas boca abajo), que tiene su propia forma independiente (rectangular/circular) y no incorpora las formas nuevas.
- Disponible para cualquier partida y cualquier usuario del modo edición, sin restricción de roles (el proyecto no distingue roles/permisos).

**Preguntas de alcance resueltas con el usuario:**
- ¿Geometría y orientación? → Triángulo equilátero, caja contenedora cuadrada; "Triángulo" con vértice arriba, "Triángulo invertido" con vértice abajo. Confirmado.
- ¿Redimensionado libre o con proporción fija? → Proporción fija (como hexagonal), no libre (como circular). Confirmado.
- ¿Participan de "esquinas redondeadas"? → No, igual que hexagonal. Confirmado.
- ¿Afecta al tipo "Mazo"? → No, queda fuera de este cambio. Confirmado.

No se ha generado ningún diagrama de navegación: el cambio no introduce ninguna pantalla, modal ni transición nueva — solo dos opciones adicionales en un desplegable ya existente. Sí se ha generado una maqueta HTML con la silueta de ambas formas nuevas (ver `design_formas_triangulares.html` en esta misma carpeta), validada por el usuario.

## Apuntes técnicos

- El catálogo de formas de carta vive en `core/cardProportions.js` (`CARD_PROPORTIONS`), con un campo `shape` por entrada que `getCartaShapeCss(value, esquinasRedondeadas)` traduce a `borderRadius`/`clipPath`. Las dos formas nuevas encajan como entradas adicionales de ese catálogo, con `clip-path` (no hay forma de lograr un triángulo con `border-radius`).
- `isRectShape(value)` (mismo módulo) debe seguir devolviendo `false` para las dos formas nuevas, igual que ya hace para `circular`/`hex-vertical`/`hex-horizontal` — controla si se muestra el control "Esquinas redondeadas" en `ui/cardEditorModal.js`.
- Precedente directo a reutilizar: las proporciones hexagonales (cambio 00089, fix 00096) ya resuelven el mismo problema para una silueta no rectangular con aristas rectas — mismo mecanismo de doble `clip-path` anidado para el borde (`getHexInnerClipPath` en `core/cardProportions.js`) y `filter: drop-shadow` en vez de `box-shadow` para la sombra de contacto (clase `.carta--hex` en `main.css`), documentado en `STYLE_BIBLE.md` sección 13 ("Recorte hexagonal de Carta" y "Borde de Carta en las proporciones hexagonales"). Las formas triangulares necesitarán su propia versión de ambos mecanismos (nuevo cálculo de polígono interior para el borde, posible clase `.carta--triangle` análoga a `.carta--hex`).
- Debe aplicarse en los mismos 3 puntos que ya usan `getCartaShapeCss`/el vocabulario de shape: `ui/componentRenderer.js` (carta en la mesa), `ui/cardEditorModal.js` (lienzo de cada cara del editor) y `ui/imageAdjustModal.js` (máscara de ajuste de imagen — este último mantiene su propio vocabulario de `shape` duplicado a propósito, sin importar `cardProportions.js`).
- No se ha detectado ninguna incongruencia entre `ARCHITECTURE.md`/`STYLE_BIBLE.md` y el código real durante este análisis.
