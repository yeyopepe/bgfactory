- **Nombre**: Opción de esquinas redondeadas o cuadradas en el editor de cartas
- **Código**: 00117
- **Tipo**: change

## Prompt original del usuario

"en el editor de cartas, añade una opción para indicar si se quiere redondear (comportamiento actual) o no las cartas."

## Descripción completa

En el editor de cartas (el modal grande donde se diseñan las dos caras de una carta), junto al selector de "Proporción" ya existente, se añade un checkbox "Esquinas redondeadas" que permite elegir si la carta tiene las esquinas redondeadas (comportamiento actual, marcado por defecto) o cuadradas (esquinas a 90°, sin redondeo).

### Preguntas de alcance resueltas

- **¿A qué formas de carta aplica esta opción?** Solo a las 5 proporciones rectangulares/cuadrada de carta (Poker vertical/horizontal, Tarot vertical/horizontal, Cuadrada 1:1). Para las proporciones "Circular" y las dos "Hexagonal" (vértices arriba/abajo y vértices izquierda/derecha), el checkbox no se muestra: esas formas mantienen su silueta fija, sin verse afectadas por esta opción.
- **¿Es una opción por carta o por cara?** Una única opción por carta (no una por cada cara frontal/trasera): afecta a la silueta completa de la carta, igual que la Proporción.
- **¿Cuál es el valor por defecto?** Redondeadas (comportamiento actual), tanto para cartas nuevas como para cartas ya existentes que no tengan el valor guardado — así se preserva el aspecto visual actual sin cambios para nada creado antes de este cambio.
- **¿Dónde se ubica el control?** En la toolbar superior del editor de cartas, junto al selector de "Proporción" ya existente.

### Casos límite resueltos

- Al desmarcar la opción, la carta pasa a esquinas cuadradas (sin redondeo) tanto en la vista previa del editor de cartas como en el renderizado final sobre el tablero (en ambos modos, edición y juego).
- Si el usuario cambia de una proporción rectangular a Circular o Hexagonal y vuelve después a una rectangular, el valor de esta opción (marcado o no) se conserva tal cual estaba, no se resetea.

### Convivencia con lo existente

No sustituye ningún control actual: es una opción adicional junto a la de Proporción.

### Definición visual de alto nivel

- Ubicación: en la toolbar superior del editor de cartas, junto al selector de "Proporción" ya existente.
- Elemento: un checkbox con etiqueta "Esquinas redondeadas", visible/habilitado solo cuando la proporción activa es una de las 5 rectangulares/cuadrada; oculto cuando la proporción activa es Circular o alguna Hexagonal.
- Al marcar/desmarcar, la vista previa de ambas caras en el propio editor refleja el cambio al instante (esquinas redondeadas u cuadradas), igual que ya ocurre al cambiar la Proporción.

## Apuntes técnicos

- El redondeo hoy es fijo vía `src/core/cardProportions.js`, función `getCartaShapeCss(value)`: para `shape === 'rect'` siempre devuelve `borderRadius: '8px'`; para `'circular'` devuelve `50%`; para las hexagonales devuelve `'0'` + `clipPath` de polígono. Este cambio requiere parametrizar esa función (o el punto donde se usa su resultado) para que, cuando `shape === 'rect'`, el `borderRadius` dependa de la nueva propiedad (8px si true, 0 si false/no definida, true por defecto), sin tocar el comportamiento de `circular`/hexagonales.
- `getCartaShapeCss` se usa en dos sitios que deben reflejar el cambio: `src/ui/componentRenderer.js` (línea ~1095, renderizado final en el tablero, ambos modos) y `src/ui/cardEditorModal.js` (línea ~244, vista previa del lienzo del editor).
- Modelo de datos: la nueva propiedad debe vivir a nivel de carta junto a `proporcion` (no dentro de `caraFrontal`/`caraTrasera`), en `component.properties` — ver `DEFAULT_CARTA_PROPERTIES` en `src/ui/componentModal.js` (añadir el campo con valor por defecto `true`) y el objeto `working` de `ui/cardEditorModal.js` (línea ~73, junto a `working.proporcion`), incluyendo su guardado en `onAccept` (línea ~1013/1020 de `componentModal.js`, y el `onAccept({ proporcion, caraFrontal, caraTrasera })` de `cardEditorModal.js` que habrá que ampliar con el nuevo campo).
- Revisar también `core/styleClipboard.js` / `ui/styleClipboardSelectionModal.js` (Copiar/Pegar estilo, change 00085): si el bloque "Generales" o "Proporción" del portapapeles de estilo incluye ya el campo de proporción, probablemente esta nueva propiedad deba copiarse/pegarse junto con él, para mantener la coherencia del flujo existente — a decidir por `ms-how`.
- Sin incongruencias entre documentación y código detectadas en este análisis.
