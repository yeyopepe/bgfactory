**Fecha creación**: 2026-08-05

## (a) Anotaciones funcionales

Dudas resueltas con el usuario durante este análisis:

- ¿El cambio 00151 extiende a `'carta'` el mismo criterio que 00152 aplicó a `'tableroPersonalizado'` (contenido en píxeles reales, sin reescalar al redimensionar; el editor diseña siempre al tamaño real)? → Sí, confirmado — es la extensión que 00152 dejó pendiente para esta entrada.
- ¿Qué pasa con las cartas ya diseñadas bajo el sistema actual de "unidades de diseño" (300px de ancho de referencia)? A diferencia de `'tableroPersonalizado'` (tipo nuevo introducido el mismo día que 00152, sin contenido real diseñado), `'carta'` es un tipo maduro: reinterpretar sin más sus números guardados como píxeles reales produciría un salto visual real (contenido demasiado grande/recortado) en cualquier carta ya diseñada. → Se migran automáticamente al cargar: se recalculan una única vez las coordenadas de formas/textos de cada carta ya guardada, multiplicándolas por el factor de escala que tenían en ese momento, para que el diseño se vea exactamente igual que antes del cambio. A partir de ahí, esos números ya son píxeles reales y no se vuelven a tocar.
- ¿Cómo se comporta "Copiar/Pegar estilo" entre dos cartas de tamaño distinto, ahora que el contenido no se reescala? → Se pega tal cual, sin reescalar (coherente con el nuevo criterio: mismo comportamiento que ya tiene redimensionar). Si las cartas difieren mucho de tamaño, el resultado puede quedar descolocado/cortado — el usuario lo ajusta a mano, como ya pasa hoy si redimensiona después de pegar.

Fuera de alcance: no se toca el redimensionado en la mesa en sí (`clampCartaSize` sigue forzando el ratio de `proporcion` salvo `'circular'`/`'libre'`, sin cambios) — este cambio solo afecta a qué le pasa al *contenido* de la carta al redimensionar, no a las reglas de qué tamaños de marco se permiten.

## (b) Solución técnica

### 1. `core/cardProportions.js` — retirar `getDesignSize`, conservar `CARD_DESIGN_WIDTH`

- Eliminar la función `getDesignSize(proporcionValue)`: tras las tareas 2-5 queda sin ningún uso en el proyecto (confirmado por búsqueda completa en `src/`).
- Mantener `CARD_DESIGN_WIDTH = 300`, pero actualizar su comentario: deja de ser "el ancho de referencia del lienzo de diseño" (ya no hay tal lienzo) y pasa a ser únicamente la referencia histórica del lienzo que usaban las cartas guardadas antes de este cambio, usada solo por la migración puntual de la tarea 6 (`core/state.js`) para calcular su factor de conversión a píxeles reales.

### 2. `ui/componentRenderer.js` — pintar el contenido de `'carta'` en píxeles reales

- Rama `component.type === 'carta'`: sustituir `const renderScale = width / CARD_DESIGN_WIDTH;` por escala fija — llamar directamente `paintCartaFace(contentParent, cara, 1, width, height);` (sin la constante de renderScale intermedia). El contenedor `cartaContent` ya tiene `overflow: hidden`, así que cualquier elemento que no quepa en el tamaño actual de la carta queda recortado automáticamente, igual que ya hace `tableroPersonalizado` desde el 00152 — sin cambios adicionales de estilo.
- Rama `component.type === 'mazo'` (pinta la cara trasera de la carta de arriba dentro de la caja del propio mazo, cuyo tamaño es independiente del de esa carta): sustituir `const renderScale = width / CARD_DESIGN_WIDTH;` por `const renderScale = width / (cartaArriba.width || MIN_CARTA_WIDTH);` — mantiene el comportamiento actual de "encajar el diseño de la carta en la caja del mazo, cualquiera que sea su tamaño respectivo", solo que ahora la referencia es el ancho real de la carta en vez del lienzo abstracto de 300px.
- Quitar `CARD_DESIGN_WIDTH` del `import` de `../core/cardProportions.js` (ya no se usa en este fichero tras los dos puntos anteriores).

### 3. `ui/visualEditorModal.js` — el lienzo de `'carta'` pasa a representar el tamaño real

- `working`: añadir `designWidth`/`designHeight`, inicializados desde el tamaño real del componente (`component.width`/`component.height`; si por lo que sea faltaran — no debería pasar, `'carta'` siempre nace con tamaño fijo — usar `getProporcionRatio(working.proporcion)` como fallback igual que antes, vía un ancho de referencia razonable, p. ej. `DEFAULT_CARTA_WIDTH`-equivalente local).
- `getFaceDesignSize()`: pasa a devolver siempre `{ width: working.designWidth, height: working.designHeight }`, tanto si `showProporcionSelector` es `true` como `false` — para `tableroPersonalizado` (`showProporcionSelector: false`) el resultado es idéntico al actual (`designWidth`/`designHeight` nunca cambian tras la inicialización, al no haber desplegable de Proporción), así que no hay cambio observable en ese caso.
- Listener `change` del desplegable "Proporción" (caso `'carta'`): tras `working.proporcion = proporcionSelect.value;`, añadir `working.designHeight = working.designWidth / getProporcionRatio(working.proporcion);` antes de volver a pintar — mantiene fijo el ancho actual y recalcula el alto según la proporción recién elegida, igual criterio que ya aplica `ui/componentModal.js` fuera del editor al cambiar la Proporción desde la pestaña "Específicas" (mismo patrón, sin introducir uno nuevo). Esto es lo único que hace que elegir una forma distinta dentro del editor cambie la silueta del lienzo — el resto del tiempo, el lienzo es siempre el tamaño real de la carta.
- Quitar `getDesignSize` del `import` de `../core/cardProportions.js` (eliminada en la tarea 1).
- Sin cambios en la lógica de `showProporcionSelector` para la *forma* (`getCartaShapeCss`/`isRectShape`/`getHexInnerClipPath`/`getTriangleInnerClipPath`, líneas ~293-294/465-466/621-622/663-664): el desplegable "Proporción" sigue decidiendo exactamente igual la silueta/recorte, solo cambia de dónde sale el tamaño numérico del lienzo.
- Sin cambios en `onAccept` (línea ~1150): sigue devolviendo `proporcion`/`esquinasRedondeadas` sin `designWidth`/`designHeight` — `ui/componentModal.js` ya recalcula `component.height` a partir de `component.width` (sin tocar) y la `proporcion` devuelta (líneas ~1240-1242), con la misma fórmula que la tarea usa dentro del editor (`width` fijo, `height = width / ratio`), así que ambos cálculos coinciden siempre sin necesidad de sincronizarlos explícitamente.

### 4. `ui/mazoContentModal.js` — miniatura de cara frontal en la lista de contenido del mazo

- Sustituir `paintCartaFace(thumb, carta.properties?.caraFrontal, THUMB_WIDTH / CARD_DESIGN_WIDTH, THUMB_WIDTH, THUMB_HEIGHT);` por una escala calculada sobre el ancho real de esa carta: `const renderScale = THUMB_WIDTH / (carta.width || THUMB_WIDTH);` seguido de `paintCartaFace(thumb, carta.properties?.caraFrontal, renderScale, THUMB_WIDTH, THUMB_HEIGHT);` — mismo criterio de "encajar el diseño real en una caja de miniatura fija" que la tarea 2 aplica al mazo en la mesa.
- Quitar el `import` de `CARD_DESIGN_WIDTH` (ya no se usa en este fichero).

### 5. `core/fichaMigration.js` — el `'ficha'` migrado a `'carta'` nace ya en píxeles reales

- `migrateFichaProperties(fichaProperties, componentSize)`: nuevo segundo parámetro `{ width, height }` (tamaño real del componente `'ficha'` que se está convirtiendo, siempre presente — este tipo también nacía con tamaño fijo). En la rama `fondoTipo === 'texto'`, sustituir `const height = CARD_DESIGN_WIDTH / getProporcionRatio(proporcion);` y el `TextBox` con `width: CARD_DESIGN_WIDTH, height` por `width: componentSize.width, height: componentSize.height` directamente (el cuadro de texto sigue ocupando toda la carta, ahora expresado en píxeles reales en vez de unidades de diseño).
- Añadir `medidasReales: true` al objeto `cartaProperties` devuelto — el resultado de esta migración ya nace en píxeles reales, así que no debe volver a pasar por la migración de la tarea 6.
- `migrateFichaComponent(component)`: pasar `{ width: component.width, height: component.height }` como segundo argumento a `migrateFichaProperties`.
- Quitar `CARD_DESIGN_WIDTH`/`getProporcionRatio` del `import` de `./cardProportions.js` (ya no se usan en este fichero).

### 6. `core/state.js` — migración puntual de cartas guardadas antes de este cambio

- Nueva función `migrateCartaMedidasReales(components)`, mismo patrón (`for` in-place, best-effort, nunca lanza) que `migrateFichas`/`migrateBloqueado` etc.:
  - Para cada componente con `type === 'carta'` cuyas `properties.medidasReales` no sea ya `true`:
    - Calcular `factor = component.width / CARD_DESIGN_WIDTH` (con fallback a `1` si `width` no fuera un número positivo — no debería ocurrir, pero evita `NaN`/`Infinity` en datos corruptos). Se usa un único factor para ambos ejes porque así es exactamente como pintaba hoy `ui/componentRenderer.js` antes de la tarea 2 (`renderScale` único basado solo en el ancho, aplicado uniformemente a x/y/width/height/tamañoFuente vía `paintCartaFace`) — reproducir ese mismo factor es lo que garantiza que el diseño se vea igual que antes de migrar.
    - Para `caraFrontal` y `caraTrasera` (si existen): multiplicar por `factor` los campos `x`, `y`, `width`, `height` de cada elemento de `formas` y `textBoxes`, y además `tamañoFuente` de cada `textBox`.
    - Marcar `properties.medidasReales = true` al terminar (para ambas caras a la vez, es un único flag a nivel de componente, no por cara).
  - Los componentes recién convertidos desde `'ficha'` (tarea 5, ya con `medidasReales: true`) se saltan sin tocar.
- Añadir la llamada dentro de `loadComponents(components)`, después de `migrateFichas(components)` (debe ejecutarse después, para no reinterpretar dos veces el contenido de una ficha recién convertida) y antes de `compactOrders`.
- Importar `CARD_DESIGN_WIDTH` desde `./cardProportions.js` en `core/state.js`.

### 7. `ui/componentModal.js` — las cartas nuevas nacen ya en píxeles reales

- Añadir `medidasReales: true` a `DEFAULT_CARTA_PROPERTIES` — una carta creada desde ahora en adelante no necesita ninguna migración futura.

## (c) Cambios de arquitectura

En `ARCHITECTURE.md`:

- Sección 4, entrada `'carta'`: sustituir la frase "un editor dedicado" y la explicación de `TextBox`/`Forma` en "unidades de diseño" reescaladas por un único `renderScale` uniforme — pasan a guardarse en píxeles reales, fijos con independencia del tamaño de la carta (mismo criterio ya documentado para `'tableroPersonalizado'`, cambio 00152): redimensionar una carta cambia solo el tamaño del marco, nunca el tamaño/posición de su contenido, que puede quedar recortado por el `overflow: hidden` del marco si no cabe. El lienzo del Editor visual (`ui/visualEditorModal.js`) representa, en consecuencia, el tamaño real de la carta en el momento de abrirla — cambiar el desplegable "Proporción" dentro del editor solo cambia la forma/silueta (recorte) y recalcula el alto a partir del ancho actual y la proporción elegida, sin volver a un lienzo de tamaño fijo. Añadir la mención de `properties.medidasReales` (boolean, `true` en cartas nuevas o ya migradas — ver `core/state.js`), interno, no editable desde ninguna modal.
- Sección 4, entrada `'mazo'`: actualizar la fórmula de escala del renderizado de la cara trasera de la carta de arriba (`paintCartaFace(contentParent, cara, renderScale, faceWidth, faceHeight)`) — `renderScale` pasa a calcularse sobre el ancho real de esa carta (`width / cartaArriba.width`) en vez de sobre `CARD_DESIGN_WIDTH`.
- Sección 4.3 (migración de `'ficha'`): actualizar la descripción de `fondoTipo === 'texto'` — el `TextBox` resultante ocupa el tamaño real del componente migrado (`width`/`height`), no `CARD_DESIGN_WIDTH`/ratio.
- Sección 5 (`core/cardProportions.js`): quitar la mención a `getDesignSize` (eliminada); `CARD_DESIGN_WIDTH` pasa a describirse como una referencia histórica usada solo por la migración puntual de cartas guardadas antes de este cambio (`core/state.js`).
- Sección 6.1 o donde se documenten las migraciones silenciosas de `core/state.js`: añadir `migrateCartaMedidasReales` a la lista, junto a `migrateFichas`/`migrateBloqueado`/etc., con una frase breve de qué hace y por qué (reproducir visualmente el mismo resultado que antes del cambio 00151, expresado ya en píxeles reales).
