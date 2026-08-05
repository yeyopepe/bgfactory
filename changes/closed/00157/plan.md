- **Fecha creación**: 2026-08-05

## (a) Anotaciones funcionales

- **Fuera de alcance**: el botón "Ajustar imagen…" del editor visual (`ui/visualEditorModal.js`) no cambia su condición de habilitado — sigue dependiendo únicamente de si la cara tiene `imagenResourceId`, con independencia de si `fondoTipo` es `'imagen'` o `'color'` en ese momento. Esto permite pre-ajustar/reajustar la imagen aunque el color esté activo, coherente con que ambas configuraciones conviven sin perderse (ya confirmado en `description.md`).
- **Duda técnica resuelta durante este análisis**: cómo debe comportarse una cara sin el campo `fondoTipo` (todas las cartas/tableros ya guardados) sin romper compatibilidad visual. Se resuelve así: **ausente** y **`'imagen'`** se tratan exactamente igual (se pinta `imagenResourceId` si existe, blanco si no — el comportamiento de siempre); solo `fondoTipo === 'color'` activa el nuevo camino. Así ninguna carta/tablero ya guardado cambia de aspecto, sin necesidad de ninguna migración explícita en `core/state.js`.
- El resto de preguntas de alcance ya quedaron resueltas con el usuario en `description.md` (ventana propia, exclusividad sin pérdida de configuración, no repetible).

## (b) Solución técnica

1. **Crear `src/ui/cardBackgroundColorModal.js`**, exportando `openCardBackgroundColorModal({ properties, onAccept })`. Estructura estándar de modal (`modal-overlay` / `modal` / `modal__header` / `modal__content` / `modal__footer`, sin tabs ni fieldset — un único campo, mismo criterio de simplicidad que justifica no envolverlo en `fieldset.modal__section`), calcada del bloque "Color de fondo" ya existente en `ui/boardPatternModal.js` (líneas 65-102: input `type="color"` + checkbox "Transparente" que deshabilita el input y vacía el valor, `??` para distinguir "vacío explícito" de "sin definir"):
   - Header: texto fijo "Configurar color de fondo".
   - Campo único: label "Color de fondo", `working.colorFondo = properties.colorFondo ?? '#ffffff'`.
   - Footer: "Cancelar" (`btn-cancel`, cierra sin más) y "Aceptar" (`btn-accept`, invoca `onAccept({ colorFondo: working.colorFondo })` y cierra).
   - Mismo cierre por click fuera del modal (`mousedownOnOverlay`) que el resto de modales del proyecto.

2. **`src/ui/visualEditorModal.js`**:
   - Importar `openCardBackgroundColorModal` desde el nuevo fichero.
   - `createAddElementMenu({ onAddImage, onAddTextBox, onAddShape })` → añadir un cuarto parámetro `onAddColor` y `addItem('Color de fondo…', onAddColor)` como última entrada del menú (tras "Figura geométrica").
   - `cloneCara(cara)` (línea ~190-200) → añadir explícitamente `fondoTipo: cara?.fondoTipo` y `colorFondo: cara?.colorFondo ?? '#ffffff'` al objeto devuelto (esta función enumera campos uno a uno, a diferencia de `cloneFace` de `ui/componentModal.js`/`core/styleClipboard.js`, que usan spread y no necesitan tocarse — ver punto 4).
   - En `renderFace`, en la llamada a `createAddElementMenu` (línea ~727): añadir `onAddColor` que abre `openCardBackgroundColorModal({ properties: cara, onAccept: ({ colorFondo }) => { cara.fondoTipo = 'color'; cara.colorFondo = colorFondo; renderFaces(); } })`.
   - En el `onAddImage` ya existente (línea ~728-740): añadir `cara.fondoTipo = 'imagen';` junto a las asignaciones que ya hace (`cara.imagenResourceId`, `cara.ajusteImagen`, `cara.transparenciaImagen`) — así, si el color estaba activo, volver a elegir una imagen recupera el control para la imagen.
   - Pintado del lienzo del editor (línea ~700-713, dentro de `renderFace`): antes del bloque que crea `faceImg`, si `cara.fondoTipo === 'color'` fijar `canvasInner.style.backgroundColor = cara.colorFondo || 'transparent'` y **no** ejecutar el bloque de imagen (ni buscar `resource`, ni crear `faceImg`); en caso contrario (ausente o `'imagen'`), no tocar `canvasInner.style.backgroundColor` (queda sin fondo propio, comportamiento actual: se ve el blanco de `.card-editor-modal__canvas` u otro fondo ya pintado por `applyCanvasBorder` para hex/triángulo) y pintar la imagen exactamente como hoy si `imagenResourceId` existe.

3. **`src/ui/componentRenderer.js`, función `paintCartaFace`** (línea ~281-303): misma lógica que en el editor — si `cara?.fondoTipo === 'color'`, fijar `contentParent.style.backgroundColor = cara.colorFondo || 'transparent'` y saltar por completo el bloque que busca el recurso y crea el `<img>`; en caso contrario, dejar el bloque de imagen exactamente como está hoy (sin tocar `contentParent.style.backgroundColor`, que ya viene fijado a blanco por cada llamante — `cartaContent`/`cartaInner` en la rama `'carta'`, o queda transparente sobre el blanco de `tablero` en la rama `'tableroPersonalizado'`). Esta función es la única compartida por los tres puntos de renderizado real (carta en la mesa, tablero personalizado en la mesa, miniatura de `ui/mazoContentModal.js`), así que el cambio cubre los tres sin tocarlos por separado.

4. **No requieren cambios** (confirmado durante el análisis):
   - `ui/componentModal.js` (`cloneFace`, `DEFAULT_CARTA_PROPERTIES`, `DEFAULT_TABLERO_PERSONALIZADO_PROPERTIES`): `cloneFace` ya clona con `{ ...face, ... }` (spread), así que `fondoTipo`/`colorFondo` viajan solos sin tocar la función; los valores por defecto no necesitan estos campos porque su ausencia ya es el estado "sin color activo" (ver anotación funcional de más arriba).
   - `core/styleClipboard.js`: su `cloneFace` interno también usa spread (`{ ...face, ... }`) — Copiar/Pegar estilo entre cartas arrastra `fondoTipo`/`colorFondo` de forma automática, sin lógica nueva.
   - `core/resource.js` (`isResourceInUse`/`getComponentsUsingResource`): su recorrido genérico (`collectDeepValues`, agnóstico a nombres de campo) sigue detectando `imagenResourceId` en cualquier nivel de `properties` con independencia de `fondoTipo` — una imagen "desactivada" por tener el color activo sigue contando como recurso en uso, que es el comportamiento correcto (no se pierde ni se puede borrar el recurso solo por dejar de pintarse en ese momento).
   - `core/importMerge.js` (`RESOURCE_REF_KEYS`): mismo motivo, recorrido agnóstico a `fondoTipo`.
   - `core/state.js`: no hace falta ninguna migración — un `fondoTipo` ausente ya se comporta exactamente como hoy (ver anotación funcional).

## (c) Cambios de arquitectura

En `design/docs/ARCHITECTURE.md`, sección 4 (modelo de datos de componente), bullet `'carta'`:

- En la descripción del shape de `caraFrontal`/`caraTrasera` (línea ~150, `{ imagenResourceId, ajusteImagen, formas, textBoxes, bordeColor, bordeGrosor, transparenciaImagen }`): añadir dos campos nuevos, `fondoTipo: 'imagen' | 'color' | undefined` y `colorFondo: string` (hex o vacío = transparente, solo con efecto si `fondoTipo === 'color'`), cambio 00157. Documentar explícitamente que **ausente** y `'imagen'` son equivalentes (pintan `imagenResourceId` si existe) — a diferencia del precedente `fondoTipo` de `Forma` (cambio 00133), donde `undefined` se trata como `'color'`; aquí es al revés, para no romper el aspecto de las cartas/tableros ya guardados. Cambiar de uno a otro no borra la configuración del que queda inactivo (mismo criterio de convivencia que `fondoTipo` de `Forma` y que `fondoTipo` de `'tableroSimple'`).
- En la descripción del menú "Añadir elemento" (línea ~156, enumeración "Imagen de fondo…"/"Cuadro de texto"/"Figura geométrica"): añadir la cuarta opción "Color de fondo…" (cambio 00157), que abre `ui/cardBackgroundColorModal.js` (`openCardBackgroundColorModal`) en vez de añadir un elemento repetible al lienzo — activa `fondoTipo = 'color'` sobre la cara, excluyente con "Imagen de fondo…" (que activa `fondoTipo = 'imagen'`).
- El bullet `'tableroPersonalizado'` (línea ~180) no necesita edición propia: ya remite a "mismo shape que `caraFrontal`/`caraTrasera` de `'carta'`", así que hereda los dos campos nuevos automáticamente en cuanto se actualiza el punto anterior.
