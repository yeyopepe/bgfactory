## (a) Anotaciones funcionales

- Fuera de alcance: no se añade "Copiar/Pegar estilo" para las figuras (ese patrón, STYLE_BIBLE sección 12.9, está hoy acotado solo a `'carta'` como componente completo, no a elementos internos del editor).
- Fuera de alcance: no se toca el catálogo `CARD_PROPORTIONS` de la carta en sí ni la proporción/silueta general de la carta — las figuras son elementos independientes dentro de una cara, análogos a los cuadros de texto.
- Duda resuelta con el usuario: la fila de acciones de cada cara se rediseña con un único botón "Añadir elemento" + menú desplegable (opción A de los mockups), en vez de convertir los botones existentes en iconos sueltos (opción B, descartada). Confirmado tras revisar `design_selector-menu-desplegable.html` / `design_selector-botones-icono.html` / `design_modal-figura.html`.

## (b) Solución técnica

1. **`core/cardProportions.js`**: no requiere cambios — se reutiliza tal cual para entender el criterio de resize libre + Shift=1:1 ya existente (no se toca).

2. **`src/ui/cardShapeModal.js` (fichero nuevo)**: sub-modal de configuración de una figura, calcada de `src/ui/cardTextBoxModal.js` (overlay + `.modal`, sin tabs):
   - `working = { ...shape }`, con `working.tipo = working.tipo || 'circular'`, `working.colorFondo = working.colorFondo ?? ''`, `working.bordeColor = working.bordeColor || '#000000'`, `working.bordeGrosor = working.bordeGrosor ?? 2`.
   - Campo **Tipo de figura**: grupo `.align-group`/`.align-group__btn` de opción única (mismo patrón `createAlignGroup` que ya usa `cardTextBoxModal.js`, duplicado localmente igual que ya está duplicado allí — no se extrae a un módulo compartido, mismo criterio que el resto de la app) con dos botones: "Círculo/elipse" (icono círculo) y "Cuadrado" (icono cuadrado). Al pulsar "Círculo/elipse" si `working.width !== working.height`, igualar ambos al mayor de los dos (círculo perfecto), mismo criterio que ya aplica la proporción `'circular'` de Carta al crearse/cambiarse.
   - Campo **Color de fondo**: mismo patrón que la sección "Fondo" de `cardTextBoxModal.js` (`fieldset.modal__section` informativo, `<input type="color">` + checkbox "Transparente" que vacía `working.colorFondo`).
   - Sección **Borde** (`fieldset.modal__section`, variante meramente informativa — sin checkbox activador, a diferencia del borde de `TextBox`, porque `0` ya representa "sin borde" igual que en `'carta'`/`'tablero'`): fila color+grosor (patrón ya documentado en STYLE_BIBLE sección 8), `bordeGrosor` con `min=0 max=20`.
   - Footer: `Eliminar` (`onDelete`) / `Duplicar` (`onDuplicate`, pasa `working`) / `Cancelar` / `Aceptar` (`onAccept(working)`) — idéntico patrón a `cardTextBoxModal.js`.
   - Exporta `openCardShapeModal({ shape, onAccept, onDelete, onDuplicate })`.

3. **`src/ui/cardEditorModal.js`**:
   - `cloneCara()`: añadir `formas: (cara?.formas || []).map((f) => ({ ...f }))`.
   - Importar `openCardShapeModal` desde `./cardShapeModal.js`.
   - Nueva función local `renderShape(caraKey, shape, previewScale)`, calcada de `renderTextBox` pero sin campos de texto/tipografía:
     - `border-radius: 50%` si `shape.tipo === 'circular'`, si no sin radio (figura recta).
     - `background-color: shape.colorFondo || 'transparent'`.
     - `border: shape.bordeGrosor > 0 ? '${grosor}px solid ${color}' : 'none'`.
     - Selección por click (misma variable `selected`, ampliada para admitir `{ caraKey, id, kind: 'texto' | 'forma' }` — ver punto siguiente), doble click abre `openCardShapeModal`, arrastre igual que `renderTextBox` (mismas funciones `handleMouseMove`/`handleMouseUp` sobre `shape.x`/`shape.y`).
     - `attachResizeHandle(el, { axis: 'both', getScale, getSize, clamp, onResize, onResizeEnd })`: `clamp` solo aplica el mismo mínimo (`MIN_TEXT_BOX_DESIGN_SIZE`, o una constante `MIN_SHAPE_DESIGN_SIZE` con el mismo valor) a ambos ejes, sin forzar proporción — el forzado de 1:1 con Shift para el tipo `'circular'` ya es genérico en `attachResizeHandle` (axis `'both'`), igual que en Carta.
   - Ampliar `selected`/`selectTextBox`/`deselectTextBox`/`handleKeyDown` para distinguir si el elemento seleccionado es un `textBox` o una `forma` (añadir `kind` al objeto `selected`, o mantener dos variables paralelas `selectedKind`), de forma que las flechas de teclado y el resaltado `--selected` sigan funcionando igual para ambos tipos de elemento.
   - En `renderFace`: tras pintar `textBox`es, insertar el bucle de `cara.formas` **antes** del de `textBoxes` (orden de apilado: imagen → formas → texto).
   - Sustituir `chooseImageBtn` + `addTextBoxBtn` (líneas actuales ~304-343) por un único menú desplegable nuevo, función local `createAddElementMenu(cara, caraKey)`, que reutiliza tal cual las clases ya existentes en `main.css` (`resource-add`/`resource-add__button`/`resource-add__menu`/`resource-add__item`/`resource-add__item-label`, STYLE_BIBLE sección 12.7 — mismo patrón visual que "+ Añadir recurso" de `ui/resourceList.js`, sin exportarlo desde allí por ser un caso de uso distinto) con 3 opciones:
     - "Imagen de fondo…" → misma lógica que tenía `chooseImageBtn` (`openBoardImageModal`).
     - "Cuadro de texto" → misma lógica que tenía `addTextBoxBtn`.
     - "Figura geométrica" → crea una `forma` nueva (`id: crypto.randomUUID()`, `tipo: 'circular'`, tamaño inicial cuadrado centrado — mismo criterio de posición/tamaño que ya usa `addTextBoxBtn`, p. ej. lado `designWidth * 0.3` —, `colorFondo: ''`, `bordeColor: '#000000'`, `bordeGrosor: 2`) y llama a `renderFaces()`.
   - El botón queda con texto "Añadir elemento ▾" (mismo criterio de flecha que "+ Añadir recurso ▾").

4. **`src/ui/componentRenderer.js`**, función `paintCartaFace` (usada tanto por la carta en la mesa como por `ui/mazoContentModal.js`): añadir, entre el bloque de la imagen de fondo y el bucle de `textBoxes`, un bucle equivalente sobre `cara?.formas || []` que pinta cada figura con el mismo criterio de estilo que en el editor (`border-radius`, `background-color`, `border`), posicionada/escalada con `renderScale` igual que los `textBoxes`, y `pointer-events: none` (las figuras no son interactuables en la mesa, igual que el texto). Sin esto, una figura añadida en el editor no se vería en la carta real ni en la miniatura del mazo.

5. **Persistencia**: no hace falta ningún cambio en `core/component.js`/`core/state.js`/`core/persistence.js` — `formas` viaja dentro de `caraFrontal`/`caraTrasera`, que ya se guardan/cargan/exportan/importan como parte de `properties` de `'carta'` sin tratamiento especial (mismo mecanismo que ya cubre `textBoxes`). Una carta guardada antes de este cambio, sin `formas`, se comporta como array vacío (mismo criterio que `textBoxes` ausente).

6. **Ficheros de prueba** (`src/test/*.json`): añadir, si conviene, una figura de ejemplo a alguna carta ya presente en los ficheros de prueba existentes para poder probar la funcionalidad sin recrearla a mano.

## (c) Cambios de arquitectura

En `design/docs/ARCHITECTURE.md`, sección 4 (tipo `'carta'`), en el punto que describe `caraFrontal`/`caraTrasera`:

- Añadir `formas` al shape documentado: `formas: Forma[]`, con `Forma = { id, tipo: 'circular' | 'cuadrada', x, y, width, height, colorFondo, bordeColor, bordeGrosor }`, mismas unidades de diseño que `TextBox` (x/y/width/height relativos a `CARD_DESIGN_WIDTH`).
- Documentar el nuevo orden de apilado dentro de una cara: imagen de fondo → `formas` → `textBoxes`.
- Añadir `ui/cardShapeModal.js` a la lista de sub-modales del editor de cartas (junto a `ui/cardTextBoxModal.js`), con una línea equivalente a la ya existente para `TextBox`.
- Anotar que la fila de acciones de cada cara pasó de dos botones de texto a un único menú desplegable "Añadir elemento" (mismo patrón que `ui/resourceList.js` sección 12.7), con las tres opciones (Imagen/Texto/Forma).

## (d) Cambios en estilo

En `design/docs/stylebible/STYLE_BIBLE.md`:

- Sección 12.7 (menú desplegable de acciones): añadir una línea indicando que `ui/cardEditorModal.js` reutiliza el mismo patrón (`resource-add__*`) para el menú "Añadir elemento" de cada cara del editor de cartas — segundo uso real del patrón, confirma que es agnóstico al dominio (no exclusivo de subir recursos).
- Nueva entrada breve documentando `.card-editor-modal__shape` (o el nombre de clase que se use al implementar) como bloque hermano de `.card-editor-modal__textbox`: mismas reglas de selección/hover (`:hover`, `--selected`) y mismo `.resize-handle` en la esquina, sin tipografía ni contenido de texto propio.
- Confirmar en la sección 13 ("Qué NO hacer") que el borde de la figura cuadrada/circular es una línea simple (`border` CSS), sin el bisel reservado a `'tablero'`/`'dado'` — no se añade ninguna excepción nueva a esa lista, solo se referencia el criterio ya existente.
