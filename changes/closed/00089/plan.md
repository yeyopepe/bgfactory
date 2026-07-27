## (a) Anotaciones funcionales

- **Fuera de alcance**: la sombra de contacto transitoria durante el arrastre en Modo Juego (`.lifted`) y el feedback de volteo (`.carta--flip-feedback`) siguen usando `box-shadow`, que dibuja la sombra sobre la caja rectangular del componente, no sobre la silueta hexagonal recortada — para una carta hexagonal, esos dos estados transitorios mostrarán una sombra rectangular en vez de seguir el hexágono. Solo se corrige la sombra de contacto en reposo (`.carta` base, siempre visible), que si se deja como `box-shadow` rompería la silueta hexagonal permanentemente y no solo en un gesto puntual. Ampliar la corrección a los dos estados transitorios queda fuera de este change: no está pedido explícitamente y afecta a un efecto breve, no al aspecto de reposo de la pieza.
- No han surgido dudas técnicas que requirieran resolución con el usuario: el patrón a seguir (recorte por `clip-path` en vez de `border-radius`, y sombra de contacto con `filter: drop-shadow` en vez de `box-shadow` para siluetas no rectangulares) ya existe en el proyecto para el componente "Dado" (`STYLE_BIBLE.md` sección 6 y 13) y se reutiliza aquí sin necesidad de decisiones nuevas.

## (b) Solución técnica

1. **`src/core/cardProportions.js`** — catálogo de proporciones:
   - Añadir dos entradas a `CARD_PROPORTIONS`:
     - `{ value: 'hex-vertical', label: 'Hexagonal (vértices arriba/abajo)', ratio: Math.sqrt(3) / 2, shape: 'hex-vertical' }`
     - `{ value: 'hex-horizontal', label: 'Hexagonal (vértices izquierda/derecha)', ratio: 2 / Math.sqrt(3), shape: 'hex-horizontal' }`
   - Añadir el campo `shape` también a las entradas ya existentes (`'rect'` para las cuatro rectangulares y `'1:1'`, `'circular'` para `'circular'`), para tener un único punto que decida la forma de recorte por proporción.
   - Añadir `export function getCartaShapeCss(value)` que, a partir de `shape`, devuelva `{ borderRadius, clipPath }`:
     - `'circular'` → `{ borderRadius: '50%', clipPath: 'none' }` (comportamiento actual, sin cambios).
     - `'hex-vertical'` → `{ borderRadius: '0', clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }`.
     - `'hex-horizontal'` → `{ borderRadius: '0', clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)' }`.
     - `'rect'` (resto) → `{ borderRadius: '8px', clipPath: 'none' }` (comportamiento actual, sin cambios).
   - `getProporcionRatio` no cambia: el `clamp` de redimensionado en `componentRenderer.js` (ver punto 2) ya distingue solo `'circular'` del resto y trata todo lo demás como ratio fijo — las dos proporciones hexagonales caen automáticamente en la rama de ratio fijo sin tocar esa lógica.

2. **`src/ui/componentRenderer.js`** — renderizado de la carta sobre la mesa (modo juego y edición):
   - Importar `getCartaShapeCss` junto a `getProporcionRatio`/`CARD_DESIGN_WIDTH`.
   - Sustituir el cálculo de `cartaBorderRadius` (línea ~873) por `const { borderRadius, clipPath } = getCartaShapeCss(props.proporcion)`, y aplicar `carta.style.borderRadius/clipPath` y `cartaContent.style.borderRadius/clipPath` en los dos puntos donde hoy solo se asigna `borderRadius` (líneas ~881 y ~891). El `clip-path` en `.carta` recorta también la zona sensible al puntero (arrastre/click), igual que ya hace `border-radius: 50%` con `'circular'` hoy.
   - Sombra de contacto en reposo: añadir en `main.css` una clase `.carta--hex` (`box-shadow: none; filter: drop-shadow(...)` con el mismo valor que ya usa `--shadow-1` traducido a `drop-shadow`, mismo criterio que `.dice` en la sección 6/13 de `STYLE_BIBLE.md`) y, en `componentRenderer.js`, alternarla con `carta.classList.toggle('carta--hex', shape === 'hex-vertical' || shape === 'hex-horizontal')` (usando el `shape` de la entrada del catálogo, no repitiendo el `if`).
   - El `clamp` del redimensionado (líneas ~1014-1034) no necesita cambios: solo distingue `'circular'`, y las dos proporciones hexagonales ya devuelven su ratio fijo correcto vía `getProporcionRatio`.
   - `renderHexGrid` (líneas ~50-85, patrón del tablero): añadir un parámetro de orientación (p. ej. `orientation: 'flat' | 'pointy'`, por defecto `'flat'` para no romper la firma en otras llamadas si las hubiera). La implementación actual es la orientación *flat-top* (vértices izquierda/derecha, ángulo de partida `60 * i`, desfase por columna `colOffsetY`) — se mantiene tal cual bajo `orientation === 'flat'`. Añadir la rama `orientation === 'pointy'` (vértices arriba/abajo) parametrizando, por simetría con la rama existente (intercambiando el papel de filas↔columnas y ancho↔alto, mismo cálculo que ya usa el boceto de referencia `design_patron-tablero-hexagonal.html`):
     - Ángulo de partida `30 + 60 * i` (en vez de `60 * i`).
     - Tamaño de hexágono `a` limitado por `width / (√3·columnas + (filas > 1 ? √3/2 : 0))` y por `height / (2 + 1.5·(filas - 1))` (intercambiado respecto a las fórmulas actuales de ancho/alto).
     - Desfase de rejilla por **fila** en vez de por columna (`rowOffsetX = row % 2 === 1 ? hexWidth / 2 : 0`), ya que en esta orientación las filas alternas son las que quedan desalineadas horizontalmente (al revés que en `flat`, donde son las columnas alternas las que se desalinean verticalmente).
   - Punto donde se decide si dibujar la rejilla hexagonal (línea ~448, `props.patronForma === 'hexagonal'`): normalizar el valor antes de comparar — tratar `'hexagonal'` (valor antiguo, ver punto 5) como alias de `'hex-horizontal'`. Sustituir la condición por algo equivalente a `const patronForma = props.patronForma === 'hexagonal' ? 'hex-horizontal' : props.patronForma;` seguido de `patronForma === 'hex-vertical' || patronForma === 'hex-horizontal'`, y pasar a `renderHexGrid` `orientation: patronForma === 'hex-vertical' ? 'pointy' : 'flat'`.

3. **`src/ui/cardEditorModal.js`** — editor de cartas, lienzo de cada cara:
   - Importar `getCartaShapeCss` y sustituir la línea `canvas.style.borderRadius = working.proporcion === 'circular' ? '50%' : '8px'` (línea ~176) por el resultado de `getCartaShapeCss(working.proporcion)`, aplicando tanto `borderRadius` como `clipPath` al lienzo (`canvas`).
   - `faceShape` (línea ~112), usado para la máscara de `imageAdjustModal.js`: hoy colapsa a `'circular'` o `'cuadrada'`. Ampliarlo para que, cuando `working.proporcion` sea `'hex-vertical'` o `'hex-horizontal'`, se propague ese mismo valor tal cual (en vez de `'cuadrada'`), dejando `'circular'`/`'cuadrada'` para el resto de casos igual que hoy.

4. **`src/ui/imageAdjustModal.js`** — máscara de recorte al ajustar la imagen de una cara:
   - Este módulo es deliberadamente agnóstico del catálogo de proporciones de carta (su propio comentario de cabecera lo indica) y ya define su propio vocabulario de `shape` (`'circular'`/`'cuadrada'`) sin importar `cardProportions.js`. Mantener ese criterio: añadir localmente las dos constantes de `clip-path` (mismos valores exactos que en `cardProportions.js`, punto 1 — documentarlos una vez y mantenerlos sincronizados si cambian) para `'hex-vertical'`/`'hex-horizontal'`.
   - Junto a la línea `mask.style.borderRadius = entry.shape === 'circular' ? '50%' : '0'` (línea ~107), añadir `mask.style.clipPath = (entry.shape === 'hex-vertical' || entry.shape === 'hex-horizontal') ? <polígono correspondiente> : 'none'`.

5. **`src/ui/boardPatternModal.js`** — sub-modal "Color y patrón", campo "Forma de casilla":
   - Sustituir la única opción `{ value: 'hexagonal', label: 'Hexagonal' }` de `shapeOptions` (línea ~84) por las dos nuevas: `{ value: 'hex-vertical', label: 'Hexagonal (vértices arriba/abajo)' }` y `{ value: 'hex-horizontal', label: 'Hexagonal (vértices izquierda/derecha)' }`.
   - Migración del valor antiguo: al inicializar `working.patronForma` (línea ~31, hoy `properties.patronForma || 'cuadrada'`), normalizar `'hexagonal'` a `'hex-horizontal'` — `properties.patronForma === 'hexagonal' ? 'hex-horizontal' : (properties.patronForma || 'cuadrada')`. Así el desplegable muestra la opción correcta ya al abrir la modal sobre un tablero guardado antes de este cambio, y al aceptar (`onAccept`) se guarda ya con el valor nuevo — sin necesidad de tocar la carga/guardado general de `core/state.js`. El renderizado (punto 2) sigue soportando el valor antiguo `'hexagonal'` de forma independiente, para tableros que no se hayan vuelto a abrir/guardar en esta sub-modal.

6. **`src/styles/main.css`**:
   - Añadir la clase `.carta--hex` descrita en el punto 2 (sombra de contacto vía `filter: drop-shadow`, igual que `.dice`), justo debajo de la regla `.carta` existente.

No hace falta tocar `src/ui/componentModal.js` ni el desplegable de proporción de `cardEditorModal.js`: ambos recorren `CARD_PROPORTIONS` genéricamente y ya mostrarán las dos opciones nuevas sin cambios de código.

## (c) Cambios de arquitectura

En `design/docs/ARCHITECTURE.md`, sección 4 ("Tipos de componente implementados"):

- En el bullet de `'carta'`: actualizar la lista de valores de `proporcion` para incluir `'hex-vertical'` y `'hex-horizontal'`, y sustituir la frase que describe el recorte por `border-radius: 50%`/`border-radius: 8px` para dejar constancia de que, además, existen dos proporciones que se recortan por `clip-path` poligonal (silueta hexagonal exacta, sin bisel), aplicado en los mismos tres puntos ya documentados (`componentRenderer.js`, `cardEditorModal.js`, `imageAdjustModal.js`) junto al `border-radius`.
- En el bullet de `'tablero'`: actualizar `patronForma` de `('cuadrada' | 'hexagonal')` a `('cuadrada' | 'hex-vertical' | 'hex-horizontal')`, y anotar que `'hexagonal'` (valor de antes de este cambio) se sigue interpretando como alias de `'hex-horizontal'` al renderizar, y se normaliza a ese valor la próxima vez que se guarda desde la sub-modal "Color y patrón".

## (d) Cambios en estilo

En `design/docs/stylebible/STYLE_BIBLE.md`:

- Sección 13, bullet "Esquinas redondeadas de Carta" (cambio 00053): añadir una nota indicando que, desde este cambio, dos proporciones (`'hex-vertical'`/`'hex-horizontal'`) no usan `var(--radius-lg)` ni el `border-radius: 50%` de `'circular'`, sino un recorte por `clip-path` poligonal de silueta hexagonal exacta (vértices agudos, sin bisel), aplicado en los mismos tres puntos ya listados para el resto de proporciones (mesa, editor de cartas, máscara de ajuste de imagen).
- Sección 6 ("Elevación, sombra y transición"): ampliar la nota ya existente sobre `.dice` (que usa `filter: drop-shadow` en vez de `box-shadow` por no tener silueta rectangular) para incluir también a `.carta` cuando su proporción es hexagonal (`.carta--hex`) — mismo criterio, misma técnica, ahora con un segundo caso de uso además del dado.
