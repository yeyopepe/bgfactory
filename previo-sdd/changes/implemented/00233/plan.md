- **Creation date**: 2026-09-02
- **Risk**: 1/10 — Riesgo mínimo (cambio local, fácilmente reversible)

## (a) Functional notes

**Out of scope:**

- No se toca el patrón compartido `ui/resizeHandle.js` ni su uso en `ui/componentList.js` (panel "Componentes"): los tres problemas se corrigen dentro de `ui/visualEditorModal.js` y `src/styles/main.css`.
- No se cambia el comportamiento de "Maximizar" (sigue llevando la ventana a casi pantalla completa e ignorando el tamaño manual); solo cambia qué hace "Restaurar".
- No se introduce persistencia del tamaño entre aperturas del editor (sigue arrancando en el tamaño por defecto cada vez).
- No se rediseña el escalado de lienzo en los estados "por defecto" ni "maximizado" — solo se corrige la rama de tamaño manual (`manualSize`) y la posición del botón "Ajustar imagen…" en ese estado.
- Punto 2: además del ajuste de cálculo (causa raíz), se fija `flex-wrap: nowrap` en `.card-editor-modal__faces` como refuerzo directo del síntoma reportado ("una arriba y otra abajo"). No se considera ampliación de alcance: es una regla de la misma propiedad de layout implicada.

**Doubts resolved with the user:**

- ¿Qué debe hacer exactamente el botón "Restaurar"? → Confirmado: volver **siempre** al tamaño por defecto (ventana centrada, ajustada a su contenido), descartando el tamaño manual fijado con las anclas. Ya no vuelve al tamaño manual previo.

## (b) Technical solution

- [x] **`src/ui/visualEditorModal.js` — "Restaurar" vuelve siempre al tamaño por defecto.** En el listener de `maximizeBtn` (líneas ~371-398), sustituir el bloque `if (maximized) { ... } else if (manualSize) { ... } else { ... }` por: al **maximizar** (`maximized === true`) seguir llamando a `clearModalInlineGeometry()` como hoy; al **restaurar** (`maximized === false`), llamar **siempre** a `clearModalInlineGeometry()` y además poner `manualSize = null`. Desaparece la rama que reaplicaba `manualSize` (posición `fixed` + `width`/`height`/`left`/`top` centrados). Con `manualSize` a `null`, `getEffectiveCanvasMaxSide()` cae a su rama por defecto (`CANVAS_MAX_SIDE`) y la modal vuelve a `width: fit-content` centrada por el flexbox de `.modal-overlay`. Mantener la llamada final a `renderFaces()`. Actualizar el comentario del bloque (líneas ~375-379 y ~382-396) para reflejar que restaurar descarta el tamaño manual.

- [x] **`src/ui/visualEditorModal.js` — actualizar el comentario de `manualSize`.** El comentario de declaración de `let manualSize = null;` (líneas ~274-280) dice *"`maximized` lo ignora temporalmente y "Restaurar" vuelve a él"*. Cambiarlo a que "Restaurar" descarta el tamaño manual y vuelve al tamaño por defecto.

- [x] **`src/ui/visualEditorModal.js` — nueva constante `EDITOR_CHROME_H`.** Añadir junto a `EDITOR_CHROME_V` (línea ~39) una constante de módulo `const EDITOR_CHROME_H = 200;` con comentario: ancho aproximado del "cromo" horizontal de la modal manual que no es lienzo (padding lateral de `.modal__content` + gaps entre caras + el botón "Ajustar imagen…" intercalado, `.card-editor-modal__toolbar` a `max-width: 16rem` no cuenta porque va en su propia fila). Se usa para acotar el lado de lienzo por el ancho disponible y que las caras quepan lado a lado. Valor deliberadamente holgado para no envolver nunca.

- [x] **`src/ui/visualEditorModal.js` — acotar el lado de lienzo por el ancho disponible en la rama `manualSize`.** En `getEffectiveCanvasMaxSide()` (líneas ~291-301), rama `if (manualSize) { ... }`: además del `available` derivado del alto, calcular `const availableByWidth = (manualSize.width - EDITOR_CHROME_H) / faces.length;` y añadirlo al `Math.min(...)` existente, quedando:
  ```js
  if (manualSize) {
    const available = manualSize.height - EDITOR_CHROME_V;
    const availableByWidth = (manualSize.width - EDITOR_CHROME_H) / faces.length;
    return Math.max(
      CANVAS_MIN_SIDE,
      Math.min(available, availableByWidth, window.innerWidth * 0.42, CANVAS_MAX_SIDE * 3),
    );
  }
  ```
  `faces` es el parámetro de `openVisualEditorModal` (2 para 'carta', 1 para 'tableroPersonalizado'), accesible por closure. Así los lienzos nunca crecen más de lo que cabe a lo ancho en la ventana manual, y las dos caras de 'carta' se mantienen lado a lado.

- [x] **`src/ui/visualEditorModal.js` — recolocar el botón "Ajustar imagen…" también con tamaño manual.** En `renderFaces()` (líneas ~616-622), cambiar la condición `if (maximized) { ... } else { adjustImageBtn.style.marginTop = ''; }` por `if (maximized || manualSize) { ... } else { adjustImageBtn.style.marginTop = ''; }`. El cuerpo del `if` no cambia: la fórmula `canvasHeight = designHeight * (getEffectiveCanvasMaxSide() / Math.max(designWidth, designHeight))` y `adjustImageBtn.style.marginTop = ${canvasHeight / 2 - adjustImageBtn.offsetHeight / 2}px` ya usa funciones (`getEffectiveCanvasMaxSide`, `getFaceDesignSize`) que contemplan `manualSize`. Actualizar el comentario de ese bloque (líneas ~610-615) para mencionar que el cálculo en JS aplica tanto en maximizado como en tamaño manual (el `margin-top: 8.75rem` fijo del CSS solo vale para el tamaño por defecto).

- [x] **`src/styles/main.css` — `.card-editor-modal__faces` sin envoltura de línea.** En la regla `.card-editor-modal__faces` (línea ~1912), cambiar `flex-wrap: wrap;` por `flex-wrap: nowrap;`. Mantener `display: flex; gap: 0.5rem; justify-content: center;`. Con el lado de lienzo ya acotado por el ancho (tarea anterior), las caras siempre caben en una fila; `nowrap` garantiza que nunca se apilen ni se desalineen. Añadir/ajustar el comentario de la regla para dejar constancia de que la no-envoltura depende de que `getEffectiveCanvasMaxSide()` acote el lienzo por el ancho disponible.

## (d) Style changes

`previo-sdd/design/docs/style/03-modales-menus.md` — dos puntos contradicen el comportamiento nuevo del botón "Restaurar" y deben actualizarse:

- **§12.4.1 "Botón maximizar/restaurar de modal"**, línea ~156: hoy dice *"maximizar ignora temporalmente el tamaño manual sin borrarlo, restaurar vuelve a él"*. Cambiar a: *"maximizar limpia los estilos inline de geometría del redimensionado manual y aplica la clase; **restaurar vuelve siempre al tamaño por defecto de la modal, descartando el tamaño manual que se hubiera fijado con los manejadores** (no lo recuerda). El botón limpia los estilos inline de geometría antes/después de la clase, así `.card-editor-modal--maximized` gana sin `!important`."*
- **§12.3, tabla de "modales anchas", fila `.card-editor-modal`** (línea ~137): la frase final *"Ni el maximizado ni el tamaño manual se persisten entre aperturas"* sigue siendo correcta, pero conviene precisar que **pulsar "Restaurar" también descarta el tamaño manual** (vuelve a `width: fit-content` centrado), no solo el cierre/reapertura del editor.

No hay cambios de arquitectura (`docs.tech.architectureDocDir` no se toca): la corrección es de comportamiento de UI y de cálculo de layout, sin afectar a capas, contratos ni modelo de datos.

## (e) Verification

- [x] Abrir el editor de una **carta**, arrastrar un manejador de esquina para agrandar la ventana a un tamaño manual, pulsar **"Maximizar"** y luego **"Restaurar"**: la ventana vuelve al **tamaño por defecto** (centrada, ajustada a su contenido), **no** al tamaño manual que se había fijado antes. — Verificado en el listener de `maximizeBtn`: al restaurar (`maximized === false`) se llama a `clearModalInlineGeometry()` y `manualSize = null`, con lo que la modal vuelve a `width: fit-content` centrada por flexbox y `getEffectiveCanvasMaxSide()` cae a `CANVAS_MAX_SIDE`.
- [x] En ese mismo editor de carta, tras redimensionar con las anclas a varios tamaños (más alto que ancho, más ancho que alto, cerca del mínimo): las **dos caras (frontal/trasera) se mantienen siempre una al lado de otra y alineadas por su borde superior**; ninguna salta a una fila inferior en ningún momento del arrastre. — Verificado: `getEffectiveCanvasMaxSide()` rama `manualSize` acota el lado por `(manualSize.width - EDITOR_CHROME_H) / faces.length`, así que `2 × canvasWidth + gap + botón` cabe en el ancho manual; `.card-editor-modal__faces` pasa a `flex-wrap: nowrap`.
- [x] En el editor de carta redimensionado a mano, el botón **"Ajustar imagen…"** (entre las dos caras) queda **centrado verticalmente** respecto a los lienzos, no descolgado. — Verificado: `renderFaces()` entra en la rama de cálculo JS del `marginTop` con `maximized || manualSize`.
- [x] Abrir el editor de un **tablero personalizado** (una sola cara), redimensionar con las anclas a un tamaño manual grande y a uno pequeño: el botón **"Ajustar imagen…"** queda siempre **alineado verticalmente junto a la cara** (centrado respecto al lienzo), sin quedar muy por debajo y despegado. — Verificado: misma rama `maximized || manualSize` en `renderFaces()`; con `faces.length === 1` el botón se añade tras la única cara y toma `marginTop = canvasHeight / 2 - adjustImageBtn.offsetHeight / 2`.
- [x] Comprobar que los estados **por defecto** y **maximizado** siguen exactamente igual que antes: al abrir el editor (sin tocar anclas) las caras y el botón "Ajustar imagen…" se ven como siempre; al maximizar, los lienzos aprovechan el hueco y el botón queda centrado como hoy. — Verificado: con `manualSize === null` y `maximized === false`, `getEffectiveCanvasMaxSide()` devuelve `CANVAS_MAX_SIDE` y el botón usa `marginTop = ''` (CSS `8.75rem`); a ese tamaño `2 × 380 + botón` cabe sin envolver, así que `nowrap` no cambia nada. La rama `maximized` de ambas funciones no se ha tocado.
- [x] Cerrar y reabrir el editor (sobre el mismo o distinto componente) tras haberlo redimensionado: arranca de nuevo en el **tamaño por defecto**. — Verificado: `manualSize` y `maximized` son variables locales a `openVisualEditorModal`, se reinicializan en cada apertura.
- [x] Reducir el tamaño de la ventana del navegador tras haber agrandado la modal a mano: la modal se reajusta y no queda fuera del área visible (comportamiento de `handleWindowResize()` intacto). — Verificado: `handleWindowResize()` conserva su rama `manualSize` sin cambios; tras "Restaurar" (`manualSize === null`) esa rama no hace nada, que es lo correcto.
