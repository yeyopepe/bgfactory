## (a) Anotaciones funcionales

- Fuera de alcance: no se toca el resto de propiedades de carta (`caraFrontal`/`caraTrasera`, `caraActual`, `TextBox`), ni el comportamiento de redimensionado de `'carta'` en la mesa (`ui/resizeHandle.js`), ni las proporciones Circular/Hexagonal, que mantienen su silueta fija sin ningún cambio.
- Dudas de alcance ya resueltas con el usuario en `ms-new` (ver `description.md`): la opción solo aplica a las 5 proporciones rectangulares/cuadrada; es una única opción por carta (no por cara); por defecto `true` (redondeadas, preserva el aspecto de cartas ya existentes); vive en la toolbar del Editor de cartas junto a "Proporción".

## (b) Solución técnica

1. **`src/core/cardProportions.js`** — parametrizar `getCartaShapeCss`:
   - Cambiar la firma a `getCartaShapeCss(value, esquinasRedondeadas = true)`.
   - Cuando `shape === 'rect'`, devolver `borderRadius: esquinasRedondeadas ? '8px' : '0'` (en vez del `'8px'` fijo actual). El resto de shapes (`circular`, hexagonales) no cambian: ignoran el segundo parámetro.
   - Añadir un pequeño helper exportado `isRectShape(value)` (busca en `CARD_PROPORTIONS` y devuelve `shape === 'rect'`, con el mismo fallback a `'rect'` que ya usa `getCartaShapeCss` si `value` no coincide con ninguna entrada) — lo usará `ui/cardEditorModal.js` para decidir cuándo mostrar el checkbox nuevo, sin duplicar esa búsqueda.

2. **`src/ui/componentModal.js`** — modelo de datos y flujo de aceptar del editor de cartas:
   - `DEFAULT_CARTA_PROPERTIES`: añadir `esquinasRedondeadas: true` a nivel de propiedad (junto a `proporcion`, fuera de `caraFrontal`/`caraTrasera`).
   - `cloneCartaProperties` ya copia cualquier campo de primer nivel vía `{ ...properties, ... }`: no necesita cambio explícito, `esquinasRedondeadas` se clona igual que `proporcion`.
   - En `renderCartaSpecificFields`, dentro del `onAccept` del botón "Editar diseño de la carta" (línea ~1013): el objeto recibido de `openCardEditorModal` pasa a incluir `esquinasRedondeadas`; asignar `props.esquinasRedondeadas = esquinasRedondeadas;` junto a `props.proporcion`/`props.caraFrontal`/`props.caraTrasera`.
   - En el flujo "Copiar estilo" (línea ~1058): cuando `selection.proporcion` esté marcado, incluir también `data.esquinasRedondeadas = props.esquinasRedondeadas;` (mismo bloque del checklist que "Proporción" — esta opción es una propiedad de la forma de la carta, no un bloque nuevo).
   - En el flujo "Pegar estilo" (línea ~1098): cuando `clip.proporcion` esté presente, aplicar también `props.esquinasRedondeadas = clip.esquinasRedondeadas ?? true;` (fallback por si el portapapeles se copió justo antes de este cambio en la misma sesión del navegador).

3. **`src/ui/cardEditorModal.js`** — el propio Editor de cartas:
   - En la construcción de `working` (línea ~73), añadir `esquinasRedondeadas: props.esquinasRedondeadas !== false` (default `true`, igual criterio que el resto de campos opcionales del proyecto: ausencia de dato = comportamiento anterior).
   - En la toolbar (tras `proporcionField`, línea ~136): añadir un nuevo `div.modal__field.modal__field--checkbox` con un `<input type="checkbox">` + `<label>Esquinas redondeadas</label>` (mismo patrón ya usado en `ui/componentModal.js` para "Bloqueado"/"Oculto", reutilizando la clase existente `.modal__field--checkbox` de `main.css`, sin CSS nuevo). Estado inicial del checkbox: `working.esquinasRedondeadas`. Visibilidad: el campo entero se oculta (`style.display = 'none'`) cuando `!isRectShape(working.proporcion)`, visible en caso contrario — calculado tanto al construirlo como cada vez que cambia la proporción.
   - En el listener `change` del checkbox: `working.esquinasRedondeadas = checkbox.checked; renderFaces();` (para reflejar el cambio al instante en la vista previa, igual que ya hace el cambio de Proporción).
   - En el listener `change` de `proporcionSelect` (línea ~130): tras `working.proporcion = proporcionSelect.value;`, añadir la actualización de visibilidad del nuevo campo checkbox según `isRectShape(working.proporcion)`.
   - En `renderFace` (línea ~244): cambiar `getCartaShapeCss(working.proporcion)` por `getCartaShapeCss(working.proporcion, working.esquinasRedondeadas)`.
   - En el footer, botón "Aceptar" (línea ~524): añadir `esquinasRedondeadas: working.esquinasRedondeadas` al objeto que recibe `onAccept`.

4. **`src/ui/componentRenderer.js`** — renderizado final en el tablero (ambos modos, edición y juego):
   - Línea ~1095: cambiar `getCartaShapeCss(props.proporcion)` por `getCartaShapeCss(props.proporcion, props.esquinasRedondeadas !== false)` — el `!== false` cubre tanto cartas ya existentes (sin el campo) como el valor por defecto `true`, sin necesitar ninguna migración de datos.

Con estos cuatro puntos, cartas creadas antes de este cambio (sin `esquinasRedondeadas` en `properties`) siguen mostrándose exactamente igual que hoy (redondeadas), tanto en el editor como en la mesa, sin tocar ningún dato existente.

## (c) Cambios de arquitectura

`docs.tech.architectureDocPath` (`design/docs/ARCHITECTURE.md`) está configurado. Al implementar, actualizar la sección 4 (tipo `'carta'`):

- En el párrafo introductorio del tipo `'carta'` (línea ~139), que hoy dice "Esquinas con `border-radius: 8px`... salvo `proporcion === 'circular'`...": matizar que el `border-radius: 8px` de las proporciones rectangulares/cuadrada ya no es incondicional, sino que depende de la nueva propiedad `esquinasRedondeadas` (booleana, `true` por defecto = comportamiento previo a este cambio), configurable desde el Editor de cartas (`ui/cardEditorModal.js`); Circular y Hexagonal siguen sin verse afectadas por esta propiedad.
- En el punto de `proporcion` dentro de "Propiedades específicas" (línea ~140), añadir la nueva propiedad justo después: `esquinasRedondeadas` (boolean, `true` por defecto): solo tiene efecto y solo se muestra su control (checkbox en la toolbar del Editor de cartas, junto al selector de Proporción) cuando la proporción activa tiene `shape === 'rect'`; determina si `getCartaShapeCss` devuelve `border-radius: 8px` o `border-radius: 0` para esas cinco proporciones. Documentar también el cambio de firma de `getCartaShapeCss(value, esquinasRedondeadas = true)` y el nuevo helper `isRectShape(value)` de `core/cardProportions.js` (línea ~152, junto a la mención de ese módulo).
- Mencionar que "Copiar/Pegar estilo" (bloque "Proporción" del portapapeles, `core/styleClipboard.js`) incluye ahora también `esquinasRedondeadas` junto con `proporcion`.

## (d) Cambios en estilo

`docs.tech.styleBibleDocPath` (`design/docs/stylebible/STYLE_BIBLE.md`) está configurado. Al implementar, actualizar la sección 13 (línea ~279, "Esquinas redondeadas de 'Carta'"): matizar que, desde este cambio, ese `border-radius: 8px` (equivalente a `var(--radius-lg)`) es el valor por defecto de una propiedad configurable (`esquinasRedondeadas`, checkbox en el Editor de cartas) para las proporciones rectangulares/cuadrada — desmarcarla aplica `border-radius: 0` en su lugar. No se introduce ningún patrón visual nuevo: el checkbox reutiliza tal cual `.modal__field--checkbox`, ya catalogado y usado en otros checkboxes de la app (p.ej. "Bloqueado"/"Oculto" en `ui/componentModal.js`).
