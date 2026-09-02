- **Creation date**: 2026-09-02
- **Risk**: 2/10 — Minimal risk — local change, with a safety net (tests) or easily reversible

## (a) Functional notes

**Out of scope:**

- No se toca el renderizado de las insignias en el resto de tipos de componente (`tableroSimple`, `tableroPersonalizado`, `dado`, `documento`, `carta`, `mazo`): ahí se ven bien y deben quedar exactamente igual.
- No se toca la lógica de **cuándo** aparece cada insignia (`showLockIndicator` / `showHiddenIndicator` / `showCopyIndicator`, `effective.bloqueado`, `effective.oculto`, `component.copyOf`, recuento de copias), ni los helpers `createLockBadge` / `createHiddenBadge` / `createCopyBadge` / `createHasCopiesBadge` (icono, color, forma).
- No se toca el modelo de datos del componente `texto`, ni sus propiedades, ni el dimensionado (`MIN_TEXT_BOX_WIDTH` / `MIN_TEXT_BOX_HEIGHT`, `getComponentsBounds`, manejadores de redimensionado).
- Se ha detectado, sin corregir aquí, que la firma de `renderComponentsOnTable` documentada en `05-ui-layer.md` está desactualizada respecto al código (no menciona `showCopyIndicator`, `showHiddenIndicator`, `primarySelectedIds`, `groups`, `onCartaFlip`, etc.). Queda fuera del alcance de este fix; se anota como deuda de documentación para una entrada futura.

**Doubts resolved with the user:**

- **Criterio de colocación de las insignias sobre un cuadro de texto** (validado con los mockups `design_estado_actual.html` / `design_estado_esperado.html`): cada insignia conserva icono, color, tamaño y esquina lógica (candado arriba-derecha, oculto abajo-derecha, copia / "tiene copias" abajo-izquierda), pero pegada al texto visible en vez de flotando lejos de él, y sin quedar recortada.

**Causa raíz.** La rama `component.type === 'texto'` de `renderComponentsOnTable` (`src/ui/componentRenderer.js`) incumple la regla transversal ya documentada en `previo-sdd/design/docs/architecture/05-ui-layer.md` ("Regla para cualquier tipo que recorte su propio contenido visual"): aplica `overflow: hidden` al **contenedor exterior** `.text-box` y pinta el texto directamente sobre él, en lugar de usar un contenedor **interno** dedicado. Como consecuencia, las insignias (que se añaden como hijos del exterior) (1) se recortan si sobresalen y (2) se anclan a las esquinas de una caja invisible mayor que los glifos (por el `padding: 0.5rem` y el alto de línea), quedando despegadas del texto. El resto de tipos ya usan el patrón de contenedor interno y por eso se ven bien.

## (b) Technical solution

- [x] **`src/ui/componentRenderer.js` — rama `component.type === 'texto'` de `renderComponentsOnTable`: mover el recorte del texto a un contenedor interno.** En el bloque que hoy crea el `div.text-box` (aprox. líneas 659-679):
  - Quitar de `.text-box` (contenedor exterior) la línea `textBox.style.overflow = 'hidden';`.
  - Dejar de pintar el texto directamente en `.text-box`: en vez de `textBox.textContent = component.properties.contenido || '';`, crear un contenedor interno y pintar el texto en él, siguiendo el patrón de `tableroPersonalizado` (`tableroContent`):
    ```js
    const textBoxContent = document.createElement('div');
    textBoxContent.style.position = 'absolute';
    textBoxContent.style.inset = '0';
    textBoxContent.style.overflow = 'hidden';
    textBoxContent.style.whiteSpace = 'pre-wrap';
    textBoxContent.style.wordBreak = 'break-word';
    textBoxContent.textContent = component.properties.contenido || '';
    ```
  - Mover al contenedor interno las propiedades que hoy se fijan en `.text-box` y que son del **contenido** de texto, no del marco: `padding` (`'0.5rem'`), `whiteSpace`/`wordBreak` (quedan solo en el interno), `fontSize`, `color`. El `backgroundColor` (`component.properties.colorFondo`) también pasa al contenedor interno (es el fondo del texto, y así queda recortado por el marco al redimensionar, igual que en `tableroPersonalizado`).
  - `.text-box` (exterior) conserva: `position: absolute`, `top`/`left`, `width`/`height` (solo si `component.width`/`component.height` no son nulos), y la clase `text-box`.
  - Añadir el contenedor interno como **primer** hijo de `.text-box`, antes de la etiqueta identificativa y de las insignias, para que quede por debajo de ellas en el orden de pintado (mismo criterio que `tableroContent`, que se añade tras las insignias pero con `position: absolute; inset: 0` y sin `z-index`, quedando visualmente detrás de los badges que llevan `z-index: 1`). Mantener el orden actual de `appendChild`: primero el contenido interno, luego `createIdentifierLabel` / `createLockBadge` / `createHiddenBadge` / `createCopyBadge` / `createHasCopiesBadge` (sin cambios en esas líneas 681-690), y `worldEl.appendChild(textBox)` al final.
  - No tocar los manejadores de arrastre ni de redimensionado (líneas 718-809): siguen operando sobre `.text-box` (`textBox`) y fijando `textBox.style.width` / `textBox.style.height`; el contenedor interno con `inset: 0` sigue ese tamaño automáticamente. `getResizeSize()` sigue leyendo `textBox.getBoundingClientRect()` cuando no hay `width`/`height` explícitos: como `.text-box` deja de tener `overflow: hidden` pero sigue ajustándose al contenido interno (que ahora lleva el `padding`), el tamaño medido es equivalente al actual.

- [x] **`src/styles/main.css` — regla `.text-box` (aprox. línea 866): ajustar el anclaje de las insignias para el cuadro de texto.** Tras el cambio anterior, `.text-box` pasa a estar dimensionado por su contenido (el `padding` vive ahora en el contenedor interno). Añadir reglas específicas para que las cuatro insignias queden pegadas al texto visible y no floten:
  - Las reglas base `.component-lock-badge` / `.component-hidden-badge` / `.component-copy-badge` / `.component-has-copies-badge` (aprox. líneas 2840-2935) **no se tocan** (las usan el resto de tipos).
  - Añadir, junto a las reglas de `.text-box`, overrides calificados para el contexto del cuadro de texto, de modo que el offset compense la ausencia de caja rellena y las acerque al glifo (mismo criterio "esquina" que en el resto de tipos, pero pegadas por fuera del texto, como hace `.component-title-label` con `top: -1.6rem`):
    ```css
    .text-box > .component-lock-badge      { top: -0.55rem;    right: -0.55rem; }
    .text-box > .component-hidden-badge    { bottom: -0.55rem; right: -0.55rem; }
    .text-box > .component-copy-badge,
    .text-box > .component-has-copies-badge { bottom: -0.55rem; left: -0.55rem; }
    ```
    (Valores de referencia de los mockups `design_estado_esperado.html`; ajustar en implementación si el encaje visual real lo pide, manteniendo el criterio: insignia pegada a la esquina del texto visible, nunca recortada, sin solaparse entre sí cuando coinciden candado+oculto o candado+copia.)
  - Verificar que ninguna insignia queda tapada por la etiqueta identificativa (`.component-id-label`, esquina superior izquierda, solo visible en hover/selección) — no comparten esquina, no hace falta cambio adicional.

- [x] **Comentario en `src/ui/componentRenderer.js`.** Añadir un comentario breve (estilo telegráfico del proyecto) en la rama `texto`, junto a la creación del contenedor interno, indicando el porqué: "recorte del contenido en contenedor interno (regla transversal, 05-ui-layer.md); el exterior queda sin `overflow` para no recortar etiqueta ni insignias". Solo si aporta — no repetir lo que el código ya dice.

## (c) Architecture changes

`previo-sdd/design/docs/architecture/05-ui-layer.md`:

- En la entrada de `ui/componentRenderer.js`, bloque "Regla para cualquier tipo que recorte su propio contenido visual": añadir mención explícita de que el tipo `texto` (`.text-box`) sigue este patrón — contenedor interno `div` con `position: absolute; inset: 0; overflow: hidden` para el texto y su fondo, contenedor exterior `.text-box` sin `overflow: hidden`, con etiqueta identificativa e insignias de estado. Elimina la ambigüedad de que el cuadro de texto sea una excepción.

`previo-sdd/design/docs/architecture/INDEX.md`:

- §8, punto "Renderizado en la mesa" y punto "Menú contextual, candado de bloqueo, indicador de oculto": matizar que "sin nada específico por tipo" aplica a la **lógica** de cuándo se pinta cada insignia, pero que un tipo sin caja visible propia (como `texto`) necesita respetar el patrón de contenedor interno para que las insignias del contenedor exterior no se recorten ni queden despegadas del contenido. No es una excepción nueva: es el mismo patrón de contenedor interno ya exigido en el propio §8 ("Renderizado en la mesa": "overflow del contenido recortado en contenedor interno (nunca en el exterior...)").

## (d) Style changes

`previo-sdd/design/docs/style/03-modales-menus.md`:

- §12.3, apartados "Indicador de bloqueo", "Indicador de Oculto", "Indicador de Copia" y "Indicador de Tiene copias": añadir una nota de que, sobre un componente sin caja rellena (el cuadro de texto, `.text-box`), la insignia se ancla pegada al texto visible mediante offsets propios (`.text-box > .component-*-badge`), en vez de a la esquina de una caja — se mantiene icono, color, tamaño y esquina lógica de cada una; solo cambia el punto de anclaje para este tipo.
- §12.3, si procede, referenciar que `.text-box` usa contenedor interno para el recorte del texto (coherente con la regla transversal de `05-ui-layer.md`), por lo que su contenedor exterior queda libre para etiqueta e insignias igual que el resto de tipos.

## (e) Verification

- [x] En modo edición, crear un cuadro de texto, marcarlo como **Bloqueado** ("Juego" o "Todos"): la insignia de candado aparece pegada a la esquina superior derecha del texto visible, completa (no recortada), no flotando lejos del texto.
- [x] Marcar ese mismo cuadro de texto como **Oculto**: la insignia de ojo tachado aparece pegada a la esquina inferior derecha del texto, completa, y convive con el candado sin solaparse.
- [x] Hacer una **copia** de un cuadro de texto: sobre la copia, la insignia roja de "copia" aparece pegada a la esquina inferior izquierda del texto, completa; el contorno de selección/hover de la copia sigue en rojo y la etiqueta identificativa en rojo (sin regresión).
- [x] Sobre el cuadro de texto **original** que tiene al menos una copia: la píldora azul "(N)" aparece pegada a la esquina inferior izquierda del texto, completa, con el número correcto.
- [x] Redimensionar un cuadro de texto (manejador de esquina) a un tamaño **menor** que su contenido: el texto se recorta dentro del marco (no se desborda visualmente), igual que antes del cambio; las insignias siguen visibles y pegadas a las esquinas del marco.
- [x] Redimensionar un cuadro de texto por la esquina superior izquierda: el marco crece/encoge anclando la esquina opuesta, el texto y su fondo se recortan al marco, y la posición del componente se actualiza al soltar (sin regresión respecto al comportamiento actual).
- [x] Un cuadro de texto con **color de fondo** configurado: el fondo se pinta bajo el texto y queda recortado al marco al redimensionar (no se sale del marco).
- [x] En **modo juego**, un cuadro de texto no muestra ninguna de estas insignias (no se pasan `showLockIndicator`/`showHiddenIndicator`/`showCopyIndicator`) — sin cambios respecto a antes.
- [x] Verificar en el resto de tipos (`tableroSimple`, `tableroPersonalizado`, `dado`, `documento`, `carta`, `mazo`) que las insignias de bloqueado/oculto/copia/tiene-copias siguen exactamente igual que antes (no se ha tocado su CSS base ni su rama de render).
