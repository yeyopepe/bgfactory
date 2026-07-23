## (a) Anotaciones funcionales

**Fuera de alcance** (explícitamente, para no ampliar el cambio):

- No se introduce modo oscuro ni ningún esquema de color alternativo.
- No se incorpora ninguna fuente externa/webfont (se mantiene `system-ui`, confirmado en `description.md`).
- No se modifica ningún comportamiento, interacción, dato persistido ni quién puede usar qué — es un cambio puramente de `main.css` (y los estilos inline mínimos de `componentRenderer.js` que ya existían para bisel/forma).
- El efecto "levantar" al arrastrar (`.lifted`) no cambia su valor numérico (mismo `transform`/`box-shadow` de siempre) — solo se re-describe conceptualmente en la guía de estilo como aplicación del sistema de elevación en vez de excepción aislada.
- El bisel del Tablero y la silueta con profundidad del Dado (calculados en JS con `shadeColor`) no se tocan — se mantienen intactos, solo se les añade una sombra de contacto CSS adicional (ver tarea 6).
- No se toca `ARCHITECTURE.md`: este cambio no modifica capas, modelo de datos ni el proceso de build.

**Dudas resueltas**: todas las decisiones de alcance/dirección ya se resolvieron con el usuario durante `ms-new` y están recogidas en `description.md` (fundamentos compartidos + bloques). No ha surgido ninguna duda técnica nueva durante este análisis que requiriera confirmación adicional.

## (b) Solución técnica

Todo el trabajo vive en `src/styles/main.css`, salvo la tarea 11 que toca `src/ui/componentRenderer.js`. Orden recomendado:

1. **Nuevos tokens en `:root`** (junto a los ya existentes): `--border-neutral: #dcdcdc`, `--bg-subtle: #f0f0f0`, `--bg-hover: #e8e8e8`, `--radius-sm: 4px`, `--radius-lg: 8px`, `--shadow-1: 0 2px 6px rgba(0,0,0,.10), 0 1px 2px rgba(0,0,0,.08)`, `--shadow-2: 0 4px 20px rgba(0,0,0,.15)` (mismo valor que ya usan `.modal`/`.help-icon__tooltip`, solo se nombra), `--transition-fast: 150ms ease`. Además, suavizar `--bg-table-dot` de `rgba(0,0,0,0.12)` a `rgba(0,0,0,0.09)` (mesa infinita, nivel 0, sin tocar `--bg-table`).

2. **Consolidar grises sueltos** — sustituir por los tokens del punto 1 en todos sus usos actuales (confirmados por grep sobre `main.css`, sin dejar ninguno):
   - `#ddd` → `var(--border-neutral)`: líneas 182, 201, 286, 333, 563, 705, 724, 748, 900, 942, 1100, 1107, 1125, 1185, 1192, 1210, 1255, 1286.
   - `#eee` → `var(--border-neutral)`: líneas 280, 386, 410.
   - `#f0f0f0` → `var(--bg-subtle)`: líneas 177, 425, 1250.
   - `#e0e0e0` → `var(--bg-hover)`: línea 430.
   - `#f9f9f9` → `var(--bg-hover)`: líneas 246, 291.

3. **Unificar escala de radios** a `var(--radius-sm)` (4px) / `var(--radius-lg)` (8px):
   - De `3px` a `var(--radius-sm)`: líneas 228 (`.component-list__action-btn`), 541 (`.component-id-label`), 767 (`.board-image-modal__thumb`), 1268 (`.resource-list__action-btn`).
   - El resto de `4px` existentes pasan a `var(--radius-sm)` (líneas 62, 110, 202, 334, 387, 419, 706, 725, 749, 943, 1017, 1071, 1108, 1134, 1156, 1193, 1219, 1287, 1318).
   - `8px` de `.modal` (línea 269) pasa a `var(--radius-lg)`.
   - Los `50%` (círculos: `.help-icon`, y los inline de `ficha`/imagen circular en `componentRenderer.js`) no cambian.
   - Nuevo uso de `var(--radius-lg)` en las nuevas reglas base `.board`/`.ficha`/`.carta`/`.document-viewer` de la tarea 6 salvo donde se indique lo contrario (ver esa tarea: Tablero y Ficha cuadrada mantienen esquina recta).

4. **Transiciones de hover/foco** — añadir `transition: <props> var(--transition-fast)` (sin usar `:active` ni nada que no sea `:hover`/`:focus`, coherente con lo ya prohibido) a:
   - `#mode-switcher button`, `.edit-toolbar button` → `transition: background var(--transition-fast), opacity var(--transition-fast)`.
   - `.btn-accept`, `.btn-eliminar` → añaden además `transform var(--transition-fast), box-shadow var(--transition-fast)`; en `:hover:not(:disabled)` sumar `transform: translateY(-1px)` y una sombra de color sutil (`box-shadow: 0 3px 8px rgba(44,125,216,.35)` para accept, `rgba(211,47,47,.3)` para eliminar). `.btn-cancel` solo cambia `background` con transición, sin transform.
   - `.component-list__action-btn`, `.resource-list__action-btn`, `.component-panel__footer button`, `.resource-panel__footer button` → `transition: opacity var(--transition-fast)`.
   - `.component-list__row`, `.modal__tab`, `.component-type-modal__item`, `.board-image-modal__item`, `.dice-font-modal__item` → `transition: background var(--transition-fast), border-color var(--transition-fast), box-shadow var(--transition-fast)`.
   - `.help-icon` → `transition: background var(--transition-fast), box-shadow var(--transition-fast)`.
   - `.resize-handle::after` → `transition: background var(--transition-fast)` (o filtro equivalente); ver también tarea 9 sobre su tamaño.
   - Inputs de texto dentro de modal/paneles (`.modal__field input/select/textarea`, `.component-panel__filter input`, `.resource-panel__filter input`, `.board-image-modal__search input`) → `transition: border-color var(--transition-fast), box-shadow var(--transition-fast)`.
   - El contorno discontinuo de selección (`.text-box--selectable`, `.board--selectable`, etc.) y el temblor/parpadeo del dado **no** llevan transición — son indicadores funcionales de estado y JS puro respectivamente, no decoración (ver anotación funcional).

5. **Foco de campos con anillo de color** — en los mismos selectores `:focus` que hoy solo cambian `border-color` (`.component-list__order-input:focus`, `.modal__field input/select/textarea:focus` si existiera regla — comprobar y añadir si falta —, `.board-image-modal__search input:focus`, `.component-panel__filter input:focus`, `.resource-panel__filter input:focus`), añadir `box-shadow: 0 0 0 3px rgba(44,125,216,.15)` junto al borde, reutilizando el mismo patrón numérico que ya existe en `.image-adjust-modal__mask--active` (línea 835).

6. **Sistema de elevación — nivel 1 (`var(--shadow-1)`)** en elementos hoy planos:
   - `.component-panel`, `.resource-panel` (líneas ~1067-1073, ~1152-1158): añadir `box-shadow: var(--shadow-1)`.
   - `h1` y `.edit-toolbar`: añadir `box-shadow: var(--shadow-1)` (se leen "por encima" de la mesa).
   - `.toast`: añadir `box-shadow: var(--shadow-1)`.
   - `.document-viewer` (línea 561): añadir `box-shadow: var(--shadow-1)` junto al fondo/borde ya existentes.
   - **Crear regla base `.board { box-shadow: var(--shadow-1); }`** (no existe hoy — solo hay `.board--selectable`/`--movable`). El bisel de borde calculado en JS no se toca.
   - **Crear regla base `.ficha { box-shadow: var(--shadow-1); }`** y **`.carta { box-shadow: var(--shadow-1); border-radius: var(--radius-lg); }`** (tampoco existen hoy). `carta` ya recibe `border-radius: 8px` inline desde JS (líneas 964/974 de `componentRenderer.js`) — mantenerlo tal cual (redundante con la clase pero inofensivo) o, si se prefiere limpieza, se puede dejar solo en CSS y quitar el inline; decisión menor, no bloqueante.
   - **Dado**: no usar `box-shadow` (su silueta no es rectangular — varía entre triángulo/cuadrado/rombo/decágono). Crear regla base `.dice { filter: drop-shadow(0 5px 8px rgba(0,0,0,.28)); }`, que proyecta la sombra siguiendo la forma real renderizada (SVG + texto de resultado) en vez de la caja cuadrada del contenedor.
   - **Cuadro de texto**: no lleva `box-shadow` (no tiene caja/fondo, es texto suelto sobre la mesa). Añadir a `.text-box` (línea 458) `text-shadow: 0 1px 2px rgba(0,0,0,.25)` para mantener legibilidad sobre cualquier color de mesa, en vez de sombra de caja.

7. **Sistema de elevación — nivel 2**: `.modal` (línea 267-270) y `.help-icon__tooltip` (línea 1021) ya usan el valor que ahora es `var(--shadow-2)` — sustituir el literal `0 4px 20px rgba(0,0,0,0.15)` por `var(--shadow-2)` en ambos sitios (sin cambio visual, solo nomenclatura consistente). El modal de error (`.modal__header--error`, línea 359) no necesita cambios adicionales de sombra (hereda la del `.modal` que lo contiene) — solo se le añade `box-shadow` sutil de color al `.modal__error-icon` (línea 365-376): `box-shadow: 0 2px 5px rgba(211,47,47,.4)`.

8. **Etiqueta identificativa de componente** (`.component-id-label`, línea 530): `border-radius` pasa a `var(--radius-sm)` (ya cubierto en tarea 3) y se añade `box-shadow: 0 2px 4px rgba(0,0,0,.25)`.

9. **Manejador de redimensionado** (`.resize-handle`, líneas 1030-1056): agrandar contenedor de `16px`→`18px` y grip de `8px`→`9px` (ajustar los `right`/`bottom` del `::after` proporcionalmente); añadir la transición ya prevista en la tarea 4.

10. **Cabecera con textura sutil**: añadir a `h1` (línea 33) `background: linear-gradient(180deg, #3a3a3a, var(--bg-toolbar))` en vez de `background: var(--bg-toolbar)` sólido — degradado casi imperceptible, no "llamativo" (respeta la prohibición de degradados vistosos que se mantiene).

11. **`src/ui/componentRenderer.js`**: no requiere cambios funcionales. Único punto a revisar: si se decide (ver nota tarea 6) quitar el `borderRadius` inline redundante de `carta`/`cartaContent` (líneas 964, 974) ahora que `.carta` lo define por CSS — opcional, evaluar durante implementación para no romper `cartaContent` si en algún caso se renderiza sin la clase `carta` en el nodo padre (comprobar antes de quitarlo).

12. **Limpieza de comentarios obsoletos en `main.css`**: los comentarios que documentan las "excepciones explícitas" (líneas ~485-487, ~510-511, ~559-560, ~640-641, ~664-666, ~1336-1338) se reescriben para reflejar que ya no son excepciones puntuales sino aplicación del sistema general de elevación (ver tarea de documentación en (d)).

## (d) Cambios en estilo

`design/docs/stylebible/STYLE_BIBLE.md` necesita una revisión sustancial, ya que este cambio reemplaza varias de sus reglas centrales:

- **Sección 2 (Design tokens)**: añadir los tokens nuevos (`--border-neutral`, `--bg-subtle`, `--bg-hover`, `--radius-sm`, `--radius-lg`, `--shadow-1`, `--shadow-2`, `--transition-fast`) a la tabla de `:root`, y eliminar la nota "Colores puntuales que aún no son tokens" (sección 2, líneas 29-31 actuales) ya que esos grises pasan a ser tokens.
- **Sección 5 (Bordes y esquinas)**: reescribir para describir solo dos radios (`--radius-sm`/`--radius-lg`) y su criterio de uso (controles vs. contenedores destacados), eliminando la mención al radio de `3px`.
- **Sección 6 (Sombra y elevación)**: reescritura completa — sustituir "Solo el modal tiene sombra... no añadir sombras a botones ni tarjetas" por la descripción del sistema de 3 niveles (`--shadow-1`/`--shadow-2`, más el caso especial de `filter: drop-shadow` para el Dado y `text-shadow` para el Cuadro de texto) y qué elemento usa cada nivel.
- **Sección 9 (Botones)**: actualizar "No usar `:active` ni transiciones" — se sigue sin usar `:active`, pero ahora sí hay transición de 150ms en hover/foco; documentar el nuevo feedback (opacity+transform+shadow de color en primario/destructivo, background en secundario/toolbar).
- **Sección 11 (Redimensionado)**: actualizar medidas del grip (16px→18px contenedor, 8px→9px marca) y añadir que ahora tiene transición.
- **Sección 12.3 (Etiqueta identificativa)**: actualizar radio (a `--radius-sm`) y añadir la sombra nueva.
- **Sección 13 (Qué NO hacer)**: reescritura completa. Se elimina la prohibición general de sombras/radios grandes/transiciones. Las tres "excepciones explícitas" actuales (bisel tablero/dado, esquinas carta, `.lifted`) dejan de describirse como excepciones aisladas: se integran como casos particulares del sistema de elevación de la sección 6 (bisel de Tablero/Dado se mantiene como técnica JS complementaria a su sombra CSS; esquinas de Carta ya usan `--radius-lg`; `.lifted` pasa a describirse como el estado "en el aire" del mismo sistema). Se mantiene explícitamente la prohibición de degradados llamativos y animaciones/transiciones complejas (`@keyframes`, animaciones narrativas) — el degradado sutil del header (tarea 10) se documenta como la única excepción moderada, igual que ya se documentaban otras excepciones puntuales.

`design/docs/FEATURES.md` también queda desactualizado en varias entradas que describen explícitamente el aspecto plano anterior como si fuera la regla general — actualizar in place (mismo `xxxx` 00063 añadido a **Código** de cada entrada tocada):

- **Componente "tablero"** (línea ~94): quitar "única excepción del lenguaje visual, deliberadamente plano, del resto de la app" — el bisel deja de ser la única excepción, ahora todas las piezas tienen algo de profundidad.
- **Componente "dado"** (línea ~111): quitar "sin sombras ni degradados difuminados" — ahora sí tiene una sombra de contacto (drop-shadow) además del efecto de profundidad ya descrito.
- **Componente "Visor de documentos"** (línea ~120): quitar "sin bisel ni sombra, aspecto deliberadamente plano" — gana la sombra de contacto nivel 1.
- **Componente "ficha"** (párrafo tras línea 134): quitar "con aspecto deliberadamente plano (sin bisel, sombra ni animación)" — gana la sombra de contacto nivel 1.
