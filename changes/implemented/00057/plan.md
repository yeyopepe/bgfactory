## (a) Anotaciones funcionales

- Fuera de alcance: el tipo `'texto'` (`textBox`) presenta el mismo patrón de código (`overflow: hidden` + etiqueta como hijo directo, `src/ui/componentRenderer.js:266,277`), y en teoría podría recortar su etiqueta igual que ficha/carta si el contenido de texto es más ancho que la caja. No se reporta como bug y no se toca en este fix — sería, si se confirma, un fix aparte.
- No se resolvieron dudas con el usuario: el análisis (`ms-tech-analysis`) confirmó la causa raíz sin ambigüedad, comparando código y `STYLE_BIBLE.md` sección 12.3, que documenta explícitamente que la etiqueta identificativa "no se recorta ni se envuelve en varias líneas... puede sobresalir de su ancho" — el `overflow: hidden` de los contenedores de ficha/carta contradice esa regla ya documentada, confirmando que es un bug y no un comportamiento intencionado.

## (b) Solución técnica

Causa raíz: en `src/ui/componentRenderer.js`, los contenedores de `'ficha'` (línea ~796) y `'carta'` (línea ~935) fijan `style.overflow = 'hidden'` sobre el mismo elemento al que se añade `.component-id-label` como hijo directo (líneas ~803 y ~943). Ese `overflow: hidden` es necesario para recortar el contenido visual que puede sobresalir de la forma del componente (imagen de fondo con zoom, cuadros de texto de la carta) — pero de paso recorta también la etiqueta cuando su texto es más ancho que el propio componente.

Solución: mover el `overflow: hidden` (y el recorte de forma que depende de él) a un nuevo contenedor interno que envuelva **solo** el contenido visual recortable (imagen/texto de fondo), dejando el contenedor exterior (que ya lleva la clase de selección, el borde, y ahora también la etiqueta) sin `overflow: hidden`. La etiqueta sigue siendo descendiente de `.ficha--selectable`/`.carta--selectable` (los selectores CSS en `main.css:655-656` y `680-681` son de descendiente, no de hijo directo, así que no requieren cambio), pero ya no es hija del elemento recortado.

Tareas, en `src/ui/componentRenderer.js`:

1. **`'ficha'`** (bloque ~línea 789-927):
   - Quitar `ficha.style.overflow = 'hidden'` del contenedor `ficha`.
   - Crear un nuevo `div` interno (p. ej. `fichaContent`), añadido como hijo de `ficha` **antes** de la etiqueta (para que la etiqueta quede por encima en el orden del DOM/pintado, igual que ahora), con: `position: absolute; inset: 0` (o `top/left/right/bottom: 0`), `overflow: hidden`, y el mismo `border-radius` que ya se calcula para `ficha` según `forma` (`50%` o `0`).
   - Mover `ficha.style.backgroundColor` (línea 822) y el contenido condicional de `fondoTipo` (el `img` de línea 824-839, o el `textSpan` de línea 840-849) para que se apliquen/añadan sobre `fichaContent` en vez de sobre `ficha` directamente.
   - `createIdentifierLabel(component)` se sigue añadiendo directamente a `ficha` (no a `fichaContent`), después de crear `fichaContent`.
   - El resto (posición, tamaño, borde, clases de selección/arrastre, resize handle, `fitTextToBox`) no cambia — sigue operando sobre `ficha` y `textSpanToFit` tal cual.

2. **`'carta'`** (bloque ~línea 928-1075):
   - Quitar `carta.style.overflow = 'hidden'` del contenedor `carta`.
   - Crear un nuevo `div` interno (p. ej. `cartaContent`), añadido como hijo de `carta` antes de la etiqueta, con `position: absolute; inset: 0; overflow: hidden; border-radius: 8px` (mismo radio que ya usa `carta`).
   - Mover el `img` de fondo (línea 953-963) y cada `textEl` de `textBoxes` (línea 965-984) para que se añadan a `cartaContent` en vez de a `carta`.
   - `carta.style.backgroundColor = '#ffffff'` (línea 950) puede quedarse en `carta` (un color de fondo sólido no necesita recorte: `border-radius` ya lo redondea sin depender de `overflow`), o moverse a `cartaContent` indistintamente — se deja en `carta` por ser el cambio más pequeño.
   - `createIdentifierLabel(component)` se sigue añadiendo directamente a `carta`, después de crear `cartaContent`.
   - El resto (posición, tamaño, `border-radius` de `carta`, clases de selección/arrastre/flip, resize handle) no cambia.

Verificación manual tras implementar: en modo edición, crear/seleccionar una ficha y una carta con un `id` largo (más ancho que el propio componente) y comprobar que la etiqueta se ve completa, sin recortarse por el borde del componente, igual que ya ocurre en dado/tablero/documento.
