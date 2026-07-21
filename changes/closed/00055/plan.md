## (a) Anotaciones funcionales

- Sin nada fuera de alcance adicional respecto a lo ya descrito en `description.md`.
- Dudas ya resueltas antes de este plan (recogidas en `description.md`): el criterio de búsqueda es por nombre de imagen, con la misma normalización (minúsculas + sin acentos) que ya usa el filtro del panel "Recursos" (`resourceList.js`).
- `ms-tech-analysis` no encontró ninguna incongruencia entre `ARCHITECTURE.md`/`STYLE_BIBLE.md` y el código real de `boardImageModal.js`/`componentModal.js`/`cardEditorModal.js`: la descripción de la sección 5 de `ARCHITECTURE.md` sobre `ui/boardImageModal.js` sigue siendo fiel al código actual.
- Confirmado por convención ya existente en el repo (`ui/componentList.js` y `ui/resourceList.js` mantienen cada uno su propia copia local de `normalize()`, no hay ningún módulo compartido de utilidades de texto): este cambio añade su propia copia local en `boardImageModal.js` en vez de extraer una utilidad común, para no introducir una abstracción nueva fuera del alcance del cambio.

## (b) Solución técnica

1. **`src/ui/boardImageModal.js`** — añadir el cuadro de búsqueda:
   - Añadir funciones locales `normalize(str)` y `matchesFilter(resource, query)`, calcadas de las de `ui/resourceList.js` (minúsculas + `normalize('NFD')` sin diacríticos; comparación solo por `resource.name`, ya que aquí no aplica ni tipo ni id).
   - Añadir estado local `filterText = ''` (variable dentro de `openBoardImageModal`, no de módulo — cada apertura del modal debe partir de un cuadro de búsqueda vacío, tal y como pide la descripción).
   - Extraer el render de la galería (el bloque que hoy recorre `images` creando cada `.board-image-modal__item`) a una función interna `renderGallery(list)` que limpia y repuebla un contenedor `gallery` ya insertado en el DOM, reutilizando la lógica de selección/click tal cual (sigue leyendo/escribiendo la misma variable `selectedId` del cierre, y sigue marcando `--selected` comparando con `selectedId`).
   - Solo si `images.length > 0` (el cuadro de búsqueda no debe aparecer cuando no hay imágenes, según la descripción): insertar antes de la galería un `div.board-image-modal__search` con un `input type="text"` (`placeholder="Buscar imagen…"`), con listener `input` que actualiza `filterText` y vuelve a invocar el render (filtrando `images` con `matchesFilter` y, si el resultado queda vacío, sustituyendo la galería por un mensaje `No hay imágenes que coincidan con «${filterText}».`, mismo patrón que el `empty-filter` de `resourceList.js`/el mockup `design_cuadro-busqueda-elegir-imagen.html`).
   - `selectedId` sigue existiendo tal cual, independiente de qué esté visible en cada repintado filtrado: si la imagen seleccionada queda oculta por el filtro, "Aceptar" la sigue aplicando sin cambios (no hace falta tocar `updateAcceptButton` ni el `click` de `acceptBtn`).
   - El caso `images.length === 0` (mensaje "No hay imágenes disponibles") no cambia: sigue sin cuadro de búsqueda.

2. **`src/styles/main.css`** — añadir las reglas para las clases nuevas, siguiendo el bloque ya existente `/* Board background modal — sub-modal "Imagen" ... */` (línea ~715):
   - `.board-image-modal__search` (contenedor, `margin-bottom` para separar de la galería).
   - `.board-image-modal__search input[type="text"]` y su `:focus`, mismas reglas que `.resource-panel__filter input[type="text"]` (ancho completo, `box-sizing: border-box`, padding/borde/radio ya establecidos, foco con `--accent-blue`).
   - `.board-image-modal__empty-filter`, mismas reglas que `.board-image-modal__empty` (reutilizar tal cual, ya que es el mismo tipo de mensaje centrado en gris).

No hace falta tocar `componentModal.js` ni `cardEditorModal.js`: ambos solo invocan `openBoardImageModal`, sin conocer su marcado interno.

## (c) Cambios de arquitectura

No aplica: `ARCHITECTURE.md` describe `ui/boardImageModal.js` a nivel de contrato (`galería en grid... selección única con click; si no hay ninguno, muestra "No hay imágenes disponibles"...`) sin detallar su marcado interno completo; añadir un cuadro de búsqueda no cambia el contrato de la función (`openBoardImageModal({ properties, resources, onAccept, title })` no cambia de firma) ni introduce ninguna capa o relación nueva entre módulos. No se requiere ninguna actualización de este documento.

## (d) Cambios en estilo

No aplica: el cuadro de búsqueda reutiliza tal cual una convención visual ya documentada en la práctica (mismo aspecto que `.resource-panel__filter input[type="text"]`, ya presente en el CSS), sin introducir ningún patrón, color o convención nuevos.
