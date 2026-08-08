- **Nombre**: Nuevo elemento Meeple
- **Código**: `00162`
- **Tipo**: change
- **Fecha creación**: 2026-08-06

## Descripción completa

Se añade un nuevo tipo de elemento, "Meeple", como opción más al crear un componente nuevo. No sustituye ni modifica ningún elemento existente: convive con todos los tipos actuales.

Un Meeple es, en esencia, una pieza que muestra únicamente una imagen recortada a una forma, sin ninguna caja ni color de fondo propio detrás. Este es el caso de uso principal del elemento: si la imagen elegida tiene fondo transparente (p. ej. un recurso PNG con esa transparencia), esa transparencia se respeta tal cual al mostrarla sobre la mesa — se ve lo que haya debajo en cada momento (el color/patrón de la mesa, u otro elemento si el meeple está encima de él), sin que el meeple tape esa zona con ningún relleno propio. Esto lo diferencia de todos los elementos actuales con imagen, que siempre pintan algo (aunque sea blanco) detrás de la imagen, y significa que un mismo meeple se ve distinto según qué haya debajo, ya que no aporta ningún fondo propio.

**Contenido de imagen**: se elige una imagen de la galería de recursos ya existente en el proyecto, y se puede ajustar su zoom, posición y rotación dentro de la forma del Meeple — con los mismos controles de ajuste de imagen que ya se usan en otros elementos del proyecto.

**Forma y redimensionado**: el Meeple se puede redimensionar libremente en la mesa. Admite tres formas/proporciones a elegir: cuadrada, rectangular y circular. Con forma cuadrada o rectangular, el redimensionado mantiene siempre esa proporción. Con forma circular, el redimensionado es libre en ambos ejes, pudiendo obtener también un óvalo.

**Borde opcional**: se puede añadir un borde simple (color y grosor configurables) alrededor de la forma del Meeple. Por defecto no lleva borde.

**Sin editor de diseño avanzado**: a diferencia de otros elementos con imagen del proyecto, el Meeple no permite añadir formas o cuadros de texto adicionales por encima de la imagen — su configuración es directa (elegir imagen, ajustarla, elegir forma, borde opcional), sin abrir un editor de lienzo aparte.

**Estado sin imagen**: si el Meeple no tiene ninguna imagen configurada, en modo edición se muestra con un contorno discontinuo neutro para poder localizarlo y seleccionarlo aunque esté "vacío"; en modo juego, sin imagen no se dibuja nada visible.

**Tamaño y creación**: se crea con un tamaño inicial fijo, de forma cuadrada por defecto, igual que el resto de elementos con tamaño fijo del proyecto (nunca se ajusta automáticamente al contenido).

**Comportamiento general**: el Meeple se comporta como cualquier otro elemento del proyecto en todo lo demás — se puede bloquear, ocultar, agrupar, mover, seleccionar, eliminar, clonar y copiar igual que los demás. No tiene ninguna interacción propia de click (no se voltea, no se lanza, no reparte cartas), igual que otros elementos sencillos ya existentes (tablero, documento, texto).

### Preguntas de alcance resueltas con el usuario

- **¿Qué significa "aplicar transparencia respetando los píxeles transparentes"?** → No hay ningún relleno de fondo: se ve solo la imagen con su transparencia nativa, sin recorte adicional por análisis de píxeles.
- **¿Una o dos caras (como una carta que se voltea)?** → Una sola cara, sin volteo.
- **¿Redimensionado libre o con proporción fija?** → Proporción fija (según la forma elegida), salvo en forma circular, donde es libre.
- **¿Editor de diseño avanzado (formas y textos adicionales) o configuración simple?** → Configuración simple, sin editor de lienzo aparte.
- **¿Lleva borde?** → Sí, opcional (sin borde por defecto).
- **¿Qué formas/proporciones admite?** → Un subconjunto reducido: cuadrada, una rectangular estándar y circular (no incluye las variantes de tarot, hexagonal o triangular que sí tienen otros elementos del proyecto).

## Apuntes técnicos

Contexto reunido con `ms-internal-tech-analysis` (documentación técnica + `ARCHITECTURE.md` sección 4, sin incongruencias documentación/código detectadas):

- Nuevo `type: 'meeple'`, noveno tipo de componente junto a `'texto'`, `'tableroSimple'`, `'dado'`, `'documento'`, `'carta'`, `'mazo'`, `'tableroPersonalizado'`. Se añade a la lista de `ui/componentTypeModal.js`.
- Reutiliza infraestructura ya existente, sin necesidad de construir nada nuevo de bajo nivel salvo el propio renderizado "sin caja de fondo":
  - `properties.imagenResourceId` + `properties.ajusteImagen: { zoom, posX, posY, rotation }` — mismo shape que `cara.ajusteImagen` de `'carta'`/`'tableroPersonalizado'`/`Forma`, editable con `ui/imageAdjustModal.js` reutilizado tal cual.
  - Selector de imagen: mismo patrón que `ui/boardImageModal.js` (usado hoy por `'tableroSimple'`).
  - `properties.proporcion`: subconjunto de tres valores del catálogo de `core/cardProportions.js` (`'1:1'`, una rectangular tipo `'5:7'`, y `'circular'`) — reutiliza `getCartaShapeCss`/`getProporcionRatio` y el mismo criterio de `ui/resizeHandle.js` que ya usa `'carta'` (ratio fijo salvo circular, libre con Shift para forzar 1:1).
  - `properties.bordeColor`/`properties.bordeGrosor`: mismo naming y criterio que el borde simple de `'carta'` (línea simple sin bisel, `bordeGrosor: 0` por defecto = sin borde) — no el bisel de dos tonos de `'tableroSimple'`/`'tableroPersonalizado'`/`'dado'`.
  - Tamaño por defecto fijo (p.ej. `120×120px`, proporción `'1:1'` por defecto), mismo criterio que el resto de tipos con tamaño fijo (`width`/`height` nunca `null`).
  - No usa `ui/visualEditorModal.js` (sin `formas`/`textBoxes` apilables) — configuración directa en una pestaña propia de `ui/componentModal.js`.
- **Pieza genuinamente nueva** (sin precedente ya construido en el proyecto): el renderizado sin ninguna caja/color de fondo detrás de la imagen — hoy todos los tipos con imagen (`'tableroSimple'`, `'carta'`, `'tableroPersonalizado'`) pintan siempre algo detrás (blanco si no hay imagen o color/patrón configurado). `ms-how` deberá decidir cómo aplicar el recorte de forma (`clip-path`/`border-radius` según proporción) directamente sobre la imagen, sin contenedor de fondo pintado.
- No requiere diagrama de flujo Mermaid: el flujo de alta (`componentTypeModal` → `componentModal` con pestaña específica) es el mismo patrón genérico que ya usan los demás tipos, sin secuencia de pasos/decisiones propia que representar.
