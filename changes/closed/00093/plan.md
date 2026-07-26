## (a) Anotaciones funcionales

- No queda nada fuera de alcance: el `description.md` ya resuelve el formato de la línea para los cinco tipos de componente y los casos límite relevantes.
- No ha hecho falta resolver ninguna duda adicional con el usuario: la documentación funcional y los "Apuntes técnicos" ya aportaban suficiente detalle para diseñar la solución.
- Corrección sobre los propios "Apuntes técnicos" de `description.md` (no es una incongruencia de documentación técnica, solo una imprecisión de firma): `getPosibleValores` (`core/dice.js`) recibe `properties` (el objeto `component.properties`), no el `component` completo — así se invoca ya hoy en `ui/componentRenderer.js:573` (`getPosibleValores(props)`). La solución de abajo usa la firma real.

## (b) Solución técnica

1. **`src/ui/contextMenu.js`** — añadir un nuevo parámetro opcional `description` a `openContextMenu({ x, y, generalItems, specificItems, interactionItems, description, onClose })`, con forma `{ main: string, extra?: string }`. Si se pasa:
   - Se pinta como el primer bloque del menú (antes de `generalItems`), con un contenedor `.context-menu__description` (no clicable, `cursor: default`, sin listener de `click`) que contiene un `span.context-menu__description-main` con `description.main` y, solo si `description.extra` tiene valor, un `span.context-menu__description-extra` debajo con `description.extra`.
   - Justo después, se añade siempre un `.context-menu__separator` (la clase ya existente, reutilizada tal cual) para separarlo visualmente del resto del menú — a diferencia del separador entre `generalItems`/`specificItems`, este no depende de que haya contenido después, porque el menú de `modes/play/playMode.js` siempre tiene al menos la fila general "Bloquear"/"Desbloquear".
   - Añadir una función interna `addDescriptionSection(menu, description)` (paralela a `addInfoSection`, pero sin título y sin filas label/value) que construye ambos elementos.

2. **`src/modes/play/playMode.js`** — en el callback `onContextMenu` (línea ~93), calcular la descripción justo antes de invocar `openContextMenu` y pasarla como nuevo campo `description`:
   - Importar `formatComponentIdentifier` desde `../../ui/componentRenderer.js` y `getPosibleValores` desde `../../core/dice.js`.
   - `main`: `formatComponentIdentifier(component)` (ya da el formato "Tipo: id" exacto que pide la descripción, reutilizando `COMPONENT_TYPE_LABELS`).
   - `extra`, según `component.type`:
     - `'dado'`: `` `${getPosibleValores(component.properties || {}).length} caras` ``.
     - `'tablero'`: `` `${Math.round(component.width)}x${Math.round(component.height)}` `` (tamaño real actual, no el de creación — `component.width`/`component.height` ya reflejan el tamaño vigente tras cualquier redimensionado).
     - `'texto'`, `'documento'`, `'carta'`: `undefined` (sin segunda línea, tal como pide la descripción funcional para estos tres tipos).
   - Pasar `description: { main, extra }` en el objeto que se pasa a `openContextMenu`, junto a `generalItems`/`interactionItems` ya existentes.

3. **`src/styles/main.css`** — añadir, junto a las reglas ya existentes de `.context-menu__*` (línea ~1561), las clases nuevas usadas por el paso 1:
   - `.context-menu__description`: `padding: 0.5rem 0.75rem` (mismo padding horizontal que `.context-menu__item`/`.context-menu__info-row`), `display: flex; flex-direction: column; gap: 0.15rem`, `cursor: default` (no reacciona a hover ni cambia el cursor, igual que `.context-menu__info`).
   - `.context-menu__description-main`: `font-size: 0.875rem` (mismo tamaño que `.context-menu__item`), `font-weight: 600`, `color: var(--text-primary)`.
   - `.context-menu__description-extra`: `font-size: 0.75rem` (mismo tamaño que `.context-menu__info-title`), `color: var(--text-muted)`.
   - No se reutilizan `.context-menu__info-*` directamente porque esa familia de clases está pensada para el patrón label-izquierda/valor-derecha en fila (`.context-menu__info-row`), mientras que esta línea es un bloque de dos líneas apiladas (tipo+id en negrita, extra debajo en tenue) — mismo criterio visual que la maqueta `design_menu-contextual-con-descripcion.html` de esta entrada, pero con nombres de clase que siguen el mismo BEM ya usado por el resto de `.context-menu__*` en vez de los de la maqueta.

## (d) Cambios en estilo

Actualizar `design/docs/stylebible/STYLE_BIBLE.md`, sección **12.8 Menú contextual de componente**:

- Documentar la nueva cuarta sección del menú (además de las tres ya descritas: general, específica por tipo, e "Interacciones"): una línea de descripción de solo lectura, primera de todas, con el texto "Tipo: id" (reutilizando el mismo formato que ya usa la sección 12.3) y, según el tipo de componente, una segunda línea tenue con una propiedad diferenciadora (número de caras para "Dado", tamaño "AAxBB" para "Tablero", ausente para el resto). Nombrar las clases nuevas: `.context-menu__description`, `.context-menu__description-main`, `.context-menu__description-extra`, y el separador fijo que la distingue del resto del menú.
- Corregir de paso una incongruencia ya existente detectada durante este análisis (no introducida por este cambio, cambio 00091 que ya la dejó desactualizada): la sección 5 de `ARCHITECTURE.md` (`ui/contextMenu.js`) documenta `openContextMenu({ x, y, generalItems, specificItems = [], onClose })` sin el parámetro `interactionItems`, que el código ya acepta y usa desde el cambio 00091 (confirmado en `src/ui/contextMenu.js`). Añadir también `description` (nuevo parámetro de este cambio) a esa misma firma documentada en `ARCHITECTURE.md`, sección 5, entrada de `ui/contextMenu.js`.
