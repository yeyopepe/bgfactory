- **Nombre**: Proporción circular para el componente "carta"
- **Código**: 00071
- **Tipo**: change

## Prompt original del usuario

añade la proporción circular a las cartas

## Descripción completa

Se añade una nueva opción "Circular" al catálogo de proporciones disponibles para el componente "carta" (hoy: Poker vertical 5:7, Poker horizontal 7:5, Tarot vertical, Tarot horizontal, Cuadrada 1:1 — todas rectangulares con esquinas redondeadas fijas). A diferencia de esas cinco, que mantienen siempre un ratio ancho/alto fijo al redimensionar en la mesa (no se puede cambiar arrastrando el manejador, solo cambiando la propiedad "Proporción"), la proporción "Circular" no fuerza ningún ratio: el usuario puede redimensionar la carta libremente en ambos ejes (como ya ocurre con "tablero"/"ficha"/"Visor de documentos"), pudiendo convertirla en una elipse si ancho y alto dejan de coincidir. Al crearse una carta con esta proporción, nace con ancho = alto (círculo perfecto). Redimensionar manteniendo pulsada la tecla Shift fuerza un aspecto 1:1 (círculo perfecto) mientras se arrastra, mismo criterio que ya aplica Shift a "tablero"/"ficha"/"Visor de documentos"/"cuadro de texto".

Visualmente, en vez del rectángulo con esquinas ligeramente redondeadas que tienen el resto de proporciones, una carta con proporción "Circular" se recorta como una forma redonda completa (círculo si ancho = alto, óvalo si no coinciden), tanto en modo juego como en modo edición.

El editor de cartas (ventana modal donde se diseñan las dos caras: imagen de fondo y cuadros de texto) también refleja el recorte circular en el lienzo de cada cara cuando la proporción activa es "Circular", para que el usuario vea de inmediato qué parte del contenido queda dentro de la forma redonda y cuál se recorta — igual que el resto de proporciones ya muestran su forma real (rectángulo) en ese mismo editor. El ajuste de imagen de fondo de cada cara (mover/hacer zoom) respeta igualmente esa forma circular al mostrar la vista previa recortada.

No cambia nada del resto de proporciones existentes, ni de la convivencia con mazos, volteo de cara, bloqueado, "subir al mover/interactuar", ni con el resto de tipos de componente. Los cuadros de texto y la imagen de cada cara se guardan igual — la proporción "Circular" es solo un valor más de la propiedad de proporción, sin cambiar el modelo de datos existente.

### Dudas de alcance resueltas con el usuario

- **Qué es "proporción circular"**: nueva opción "Circular" en el catálogo de proporciones (no sustituye a "Cuadrada", que se mantiene igual como opción rectangular con esquinas redondeadas).
- **Ratio forzado al redimensionar**: NO se fuerza ningún ratio fijo (a diferencia de las otras 5 proporciones) — el usuario puede estirarla libremente y convertirla en óvalo; por defecto nace como círculo perfecto (ancho=alto). Shift durante el redimensionado fuerza círculo perfecto, igual que en otros tipos de resize libre.
- **Editor de cartas**: el lienzo de cada cara debe mostrar ya el recorte circular (no un rectángulo con el recorte aplicado solo al renderizar en la mesa).

## Apuntes técnicos

- Incongruencia de documentación detectada (no corregida en este documento, pendiente de aplicar cuando se planifique/implemente): `design/docs/FEATURES.md`, sección "Componente carta", describe el catálogo de proporciones como "cuadrada, horizontal/vertical 2:1, vertical estándar tipo póker 2:3 por defecto, horizontal estándar 3:2, y vertical clásica de coleccionables 5:7". Esto no coincide con el código real (`src/core/cardProportions.js`), que define `CARD_PROPORTIONS` como: `'5:7'` (Poker vertical, por defecto), `'7:5'` (Poker horizontal), `'tarot-h'` (Tarot vertical, 70×120mm), `'tarot-v'` (Tarot horizontal, 120×70mm), `'1:1'` (Cuadrada) — que sí coincide con `design/docs/ARCHITECTURE.md`. El código manda: `FEATURES.md` debería actualizarse para listar estas 5 proporciones reales (más la nueva "Circular" que añade este cambio), no las que describe actualmente.
- El recorte visual actual de "carta" usa `border-radius: 8px` fijo en `src/ui/componentRenderer.js` (elemento `.carta` y su contenedor de contenido interno), independientemente de la proporción elegida. Este cambio necesita condicionar ese `border-radius` (8px vs 50%) según si `properties.proporcion === 'circular'`.
- El resize de "carta" mantiene siempre el ratio de `getProporcionRatio(props.proporcion)` (`src/core/cardProportions.js`) vía `attachResizeHandle` en `src/ui/componentRenderer.js`, ignorando Shift (a diferencia de "tablero"/"ficha"/"Visor de documentos"/"cuadro de texto", que sí escuchan Shift para forzar 1:1 desde el cambio 00049). Para "Circular" hace falta el comportamiento de resize libre (con Shift forzando 1:1), no el actual de "carta".
- El componente "ficha" ya tiene un precedente directo para forma circular: propiedad `forma: 'cuadrada'|'circular'` con `border-radius: 50%|0`, y su editor de ajuste de imagen (`src/ui/imageAdjustModal.js`) ya sabe recortar en circular. Puede servir de referencia de patrón para "carta", aunque en "carta" es un valor del catálogo de proporciones (`properties.proporcion`), no una propiedad de forma independiente como en "ficha".
- `src/ui/cardEditorModal.js` es el editor de cartas (lienzo de cada cara, cuadros de texto) y usa `core/cardProportions.js` (`CARD_PROPORTIONS`, `getProporcionRatio`, `getDesignSize`) para calcular el tamaño de diseño de cada cara; el recorte circular del lienzo tendría que aplicarse ahí también.
