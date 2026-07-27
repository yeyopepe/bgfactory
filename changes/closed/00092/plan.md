## (a) Anotaciones funcionales

- **Fuera de alcance**: no cambia la posición del botón "Ajustar imagen…" entre las dos caras (ya está bien, se mantiene), ni el comportamiento de apilado vertical en pantallas estrechas (se conserva tal cual).
- **Requisito explícito de esta iteración del plan**: la ampliación de `description.md` pide que la reestructuración del espaciado no rompa, por efecto colateral, la lógica que deshabilita "Ajustar imagen…" cuando ninguna cara tiene imagen seleccionada. Verificado en código (`src/ui/cardEditorModal.js:93`, dentro de `renderFaces()`): `adjustImageBtn.disabled = !working.caraFrontal.imagenResourceId && !working.caraTrasera.imagenResourceId` depende únicamente de datos (`imagenResourceId` de cada cara), no de ningún cálculo de ancho, `previewScale` ni layout CSS. Ninguno de los cambios de (b) toca esa línea — se mantiene como paso de verificación manual explícito en vez de darlo por hecho (ver (b).6).

- **Primera corrección de causa raíz (por qué fallaron los intentos 1 y 2)**: los dos intentos previos atribuían el hueco excesivo entre las dos caras al `max-width: 1100px` de `.card-editor-modal`. Esa atribución es incorrecta: `.card-editor-modal__faces` (`src/styles/main.css:1026-1030`) usa `justify-content: center` sobre sus tres hijos flex (cara frontal, botón, cara trasera), así que ese grupo se centra **como bloque compacto** dentro del modal — el ancho del modal solo determina el margen en blanco a los lados del grupo, nunca la separación entre los propios hijos del flex. La separación real dependía de otras dos cosas, que ningún intento anterior había tocado:
  1. El `gap: 1.5rem` de `.card-editor-modal__faces` — no está en la escala de espaciado documentada (`STYLE_BIBLE.md` sección 4: gap de flex debe ser `0.5rem` "ajustado" o `1rem` "holgado"; `1.5rem` no es ninguno de los dos).
  2. El botón `adjustImageBtn`, con la clase compartida `.btn-cancel` (`padding: 0.5rem 1.5rem`, pensado para botones de pie de modal) sin ningún override de padding específico.
  - El mockup de referencia (`design_editor-cartas-espaciado.html`) ya apuntaba a esto: además de acercar el modal, reduce el `gap` a `0.75rem` y da al botón un padding propio más ajustado (`0.5rem 0.85rem`).

- **Segunda corrección de causa raíz (por qué el intento 3, la primera versión de este plan.md, tampoco fue suficiente)**: se implementaron el gap a `0.5rem` y el padding del botón a `0.75rem`, y se verificaron visualmente en el navegador (proporciones `5:7` y `7:5`, sin imagen ni borde activo) — parecían correctas. El usuario reportó después, con una captura del inspector de DevTools sobre una carta real (proporción `circular`, con imágenes elegidas en ambas caras y `bordeGrosor: 1`), que "sigue pasando lo mismo": el botón seguía flotando en una columna central ancha, sin superponerse a nada para reducirla.
  - **Medido en el DOM real** (`getBoundingClientRect`/`getComputedStyle`, repitiendo el mismo repro que el usuario): `.card-editor-modal__face` (la columna de cada cara, `src/ui/cardEditorModal.js:168-169`) mide **422.97px de ancho siempre, para cualquier proporción** (mismo valor exacto con `'5:7'` sin imagen/grosor 0 que con `'circular'` con imagen/grosor 1) — muy por encima de cualquier lienzo real (`.card-editor-modal__canvas`, entre 151px y 260px según proporción).
  - **Causa exacta**: la fila "Borde" (Color + Grosor), construida en `renderFace()` siguiendo el patrón de `STYLE_BIBLE.md` sección 8 (`borderRowInner` con `style.display='flex'; style.gap='0.5rem'`, dos sub-`div` con `style.flex='1'`), no tiene ningún ancho máximo propio. Los `<input type="color">`/`<input type="number">` que contiene llevan `width: 100%` por regla global (`src/styles/main.css:347-352`), pero como ninguno de sus contenedores (`borderRowInner`, `borderField`, `actionsRow`, `faceCol`) tiene un ancho explícito, ese `100%` no se resuelve contra el lienzo sino contra el ancho nativo por defecto de los propios `<input>` sin restricción — sensiblemente mayor que 260px.
  - **Resultado**: el lienzo queda centrado (`align-items: center` en `.card-editor-modal__face`) dentro de una columna invisible ~423px de ancha. El sobrante (~163px por lado) se reparte como margen invisible a ambos lados del lienzo, dentro de la propia columna de cada cara — no alrededor del botón —, así que el ajuste de gap/padding de (b).1-(b).2 nunca podía tocarlo: cada intento corrigió una capa distinta (ancho de modal → gap → padding de botón) sin llegar nunca a la columna de cada cara, que es la que de verdad determina el ancho visible del conjunto.
  - Confirmado con `ms-internal-tech-analysis` que no hay incongruencia de documentación: `STYLE_BIBLE.md` sección 8 documenta el patrón color+grosor tal cual está implementado, pensado para un modal de ancho normal (`componentModal.js`, borde de tablero) donde no compite con un lienzo estrecho. Reutilizarlo sin acotar su ancho dentro de la columna angosta de `cardEditorModal.js` es específico de este segundo bloque, no un fallo de la sección 8 en sí.
  - **Solución adicional necesaria** (ver (b).1): fijar el ancho de la columna de cada cara al `canvasWidth` ya calculado en `renderFace()` — el mismo valor en px que ya dimensiona el lienzo —, para que la fila de Color+Grosor quede forzada a encajar en ese ancho en vez de determinarlo.

- **Duda resuelta**: ¿se mantiene el ajuste de ancho del modal (`fit-content`) del intento 3? Sí, se mantiene como mejora secundaria e independiente (reduce el margen en blanco a los lados del conjunto en pantallas anchas), nunca como el cambio que soluciona la queja principal — eso lo resuelven (b).1-(b).3.

## (b) Solución técnica

1. **`src/ui/cardEditorModal.js`, función `renderFace()`** (línea ~168, creación de `faceCol`) — cambio nuevo, no aplicado en ningún intento anterior: fijar el ancho de la columna al mismo `canvasWidth` ya calculado para el lienzo de esa cara:
   ```js
   const faceCol = document.createElement('div');
   faceCol.className = 'card-editor-modal__face';
   faceCol.style.width = `${canvasWidth}px`;
   ```
   `canvasWidth` ya es un valor numérico calculado dinámicamente según la proporción activa (mismo patrón ya usado unas líneas más abajo para `canvas.style.width`, admitido por `STYLE_BIBLE.md` sección 8 para valores puramente numéricos sin sentido como clase). Al fijar este ancho, la fila "Borde" (`borderRowInner`, `flex:1` en cada campo) deja de expandirse a su ancho nativo y se reparte dentro del ancho real del lienzo — igual que ya hacen la etiqueta, "Elegir imagen…" y "+ Texto", que no llevan `width:100%`. Es el cambio que de verdad hace que el bloque visible de cada cara (lienzo + acciones) ocupe el mismo ancho que el lienzo, sin margen invisible a los lados — condición necesaria para que el botón central deje de "flotar" en un hueco.
   - Nota de robustez: para proporciones muy estrechas (p. ej. `tarot-h`, ratio 0.583 → `canvasWidth` ≈ 152px), la fila Color+Grosor quedará más apretada que hoy pero sigue siendo usable (los campos son `flex:1` con `flex-shrink` por defecto, se comprimen en vez de desbordar); no hace falta `flex-wrap` adicional en `borderRowInner` para este cambio.

2. **`src/styles/main.css`, regla `.card-editor-modal__faces`** (hoy `gap: 1.5rem;`): reducir a `gap: 0.5rem;` — valor "ajustado" documentado en `STYLE_BIBLE.md` sección 4.

3. **`src/styles/main.css`, regla `.card-editor-modal__adjust-image`** (hoy solo `align-self: center;`): añadir un padding propio más compacto que el heredado de `.btn-cancel`:
   ```css
   .card-editor-modal__adjust-image {
     align-self: center;
     padding: 0.5rem 0.75rem;
   }
   ```
   `0.75rem` está en la escala de espaciado de `STYLE_BIBLE.md` sección 4, a medio camino entre el padding estándar de botón (`0.5rem 1rem`, sección 9) y el de un botón pequeño dentro de un item (`0.25rem 0.5rem`).

4. **`src/styles/main.css`, regla `.card-editor-modal`** (hoy `max-width: 1100px;`) — ajuste secundario, no crítico para la queja principal (ver (a)): sustituir por un ancho ajustado al contenido con tope de seguridad:
   ```css
   .card-editor-modal {
     width: fit-content;
     max-width: min(1100px, 90vw);
   }
   ```
   Reduce el margen en blanco sobrante a los lados del conjunto en pantallas anchas, sin afectar al `flex-wrap: wrap` existente en `.card-editor-modal__faces` para el apilado en pantallas pequeñas. Solo se toca la clase de bloque propia `.card-editor-modal` (no `.modal`), siguiendo el patrón de `STYLE_BIBLE.md` §12.4.

5. **Verificación manual en navegador** (ejecutar la app y abrir el editor de cartas) — esta vez cubriendo explícitamente el escenario que expuso el fallo del intento 3:
   - **Espaciado con contenido real (crítico)**: repetir el repro exacto del usuario — proporción `circular`, con imagen elegida en ambas caras y `bordeGrosor: 1` — y comprobar con el inspector (o midiendo `getBoundingClientRect`) que el ancho de `.card-editor-modal__face` coincide con el de su `.card-editor-modal__canvas` (sin margen invisible a los lados), y que el conjunto (lienzo + botón + lienzo) se ve compacto como en el mockup. Repetir además con `'5:7'` (por defecto), `'7:5'` y una proporción estrecha (`'tarot-h'`) para cubrir el rango de anchos de lienzo.
   - **Apilado en pantallas estrechas**: confirmar que sigue funcionando igual que antes.
   - **Habilitación del botón** (requisito de la ampliación): comprobar los tres estados de `adjustImageBtn` — (1) sin imagen en ninguna cara → deshabilitado; (2) imagen solo en una cara → habilitado; (3) imagen en ambas → habilitado. Confirmar que el estado visual (`:disabled`) y el click (abre `openImageAdjustModal` solo si está habilitado) no cambian respecto a antes.

## (d) Cambios en estilo

- **`STYLE_BIBLE.md` sección 12.4** ("Modales anchas"): corregir la entrada de `.card-editor-modal` para reflejar que ya no usa un `max-width` fijo sino un ancho ajustado al contenido con tope `min(1100px, 90vw)` — dejar constancia de que es la primera excepción del catálogo que usa `width: fit-content` en vez de heredar el `width: 90%` fijo de `.modal`, porque el ancho de su contenido varía según la proporción de carta activa.
- **`STYLE_BIBLE.md` sección 9** ("Botones"): añadir `.card-editor-modal__adjust-image` (`padding: 0.5rem 0.75rem`) como tercera variante de padding ya usada en el proyecto — un botón de texto completo en un contexto de espacio reducido — para que futuros casos similares reutilicen `0.75rem` en vez de un valor ad-hoc.
- **`STYLE_BIBLE.md` sección 8** (patrón "campo de color + grosor en la misma fila"): añadir una nota de precaución junto al patrón ya documentado — cuando se reutilice dentro de un contenedor de ancho variable/acotado (no un modal de ancho normal), el contenedor debe fijar explícitamente su propio ancho (como hace ahora `cardEditorModal.js` con `faceCol.style.width`), porque los campos `flex:1` con inputs `width:100%` del patrón se expanden a su ancho nativo si no hay ningún ancho explícito en la cadena de contenedores.
