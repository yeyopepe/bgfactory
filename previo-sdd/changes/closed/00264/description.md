- **Name**: Sombra/marco cuadrado al levantar componentes de forma no rectangular
- **Code**: 00264
- **Type**: fix
- **Creation date**: 2026-09-14

## Full description

Al arrastrar en Modo Juego un componente cuya silueta no es rectangular ni circular (por ejemplo una carta con proporción triangular o hexagonal, o el dado), el efecto visual de "levantar" que se muestra mientras se mueve dibuja una sombra y un marco con forma cuadrada/rectangular, en vez de seguir la silueta real del elemento (triángulo, hexágono, rombo, decágono, etc.).

En reposo (sin arrastrar), esas mismas piezas sí muestran correctamente la sombra siguiendo su forma real. El problema aparece únicamente durante el gesto de arrastre, mientras dura el efecto de "elemento en el aire".

Comportamiento esperado: durante el arrastre, la sombra que simula el "levantado" de estos elementos debe seguir su silueta real, igual que ya ocurre cuando están en reposo sobre la mesa, en vez de mostrar un rectángulo que no corresponde con su forma.

## Technical notes

- Estado transitorio `.lifted` (`src/styles/main.css`), añadido/quitado por `beginDragLift`/`endDragLift` en `src/ui/componentRenderer.js`. Aplica `transform: translate(-2px, -4px)` y `box-shadow: 6px 7px 9px 2px rgba(0, 0, 0, 0.35)` sobre la caja exterior del elemento arrastrado.
- Ese `box-shadow` se pinta sobre la caja rectangular del propio elemento (`.carta`, `.dice`, etc.), que siempre es un rectángulo — el recorte de silueta (`clip-path`) para proporciones `hex-vertical`/`hex-horizontal`/`triangulo`/`triangulo-invertido` se aplica en un `div` hijo interior (`cartaContent`), no en el propio contenedor `.carta`. Por eso `box-shadow` no sigue la silueta recortada.
- En reposo, esas mismas piezas evitan justo este problema usando `filter: drop-shadow` en vez de `box-shadow`: `.dice` (línea ~1128 de `src/styles/main.css`) y `.carta--hex, .carta--triangle` (línea ~1316), documentado en `design/docs/style/001-tokens-visual.md` ("Elevation, shadow and transition"). `filter` sí seguiría la silueta real también en el estado `.lifted`, porque se calcula sobre los píxeles ya renderizados de los descendientes (incluido el recorte del hijo), no sobre la caja del propio elemento.
- La regla `.lifted` (línea ~3537 de `src/styles/main.css`) es la única excepción de ese mismo sistema de elevación (documentada en `design/docs/style/001-tokens-visual.md`, "'Lift' effect on dragging in play mode") que no respeta el criterio "usar `filter: drop-shadow` para siluetas no rectangulares".
- Posible inconsistencia a resolver por `pv-how`: la solución probablemente implique una variante de `.lifted` (combinada con `.dice`/`.carta--hex`/`.carta--triangle`) que sustituya el `box-shadow` fijo por un `filter: drop-shadow` equivalente durante el arrastre, sin tocar el comportamiento de `.lifted` para el resto de piezas (rectangulares/circulares), que sí deben seguir usando `box-shadow` como hoy.
