- **Nombre**: Configuración de borde y fondo en los cuadros de texto del editor de cartas
- **Código**: 00072
- **Tipo**: change

## Prompt original del usuario

"añade en el editor de cartas las siguientes funcionalidades a los cuadros de texto:
- configuración del borde  (con un check):
   - color, grosor y tipo de linea (continua, punteada) del borde
- configuración del color de fondo (vacio = transparente)"

"Añade también en la configuración el borde de la carta completa: grosor y color."

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

### Casos límite

- Cuadro de texto nuevo: se crea con el check de borde desmarcado y con fondo transparente (mismo comportamiento que hoy, sin cambios visibles hasta que el usuario active alguna de las dos configuraciones).
- Cuadros de texto guardados antes de este cambio (sin estos campos): se comportan como si ambos estuvieran desmarcados/transparente, igual que un cuadro de texto nuevo.
- El borde de este cuadro de texto es una línea simple (color + grosor + estilo continua/punteada), sin ningún efecto de bisel o relieve — esa técnica está reservada a los tipos de componente "Tablero" y "Dado" y no se extiende aquí.
- Esta configuración es exclusiva de los cuadros de texto del editor de cartas; no afecta al componente suelto de tipo "Texto" que se coloca directamente sobre la mesa (que ya tiene su propio color de fondo, sin esta ampliación).
- Carta nueva o cara sin borde configurado (cartas guardadas antes de esta ampliación): grosor `0`, sin ningún efecto visual respecto a hoy.
- El borde de la carta completa es independiente del borde de los cuadros de texto: cada uno se configura y se dibuja por separado, y pueden convivir sin conflicto (un cuadro de texto con su propio borde, dentro de una carta que también tiene borde propio).

### Convivencia con lo existente

No sustituye nada: es una ampliación de las propiedades ya existentes de cada cuadro de texto (contenido, tipografía, tamaño, color de texto), sin afectar a los demás tipos de componente.

### Alcance de los datos

Estas configuraciones se guardan como parte de los datos de cada cuadro de texto, dentro de los datos de la carta (autoguardado igual que el resto del estado del proyecto).

### Quién puede usarlo

Cualquier usuario en modo edición, igual que el resto de la configuración de cuadros de texto de carta.

### Definición visual de alto nivel

- Dentro del sub-modal de edición de cuadro de texto, tras el campo "Color" actual, aparece un bloque "Borde": una fila con el checkbox "Activar borde"; debajo, solo visible/habilitado si está marcado, una fila con selector de color y campo numérico de grosor (mismo patrón ya usado para el borde de "Tablero"/"Ficha"), y debajo un desplegable con el tipo de línea (Continua/Punteada).
- A continuación, un bloque "Fondo": una fila con selector de color y checkbox "Transparente" al lado (mismo patrón ya usado en "Ficha" y en el componente "Texto" de la mesa).
- El resultado se refleja de inmediato en la vista previa del propio editor de cartas y, al guardar, en el renderizado de la carta sobre la mesa.
- Borde de la carta completa: dentro de cada sección de cara (frontal/trasera) del editor de cartas, junto a las demás acciones de esa cara ("Elegir imagen…"), un control "Borde" con selector de color y campo numérico de grosor (mismo patrón "color y grosor en la misma fila" ya usado en "Ficha"/"Tablero"). Al cambiar el grosor por encima de 0 aparece de inmediato el borde en la vista previa de esa cara dentro del editor; al guardar, se refleja también en el renderizado de la carta sobre la mesa.

## Apuntes técnicos

- El modelo `TextBox` (documentado en `ARCHITECTURE.md` sección 4, tipo `'carta'`) es hoy `{ id, contenido, fuenteResourceId, tamañoFuente, color, x, y, width, height }`, sin ningún campo de borde/fondo. Este cambio le añade: `bordeActivo` (boolean, false por defecto), `bordeColor` (string hex, negro por defecto), `bordeGrosor` (number px, 1–20, 2 por defecto), `bordeTipo` (`'continua' | 'punteada'`, `'continua'` por defecto) y `colorFondo` (string hex o vacío, vacío/transparente por defecto) — mismo naming y semántica que las propiedades equivalentes ya usadas en los tipos `'tablero'`/`'ficha'` (`bordeColor`/`bordeGrosor`) y `'ficha'`/`'texto'` (`colorFondo` vacío = transparente).
- Editor de la propiedad: `src/ui/cardTextBoxModal.js` (sub-modal, tras el campo "Color" existente), reutilizando el patrón "color + grosor en la misma fila" y el patrón "color + checkbox Transparente" ya documentados en `STYLE_BIBLE.md` sección 8, tal como ya se implementan en `src/ui/componentModal.js` para `'tablero'`/`'ficha'`.
- Los bloques "Borde" y "Fondo" son el primer uso del nuevo patrón `.modal__section` documentado en `STYLE_BIBLE.md` sección 12.6 (agrupación visual de campos dentro de una pestaña/sub-modal, con separador superior y título en mayúsculas) — cada bloque debe implementarse como un `.modal__section` propio, no como un `<div>` ad-hoc. "Borde" usa el título tipo des/activador (`.modal__section-title--toggle`: checkbox "Activar borde" + título "Borde" en la misma fila) — al desmarcarlo, los campos de color/grosor/tipo de línea de esa sección quedan deshabilitados visualmente (`.modal__section--disabled`, sin borrar sus valores). "Fondo" usa el título meramente informativo (`.modal__section-title`, sin checkbox de sección) — el checkbox "Transparente" que contiene es un control de campo normal (patrón ya existente en `'ficha'`/`'texto'`), no un des/activador de sección.
- Puntos de renderizado a actualizar: `src/ui/cardEditorModal.js` (función `renderTextBox`, vista previa dentro del propio editor) y `src/ui/componentRenderer.js` (bloque que dibuja los `textBoxes` de una carta sobre la mesa, aprox. líneas 1006-1023), aplicando `border` (o `border: none` si `bordeActivo` es false) y `background-color` (o transparente si `colorFondo` está vacío) al elemento del cuadro de texto en ambos sitios.
- Ningún campo nuevo requiere migración explícita: al ser opcionales con semántica "ausente = desmarcado/vacío", los guardados existentes siguen funcionando sin cambios.
- **Ampliación (borde de la carta completa)**: hoy `caraFrontal`/`caraTrasera` (`ARCHITECTURA.md` sección 4, tipo `'carta'`) son `{ imagenResourceId, ajusteImagen, textBoxes }`, sin ningún campo de borde propio; el elemento `.carta` de `ui/componentRenderer.js` (líneas ~961-991) hoy no dibuja ningún borde (solo `backgroundColor: '#ffffff'`, `borderRadius` según `proporcion`). Esta ampliación añade a cada cara `bordeColor` (string hex, negro por defecto) y `bordeGrosor` (number px, 0–20, `0` por defecto = sin borde) — mismo naming y semántica 0=sin-borde que ya usa `'ficha'` (`ui/componentModal.js` líneas 862-899, bloque "Borde: color y grosor juntos en la misma fila"), a diferencia de `'tablero'` donde el mínimo es 1 y el borde siempre está presente.
- Editor de la propiedad: `src/ui/cardEditorModal.js`, dentro de `renderFace(caraKey, label)` (por cara, no en el `toolbar` compartido con "Proporción"), reutilizando el mismo patrón "color + grosor en la misma fila" de `componentModal.js`.
- Renderizado a actualizar: `src/ui/componentRenderer.js`, bloque `component.type === 'carta'` (~línea 961) — aplicar `border` (o `border: none` si `bordeGrosor` es `0`) al elemento `.carta` según la cara activa (`caraActual`), sin bisel (línea simple, igual que `'ficha'`), respetando `cartaBorderRadius` ya calculado (redondeado u óvalo/círculo si `proporcion === 'circular'`). Como el borde envuelve la carta completa (no cada cara por separado dentro del DOM, que ya alterna vía `caraActual`), el borde mostrado en cada instante es el de la cara actualmente visible.
- Mismo criterio de "sin migración": campos opcionales, ausentes en cartas guardadas antes de esta ampliación se comportan como `bordeGrosor: 0` (sin cambio visual).
