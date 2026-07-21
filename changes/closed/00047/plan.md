## (a) Anotaciones funcionales

- Fuera de alcance: cualquier otro campo o tipo de componente distinto de "ficha" y de los recursos de galería. No se toca el componente de texto (que ya tiene su propio patrón de color de fondo transparente) ni tablero/dado/documento.
- Fuera de alcance: el campo "Forma" de ficha no se reordena (ya está el primero, antes de "Fondo"), tal y como asume `description.md`.
- No hay dudas nuevas que resolver con el usuario: `description.md` ya deja resueltas las de alcance (color de fondo se aplica siempre y por defecto transparente; id fijo y legible para los 3 recursos por defecto).
- Los ficheros `src/img/localizations/*.jpeg` referenciados en `description.md` ya están en el repo con el nombre correcto (`localization-secondary-back.jpeg`, sin la errata "secundary" que sí aparece en el texto de `description.md`); se usa el nombre real de fichero como fuente de verdad.

## (b) Solución técnica

1. **Reordenar y agrupar los campos de ficha** (`src/ui/componentModal.js`, `renderFichaSpecificFields`):
   - Mover el selector de tipo de "Fondo" (`bgTypeField`) para que se renderice justo después de "Forma" y antes de "Color de fondo" y del bloque de borde.
   - Combinar "Color del borde" y "Grosor del borde" en una sola fila: un contenedor `div.modal__field` que envuelve un `div` con `display: flex; gap` conteniendo dos sub-campos (cada uno con su propia etiqueta e input), reemplazando los dos `div.modal__field` independientes actuales. No cambia el comportamiento de ninguno de los dos inputs, solo su disposición.
   - Orden final del bloque específico de ficha: Forma → Fondo (tipo) → Color de fondo → fila Color del borde/Grosor del borde → bloque específico según tipo de fondo (Texto o Imagen; "Color sólido" ya no necesita bloque propio, ver tarea 2).

2. **Color de fondo siempre visible y aplicado, transparente por defecto**:
   - En `DEFAULT_FICHA_PROPERTIES` (`src/ui/componentModal.js:52`), cambiar `colorFondo: '#cccccc'` por `colorFondo: ''`.
   - En `renderFichaSpecificFields`, sustituir el actual `colorBlock` (que hoy solo se muestra para `fondoTipo === 'color'` y contiene un simple `input[type=color]`) por un campo "Color de fondo" siempre visible, fuera de `updateBgFieldsVisibility()`, reutilizando el patrón ya existente en el bloque de texto (`bgColorField`/`bgColorContainer`/checkbox "Transparente", líneas ~293-335 del mismo fichero): `input[type=color]` + checkbox "Transparente" (marcado cuando `colorFondo` es `''`), que al desmarcarse escribe el valor del color y al marcarse pone `colorFondo = ''`.
   - `updateBgFieldsVisibility()` deja de tocar `colorBlock` (ya no existe): solo alterna `textBlock` e `imageBlock` según `fondoTipo`.
   - En `src/ui/componentRenderer.js` (función de render de ficha, ~línea 801-847): aplicar `ficha.style.backgroundColor = props.colorFondo || 'transparent'` de forma incondicional, antes de la rama según `fondoTipo`, y quitar los dos `ficha.style.backgroundColor = props.colorFondo || '#cccccc'` actuales (rama `imagen` sin recurso todavía elegido, y rama `color`) — el color de fondo ya queda fijado por la línea incondicional; la imagen o el texto se siguen dibujando encima según corresponda.

3. **Sustituir los 3 recursos demo por las 3 imágenes de localización**:
   - En `src/core/resource.js`, `createResource()` acepta un nuevo parámetro opcional `id`; si se pasa, se usa tal cual en vez de `crypto.randomUUID()`. El resto de llamadas (subida de recursos desde la UI) no pasan `id`, así que siguen generando UUID como hasta ahora.
   - En `src/data/defaultResources.js`, sustituir las 3 entradas actuales (`icono_errante (demo)`, `Permanent Marker (demo)`, `Roboto (demo)`) por 3 entradas nuevas de tipo `imagen`, una por cada fichero de `src/img/localizations/` (`localization-main-back.jpeg`, `localization-secondary-back.jpeg`, `localization-secondary-forbidden-back.jpeg`), con:
     - `id`: nombre de fichero sin extensión (p. ej. `localization-main-back`).
     - `name`: igual al `id` (identificador legible, sin sufijo "(demo)" ya que no son recursos de ejemplo sino los recursos por defecto reales).
     - `fileName`: nombre completo del fichero.
     - `mimeType`: `image/jpeg`.
     - `dataUrl`: el contenido del fichero `.jpeg` correspondiente codificado en base64 como data URI, incrustado directamente en el fichero (mismo patrón que el icono SVG demo actual), generado una vez a partir de los ficheros ya existentes en `src/img/localizations/`.
   - En `src/main.js`, `seedDefaultResources()` pasa `resourceData.id` a `createResource()` (además del resto de campos que ya pasa) para que estos 3 recursos conserven el id fijo definido en `DEFAULT_RESOURCES`.

## (c) Cambios de arquitectura

No aplica: esta solución no modifica la arquitectura básica del proyecto (capas, flujo de datos, ni el contrato de `createResource` más allá de un parámetro opcional retrocompatible).
