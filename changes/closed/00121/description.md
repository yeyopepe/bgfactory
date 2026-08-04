- **Nombre**: Forma circular para mazos + nombre en la etiqueta de cartas
- **Código**: 00121
- **Tipo**: change

## Prompt original del usuario

Añade a los mazos la posibilidad de que la forma sea circular, además de la rectangular ya implementada. También añade a la etiqueta con el número de cartas el nombre del mazo

## Descripción completa

Hoy los mazos ("Mazo") solo pueden tener forma rectangular, con una propiedad "Orientación" (Vertical/Horizontal) que transpone su ancho y alto. Este cambio añade una segunda forma posible, "Circular", como alternativa a la rectangular ya existente, y además hace que la etiqueta que ya muestra el número de cartas del mazo incluya también su identificador.

### 1) Forma circular del mazo

- En la pestaña específica de "Mazo" del modal de propiedades, junto al selector "Orientación" ya existente, se añade un nuevo selector "Forma" con dos opciones: "Rectangular" (comportamiento actual, valor por defecto) y "Circular".
- El selector "Orientación" deja de mostrarse cuando la forma elegida es "Circular" (un círculo no tiene orientación vertical/horizontal). Vuelve a mostrarse si se cambia de nuevo a "Rectangular".
- Al cambiar la forma a "Circular", el mazo iguala su ancho y su alto (círculo perfecto), tomando como referencia el mayor de los dos valores que tuviera en ese momento.
- Con forma circular, la caja del mazo (y su contenido: el reverso de la carta de arriba, o el icono de "mazo vacío" si no tiene cartas) se recorta en círculo. El redimensionado del mazo en la mesa sigue siendo libre en ambos ejes igual que hoy (permite óvalos), con la tecla Shift forzando que se mantenga circular (ancho = alto) durante el arrastre.
- La sombra de la caja del mazo no cambia de mecanismo (sigue la silueta automáticamente al ser circular, sin necesitar ningún tratamiento especial).
- La "zona de revelado" (el recuadro decorativo que marca dónde aparecerán las cartas sacadas del mazo, pegado a su lado derecho) adopta la misma forma elegida para el mazo: sigue teniendo el mismo ancho, alto y posición que hoy, pero se dibuja circular cuando el mazo es circular, y rectangular cuando el mazo es rectangular.
- Mazos ya guardados sin este campo se comportan como "Rectangular" (sin cambio visual).

### 2) Nombre del mazo en la etiqueta de número de cartas

- Hoy ningún componente del proyecto (mazo incluido) tiene un campo "Nombre" editable en la interfaz — lo único identificativo y editable de un componente es su id.

**Pregunta de alcance resuelta**: ¿qué debe mostrar la etiqueta como "nombre" del mazo, dado que no existe un campo "Nombre" editable hoy? Se ofrecieron tres opciones (usar el id ya existente, añadir un campo "Nombre" nuevo solo para mazos, o añadir un campo "Nombre" general para todos los componentes) y el usuario eligió **reutilizar el id existente** como "nombre" del mazo, sin introducir ningún campo nuevo.

- La etiqueta que ya se muestra siempre encima del mazo (tanto en modo juego como en modo edición) con el número de cartas pasa de mostrar solo "<N> cartas" a mostrar "<id del mazo> — <N> cartas".
- Si el id es largo, la etiqueta no se recorta ni se envuelve en varias líneas — puede sobresalir del ancho del mazo, mismo criterio ya aplicado a la etiqueta identificativa de componente en modo edición.

## Apuntes técnicos

- El tipo `'mazo'` (`core`, ver `ARCHITECTURE.md` sección 4, entrada `'mazo'`) reutiliza hoy la clase CSS `.carta` para su caja (mismo radio/sombra), y el tipo `'carta'` ya implementa una proporción `'circular'` (`border-radius: 50%`, resize libre con Shift forzando 1:1, ver `core/cardProportions.js` y `ui/resizeHandle.js`) que sirve de patrón directo a reutilizar/adaptar para esta nueva forma de mazo, en vez de reinventar el mecanismo.
- El renderizado del mazo vive en `ui/componentRenderer.js` (bloque `component.type === 'mazo'`, en torno a la línea 1310): construye `mazo` (className `'carta'`) y `mazoContent` (con `borderRadius` fijado hoy siempre a `var(--radius-lg)`, habría que condicionarlo a la nueva propiedad de forma) y añade `countLabel` (`.mazo-count-label`, texto hoy `${cartaIds.length} cartas`, hay que anteponer el id).
- La zona de revelado se calcula en `core/deck.js` (`getMazoRevealZoneRect`) y se pinta con `renderMazoRevealZone` en `ui/componentRenderer.js` — su forma habría que condicionarla también a la nueva propiedad de forma del mazo.
- Las propiedades específicas de mazo (`orientacion`, y la nueva de forma) se definen en `ui/componentModal.js` (`DEFAULT_MAZO_PROPERTIES`, `MAZO_ORIENTACIONES`, función `renderMazoSpecificFields` en torno a la línea 1124), donde ya vive el selector "Orientación" a modificar/completar.
- No se ha detectado ninguna incongruencia entre `ARCHITECTURE.md`/`STYLE_BIBLE.md` y el código real durante este análisis.
