**Fecha creación**: 2026-08-05

## (a) Anotaciones funcionales

Fuera de alcance: ninguno adicional a lo ya fijado en `description.md` — la funcionalidad se limita al editor de cartas (modo edición), a las tres formas existentes de `Forma`, y a reutilizar la galería de recursos ya existente sin subida directa.

No hubo dudas técnicas nuevas que resolver con el usuario durante este análisis: `description.md` ya venía con las preguntas de alcance resueltas y con "Apuntes técnicos" que apuntaban correctamente a los módulos a reutilizar (`imageAdjustModal.js`, patrón `fondoTipo` de tablero, `isResourceInUse`).

## (b) Solución técnica

1. **Extender el modelo `Forma`** (definido implícitamente en `ui/cardShapeModal.js` / `ui/cardEditorModal.js` / `ui/componentRenderer.js`, sin clase ni validación central) con tres campos nuevos:
   - `fondoTipo` (`'color' | 'imagen'`, sin valor por defecto explícito — se trata como `'color'` cuando es `undefined`, mismo criterio que el resto de campos opcionales de `Forma`; figuras guardadas antes de este cambio se comportan como `'color'`, sin cambio visual).
   - `imagenResourceId` (`string | null`, `null` por defecto): id de un recurso de la galería (`core/resource.js`, tipo `'imagen'`).
   - `ajusteImagen` (`{ zoom, posX, posY }`, mismo shape que `cara.ajusteImagen`/`TextBox` no tiene equivalente pero sí `caraFrontal`/`caraTrasera`): zoom/posición del recorte, con los mismos valores por defecto que el resto de la app (`{ zoom: 100, posX: 50, posY: 50 }`).
   - Igual que `fondoTipo` de `'tablero'`, cambiar de `'color'` a `'imagen'` y viceversa **no borra** la configuración de la que se deja de usar (`colorFondo`/`colorFondoTransparencia` por un lado, `imagenResourceId`/`ajusteImagen` por otro) — ambos bloques conviven siempre en el objeto `Forma`, solo se pinta uno según `fondoTipo`.

2. **`ui/cardShapeModal.js`** — sección "Fondo" (pasa de ser meramente informativa a tener un selector de tipo, mismo patrón `.modal__section` informativo con control interno que ya usa `'tablero'`):
   - Añadir una fila con un `<select>` Color/Imagen (mismo patrón de fila `display:flex;gap:0.5rem` que `bgTypeSelect` + botón en `ui/componentModal.js` líneas ~675-696) que fija `working.fondoTipo`.
   - Con `fondoTipo === 'color'`: se muestra el bloque actual sin cambios (color + checkbox "Transparente" + slider de transparencia).
   - Con `fondoTipo === 'imagen'`: se sustituye por dos botones, "Elegir imagen…" y "Ajustar imagen…" (deshabilitado mientras `working.imagenResourceId` sea `null`), mismo texto/orden que describe `design_navigation_fondo-imagen-figura.md`.
     - "Elegir imagen…" abre `ui/boardImageModal.js` (`openBoardImageModal({ properties: working, resources: getResources(), onAccept: (resourceId) => { working.imagenResourceId = resourceId; working.ajusteImagen = { zoom: 100, posX: 50, posY: 50 }; renderBgSection(); } })`) — se reutiliza tal cual (ya opera sobre cualquier objeto con `imagenResourceId`, ya muestra "No hay imágenes disponibles" con "Aceptar" deshabilitado cuando la galería está vacía, cumpliendo ese punto de `description.md` sin código adicional). Reinicia el ajuste al cambiar de imagen, mismo criterio que `cardEditorModal.js` al elegir imagen de una cara.
     - "Ajustar imagen…" abre `ui/imageAdjustModal.js` (`openImageAdjustModal({ shape: working.tipo, width: working.width, height: working.height, resource: getResources().find(r => r.id === working.imagenResourceId), adjustment: working.ajusteImagen, onAccept: (adj) => { working.ajusteImagen = adj; } })`) — sin `faces` (modo de un único stage, el mismo que ya contempla el módulo para "un tipo futuro con una sola imagen de fondo").
   - Cambiar el `<select>` de tipo de fondo debe recalcular/repintar solo esa sub-sección (extraer el bloque color/imagen a una función interna tipo `renderBgSection()` invocada al crear la modal y en el listener del select), sin reconstruir el resto de la modal.
   - Se necesita `import { getResources } from '../core/state.js'` (o el módulo correspondiente, confirmar el import ya usado por `boardImageModal`/`cardEditorModal.js`) y `import { openBoardImageModal } from './boardImageModal.js'` / `import { openImageAdjustModal } from './imageAdjustModal.js'`, ninguno presente hoy en `cardShapeModal.js`.

3. **`ui/imageAdjustModal.js`** — extender el recorte de la máscara de previsualización para reconocer `shape === 'redondeada'`: cambiar `mask.style.borderRadius = entry.shape === 'circular' ? '50%' : '0';` (línea ~119) para que `'redondeada'` use `8px` (mismo radio ya usado por `SHAPE_BORDER_RADIUS.redondeada` en `ui/componentRenderer.js` y por "Carta" con esquinas redondeadas — `var(--radius-lg)` documentado en `STYLE_BIBLE.md` sección 5) en vez de caer al recorte cuadrado por defecto. Es un gap real ya detectado en el análisis (`ms-internal-tech-analysis`), no solo un ajuste cosmético: sin este cambio, ajustar la imagen de una figura `'redondeada'` se previsualizaría con esquinas cuadradas aunque el resultado final sí las recorte en redondo.

4. **Pintado final de la figura** — dos puntos que hoy pintan `Forma` con `backgroundColor` liso y deben pintar la imagen cuando `fondoTipo === 'imagen'`:
   - `ui/componentRenderer.js` → `paintShape` (líneas ~314-327): cuando `shape.fondoTipo === 'imagen'` y hay `shape.imagenResourceId` con recurso válido, en vez de `shapeEl.style.backgroundColor = hexToRgba(...)`, crear un contenedor interno con `position:absolute; inset:0; overflow:hidden` y el mismo `border-radius` que ya calcula `SHAPE_BORDER_RADIUS[shape.tipo]`, insertar un `<img>` dentro con `applyImageAdjustStyle(img, shape.ajusteImagen)` (mismo helper ya usado por `paintCartaFace`) — el contenedor exterior `shapeEl` conserva el `border` (se sigue dibujando por encima, tal como pide `description.md`) y el propio `border-radius` (para que el borde en sí también luzca redondeado). Sin imagen resuelta (recurso borrado/inexistente) o con `fondoTipo === 'color'`, se mantiene el `backgroundColor` actual sin cambios.
   - `ui/cardEditorModal.js` → `renderShape` (líneas ~965-980): mismo tratamiento, para que el lienzo del editor muestre la imagen igual que el resultado final.
   - Ninguno de los dos necesita `clip-path` (a diferencia de `imageAdjustModal.js`, que sí lo usa para hexágonos/triángulos de `'carta'`): `Forma` solo tiene `'circular'`/`'cuadrada'`/`'redondeada'`, las tres resolubles con `border-radius`.

5. **Creación de figura nueva** (`ui/cardEditorModal.js` → `onAddShape`, líneas ~736-753): sin cambios funcionales — nace con `fondoTipo` ausente (tratado como `'color'`), igual que hoy. No hace falta inicializar el campo explícitamente.

6. **Duplicar / Copiar-pegar figura**: sin cambios de código. `onDuplicate` (`cardEditorModal.js`, spread `{ ...workingShape }`) y "Copiar"/"Pegar" del menú contextual (`copiedElement`, spread `{ ...element }`) ya copian el objeto `Forma` completo campo a campo, así que `fondoTipo`/`imagenResourceId`/`ajusteImagen` se llevan automáticamente con la copia, cumpliendo ese punto de `description.md` sin trabajo adicional.

7. **Cambiar el tipo de figura conservando la imagen**: sin cambios de código. `imagenResourceId`/`ajusteImagen` son campos independientes de `tipo` en el objeto `Forma`; el único ajuste que hace hoy el selector de tipo (igualar `width`/`height` al pasar a `'circular'`) no los toca, así que ya se conservan al cambiar de forma — solo cambia el recorte visual (paso 4), que ya se recalcula solo con el `border-radius` correspondiente al nuevo `tipo`.

8. **Borrado de recurso en uso**: sin cambios. `core/resource.js` → `isResourceInUse`/`getComponentsUsingResource` ya recorren `component.properties` en profundidad (`collectDeepValues`), así que el nuevo `imagenResourceId` dentro de `cara.formas[]` queda cubierto automáticamente por el mecanismo de bloqueo de borrado ya existente.

## (c) Cambios de arquitectura

Actualizar `design/docs/ARCHITECTURE.md`, sección 4 (definición de `Forma`, línea ~149):

- Ampliar `tipo: 'circular' | 'cuadrada'` a `tipo: 'circular' | 'cuadrada' | 'redondeada'` — incongruencia preexistente detectada por `ms-internal-tech-analysis`: el código (`ui/cardShapeModal.js` líneas ~36-52, `ui/componentRenderer.js` → `SHAPE_BORDER_RADIUS`) ya soporta e implementa `'redondeada'` desde el cambio 00120 (mencionado en la propia sección como origen de `Forma`), pero la documentación nunca llegó a incluir ese tercer valor. Corregirlo de paso al aplicar este cambio, ya que este mismo cambio vuelve a tocar esa definición.
- Añadir a la definición de `Forma` los tres campos nuevos de este cambio: `fondoTipo: 'color' | 'imagen' | undefined` (undefined = `'color'`), `imagenResourceId: string | null`, `ajusteImagen: { zoom, posX, posY }` — mismo criterio de redacción que el resto de campos opcionales ya documentados ahí (semántica, valor por defecto, y que `imagenResourceId` sustituye por completo a `colorFondo` sin combinarse, mismo patrón que `fondoTipo` de `'tablero'`).
- En la sección 5 (`ui/imageAdjustModal.js`), añadir una nota de que la máscara de previsualización reconoce ahora también `shape: 'redondeada'` (radio `8px`), además de `'circular'`/las formas hexagonales/triangulares ya documentadas — usado por primera vez desde `Forma` de carta (este cambio).
