- **Nombre**: Configuración de borde y fondo en los cuadros de texto del editor de cartas
- **Código**: 00072
- **Tipo**: change

## Prompt original del usuario

"añade en el editor de cartas las siguientes funcionalidades a los cuadros de texto:
- configuración del borde  (con un check):
   - color, grosor y tipo de linea (continua, punteada) del borde
- configuración del color de fondo (vacio = transparente)"

"Añade también en la configuración el borde de la carta completa: grosor y color."

"Añade también, para la imagen de cada cara de la carta, un valor de transparencia (0% por defecto)"

"También añade que en los botones que ahora dicen "+ Cuadro de texto", cámbialos por "+ Texto""

"Actualiza también las propiedades de los siguientes elementos para crear las siguientes secciones de propiedades:
- Tablero: sección borde
- Ficha: secciones Fondo y Borde"

## Descripción completa

En el editor de cartas (el sub-modal que se abre con doble click sobre un cuadro de texto de una cara), se añaden dos bloques nuevos de configuración a cada cuadro de texto, después del campo "Color" ya existente:

1. **Borde**: un check "Activar borde" que, marcado, muestra tres controles adicionales:
   - Color del borde (selector de color, negro por defecto).
   - Grosor del borde en píxeles, de 1 a 20 (2 por defecto) — color y grosor se muestran en la misma fila.
   - Tipo de línea: desplegable con dos opciones, "Continua" (por defecto) y "Punteada".

   Si el check está desmarcado (por defecto, incluidos los cuadros de texto ya existentes antes de este cambio), el cuadro de texto no muestra ningún borde, y los valores de color/grosor/tipo de línea configurados previamente no se pierden (se conservan aunque el check esté desmarcado, para no perder la configuración si se vuelve a activar).

2. **Color de fondo**: un selector de color junto a un check "Transparente". Si "Transparente" está marcado (por defecto, incluidos los cuadros de texto ya existentes), el cuadro de texto no tiene ningún color de fondo (se ve la carta a través suyo). Si se desmarca, se aplica el color elegido en el selector como fondo del cuadro de texto, detrás del texto.

Ambas configuraciones son propias de cada cuadro de texto (no se comparten entre cuadros de texto ni entre caras de la misma carta ni entre cartas), y se aplican tanto en la vista previa del propio editor de cartas como en el renderizado final de la carta sobre la mesa (modo edición y modo juego).

### Ampliación: borde de la carta completa

Además del borde de cada cuadro de texto (arriba), se añade una configuración de borde para el contorno exterior de la carta en sí (el rectángulo/círculo completo de la carta, no un cuadro de texto).

3. **Borde de la carta**: dentro del editor de cartas, en la sección propia de cada cara (frontal y trasera), un control con un selector de color y un campo numérico de grosor en píxeles (0 a 20, 0 por defecto). Grosor `0` significa "sin borde" (no hay checkbox de activación aparte, a diferencia del borde de cuadro de texto): basta con subir el grosor por encima de 0 para que el borde se muestre, y volver a bajarlo a 0 para quitarlo sin perder el color configurado.

Al ser un control por cara, la carta puede tener un borde distinto en su cara frontal y en su cara trasera (igual que el resto de la configuración de cada cara: imagen, ajuste de imagen y cuadros de texto son ya propios de cada cara, no compartidos).

El borde se dibuja como línea simple (color + grosor), sin ningún efecto de bisel o relieve (esa técnica queda reservada a "Tablero"/"Dado", igual que se indica más abajo para el borde de cuadro de texto), y respeta la forma de la carta: esquinas redondeadas o círculo/óvalo completo según la proporción configurada (`proporcion === 'circular'`), igual que ya ocurre con el resto del contorno de la carta.

### Ampliación: transparencia de la imagen de cada cara

Además del borde (arriba), se añade a cada cara (frontal y trasera) un valor de transparencia para su imagen, independiente entre caras.

4. **Transparencia de imagen**: dentro del editor de cartas, en la sección propia de cada cara, junto al resto de configuración de la imagen de esa cara (elegir imagen / ajustar imagen), un control de transparencia de 0% a 100% (0% por defecto). `0%` significa "imagen totalmente opaca" (sin cambio visual respecto a hoy); a medida que sube el valor, la imagen se vuelve más transparente hasta desaparecer del todo en `100%`.

Este control solo afecta a la imagen de fondo de la cara: no afecta al color de fondo blanco de la carta, a los cuadros de texto ni al borde de carta (arriba). El control solo tiene sentido, y por tanto solo se muestra, si esa cara tiene una imagen elegida; al no haber imagen no hay nada que hacer transparente. Al elegir o cambiar la imagen de una cara, la transparencia se reinicia a `0%` (mismo criterio ya usado para el ajuste de posición/zoom de esa imagen, que también se reinicia al cambiar de imagen).

### Ampliación: renombrado del botón "+ Cuadro de texto"

Sin relación funcional con lo anterior: en el editor de cartas, el botón que añade un cuadro de texto nuevo a una cara pasa de decir "+ Cuadro de texto" a decir "+ Texto" (mismo botón, mismo comportamiento, solo cambia la etiqueta visible). Aparece dos veces, una por cada cara (frontal y trasera).

### Ampliación: secciones de propiedades en "Tablero" y "Ficha"

Sin relación funcional con lo anterior (no añade ningún campo ni comportamiento nuevo): en la modal de propiedades de componente (pestaña "Específicas"), los campos ya existentes de borde y fondo de los tipos "Tablero" y "Ficha" se reorganizan visualmente en bloques encuadrados, con el mismo criterio de agrupación visual ya introducido en esta misma entrada para los cuadros de texto de carta (bloques "Borde"/"Fondo" con marco propio).

5. **Tablero**: los campos ya existentes "Color del borde" y "Grosor" (fila única, sin cambios en su comportamiento) pasan a mostrarse dentro de un bloque encuadrado y titulado "Borde". El campo "Fondo" (selector "Color y patrón"/"Imagen" y su configuración) no cambia de comportamiento, pero pasa a mostrarse dentro de su propio bloque encuadrado, sin título (para mantener el mismo lenguaje visual que el resto de la pestaña).
6. **Ficha**: los campos ya existentes "Fondo" (selector Color sólido/Texto/Imagen) y "Color de fondo" (selector de color + checkbox "Transparente") pasan a mostrarse juntos dentro de un bloque encuadrado y titulado "Fondo". Los campos ya existentes "Color del borde" y "Grosor" (fila única) pasan a mostrarse dentro de un bloque encuadrado y titulado "Borde". El campo ya existente "Forma" pasa a mostrarse dentro de su propio bloque encuadrado, sin título.

En los dos bloques titulados de cada tipo, el título es meramente informativo (no lleva checkbox de activación/desactivación): ninguno de estos bordes tiene hoy un check que los active o desactive por completo (el de "Tablero" siempre está presente, el de "Ficha" ya se desactiva por sí solo poniendo el grosor a `0`), así que no aplica el otro tipo de título de sección ("des/activador") que sí usa el bloque "Borde" de los cuadros de texto de carta (arriba). Los bloques sin título ("Fondo" de "Tablero", "Forma" de "Ficha") llevan el mismo marco pero, al no tener nada que activar/desactivar ni que nombrar, no llevan ningún texto de título.

### Casos límite

- Cuadro de texto nuevo: se crea con el check de borde desmarcado y con fondo transparente (mismo comportamiento que hoy, sin cambios visibles hasta que el usuario active alguna de las dos configuraciones).
- Cuadros de texto guardados antes de este cambio (sin estos campos): se comportan como si ambos estuvieran desmarcados/transparente, igual que un cuadro de texto nuevo.
- El borde de este cuadro de texto es una línea simple (color + grosor + estilo continua/punteada), sin ningún efecto de bisel o relieve — esa técnica está reservada a los tipos de componente "Tablero" y "Dado" y no se extiende aquí.
- Esta configuración es exclusiva de los cuadros de texto del editor de cartas; no afecta al componente suelto de tipo "Texto" que se coloca directamente sobre la mesa (que ya tiene su propio color de fondo, sin esta ampliación).
- Carta nueva o cara sin borde configurado (cartas guardadas antes de esta ampliación): grosor `0`, sin ningún efecto visual respecto a hoy.
- El borde de la carta completa es independiente del borde de los cuadros de texto: cada uno se configura y se dibuja por separado, y pueden convivir sin conflicto (un cuadro de texto con su propio borde, dentro de una carta que también tiene borde propio).
- Carta nueva, cara sin imagen o cara sin transparencia configurada (cartas guardadas antes de esta ampliación): `0%`, sin ningún efecto visual respecto a hoy.
- La transparencia de imagen es independiente del borde de cuadro de texto, del fondo de cuadro de texto y del borde de carta: los cuatro conviven sin conflicto, cada uno se configura y se aplica por separado.
- La reorganización de "Tablero"/"Ficha" en secciones es puramente visual: ningún valor guardado cambia, ni de aspecto ni de dato — un componente guardado antes de esta ampliación se ve exactamente igual salvo por el título de sección y el separador añadidos encima de los campos ya existentes.

### Convivencia con lo existente

No sustituye nada: es una ampliación de las propiedades ya existentes de cada cuadro de texto (contenido, tipografía, tamaño, color de texto), sin afectar a los demás tipos de componente.

### Alcance de los datos

Estas configuraciones se guardan como parte de los datos de cada cuadro de texto, dentro de los datos de la carta (autoguardado igual que el resto del estado del proyecto).

### Quién puede usarlo

Cualquier usuario en modo edición, igual que el resto de la configuración de cuadros de texto de carta.

### Definición visual de alto nivel

- Dentro del sub-modal de edición de cuadro de texto, tras el campo "Color" actual, aparece un bloque "Borde": la sección entera queda encuadrada (marco alrededor de todos sus campos, no solo un título con una línea encima), con el título "Borde" integrado en el propio marco (junto con el checkbox "Activar borde"), en un tono violeta/índigo apagado propio de este título (distinto del azul de acento ya usado para botones/selección, y más marcado que el gris neutro de bordes normales); dentro del marco, solo visible/habilitado si está marcado, una fila con selector de color y campo numérico de grosor (mismo patrón ya usado para el borde de "Tablero"/"Ficha"), y debajo un desplegable con el tipo de línea (Continua/Punteada).
- A continuación, un bloque "Fondo": mismo criterio de marco (sección entera encuadrada) con el título "Fondo" integrado, en el mismo tono violeta/índigo (aquí sin checkbox); dentro, una fila con selector de color y checkbox "Transparente" al lado (mismo patrón ya usado en "Ficha" y en el componente "Texto" de la mesa).
- El resultado se refleja de inmediato en la vista previa del propio editor de cartas y, al guardar, en el renderizado de la carta sobre la mesa.
- Borde de la carta completa: dentro de cada sección de cara (frontal/trasera) del editor de cartas, junto a las demás acciones de esa cara ("Elegir imagen…"), un control "Borde" con selector de color y campo numérico de grosor (mismo patrón "color y grosor en la misma fila" ya usado en "Ficha"/"Tablero"). Al cambiar el grosor por encima de 0 aparece de inmediato el borde en la vista previa de esa cara dentro del editor; al guardar, se refleja también en el renderizado de la carta sobre la mesa.
- Transparencia de imagen: dentro de cada sección de cara, junto a la imagen elegida ("Elegir imagen…"/"Ajustar imagen…"), solo visible si esa cara tiene imagen, un control "Transparencia" con slider de 0% a 100% y campo numérico junto a un símbolo "%" (mismo patrón ya usado para "Zoom" en el ajuste de imagen). Al mover el slider, la imagen se ve de inmediato más o menos transparente en la vista previa de esa cara dentro del editor; al guardar, se refleja también en el renderizado de la carta sobre la mesa.
- Renombrado de botón: el botón "+ Cuadro de texto" de cada cara pasa a decir "+ Texto", sin ningún otro cambio visual ni de comportamiento.
- Secciones de "Tablero"/"Ficha": en la pestaña "Específicas" de la modal de propiedades, los campos "Color del borde"+"Grosor" de "Tablero" quedan dentro de un marco titulado "Borde" (sección entera encuadrada, no solo un título con línea encima), sin ningún checkbox de activación. En "Ficha", los campos "Fondo"+"Color de fondo" quedan dentro de un marco titulado "Fondo", y los campos "Color del borde"+"Grosor" dentro de un marco titulado "Borde", ambos igualmente sin checkbox de activación. Además, los campos de estos dos tipos que no forman parte de ninguna sección nueva ("Fondo" de "Tablero" — el selector "Color y patrón"/"Imagen" — y "Forma" de "Ficha") quedan igualmente encuadrados con el mismo estilo de marco, pero sin título — como si fueran una sección más, solo que sin nombre, para que toda la pestaña "Específicas" mantenga un mismo lenguaje visual de bloques encuadrados. Ningún campo cambia de orden relativo entre sí dentro de su bloque, ni de comportamiento — solo se añade el marco (y el título, cuando lo lleva) alrededor de los campos ya existentes.

## Apuntes técnicos

- El modelo `TextBox` (documentado en `ARCHITECTURE.md` sección 4, tipo `'carta'`) es hoy `{ id, contenido, fuenteResourceId, tamañoFuente, color, x, y, width, height }`, sin ningún campo de borde/fondo. Este cambio le añade: `bordeActivo` (boolean, false por defecto), `bordeColor` (string hex, negro por defecto), `bordeGrosor` (number px, 1–20, 2 por defecto), `bordeTipo` (`'continua' | 'punteada'`, `'continua'` por defecto) y `colorFondo` (string hex o vacío, vacío/transparente por defecto) — mismo naming y semántica que las propiedades equivalentes ya usadas en los tipos `'tablero'`/`'ficha'` (`bordeColor`/`bordeGrosor`) y `'ficha'`/`'texto'` (`colorFondo` vacío = transparente).
- Editor de la propiedad: `src/ui/cardTextBoxModal.js` (sub-modal, tras el campo "Color" existente), reutilizando el patrón "color + grosor en la misma fila" y el patrón "color + checkbox Transparente" ya documentados en `STYLE_BIBLE.md` sección 8, tal como ya se implementan en `src/ui/componentModal.js` para `'tablero'`/`'ficha'`.
- Los bloques "Borde" y "Fondo" son el primer uso del nuevo patrón `.modal__section` documentado en `STYLE_BIBLE.md` sección 12.6 (agrupación visual de campos dentro de una pestaña/sub-modal) — cada bloque debe implementarse como un `.modal__section` propio, no como un `<div>` ad-hoc. **Layout de la sección**: la sección entera queda encuadrada (marco alrededor de todos sus campos — implementable con `<fieldset>`/`<legend>`, o un `<div>` con borde y un título superpuesto si no se usa `<fieldset>`), con el título integrado en el propio marco, en vez de solo un título con una línea separadora encima de los campos (layout descartado tras valorarlo). "Borde" usa el título tipo des/activador (checkbox "Activar borde" + título "Borde" dentro del marco) — al desmarcarlo, los campos de color/grosor/tipo de línea de esa sección quedan deshabilitados visualmente (`.modal__section--disabled`, sin borrar sus valores). "Fondo" usa el título meramente informativo (sin checkbox de sección) — el checkbox "Transparente" que contiene es un control de campo normal (patrón ya existente en `'ficha'`/`'texto'`), no un des/activador de sección. Al planificar la implementación hay que escribir `STYLE_BIBLE.md` sección 12.6 acorde a este layout encuadrado (no existía ninguna versión previa publicada de esta sección con la que reconciliar, solo el borrador de "título+línea" que se descartó en el propio análisis de esta entrada).
- **Encuadrado también de los campos sin sección** ("Tablero"/"Ficha", ver ampliación de secciones más abajo): los campos que no forman parte de ninguna sección titulada (el selector "Fondo" de "Tablero", el campo "Forma" de "Ficha") se encuadran igualmente con el mismo estilo de marco, pero sin título — mismo criterio visual que una sección, solo que anónima. Es una decisión explícita del usuario tras valorar tanto encuadrar únicamente las secciones tituladas (dejando los campos sueltos como están hoy) como este encuadrado uniforme; se optó por este último para que toda la pestaña "Específicas" luzca con un lenguaje visual consistente de bloques encuadrados.
- **Color del título/marco de sección**: tanto el texto del título como el borde del marco usan un nuevo tono violeta/índigo apagado dedicado (`#5b5f97` en las maquetas de esta entrada, propuesto como nuevo token `--section-accent` en `:root` de `main.css`) solo para el título — el marco/borde del `fieldset` en sí puede seguir usando `var(--border-neutral)` (el gris neutro ya usado para el resto de bordes finos de la app) ya que su función es solo delimitar el bloque, no la misma que cumplía la línea de acento del layout anterior (descartado). El título no reutiliza `var(--accent-blue)`/`var(--accent-blue-dark)` (que en el resto de la app siempre significan "interactivo/seleccionado": botón "Aceptar", contorno de selección) ni `var(--text-muted)` (texto secundario ya existente). Es una excepción de color nueva, catalogable junto a las demás en `STYLE_BIBLE.md` sección 13 (bisel de "Tablero"/"Dado", radios de "Carta") al planificar la implementación — no un tono ad-hoc sin documentar.
- Puntos de renderizado a actualizar: `src/ui/cardEditorModal.js` (función `renderTextBox`, vista previa dentro del propio editor) y `src/ui/componentRenderer.js` (bloque que dibuja los `textBoxes` de una carta sobre la mesa, aprox. líneas 1006-1023), aplicando `border` (o `border: none` si `bordeActivo` es false) y `background-color` (o transparente si `colorFondo` está vacío) al elemento del cuadro de texto en ambos sitios.
- Ningún campo nuevo requiere migración explícita: al ser opcionales con semántica "ausente = desmarcado/vacío", los guardados existentes siguen funcionando sin cambios.
- **Ampliación (borde de la carta completa)**: hoy `caraFrontal`/`caraTrasera` (`ARCHITECTURA.md` sección 4, tipo `'carta'`) son `{ imagenResourceId, ajusteImagen, textBoxes }`, sin ningún campo de borde propio; el elemento `.carta` de `ui/componentRenderer.js` (líneas ~961-991) hoy no dibuja ningún borde (solo `backgroundColor: '#ffffff'`, `borderRadius` según `proporcion`). Esta ampliación añade a cada cara `bordeColor` (string hex, negro por defecto) y `bordeGrosor` (number px, 0–20, `0` por defecto = sin borde) — mismo naming y semántica 0=sin-borde que ya usa `'ficha'` (`ui/componentModal.js` líneas 862-899, bloque "Borde: color y grosor juntos en la misma fila"), a diferencia de `'tablero'` donde el mínimo es 1 y el borde siempre está presente.
- Editor de la propiedad: `src/ui/cardEditorModal.js`, dentro de `renderFace(caraKey, label)` (por cara, no en el `toolbar` compartido con "Proporción"), reutilizando el mismo patrón "color + grosor en la misma fila" de `componentModal.js`.
- Renderizado a actualizar: `src/ui/componentRenderer.js`, bloque `component.type === 'carta'` (~línea 961) — aplicar `border` (o `border: none` si `bordeGrosor` es `0`) al elemento `.carta` según la cara activa (`caraActual`), sin bisel (línea simple, igual que `'ficha'`), respetando `cartaBorderRadius` ya calculado (redondeado u óvalo/círculo si `proporcion === 'circular'`). Como el borde envuelve la carta completa (no cada cara por separado dentro del DOM, que ya alterna vía `caraActual`), el borde mostrado en cada instante es el de la cara actualmente visible.
- Mismo criterio de "sin migración": campos opcionales, ausentes en cartas guardadas antes de esta ampliación se comportan como `bordeGrosor: 0` (sin cambio visual).
- **Ampliación (transparencia de imagen de cada cara)**: `caraFrontal`/`caraTrasera` (`ARCHITECTURE.md` sección 4, tipo `'carta'`) son hoy `{ imagenResourceId, ajusteImagen, textBoxes }` (más `bordeColor`/`bordeGrosor` de la ampliación anterior); no existe hoy en el proyecto ningún campo de opacidad/transparencia de imagen en ningún tipo de componente (`'ficha'`, `'tablero'`, etc. tampoco lo tienen) — es un campo nuevo, sin precedente de naming que reutilizar. Esta ampliación añade a cada cara `transparenciaImagen` (number, 0–100, `0` por defecto = imagen opaca), aplicado como `opacity` CSS del elemento `<img>` de esa cara mediante `1 - transparenciaImagen / 100`.
- Patrón de UI a reutilizar: el control slider + input numérico + símbolo "%" ya implementado para "Zoom" en `src/ui/imageAdjustModal.js` (líneas ~187-220: `input[type=range]` sincronizado con un `input[type=text]`, ambos actualizando el mismo valor en `state`), adaptado a rango 0–100 en vez de 100–300.
- Editor de la propiedad: `src/ui/cardEditorModal.js`, dentro de `renderFace(caraKey, label)` (línea ~141 en adelante, junto al bloque de imagen de esa cara: `cara.imagenResourceId`, botones "Elegir imagen…"/"Ajustar imagen…") — el control solo se muestra si `cara.imagenResourceId` no es `null`. Al elegir/cambiar imagen (línea ~193-194, donde ya se reinicia `cara.ajusteImagen = { zoom: 100, posX: 50, posY: 50 }`), reiniciar también `cara.transparenciaImagen = 0`.
- Renderizado a actualizar: `src/ui/componentRenderer.js`, en los dos puntos donde se crea el `<img>` de la imagen de fondo de una cara y se le aplica `applyImageAdjustStyle` — la vista previa del propio editor (`cardEditorModal.js`, análogo a `renderFace`) y el bloque `component.type === 'carta'` de `componentRenderer.js` (~línea 1017-1027, tras `applyImageAdjustStyle(img, cara.ajusteImagen)`) — añadiendo `img.style.opacity = String(1 - (cara.transparenciaImagen ?? 0) / 100)`.
- Mismo criterio de "sin migración": campo opcional, ausente en cartas guardadas antes de esta ampliación se comporta como `transparenciaImagen: 0` (sin cambio visual).
- **Ampliación (renombrado de botón)**: en `src/ui/cardEditorModal.js` línea 204, `addTextBoxBtn.textContent = '+ Cuadro de texto'` pasa a `'+ Texto'`. Es solo texto visible, sin ningún dato ni comportamiento nuevo — no requiere apuntes adicionales.
- **Ampliación (secciones "Tablero"/"Ficha")**: sin ningún campo nuevo en el modelo de datos (`ARCHITECTURE.md` sección 4, tipos `'tablero'`/`'ficha'`) — es puramente reorganización de `ui/componentModal.js`. Confirmado que el patrón `.modal__section` de `STYLE_BIBLE.md` sección 12.6 ya está documentado como reutilizable por "cualquier grupo de campos futuro" (no es exclusivo del cuadro de texto de carta), aunque su implementación real en código está aún pendiente (solo existe hoy en la planificación/documentación de este mismo cambio 00072, no en CSS/HTML ya escrito) — incluido el layout encuadrado, decidido después de valorar variantes durante el propio análisis de esta entrada.
  - `renderBoardSpecificFields` (líneas ~410-452 antes de esta ampliación): el bloque "Borde" (fila `borderRow` con `borderColorField`+`borderWidthField`, grosor 1–20 sin checkbox) pasa a envolverse en un `.modal__section` encuadrado con título "Borde". El campo "Fondo" que sigue (línea ~454 en adelante, selector "Color y patrón"/"Imagen") pasa a envolverse en su propio `.modal__section` encuadrado, sin título.
  - `renderFichaSpecificFields`: el campo "Forma" (`shapeField`, antes de la línea ~799) pasa a envolverse en un `.modal__section` encuadrado sin título. El bloque "Fondo" (`bgTypeField` selector color/texto/imagen, líneas ~799-819, seguido de `bgColorField` color+checkbox "Transparente", líneas ~821-860) pasa a envolverse junto en un único `.modal__section` encuadrado con título "Fondo". El bloque "Borde" (`borderRow`, líneas ~862-901, grosor 0–20 sin checkbox) pasa a envolverse en su propio `.modal__section` encuadrado con título "Borde", separado del de "Fondo".
  - Ningún handler de evento (`addEventListener`) ni valor por defecto (`DEFAULT_BOARD_PROPERTIES`/`DEFAULT_FICHA_PROPERTIES`) cambia — solo el marcado que envuelve estos campos ya existentes.
