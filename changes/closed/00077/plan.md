## (a) Anotaciones funcionales

- Fuera de alcance: el botón "+ Añadir recurso" en sí (no cambia), y cualquier otro desplegable/select de la app — el cambio se limita a `.resource-add__menu` y sus `.resource-add__item`.
- Duda resuelta con el usuario (ya en `description.md`): "la opción seleccionada" se refiere al estado hover/foco de cada ítem del menú mientras está abierto, no a una opción persistida entre aperturas (este menú no es un `<select>`, es un menú de acciones).
- Confirmado en el análisis técnico (`ms-internal-tech-analysis`): `.resource-add__item`/`.resource-add__menu` solo se usan en `createAddMenu()` (`src/ui/resourceList.js`), sin otro consumidor en el código ni en el HTML de salida — no hay riesgo de romper otra pantalla al tocar estos estilos.
- `var(--bg-hover)` (gris neutro) se reutiliza en muchos otros sitios del proyecto (filas de tabla, botón secundario, tabs, `.element-selection-group__item`, etc.) — no se toca su valor global; el nuevo hover azul de este menú se implementa como regla propia de `.resource-add__item:hover`, no cambiando el token compartido.
- No existe hoy ningún token de "azul claro" de fondo en `:root` — hace falta añadir uno nuevo siguiendo la convención de la sección 2 del Style Bible ("nunca hardcodear un color reutilizable sin token").

## (b) Solución técnica

1. En `src/styles/main.css`, añadir un nuevo token en `:root` (sección de design tokens, junto a `--accent-blue-dark`): `--accent-blue-light: #eaf3fc;` — tono claro derivado de `--accent-blue`, pensado para fondos que necesiten destacar como "interactivos" sin usar el azul sólido.
2. `.resource-add__menu` (~línea 1544): cambiar `background: #fff;` por `background: var(--accent-blue-light);`, y el `border` de `var(--border-neutral)` a un tono acorde (usar `rgba(44, 125, 216, 0.25)`, mismo valor RGB que `--accent-blue`, siguiendo el precedente ya usado en el proyecto para sombras/tintes derivados de este color — p.ej. `rgba(44,125,216,.35)` en el botón primario).
3. `.resource-add__item:not(:last-child)` (~línea 1562): cambiar el separador `border-bottom: 1px solid var(--border-neutral);` al mismo tinte azul que el borde del menú (`rgba(44, 125, 216, 0.25)`), para que quede coherente con el nuevo fondo.
4. `.resource-add__item:hover` (~línea 1566): cambiar `background: var(--bg-hover);` por `background: var(--accent-blue);` (mismo azul que `.resource-add__button`).
5. Añadir regla `.resource-add__item:hover .resource-add__item-label { color: var(--text-light); }` y `.resource-add__item:hover .resource-add__hint { color: var(--text-light); }` para que la etiqueta y el texto de ayuda sigan siendo legibles sobre el fondo azul oscuro del hover (en vez de sus colores actuales `var(--text-primary)`/`var(--text-muted)`, pensados para fondo claro).
6. No hace falta tocar `src/ui/resourceList.js`: la estructura y las clases ya existentes son suficientes, solo cambia el CSS.

## (d) Cambios en estilo

En `design/docs/stylebible/STYLE_BIBLE.md`:

- Sección 2 (Design tokens): añadir la línea del nuevo token `--accent-blue-light: #eaf3fc; /* fondo claro para paneles que quieren destacar como interactivos sin usar el azul sólido (cambio 00077) */` junto a `--accent-blue-dark`.
- Sección donde se documenta el patrón de `createAddMenu` (línea ~227, "Patrón para ofrecer varias variantes de una misma acción..."): actualizar la descripción de `.resource-add__menu` (ahora fondo `var(--accent-blue-light)` en vez de blanco, borde con tinte azul) y de `.resource-add__item` (hover ahora `var(--accent-blue)` con texto `var(--text-light)`, en vez de `var(--bg-hover)`), dejando constancia de que este menú concreto es una excepción al hover neutro estándar por ser el resaltado de una acción destacada (cambio 00077).
