- **Fecha creación**: 2026-08-05

## (a) Anotaciones funcionales

- **Fuera de alcance** (ya fijado en `description.md`): "Dado" y "Carta/Ficha" no llevan este check.
- **Aviso de orden**: el cambio 00154 se creó antes que el 00153 ("Color de fondo y borde des/activable en Tablero Simple") y el 00156 ("Nuevo tipo de fondo 'Color' en Tablero simple"), ambos ya en `closed` — es decir, más avanzados en el flujo. Este plan se ha diseñado releyendo el estado **actual** de `componentModal.js`/`componentRenderer.js` (que ya incluyen ambos cambios), no los apuntes técnicos que se dejaron en `description.md` cuando aún no existían.
- Consecuencia relevante de 00153: la sección "Borde" de `'tableroSimple'` ya tiene hoy un checkbox propio en su `<legend>` (`bordeActivo`, patrón "des/activador" de `STYLE_BIBLE.md` sección 12.6) que activa/desactiva el borde entero. La nueva sección "Visual" es independiente de ese checkbox: cuando el borde está desactivado (`bordeActivo === false`) no se pinta ningún borde, biselado o no; cuando está activo, `biselado` decide solo el acabado (bisel de dos tonos vs. plano de un color).
- No han surgido dudas técnicas que requirieran resolución adicional con el usuario más allá de lo ya acordado en `description.md` (alcance, ubicación como primera sección, comportamiento por defecto).

## (b) Solución técnica

1. **`src/ui/componentModal.js` — `DEFAULT_BOARD_PROPERTIES`** (objeto de valores por defecto de `'tableroSimple'`): añadir `biselado: true`.
2. **`src/ui/componentModal.js` — `DEFAULT_TABLERO_PERSONALIZADO_PROPERTIES`**: añadir `biselado: true` como campo de primer nivel, hermano de `cara` (no dentro de `cara`, ya que el checkbox vive en las propiedades específicas de `componentModal.js`, no en el Editor visual). `cloneTableroPersonalizadoProperties` ya copia cualquier campo de primer nivel vía `...properties`, así que no necesita cambios.
3. **`src/ui/componentModal.js` — `renderBoardSpecificFields`**: crear un nuevo `fieldset.modal__section` (título meramente informativo — `legend.modal__section-title`, sin el modificador `--toggle`, ya que no des/activa nada) con texto "Visual", insertado como **primer hijo** de `container` (antes del fieldset "Borde" existente). Dentro, un único campo `.modal__field--checkbox` (mismo patrón que "Esquinas redondeadas" del Editor visual o "Bloqueado"/"Oculto" de la pestaña "Generales"): checkbox + `<label>` "Biselado en el borde", inicializado a `props.biselado !== false` (ausencia de la propiedad = `true`, para tableros guardados antes de este cambio) y que en su evento `change` actualiza `props.biselado = checkbox.checked`.
4. **`src/ui/componentModal.js` — `renderTableroPersonalizadoSpecificFields`**: mismo fieldset "Visual" (idéntica estructura y comportamiento que el punto 3), insertado como **primer hijo** de `container`, antes del campo con el botón "Editar diseño del tablero".
5. **`src/ui/componentRenderer.js` — rama `component.type === 'tableroSimple'`** (dentro del bloque `if (bordeActivo) { ... }`): sustituir el pintado incondicional de dos tonos por una decisión según `props.biselado !== false`:
   - `biselado` verdadero (o ausente): comportamiento actual, `shadeColor(bordeColor, 0.35)`/`shadeColor(bordeColor, -0.35)` repartidos en los cuatro lados.
   - `biselado` falso: `board.style.borderColor = bordeColor` (un único tono en los cuatro lados, sin relieve) — limpiando/sin usar los `border*Color` individuales.
6. **`src/ui/componentRenderer.js` — rama `component.type === 'tableroPersonalizado'`**: mismo criterio que el punto 5, leyendo `props.biselado !== false` donde `props` es `component.properties` (no `cara`, que solo aporta `bordeColor`/`bordeGrosor`) y aplicándolo sobre `tablero.style.border*Color`.
7. **`src/ui/visualEditorModal.js` — `openVisualEditorModal`/`applyCanvasBorder()`**: para que la previsualización del lienzo dentro de "Editar diseño del tablero" no muestre siempre bisel aunque el tablero esté configurado como plano, añadir un nuevo parámetro de entrada `bevelEnabled = true` a `openVisualEditorModal({ ..., bevelEnabled })`, leído una sola vez al abrir el editor (no reactivo mientras está abierto — el checkbox "Biselado en el borde" no es editable desde dentro del Editor visual). En `applyCanvasBorder()`, dentro de la rama `borderStyle === 'bisel'`, usar `bevelEnabled` para elegir entre el bisel de dos tonos actual o `canvas.style.borderColor = bordeColor` (plano), mismo criterio que los puntos 5/6.
8. **`src/ui/componentModal.js` — `renderTableroPersonalizadoSpecificFields`**: al invocar `openVisualEditorModal` desde el botón "Editar diseño del tablero", pasar `bevelEnabled: props.biselado !== false`.

## (c) Cambios de arquitectura

En `design/docs/ARCHITECTURE.md`, sección 4 ("Tipos de componente implementados"):

- Bullet de `'tableroSimple'` (línea del `bordeColor`/`bordeGrosor` con el bisel de dos tonos): añadir una frase indicando la nueva propiedad `biselado` (boolean, `true` por defecto) que decide si ese borde se pinta con el bisel de dos tonos o totalmente plano de un color — remite a `STYLE_BIBLE.md` sección 13.
- Bullet de `'tableroPersonalizado'` (cambio 00143, mismo párrafo que documenta `properties.cara` y el bisel compartido con `'tableroSimple'`): añadir la nueva propiedad `properties.biselado` (boolean, `true` por defecto, de nivel superior — no dentro de `cara`) con el mismo criterio.

No se corrige en este cambio la documentación ya desactualizada de ese mismo bullet de `'tableroSimple'` respecto a `bordeActivo`/`colorFondo`/`colorSolido` (cambios 00153/00155/00156, no reflejados hoy en `ARCHITECTURE.md`) — incongruencia preexistente ajena al alcance de este cambio.

## (d) Cambios en estilo

En `design/docs/stylebible/STYLE_BIBLE.md`:

- **Sección 12.6** ("Secciones dentro de pestañas de propiedades"), bullet de `ui/componentModal.js` tipo `'tableroSimple'`: añadir la nueva sección "Visual" (informativa, primera de la pestaña, antes de "Borde") con el checkbox "Biselado en el borde".
- **Sección 12.6**: añadir un bullet nuevo para `ui/componentModal.js` tipo `'tableroPersonalizado'` (hoy esa pestaña no aparece en el catálogo, al no tener hasta ahora ningún `.modal__section` propio — solo el botón "Editar diseño del tablero"): sección "Visual" (informativa, primera de la pestaña, antes del botón), mismo checkbox "Biselado en el borde".
- **Sección 13** (bisel/profundidad de "Tablero simple", "Tablero personalizado" y "Dado"): actualizar el párrafo para reflejar que en `'tableroSimple'` y `'tableroPersonalizado'` el bisel de dos tonos es ahora opcional (`properties.biselado`, `true` por defecto): desmarcado, se pinta `bordeColor` sin repartir en dos tonos, en los tres puntos donde se pinta (mesa de cada tipo y previsualización del Editor visual para `'tableroPersonalizado'`). "Dado" no se ve afectado por esta propiedad — sigue biselado siempre, fuera del alcance de este cambio.
