- **Name**: El lienzo del editor visual aprovecha todo el espacio de la ventana al maximizar/redimensionar
- **Code**: 00235
- **Type**: fix
- **Creation date**: 2026-09-02

## Full description

Continuación de los cambios 00225 y 00233 (la ventana del editor visual de cartas y de tableros personalizados se puede maximizar y redimensionar a mano con manejadores de esquina). Se ha detectado que el lienzo de diseño no crece lo suficiente para aprovechar el espacio de la ventana:

### Qué falla

- **Al redimensionar la ventana del editor con los manejadores de esquina**, el lienzo de la cara no crece para ocupar el espacio nuevo: queda un área en blanco grande alrededor (sobre todo debajo del lienzo). Es especialmente visible con un tablero personalizado apaisado de una sola cara: con la ventana casi a pantalla completa, el lienzo ocupa solo la mitad superior y el resto queda vacío.
- **Al pulsar "Maximizar"**, tampoco se aprovecha el tamaño casi de pantalla completa que le corresponde a ese estado: la ventana sí pasa a ocupar casi toda la pantalla, pero el lienzo dentro se queda pequeño, con mucho espacio sin usar alrededor.
- El comportamiento esperado ya está descrito en la documentación del editor ("el área de cada cara crece / escala para aprovechar el espacio"), pero no se cumple para diseños apaisados ni, en general, cuando la ventana es mucho más grande que el lienzo: el escalado actual solo tiene en cuenta la dimensión más larga del diseño y unos topes pensados para dos cartas verticales, así que deja espacio libre en la otra dimensión.

### Qué se espera

Tanto al redimensionar con las anclas como al maximizar, el lienzo —o los dos lienzos, en el caso de la carta— debe **escalar para ocupar todo el área interior disponible de la ventana**: tanto el ancho como el alto del contenido, descontando la cabecera, el pie, la barra de herramientas y un pequeño margen, manteniendo su proporción. Un diseño apaisado usará casi todo el ancho disponible; uno vertical, casi todo el alto. Se aplica igual con una cara (tablero personalizado) y con dos (carta): en el caso de la carta, las dos caras siguen mostrándose una al lado de otra y alineadas (sin apilarse, fix 00233), ahora encajando también en alto.

El resto del comportamiento del editor no cambia: la ventana sigue sin bajar de su tamaño mínimo ni salirse del área visible del navegador; "Restaurar" sigue devolviendo la ventana a su tamaño por defecto (fix 00233); y ni el tamaño maximizado ni el elegido a mano se recuerdan entre aperturas.

### Preguntas de alcance resueltas con el usuario

- **¿Hasta dónde debe crecer el lienzo al "aprovechar al máximo" la ventana?** Confirmado: encajar en el ancho **y** el alto disponibles del área interior de la ventana (menos cabecera/pie/toolbar y un pequeño margen), manteniendo la proporción del diseño. Aplica tanto al caso de una cara (tablero personalizado) como al de dos caras (carta), no solo al primero.

## Technical notes

- Ficheros implicados: `src/ui/visualEditorModal.js` (función `getEffectiveCanvasMaxSide()` y su uso en `renderFace()` / `previewScale`; ramas `maximized` y `manualSize`; constantes `CANVAS_MAX_SIDE = 380`, `EDITOR_CHROME_V = 210`, `EDITOR_CHROME_H = 200`) y posiblemente `src/styles/main.css` (`.card-editor-modal--maximized`: `max-width: 90vw; max-height: 90vh`; `.modal__content`: `flex: 1; overflow-y: auto`; `.modal`: `max-height: 80vh`).
- **Causa raíz**: `getEffectiveCanvasMaxSide()` devuelve un único "lado" máximo, y `renderFace()` calcula `previewScale = lado / Math.max(designWidth, designHeight)` — es decir, solo ajusta la dimensión **más larga** del diseño a ese lado. Para un diseño apaisado de una sola cara, el lado gobierna el ancho del lienzo y la altura resultante (`designHeight / designWidth * lado`) queda mucho menor, dejando hueco vertical. Además los topes actuales (`window.innerWidth * 0.42`, `CANVAS_MAX_SIDE * 3 = 1140`, y `window.innerHeight * 0.7` en la rama `maximized`) se calibraron para el caso de dos cartas verticales y no reflejan el área interior real de la modal maximizada o con tamaño manual.
- **Enfoque de solución previsto (a concretar en el plan)**: en las ramas `maximized` y `manualSize`, derivar el tamaño del lienzo del **área interior real disponible** de `.modal__content` (ancho y alto), descontando el cromo, y escalar cada lienzo para encajar en la caja (ancho **y** alto) que le corresponde — repartiendo el ancho entre `faces.length` caras — manteniendo la proporción del diseño, en vez de topar solo el lado más largo con constantes fijas. La rama por defecto (sin maximizar ni tamaño manual) puede quedarse como está.
- El fix 00233 introdujo `availableByWidth = (manualSize.width - EDITOR_CHROME_H) / faces.length` en la rama `manualSize` para que las dos caras no se apilen; ese criterio de reparto de ancho por cara sirve de base, pero hay que añadir el equivalente en alto y hacerlo también para la rama `maximized`.
- Sin puntos de seguridad pendientes: cambio puramente de layout de UI en un editor local del navegador, sin red, sin entrada de usuario que llegue a un parser/consulta, sin datos sensibles ni dependencias nuevas.
- Alcance estrictamente acotado a corregir el aprovechamiento del espacio del lienzo al maximizar/redimensionar; no se refactoriza ni se toca nada ajeno a esa causa.
