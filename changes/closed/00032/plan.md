## (a) Anotaciones funcionales

- Fuera de alcance: no se toca el modelo de datos (no se añade ningún id corto/legible nuevo); se usa `component.id` (UUID) y `component.type` tal cual existen hoy.
- Fuera de alcance: no se crea ningún tooltip visual propio para el modo juego (se descartó explícitamente, ver `description.md`) — se usa el atributo `title` nativo del navegador.
- Fuera de alcance: no se modifica el comportamiento de arrastre, lanzamiento de dado, selección ni redimensionado — el tooltip/etiqueta son puramente informativos y no consumen eventos.
- Dudas ya resueltas con el usuario (ver `description.md` para el detalle completo): estilo nativo del tooltip en modo juego; nombre de tipo capitalizado; id mostrado tal cual (UUID); alcance a los tres tipos de componente; la etiqueta de modo edición aparece tanto en hover como en selección; la etiqueta puede sobresalir del ancho del elemento si no cabe; fondo de la etiqueta en azul oscuro con texto claro.

## (b) Solución técnica

1. **`src/ui/componentRenderer.js` — helper de formato compartido**: añadir una función local `formatComponentIdentifier(component)` que devuelva el string `"<Tipo>: <id>"`, con un mapa fijo `{ texto: 'Texto', tablero: 'Tablero', dado: 'Dado' }` para la etiqueta de tipo (fallback al valor crudo de `component.type` si apareciera un tipo no mapeado, por robustez futura). La reutilizan tanto el modo tooltip como el modo etiqueta (paso 2).

2. **`src/ui/componentRenderer.js` — nueva opción `identifyMode` en `renderComponentsOnTable`**: añadir un parámetro `identifyMode` (valores `'tooltip'` | `'label'`, sin valor por defecto — si no se pasa, no se añade ni tooltip ni etiqueta) a la firma de `renderComponentsOnTable(worldEl, components, { ..., identifyMode } = {})`. Se decide con un único parámetro (no dos booleanos independientes) porque las dos variantes son mutuamente excluyentes según el modo que invoque la función.
   - Si `identifyMode === 'tooltip'`: en las tres ramas (`'texto'`, `'tablero'`, `'dado'`), tras crear el elemento contenedor (`textBox`/`board`/`dice`), fijar `elemento.title = formatComponentIdentifier(component)`. Cubre todo el área del componente al ser un atributo del propio contenedor.
   - Si `identifyMode === 'label'`: en las tres ramas, crear un `<span class="component-id-label">` con `textContent = formatComponentIdentifier(component)`, y añadirlo como hijo del contenedor (antes de cualquier otro contenido) — posicionado en la esquina superior izquierda vía CSS (paso 3), no vía estilos inline, para mantener la lógica de presentación en el CSS. No requiere lógica de mostrar/ocultar en JS: su visibilidad depende solo de las clases CSS ya existentes de hover/selección (paso 3).

3. **`src/modes/play/playMode.js`**: pasar `identifyMode: 'tooltip'` en la llamada a `renderComponentsOnTable` (junto a las opciones ya existentes `onMove`, `canMove`, `onDiceResult`, `onDiceOpenResult`).

4. **`src/modes/edit/editMode.js`**: pasar `identifyMode: 'label'` en la llamada a `renderComponentsOnTable` dentro de `renderTable()` (junto a `onSelect`, `onToggleSelect`, `selectedId`, `onMove`, `onResize`).

5. **`src/styles/main.css` — estilos de la etiqueta**:
   - Nuevo token de color en `:root` (sección "Design tokens"): `--accent-blue-dark: #123a66;` (fondo de la etiqueta, azul oscuro diferenciado de `--accent-blue`, el del contorno).
   - Nueva regla base `.component-id-label`: `position: absolute; top: -1.4rem; left: -3px; white-space: nowrap; background: var(--accent-blue-dark); color: var(--text-light); font-size: 0.72rem; line-height: 1.4; padding: 0.1rem 0.4rem; border-radius: 3px; pointer-events: none; display: none;` (oculta por defecto).
   - Regla de visibilidad, junto a las reglas `--selectable:hover`/`--selected` ya existentes de cada tipo (`.text-box--selectable`, `.board--selectable`, `.dice--selectable`), añadiendo el selector descendiente para mostrar la etiqueta en los mismos dos casos en que ya se muestra el contorno azul:
     ```css
     .text-box--selectable:hover .component-id-label,
     .text-box--selectable.text-box--selected .component-id-label,
     .board--selectable:hover .component-id-label,
     .board--selectable.board--selected .component-id-label,
     .dice--selectable:hover .component-id-label,
     .dice--selectable.dice--selected .component-id-label {
       display: block;
     }
     ```
   - Los contenedores de `'texto'`/`'tablero'`/`'dado'` ya son `position: absolute` (posicionamiento de la mesa); al no tener hoy `position: relative` propio no hace falta añadirlo porque la etiqueta se posiciona respecto a ese mismo contenedor `absolute` (que ya actúa como *containing block* para hijos `position: absolute`).

## (d) Cambios en estilo

- Añadir el nuevo token `--accent-blue-dark` a la sección "2. Design tokens" de `STYLE_BIBLE.md`, con su propósito ("fondo de la etiqueta identificativa de componente en modo edición").
- Documentar en la sección de patrones (8) o en una nueva subsección el patrón `.component-id-label`: pequeña etiqueta anclada en la esquina superior izquierda de un componente, visible solo en hover/selección, mismo criterio en los tres tipos de componente de la mesa.
