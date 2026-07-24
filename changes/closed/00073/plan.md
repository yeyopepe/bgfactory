## (a) Anotaciones funcionales

- Fuera de alcance: reconversión retroactiva de imágenes ya guardadas (autoguardado, HTML exportado o JSON exportado) — solo afecta a subidas nuevas a partir de esta funcionalidad, tal como indica `description.md`.
- Fuera de alcance: cualquier indicador visual de carga o de progreso durante la conversión — la propia `description.md` descarta que haga falta, al ser prácticamente instantánea.
- No ha hecho falta resolver ninguna duda adicional con el usuario: `description.md` ya deja acotadas todas las decisiones relevantes (formatos de origen, calidad, comportamiento ante fallo, alcance no retroactivo).

## (b) Solución técnica

1. **Crear `src/core/imageConversion.js`** (capa `core`, sin dependencias de otras capas — coherente con `ARCHITECTURE.md` sección 2, ya que tanto `modes/edit/editMode.js` como `ui/resourceModal.js` necesitan esta lógica y ambos pueden depender de `core`): expone una única función `async function convertImageToWebP(file, dataUrl)`.
   - Determina la extensión de `file.name` en minúsculas; si no es `png`, `jpg` ni `jpeg`, devuelve de inmediato `{ dataUrl, fileName: file.name, mimeType: file.type }` sin tocar nada (cubre WebP ya subido, SVG y GIF, que se guardan tal cual).
   - Si es un formato a convertir: crea un `Image`, le asigna `src = dataUrl` (el mismo data URL ya leído por `FileReader`, sin volver a leer el fichero), y en su `onload` dibuja la imagen a tamaño natural sobre un `<canvas>` y llama a `canvas.toDataURL('image/webp', 0.92)` (compresión con pérdida, calidad alta — 0.92 es un valor estándar imperceptible a la vista con ahorro significativo de espacio).
   - Verifica que el resultado empiece por `data:image/webp` (algunos navegadores devuelven silenciosamente un PNG si no soportan la codificación WebP en `toDataURL`, en vez de lanzar un error) — si no es así, o si `Image.onerror` salta, se resuelve con el fallback `{ dataUrl, fileName: file.name, mimeType: file.type }` (fichero original sin bloquear ni avisar, tal como pide `description.md`).
   - Si la conversión sí produce un WebP válido, devuelve `{ dataUrl: webpDataUrl, fileName: '<nombre-sin-extensión>.webp', mimeType: 'image/webp' }`.
   - Toda la lógica va envuelta en un único `try/catch` (más el chequeo de prefijo) para que cualquier fallo inesperado también caiga en el fallback del original, sin excepción sin capturar.

2. **`src/modes/edit/editMode.js`** (~L73-92, alta de recurso nuevo): en el listener `change` de `resourceFileInput`, el callback `reader.onload` pasa a ser `async`; tras `reader.readAsDataURL(file)` completarse, llama a `convertImageToWebP(file, reader.result)` (import añadido desde `../../core/imageConversion.js`) y usa el `{ dataUrl, fileName, mimeType }` resultante al construir `createResource(...)` en vez de `reader.result`/`file.name`/`file.type` directos. No hace falta condicionar por `type` (imagen vs tipografía): la propia función ya es un no-op para extensiones de tipografía al no estar en la lista `png/jpg/jpeg`.

3. **`src/ui/resourceModal.js`** (~L116-128, reemplazo de fichero de un recurso existente, dentro de `renderImageContent`): mismo cambio — `fileInput.addEventListener('change', ...)` con `reader.onload` async, llamando a `convertImageToWebP(file, reader.result)` (mismo import) y asignando el resultado a `workingResource.dataUrl`/`fileName`/`mimeType` antes de actualizar `previewImg.src`. Este punto ya filtra antes por `resourceTypeForFileName(file.name) !== RESOURCE_TYPES.IMAGE` (solo imágenes), así que siempre tiene sentido intentar la conversión.

4. No se toca `core/resource.js` (`createResource`/`updateResource`/`resourceTypeForFileName` sin cambios de forma ni de comportamiento) ni ningún otro punto de persistencia/exportación (`core/fileExport.js`, autoguardado, export/import JSON): todos ya guardan `dataUrl`/`fileName`/`mimeType` tal cual vienen del recurso, así que al venir ya en WebP desde el origen no necesitan modificarse — confirmado por el análisis técnico previo (`ms-internal-tech-analysis`), sin incongruencias detectadas entre `ARCHITECTURE.md` y el código real en esta zona.

5. **Migración puntual de los 38 recursos por defecto** (`src/data/defaultResources.js`, `DEFAULT_RESOURCES`): a petición explícita del usuario, además de aplicar la conversión a subidas nuevas, se re-codifican una única vez (proceso puntual de esta implementación, no una funcionalidad nueva de la app) los recursos de imagen ya embebidos en este fichero cuyo origen sea PNG/JPG/JPEG (todos los 38 lo son, ninguno es ya WebP/SVG/GIF) a WebP con la misma calidad alta (92/100), actualizando en cada entrada `dataUrl` (nuevo `data:image/webp;base64,...`), `fileName` (extensión `.webp`) y `mimeType` (`image/webp`); `id`/`name`/`type` no cambian. Se hace con un script Python puntual (Pillow, ya disponible en el entorno) que decodifica cada `dataUrl` existente, la recodifica y reescribe el fichero — no se ejecuta como parte del build ni de ningún flujo de la app, y no deja ningún script nuevo persistido en el repo.

## (c) Cambios de arquitectura

Añadir en `ARCHITECTURE.md` sección 4.2 (Modelo de datos de recurso) una nota breve indicando que las subidas nuevas de imagen (`png`/`jpg`/`jpeg`) se convierten automáticamente a WebP en el propio navegador (`core/imageConversion.js`, `convertImageToWebP`) antes de guardarse como `dataUrl`/`fileName`/`mimeType`, con fallback silencioso al original si la conversión no está disponible o falla; SVG, GIF y WebP ya subido se guardan sin conversión.

## (d) Cambios en estilo

No aplica: esta funcionalidad no introduce ni modifica ninguna convención de estilo visual, de interacción o de redacción — es transparente para quien la usa (mismo flujo de subida, sin elementos visuales nuevos).
