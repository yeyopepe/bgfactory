- **Nombre**: Conversión automática a WebP de imágenes subidas a la galería
- **Código**: 00073
- **Tipo**: change

## Prompt original del usuario

quiero que los recursos que se suban a la galería, se conviertan a WebP para reducir espacio sin perder calidad

## Descripción completa

Al subir una imagen a la galería de recursos —tanto al dar de alta un recurso nuevo desde el panel "Recursos" en modo edición, como al reemplazar el fichero de un recurso ya existente desde su modal de edición— la imagen se convierte automáticamente a formato WebP antes de guardarse, para reducir el espacio que ocupa (en el autoguardado del navegador, en el HTML exportado y en el JSON de exportar/importar componentes) sin pérdida de calidad perceptible.

La conversión es totalmente transparente para quien la usa: el flujo de subida (mismo selector de fichero, mismos pasos) no cambia en nada; simplemente el fichero que queda guardado como recurso ya está en formato WebP.

**Alcance y decisiones de esta funcionalidad:**

- **Nivel de compresión**: se usa WebP con compresión "con pérdida" pero de calidad muy alta (imperceptible a la vista), priorizando el ahorro de espacio. Se descarta la compresión totalmente "sin pérdida" porque da un ahorro mucho menor.
- **Formatos de origen que se convierten**: solo PNG, JPG y JPEG. Si el fichero subido ya es WebP, no se reconvierte.
  - Los SVG se guardan tal cual, sin conversión: son imágenes vectoriales y convertirlas rasterizaría el contenido, perdiendo la nitidez a cualquier escala.
  - Los GIF también se guardan tal cual: pueden ser animados, y la conversión solo podría capturar el primer fotograma, perdiendo la animación sin ningún aviso.
- **Alcance retroactivo**: solo afecta a subidas nuevas a partir de esta funcionalidad. Las imágenes que ya estén guardadas hoy en la galería (en el navegador o en ficheros ya exportados) no se tocan ni se reconvierten.
- **Si la conversión no puede realizarse** por cualquier motivo (caso excepcional), el fichero original se guarda tal cual, sin bloquear la subida ni mostrar ningún error al usuario.
- No hay ningún elemento visual nuevo ni cambio de interacción visible: no hace falta ningún indicador de carga adicional, la conversión es prácticamente instantánea incluso para imágenes de varios megabytes.

## Apuntes técnicos

- Puntos de código afectados: `src/modes/edit/editMode.js` (~L73-92, alta de recurso nuevo vía "+ Añadir recurso") y `src/ui/resourceModal.js` (~L116-128, reemplazo de fichero de un recurso existente). Ambos usan hoy `FileReader.readAsDataURL(file)` y guardan `dataUrl: reader.result` sin ninguna transformación, junto con `fileName`/`mimeType` del fichero original.
- La conversión debe hacerse en el propio navegador (p.ej. dibujando la imagen en un `<canvas>` y codificándola como WebP), sin ninguna dependencia ni servicio externo nuevo — coherente con que el proyecto no puede depender de Node.js ni de librerías de build adicionales (ver `ARCHITECTURE.md` sección 1).
- Modelo de recurso sin cambios de forma (`core/resource.js`: `{ id, name, type, dataUrl, fileName, mimeType }`); tras convertir, `fileName`/`mimeType` deberían actualizarse para reflejar el nuevo formato (extensión `.webp`, `image/webp`) en vez de los del fichero original.
- `resourceTypeForFileName` (`core/resource.js`) decide el tipo (`'imagen'`/`'tipografia'`) a partir de la extensión del fichero **antes** de convertir — la conversión a WebP no debe alterar esa detección de tipo, solo el contenido/nombre/mimeType finales guardados.
- Nada más en la app depende de la extensión/mimeType original de una imagen (solo `ui/fontFaceRegistry.js` lee `fileName` para deducir el formato de una tipografía, no aplica a imágenes).
- Persistencia sin cambios: los recursos se serializan tal cual en el autoguardado (`localStorage`), en `core/fileExport.js` (`buildExportHtml`, HTML exportado) y en el JSON de exportar/importar componentes — al venir ya el `dataUrl` en WebP desde el origen, ninguna de esas rutas necesita tocarse.
