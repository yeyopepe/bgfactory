- **Creation date**: 2026-09-02
- **Risk**: 2/10 — Riesgo mínimo (cambio local en un módulo de UI, sin contratos ni datos, reversible revirtiendo el commit)

## (a) Functional notes

**Out of scope:**

- No se toca la rama **por defecto** de `getEffectiveCanvasMaxSide()` (editor recién abierto, sin maximizar ni tamaño manual): sigue devolviendo la constante fija `CANVAS_MAX_SIDE`. El aspecto del editor al abrirse no cambia.
- No se cambia el comportamiento de "Maximizar"/"Restaurar" (fix 00233) ni el de los manejadores de esquina (00225): sólo cambia **cuánto crece el lienzo** dentro de esos estados.
- No se toca el patrón compartido `ui/resizeHandle.js` ni el panel "Componentes".
- No se añade persistencia del tamaño ni scroll horizontal; el diseño del lienzo nunca se deforma ni se recorta para llenar el hueco.
- No se rediseña el ajuste de imagen (`openImageAdjustModal`) ni la barra de herramientas.
- Mejora vista pero descartada: eliminar por completo `EDITOR_CHROME_V`/`EDITOR_CHROME_H` (estimaciones constantes) en favor de medir siempre en runtime. Se mantienen como **fallback** cuando aún no hay `facesRow` montada de un render anterior que medir, para no depender de medidas de layout a 0 en un render sin DOM previo.

**Doubts resolved with the user:**

- **¿Hasta dónde crece el lienzo al "aprovechar la ventana"?** (dos pasos) 1) Debe encajar tanto en ancho como en alto del área interior de trabajo, no sólo topar la dimensión más larga; aplica igual a 1 cara (tablero personalizado) y a 2 (carta). 2) Precisado: el lienzo crece **lo más grande posible manteniendo su proporción**, topando contra la primera restricción (ancho **o** alto). El hueco sobrante **no** se rellena deformando el lienzo: se reparte a ambos lados para dejarlo **centrado**. Sin scroll.

## (b) Technical solution

Concepto: hoy `getEffectiveCanvasMaxSide()` devuelve un escalar ("lado máximo del lienzo") y `renderFace()` calcula `previewScale = lado / Math.max(designWidth, designHeight)`, que sólo ajusta la dimensión más larga del diseño. La corrección mantiene esa firma escalar (para no tocar a sus dos únicos llamadores) pero, en las ramas `maximized` y `manualSize`, deriva ese "lado" del **hueco interior real** de la modal medido en runtime, como el mayor valor que hace que el lienzo quepa a la vez en el ancho por cara **y** en el alto disponibles. El centrado y la ausencia de scroll se resuelven con CSS acotado a `.card-editor-modal`.

- [ ] **`src/ui/visualEditorModal.js` — helper `getEditorWorkArea()` que mide el hueco interior real.** Añadir una función local a `openVisualEditorModal` (junto a `getEffectiveCanvasMaxSide`, tiene en closure `content`, `toolbar`, `facesRow`, `adjustImageBtn`, `faces`). Devuelve `{ availWidthPerFace, availHeight }` en px:
  - `const cs = getComputedStyle(content);` y `const padX = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);` `const padY = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);`
  - **Alto disponible**: `const inner = content.clientHeight - padY;` (nota: `clientHeight` ya excluye scrollbar; el padding se resta explícitamente porque `clientHeight` lo incluye). Restar el alto del cromo vertical que convive con el lienzo dentro de `content`: `toolbar.offsetHeight` (0 si `showProporcionSelector` es `false`), más, por cara, la etiqueta y la fila de acciones. Medir estas dos del **render anterior** aún montado: `const sampleFace = facesRow.querySelector('.card-editor-modal__face');` y si existe, `faceLabelH = sampleFace.querySelector('.card-editor-modal__face-label')?.offsetHeight ?? 0` y `actionsH = sampleFace.querySelector('.card-editor-modal__face-actions')?.offsetHeight ?? 0`; si no existe `sampleFace`, usar el fallback constante `EDITOR_CHROME_V` para `toolbar + label + actions + gaps` conjuntamente. Añadir un margen de respiro `EDITOR_WORK_MARGIN` (nueva constante, ~24) y los `gap` de `.card-editor-modal__face` (`0.5rem` × 2 ≈ 16). `availHeight = Math.max(CANVAS_MIN_SIDE, inner - toolbarH - faceLabelH - actionsH - facesGap - EDITOR_WORK_MARGIN)` (o `inner - EDITOR_CHROME_V - EDITOR_WORK_MARGIN` en el camino de fallback).
  - **Ancho disponible por cara**: `const rowW = content.clientWidth - padX;` menos el ancho del botón "Ajustar imagen…" cuando va intercalado (sólo con 2 caras: `faces.length === 2 ? adjustImageBtn.offsetWidth + gap : 0`) menos los `gap` de `.card-editor-modal__faces` (`0.5rem` × (faces.length - 1 + (faces.length===2?1:0))). `availWidthPerFace = Math.max(CANVAS_MIN_SIDE, (rowW - adjustBtnSpace - facesRowGaps) / faces.length)`.
  - Comentario `[gotcha]`: sólo se llama desde las ramas `maximized`/`manualSize`, que siempre corren tras un gesto del usuario con `overlay` ya en el DOM; nunca desde el primer render (línea ~1347), que va por la rama por defecto y no mide.

- [ ] **`src/ui/visualEditorModal.js` — nuevas constantes de módulo.** Junto a `EDITOR_CHROME_H` (línea ~46): `const EDITOR_WORK_MARGIN = 24;` con comentario (holgura para que el lienzo no toque los bordes del hueco de trabajo ni fuerce scroll por redondeos de medida). Mantener `EDITOR_CHROME_V`/`EDITOR_CHROME_H` como fallback (ya comentado arriba).

- [ ] **`src/ui/visualEditorModal.js` — reescribir las ramas `maximized` y `manualSize` de `getEffectiveCanvasMaxSide()`.** (líneas ~301-312). La firma sigue devolviendo un escalar. En ambas ramas:
  ```js
  const { width: dW, height: dH } = getFaceDesignSize();
  const longSide = Math.max(dW, dH);
  const { availWidthPerFace, availHeight } = getEditorWorkArea();
  // "lado" que hace canvasWidth = dW * (lado/longSide) <= availWidthPerFace
  const sideFromWidth = availWidthPerFace * longSide / dW;
  // "lado" que hace canvasHeight = dH * (lado/longSide) <= availHeight
  const sideFromHeight = availHeight * longSide / dH;
  return Math.max(
    CANVAS_MIN_SIDE,
    Math.min(sideFromWidth, sideFromHeight, CANVAS_MAX_SIDE * 3),
  );
  ```
  - Esto sustituye tanto `Math.min(window.innerHeight * 0.7, window.innerWidth * 0.42)` (rama `maximized`) como el `Math.min(available, availableByWidth, window.innerWidth * 0.42, CANVAS_MAX_SIDE * 3)` (rama `manualSize`): ya no se topa contra fracciones fijas del viewport, sino contra el hueco interior real. Se conserva el suelo `CANVAS_MIN_SIDE` y el techo prudente `CANVAS_MAX_SIDE * 3`.
  - Ambas ramas quedan idénticas → colapsarlas en `if (maximized || manualSize) { ... }`. La rama `return CANVAS_MAX_SIDE;` (por defecto) se mantiene intacta.
  - Actualizar el comentario de cabecera de la función (líneas ~290-300) para describir el criterio nuevo (encajar en ancho por cara **y** alto del hueco real, manteniendo proporción; centrado y sin scroll los da el CSS).

- [ ] **`src/ui/visualEditorModal.js` — `renderFaces()`: recolocar el botón "Ajustar imagen…".** (líneas ~616-622). El cálculo actual `canvasHeight = designHeight * (getEffectiveCanvasMaxSide() / Math.max(designWidth, designHeight))` sigue siendo correcto con la nueva semántica del escalar (deriva el alto real del lienzo resultante). No cambia la fórmula; verificar sólo que sigue dentro de `if (maximized || manualSize)`. Actualizar el comentario si menciona los topes viejos.

- [ ] **`src/styles/main.css` — `.card-editor-modal .modal__content` como columna flex.** Añadir una regla scoped: `.card-editor-modal .modal__content { display: flex; flex-direction: column; }`. Mantiene `flex: 1; overflow-y: auto; padding: 1.5rem` heredados de `.modal__content`. Necesario para que `.card-editor-modal__faces` pueda crecer y centrar el lienzo en el hueco vertical sobrante. No afecta a otras modales (selector acotado a `.card-editor-modal`).

- [ ] **`src/styles/main.css` — `.card-editor-modal__faces` ocupa el hueco y centra.** En la regla existente (línea ~1960, ya `display:flex; gap:0.5rem; flex-wrap:nowrap; justify-content:center` tras 00233) añadir `flex: 1 1 auto;` y `align-items: center;`. Así la fila de caras se estira para llenar el alto de `.modal__content` y el lienzo (más bajo que el hueco, por la proporción) queda centrado verticalmente; `justify-content: center` ya lo centra en horizontal cuando sobra ancho (carta con dos caras verticales). Actualizar el comentario del bloque para reflejar el criterio del fix 00235 (encaje en ancho **y** alto, centrado en el sobrante).
  - `overflow-y: auto` de `.modal__content` se mantiene como válvula de seguridad: si la ventana se encoge al mínimo y el lienzo, con suelo `CANVAS_MIN_SIDE`, no cabe, aparece scroll en vez de recortarse el pie.

## (c) Architecture changes

No aplica: el fix es de cálculo de layout y CSS en la capa `ui`, sin tocar capas, contratos entre módulos ni modelo de datos. `docs.tech.architectureDocDir` no describe la matemática de escalado del lienzo del editor.

## (d) Style changes

`previo-sdd/design/docs/style/03-modales-menus.md` — **§12.3, fila `.card-editor-modal`** de la tabla de "modales anchas" (actualizada por 00233): hoy dice que las caras no se apilan por `flex-wrap: nowrap` + "el lado de lienzo acotado también por el ancho disponible (00233)". Añadir/precisar: en estado maximizado o con tamaño manual, el lienzo (o los dos lienzos) escala para ser **lo más grande posible dentro del hueco interior real de `.modal__content`** manteniendo su proporción — topando contra el ancho por cara **o** el alto disponibles — y queda **centrado** en el espacio sobrante (`.card-editor-modal .modal__content` pasa a `display:flex; flex-direction:column`; `.card-editor-modal__faces` a `flex:1; align-items:center`). `overflow-y: auto` de `.modal__content` queda sólo como válvula si la ventana se encoge por debajo del lienzo mínimo (00235).

No hay patrón visual nuevo (se reutiliza el mismo lienzo/manejadores); es una precisión del criterio de escalado ya insinuado ("aprovechar el espacio") en la documentación funcional del editor (`docs.functional.featuresDocPathDir`, entradas 022/019), que `pv-do` actualizará en su paso de documentación funcional.

## (e) Verification

- [ ] Abrir el editor de un **tablero personalizado** con un diseño **apaisado** (ancho ≫ alto) y pulsar **"Maximizar"**: el lienzo llena casi todo el ancho interior de la modal (no ~42% del viewport como antes), su alto es `ancho / proporción`, y queda **centrado verticalmente** en el hueco — el espacio sobrante se reparte arriba y abajo, no todo debajo. No aparece barra de scroll en el cuerpo de la modal.
- [ ] En ese mismo editor de tablero apaisado, **redimensionar la ventana con los manejadores de esquina** a varios tamaños grandes (más ancho que alto, casi cuadrado): el lienzo escala de forma continua para encajar en el ancho **y** el alto disponibles manteniendo su proporción, siempre centrado en el hueco, sin scroll.
- [ ] Abrir el editor de un tablero personalizado con un diseño **vertical** (alto ≫ ancho), maximizar: ahora la restricción limitante es el **alto** — el lienzo crece hasta casi llenar el alto interior y queda **centrado horizontalmente**, con el sobrante de ancho a los lados.
- [ ] Abrir el editor de una **carta** (dos caras, proporción vertical), maximizar y redimensionar grande: las dos caras siguen **una al lado de otra y alineadas** (sin apilarse, fix 00233) y ahora crecen también en **alto** hasta el límite del hueco; el botón "Ajustar imagen…" entre ellas queda **centrado verticalmente** respecto al alto real del lienzo. Sin scroll.
- [ ] Con la carta en proporción **apaisada** (p. ej. Poker horizontal 7:5 o "Libre" ancha), maximizar: las dos caras topan el **ancho por cara** disponible y quedan centradas verticalmente en el hueco.
- [ ] Comprobar que el estado **por defecto** (editor recién abierto, sin maximizar ni redimensionar) se ve **exactamente igual que antes**: lienzo(s) a `CANVAS_MAX_SIDE` y botón "Ajustar imagen…" con su margen fijo del CSS.
- [ ] Encoger la **ventana del navegador** a un tamaño muy pequeño con el editor maximizado: el lienzo no baja de `CANVAS_MIN_SIDE`; si a ese mínimo no cabe, aparece scroll vertical en el cuerpo de la modal (nunca se recorta ni se oculta el pie "Aceptar/Cancelar").
- [ ] Mover y redimensionar un cuadro de texto / figura dentro de un lienzo agrandado: sigue funcionando igual (el `previewScale` nuevo se aplica de forma coherente a la posición y tamaño de los elementos).
- [ ] Cerrar y reabrir el editor tras haberlo maximizado/redimensionado: arranca en el tamaño por defecto (fix 00233 intacto).
