- **Nombre**: Imagen propia del mazo (ya no hereda el dorso de las cartas)
- **Código**: 00194
- **Tipo**: change
- **Fecha creación**: 2026-08-07

## Prompt original del usuario

ahora los mazos ya no deberán tomar la imagen del dorso de las cartas, sino que en sus propiedades específicas el usuario debe poder seleccionar una imagen y abrir la modal para ajustar el zoom, transparencia, rotación, etc

## Descripción completa

Los mazos dejan de tomar automáticamente y sin alternativa como imagen visual el dorso de la carta que tengan arriba de la pila. El usuario pasa a poder elegir una imagen propia para el mazo; mientras no elija ninguna, el mazo se sigue comportando exactamente igual que hoy (dorso de la carta de arriba, o icono neutro si está vacío).

**Nuevo comportamiento:**

- En las propiedades específicas del mazo, junto a los campos ya existentes ("Forma" y "Orientación"), aparecen botones nuevos:
  - **"Elegir imagen…"**: abre la misma galería de imágenes que ya se usa en otros elementos del juego (por ejemplo, para elegir la imagen de fondo de un tablero simple) — lista de imágenes disponibles con buscador.
  - **"Ajustar imagen…"**: deshabilitado hasta que se haya elegido una imagen propia. Abre la misma ventana de ajuste ya usada en otros elementos (Carta/Ficha, Figuras), con controles de zoom, transparencia y rotación sobre la imagen elegida. La zona de previsualización respeta la forma actual del mazo (cuadrada o circular, según esté configurado).
  - **"Quitar imagen"**: visible/habilitado solo cuando el mazo tiene una imagen propia elegida. La quita (vuelve a quedar sin imagen propia) y, junto a ella, se pierde su ajuste de zoom/posición/rotación y su transparencia.
- Al elegir una imagen nueva (o reemplazar la ya elegida), el ajuste de zoom/posición/rotación y la transparencia se reinician a sus valores por defecto — mismo criterio que siguen ya otros elementos del juego al cambiar de imagen.
- **Qué se pinta en la mesa**:
  - Si el mazo tiene una imagen propia elegida: se pinta siempre esa imagen (con su ajuste y transparencia), tenga o no cartas metidas dentro — deja de tener ninguna relación con el contenido de la pila.
  - Si el mazo NO tiene imagen propia (todavía no se ha elegido ninguna, o se ha quitado con "Quitar imagen"): se comporta exactamente igual que hoy — se pinta el dorso de la carta que esté arriba de la pila, o el icono neutro de "mazo vacío" si no tiene ninguna carta dentro.
- Sin relación con "Forma" ni "Orientación": "Forma" sigue decidiendo si la caja del mazo es rectangular o circular (y por tanto la forma de la zona de ajuste de imagen); "Orientación" sigue intercambiando ancho y alto sin afectar a la imagen propia.
- La imagen elegida, su ajuste y su transparencia se guardan como cualquier otra propiedad del mazo: persisten al guardar la partida y al exportarla a fichero, no están ligadas a la sesión actual del navegador.
- Al duplicar un mazo, su imagen propia (si la tiene), ajuste y transparencia se copian automáticamente al duplicado, igual que el resto de sus propiedades.
- **Mazos ya existentes**: al no tener ninguno imagen propia configurada todavía, todos siguen mostrándose exactamente igual que antes del cambio (dorso de la carta de arriba / icono de vacío) — no hace falta ninguna migración de datos.

## Apuntes técnicos

- Estado actual (`design/docs/architecture/02-component-types.md`, tipo `'mazo'`): no tiene propiedad de imagen propia. `ui/componentRenderer.js` (rama `'mazo'`, ~línea 1747-1760) pinta `paintCartaFace(mazoContent, mazoCaraTrasera, renderScale, width, height)` usando la `caraTrasera` de `cartaIds[0]` si hay carta arriba, o `renderMazoEmptyPlaceholder(mazoContent, width, height)` si el mazo está vacío. Tras el cambio, ese bloque pasa a ser el *fallback* (solo se ejecuta si el mazo no tiene `imagenResourceId` propio) — se mantiene tal cual, no se elimina.
- Patrón de selección de imagen a reutilizar: `ui/boardImageModal.js` (`openBoardImageModal({ properties, resources, onAccept, title })`), ya usado por "Tablero simple" (`ui/componentModal.js`, sección "Fondo" → "Configurar fondo" cuando `fondoTipo === 'imagen'`). Galería de recursos tipo 'imagen' con buscador; `onAccept(resourceId)` es responsabilidad de quien invoca actualizar `imagenResourceId`.
- Patrón de ajuste a reutilizar: `ui/imageAdjustModal.js` (`openImageAdjustModal`), genérico y agnóstico de tipo de componente por diseño explícito (comentario de cabecera del propio fichero). Sin `faces`, funciona en modo de una sola imagen (`entries = [{ key: '__single__', shape, width, height, resource, adjustment, transparencia }]`), devolviendo en `onAccept` un único objeto `{ zoom, posX, posY, rotation, transparencia }` en vez de un mapa por clave — así lo usaría 'mazo'. Referencia de invocación single-stage más cercana: `ui/visualEditorModal.js` no la usa así (siempre pasa `faces`), pero la propia firma de la función soporta el modo sin `faces` explícitamente.
- Shapes de máscara soportadas por `imageAdjustModal.js`: `'circular'`, `'redondeada'` (border-radius 8px), `'cuadrada'`/cualquier otro valor (sin redondeo), más las de `HEX_CLIP_PATHS` para hexágonos/triángulos (no aplican a mazo). Mazo mapea su `forma` a `'circular'` o `'cuadrada'` según corresponda.
- `core/resource.js` (`isResourceInUse`/`getComponentsUsingResource`) ya recorre `component.properties` en profundidad (`collectDeepValues`), así que un `imagenResourceId` de primer nivel en `properties` de `'mazo'` queda cubierto automáticamente por la detección de uso — sin cambio necesario en ese módulo.
- Checklist de `INDEX.md` §8 a revisar al implementar: persistencia/fileExport ya serializan `components` completo (incluye `properties` de cualquier tipo, sin lista de campos por tipo) — no requiere tocar `core/persistence.js`/`core/fileExport.js` en este caso, a diferencia de una colección nueva a nivel de `state.js`.
