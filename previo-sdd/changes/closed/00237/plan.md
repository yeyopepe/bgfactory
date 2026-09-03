- **Creation date**: 2026-09-03
- **Risk**: 2/10 — Riesgo mínimo (cambio local en un módulo de UI, sin contratos ni datos, reversible revirtiendo el commit; sin red de tests automatizados, de ahí que no baje de 2)

## (a) Functional notes

**Out of scope:**

- **No se toca el editor de cartas** (`showProporcionSelector: true`, dos caras): ya funciona bien tras 00235. El fix debe dejar su comportamiento visual idéntico; cualquier cambio en código o CSS compartido (`getEffectiveCanvasMaxSide()`, `getEditorWorkArea()`, `.card-editor-modal*`) se verifica también contra el caso carta como regresión, pero el objetivo es solo el tablero personalizado.
- No se toca la rama **por defecto** de `getEffectiveCanvasMaxSide()` (editor recién abierto, sin maximizar ni tamaño manual): sigue devolviendo `CANVAS_MAX_SIDE`. El aspecto al abrir el editor no cambia.
- No se cambia la mecánica de "Maximizar"/"Restaurar" (00233) ni la de los manejadores de esquina (00225): solo cambia **cuánto crece el lienzo** y **cómo queda centrado** dentro de esos estados.
- No se toca `ui/resizeHandle.js`, ni el panel "Componentes", ni el ajuste de imagen (`openImageAdjustModal`), ni la barra de herramientas.
- No se añade persistencia del tamaño ni scroll horizontal; el lienzo nunca se deforma ni se recorta para llenar el hueco.
- **Mejora vista pero descartada** (fuera de alcance del fix): sacar la fila de acciones (`.card-editor-modal__face-actions`, con "Añadir elemento" y el formulario "Borde") fuera del bloque centrado verticalmente, para que su alto no compita con el del lienzo. Sería un cambio estructural del DOM del editor, no la corrección mínima de la causa raíz. Se mantiene dentro de `.card-editor-modal__face` y el plan resuelve la convergencia de su medición sin moverla.

**Doubts resolved with the user:**

- **¿Afecta también al editor de cartas?** No. El usuario confirmó que tras 00235 el editor de cartas ya redimensiona y aprovecha el espacio correctamente. El re-report (y este plan) se acota **solo** al editor de tableros personalizados (una cara).
- Sin más dudas técnicas abiertas: el criterio funcional esperado es el ya acordado en 00235 (lienzo lo más grande posible dentro del hueco interior real, manteniendo proporción, topando la primera restricción ancho/alto, centrado en el sobrante, sin scroll salvo válvula), aplicado al caso de una sola cara.

## (b) Technical solution

Diagnóstico de la causa raíz (confirmado leyendo código + documentación; el editor de carta converge y el de tablero no por las razones que se detallan en cada punto):

1. **Techo artificial `CANVAS_MAX_SIDE * 3 = 1140`** en `getEffectiveCanvasMaxSide()` (rama `maximized || manualSize`): limita el "lado" máximo del lienzo a 1140 px. Un tablero **apaisado** topa primero el **ancho** (`sideFromWidth < sideFromHeight`), y en una ventana maximizada (~90vw) el ancho interior disponible es muy superior a 1140 → el lienzo se queda pequeño y sobra blanco a los lados. Una carta vertical topa antes el **alto** y nunca llega a ese techo, por eso no le afecta.
2. **`actionsH` no convergente.** `getEditorWorkArea()` resta de `availHeight` la altura de `.card-editor-modal__face-actions` medida del render **anterior**. Esa fila tiene `flex-wrap: wrap` y su anchura es la del lienzo. En tablero personalizado el lienzo pasa de pequeño (render previo, p. ej. `CANVAS_MAX_SIDE` o un tamaño manual menor) a muy ancho (render nuevo): la fila de acciones pasa de envolver en varias filas (alta) a una sola (baja) → `availHeight` queda **infravalorado** → el lienzo sale más pequeño de lo posible y, además, la fila ya reducida deja un gran hueco debajo. Es un problema de convergencia de la pasada única de `renderFaces()`. En carta, con dos lienzos verticales estrechos, la fila envuelve de forma parecida antes y después → `actionsH` estable → una pasada converge.
3. **Centrado vertical no efectivo.** Cadena flex `.modal` (columna, `height:90vh` al maximizar) → `.modal__content` (`flex:1`) → `.card-editor-modal__faces` (`flex:1 1 auto; align-items:center`). El selector scoped `.card-editor-modal .modal__content` es hoy `display:flex; flex-direction:column` **sin `min-height: 0`**. Con `min-height: auto` (por defecto) + el `overflow-y: auto` que hereda de `.modal__content`, un hijo flex con contenido no se deja constreñir por el padre y el contenido queda pegado arriba en vez de centrarse en el hueco sobrante — el mismo motivo por el que `#content` (columna flex principal de la app) lleva `min-height: 0` explícito (`style/002-componentes-layout.md`, Layout).

Solución mínima (dos ficheros):

- [x] **`src/styles/main.css` — `.card-editor-modal .modal__content`: añadir `min-height: 0`.** En la regla existente (línea ~1965), que hoy es:
  ```css
  .card-editor-modal .modal__content {
    display: flex;
    flex-direction: column;
  }
  ```
  dejarla como:
  ```css
  .card-editor-modal .modal__content {
    display: flex;
    flex-direction: column;
    min-height: 0;
  }
  ```
  Permite que `.card-editor-modal__faces` (`flex: 1 1 auto`) se estire de verdad para llenar el alto de `.modal__content` y que `align-items: center` centre verticalmente el bloque de la cara en el hueco sobrante. Selector acotado a `.card-editor-modal`: no afecta a otras modales. Actualizar el comentario del bloque (líneas ~1960-1964) para mencionar que `min-height: 0` es lo que habilita el estiramiento/centrado (mismo idioma que el resto del fichero).

- [x] **`src/ui/visualEditorModal.js` — `getEffectiveCanvasMaxSide()`: quitar el techo `CANVAS_MAX_SIDE * 3`.** En la rama `maximized || manualSize` (líneas ~311-323), el `return` actual:
  ```js
  return Math.max(
    CANVAS_MIN_SIDE,
    Math.min(sideFromWidth, sideFromHeight, CANVAS_MAX_SIDE * 3),
  );
  ```
  pasa a:
  ```js
  return Math.max(
    CANVAS_MIN_SIDE,
    Math.min(sideFromWidth, sideFromHeight),
  );
  ```
  `sideFromWidth`/`sideFromHeight` ya derivan del hueco interior **real** medido en runtime (`getEditorWorkArea()`), así que son el límite correcto; el `CANVAS_MAX_SIDE * 3` era un tope prudente heredado del diseño previo a 00235 que ahora impide aprovechar el ancho en una ventana grande. Se conserva el suelo `CANVAS_MIN_SIDE`. Actualizar el comentario de cabecera de la función (líneas ~295-309) para eliminar la mención al "techo prudente CANVAS_MAX_SIDE * 3".

- [x] **`src/ui/visualEditorModal.js` — `renderFaces()`: segunda pasada de convergencia con `requestAnimationFrame` en estado maximizado/manual.** Causa raíz 2: la fila de acciones que `getEditorWorkArea()` mide (`actionsH`) pertenece al render anterior y, en tablero personalizado, tiene una altura distinta a la que tendrá con el lienzo nuevo (más ancho). Tras pintar el render nuevo, el DOM ya tiene la fila de acciones a su **anchura final**; basta re-medir y re-renderizar una vez para que `availHeight` (y por tanto el tamaño del lienzo) converja.
  - Añadir una variable local a `openVisualEditorModal` junto a `currentCanvasMaxSide` (línea ~670): `let convergePending = false;` y `let convergeRaf = 0;`.
  - Al **final** de `renderFaces()` (después del bloque que ajusta `adjustImageBtn.style.marginTop`, línea ~702), añadir:
    ```js
    // Segunda pasada de convergencia (cambio 00237): en estado maximizado o con
    // tamaño manual, getEditorWorkArea() midió la fila de acciones del render
    // anterior, cuya altura (flex-wrap) depende del ancho del lienzo y cambia
    // con el render nuevo — sobre todo en 'tableroPersonalizado' apaisado, donde
    // el lienzo pasa a ocupar casi todo el ancho. Tras pintar, se re-mide el
    // "lado" con la fila ya a su anchura final y, si difiere de forma
    // apreciable, se re-renderiza una sola vez. `convergePending` corta la
    // recursión: el segundo render no vuelve a agendar. [gotcha] no es un bucle
    // de convergencia iterativo (mismo criterio acotado que el doble rAF de
    // ui/progressModal.js, bug 00218): una única pasada extra basta porque ya
    // mide el layout definitivo.
    if ((maximized || manualSize) && !convergePending) {
      const before = currentCanvasMaxSide;
      cancelAnimationFrame(convergeRaf);
      convergeRaf = requestAnimationFrame(() => {
        const after = getEffectiveCanvasMaxSide();
        if (Math.abs(after - before) > 1) {
          convergePending = true;
          renderFaces();
          convergePending = false;
        }
      });
    }
    ```
  - En `cleanup()` (línea ~585), añadir `cancelAnimationFrame(convergeRaf);` junto a los `removeEventListener`, para no dejar un rAF pendiente si se cierra el editor entre el render y su convergencia.
  - Umbral `> 1` px: evita re-renders inútiles por redondeos de medida; durante un arrastre, una vez convergido el primer tick, los siguientes a tamaños similares no re-renderizan.

- [x] **`src/ui/visualEditorModal.js` — verificar que `renderFace()` y el margen de "Ajustar imagen…" siguen siendo correctos con el nuevo `currentCanvasMaxSide`.** No requieren cambios de fórmula: `renderFace()` (línea ~863) sigue con `previewScale = currentCanvasMaxSide / Math.max(designWidth, designHeight)` y el margen del botón (línea ~698) con `canvasHeight = designHeight * (currentCanvasMaxSide / Math.max(...))`. Al quitar el techo y converger la medición, `currentCanvasMaxSide` es simplemente un valor mayor y más ajustado al hueco real; ambas fórmulas escalan de forma coherente. Solo revisar que ningún comentario mencione el techo viejo.

## (c) Architecture changes

`previo-sdd/design/docs/architecture/006-ui-layer.md` — sección **`ui/visualEditorModal.js`**, subsección "Window size":

- En el pseudocódigo de `getEffectiveCanvasMaxSide()` (rama `maximized || manualSize`), cambiar `return max(CANVAS_MIN_SIDE, min(sideFromWidth, sideFromHeight, CANVAS_MAX_SIDE * 3))` por `return max(CANVAS_MIN_SIDE, min(sideFromWidth, sideFromHeight))`, y ajustar la línea `[motivación] fix 00235` para añadir que el fix 00237 elimina el techo `CANVAS_MAX_SIDE * 3` (era un tope heredado que, con medición real del hueco, impedía que un diseño apaisado aprovechara el ancho de una ventana maximizada).
- En la descripción de `getEditorWorkArea()` / `renderFaces()`, añadir que en estado `maximized || manualSize` `renderFaces()` hace una **segunda pasada de convergencia** vía `requestAnimationFrame` (fix 00237): la primera pasada mide la fila de acciones del render anterior, cuya altura (`flex-wrap`) depende del ancho del lienzo; tras pintar se re-mide con la fila a su anchura final y se re-renderiza una vez si el "lado" difiere > 1 px. `convergePending` corta la recursión (una sola pasada extra, no un bucle iterativo — mismo criterio acotado que el doble rAF de `ui/progressModal.js`). `cleanup()` cancela el rAF pendiente.
- En la línea que describe el centrado por CSS, añadir que `.card-editor-modal .modal__content` lleva `min-height: 0` (fix 00237) para que `.card-editor-modal__faces` (`flex: 1 1 auto`) se estire realmente y `align-items: center` centre el lienzo en el hueco vertical — sin él, el `overflow-y: auto` heredado deja el contenido pegado arriba.
- Actualizar la fila de la tabla "Módulo constantes" si menciona `CANVAS_MAX_SIDE * 3` como techo (quitar esa mención); mantener el resto de constantes.

## (d) Style changes

`previo-sdd/design/docs/style/003-modales-menus.md` — sección **"Wide modals"**, fila `.card-editor-modal` de la tabla:

- Donde describe el escalado del lienzo en estado maximizado/manual (00233/00235: "escala para ser lo más grande posible dentro del hueco interior real … topando el ancho por cara o el alto"), añadir que el fix 00237 **elimina el techo artificial** que antes lo limitaba antes de llegar a ese hueco real (un diseño apaisado en ventana maximizada ahora sí llena el ancho disponible).
- Añadir que `.card-editor-modal .modal__content` pasa a `display:flex; flex-direction:column; min-height:0` (el `min-height:0` es lo que permite que `.card-editor-modal__faces { flex:1 1 auto; align-items:center }` se estire y centre el lienzo en el hueco vertical; sin él el `overflow-y:auto` heredado dejaba el lienzo pegado arriba — bug 00237).
- Mencionar la segunda pasada de convergencia de `renderFaces()` vía `requestAnimationFrame` en estado maximizado/manual (fix 00237) como la razón de que la medición del hueco (que depende de una fila de acciones con `flex-wrap`) acabe estabilizándose; remitir a `../architecture/006-ui-layer.md` para el detalle.

## (e) Verification

- [x] Abrir el editor de un **tablero personalizado** con un diseño **apaisado** (ancho ≫ alto, p. ej. el tablero de los días de la semana) y pulsar **"Maximizar"**: el lienzo llena casi todo el **ancho** interior de la modal (ya no ~1140 px ni ~mitad del ancho), su alto es `ancho / proporción`, y el bloque lienzo + fila de acciones queda **centrado verticalmente** — el hueco sobrante de alto se reparte arriba y abajo por igual, no todo debajo. No aparece barra de scroll en el cuerpo de la modal.
  - Verificado por inspección de código: `getEffectiveCanvasMaxSide()` rama `maximized` devuelve `Math.max(CANVAS_MIN_SIDE, Math.min(sideFromWidth, sideFromHeight))` sin el techo `CANVAS_MAX_SIDE * 3`; para apaisado `dW = longSide` → `sideFromWidth = availWidthPerFace` (ancho interior completo, 1 cara sin botón intercalado) → `canvasWidth = availWidthPerFace`. Centrado: `.card-editor-modal .modal__content { …; min-height: 0 }` permite que `.card-editor-modal__faces { flex: 1 1 auto; align-items: center }` se estire y centre el bloque de la cara. Sin scroll: `availHeight` ya descuenta toolbar+label+actions+gaps+margin.
- [x] En ese mismo editor de tablero apaisado, **redimensionar la ventana con los manejadores de esquina** a varios tamaños grandes (más ancho que alto, casi cuadrado): el lienzo escala de forma continua para encajar en el ancho **y** el alto disponibles manteniendo su proporción, siempre centrado en el hueco, sin grandes áreas en blanco y sin scroll. Al soltar el manejador el tamaño no "salta" (la convergencia ya se aplicó durante el arrastre).
  - Verificado por inspección: `onResize`/`onResizeEnd` de los dos manejadores llaman `renderFaces()`; cada llamada agenda la segunda pasada de convergencia (rAF) que re-mide la fila de acciones a su anchura final y re-renderiza una vez si el "lado" difiere > 1 px. `cancelAnimationFrame(convergeRaf)` antes de agendar evita apilar rAF en ticks rápidos; ya convergido a un tamaño, ticks similares no re-renderizan (`Math.abs(after - before) <= 1`).
- [x] Abrir el editor de un tablero personalizado con un diseño **vertical** (alto ≫ ancho) y maximizar: la restricción limitante es el **alto** — el lienzo crece hasta casi llenar el alto interior y queda **centrado horizontalmente**, con el sobrante de ancho a los lados.
  - Verificado por inspección: con `dH = longSide`, `sideFromHeight = availHeight` y `sideFromWidth` mayor → `Math.min` toma `sideFromHeight` → `canvasHeight = availHeight`, `canvasWidth` menor; `.card-editor-modal__faces { justify-content: center }` lo centra horizontalmente.
- [x] **Regresión editor de carta**: abrir el editor de una **carta** (dos caras) en proporción vertical, maximizar y redimensionar grande: las dos caras siguen una al lado de otra y alineadas (00233), crecen en alto hasta el límite del hueco, el botón "Ajustar imagen…" entre ellas queda centrado verticalmente respecto al alto real del lienzo, y el conjunto queda centrado. El comportamiento se ve **igual que antes del fix**. Repetir con la carta en proporción **apaisada** (p. ej. Poker horizontal): las dos caras topan el ancho por cara disponible, centradas verticalmente, sin regresión.
  - Verificado por inspección: la lógica de `getEditorWorkArea()` (reparto de ancho por `faces.length`, `adjustBtnSpace` con 2 caras, medición de `toolbarH`/`faceLabelH`/`actionsH`) no se toca. Quitar el techo `CANVAS_MAX_SIDE * 3` solo permite que el lienzo llegue al hueco real (comportamiento 00235 pretendido); carta vertical es height-bound y no lo alcanzaba. `min-height: 0` solo refuerza el estiramiento flex del que carta ya dependía (su lienzo era height-bound con holgura → sigue centrado). Segunda pasada rAF: en carta `actionsH` es estable (dos caras estrechas) → `after ≈ before` → no hay re-render extra → comportamiento idéntico.
- [x] Comprobar que el estado **por defecto** (editor recién abierto, sin maximizar ni redimensionar), tanto de tablero personalizado como de carta, se ve **exactamente igual que antes**: lienzo(s) a `CANVAS_MAX_SIDE` y botón "Ajustar imagen…" con su margen fijo del CSS.
  - Verificado por inspección: rama por defecto de `getEffectiveCanvasMaxSide()` intacta (`return CANVAS_MAX_SIDE`). El bloque rAF de convergencia está guardado por `if ((maximized || manualSize) && !convergePending)` → no se agenda en estado por defecto. `min-height: 0` no altera el layout por defecto (la fila de caras la dimensiona su contenido, sin estirar).
- [x] Encoger la **ventana del navegador** a un tamaño muy pequeño con el editor de tablero maximizado: el lienzo no baja de `CANVAS_MIN_SIDE`; si a ese mínimo no cabe, aparece scroll vertical en el cuerpo de la modal (nunca se recorta ni se oculta el pie "Aceptar/Cancelar").
  - Verificado por inspección: suelo `Math.max(CANVAS_MIN_SIDE, …)` conservado en `getEffectiveCanvasMaxSide()` y en `getEditorWorkArea()`. `overflow-y: auto` heredado de `.modal__content` actúa de válvula; el pie (`.modal__footer`) está fuera de `.modal__content`, no se recorta.
- [x] Mover y redimensionar un cuadro de texto / figura dentro de un lienzo agrandado de tablero: sigue funcionando igual (el `previewScale` nuevo se aplica de forma coherente a posición y tamaño de los elementos).
  - Verificado por inspección: `renderFace()` mantiene `previewScale = currentCanvasMaxSide / Math.max(designWidth, designHeight)`; posición/tamaño de elementos = valor de diseño × `previewScale`, deltas de arrastre ÷ `previewScale`. Un `currentCanvasMaxSide` mayor solo escala todo proporcionalmente.
- [x] Cerrar el editor de tablero justo después de maximizar (antes de que "asiente"): no quedan errores en consola por un `requestAnimationFrame` pendiente (lo cancela `cleanup()`).
  - Verificado por inspección: `cleanup()` llama `cancelAnimationFrame(convergeRaf)` antes de `overlay.remove()`; el callback rAF no llega a ejecutarse sobre DOM desmontado.
- [x] Cerrar y reabrir el editor tras haberlo maximizado/redimensionado: arranca en el tamaño por defecto (00233 intacto).
  - Verificado por inspección: `maximized` y `manualSize` siguen siendo variables locales a `openVisualEditorModal`, reinicializadas en cada apertura (sin cambios). `convergePending`/`convergeRaf` también locales, reinicializados a `false`/`0`.
