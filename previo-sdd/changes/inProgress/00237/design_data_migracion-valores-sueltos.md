# Datos — Mapeo de valores sueltos → token

Lista cerrada de los valores hardcodeados identificados en el análisis y el token al que se migran en este cambio. No es una auditoría exhaustiva de las ~3.702 líneas: es el conjunto ya localizado (revisado contra el código real en el re-análisis). Cada fila se verifica en la fase técnica (dónde aparece exactamente, cuántas veces, y si la sustitución es 1:1).

| Valor actual (suelto) | Contexto | Nº usos aprox. | → Token destino |
|---|---|---|---|
| `white` / `#fff` / `#ffffff` | Fondo de modales y previsualizaciones | ~9 | `var(--bg-surface)` |
| `rgba(0,0,0,0.5)` | Velo de fondo de modal (`.modal-overlay`) | 1 | `var(--bg-overlay)` |
| `rgba(44,125,216,0.15)` | Foco y filas seleccionadas | varios | `var(--accent-blue-alpha-15)` |
| `rgba(44,125,216,0.2)` | Anillo de foco de un elemento concreto (~L1903) | 1 | **pendiente**: `--accent-blue-alpha-15` / `-25` / token nuevo `-20` (decide `pv-how`) |
| `rgba(44,125,216,0.25)` | Bordes de menús flotantes | varios | `var(--accent-blue-alpha-25)` |
| `rgba(44,125,216,0.35)` | Hover elevado en controles y `box-shadow` del hover de botón primario (~L914) | 2 | `var(--accent-blue-alpha-35)` |
| `#999` / `#999999` | Grips e insignias (ambas notaciones) | ~4 | `var(--gray-600)` |
| `#ccc` | Borde de patrón de tablero de ajedrez (~L1763) | 1 | `var(--gray-500)` |
| `#3a3a3a` | Extremo oscuro del degradado de la cabecera (`h1`, ~L48) | 1 | `var(--gray-800)` |
| `rgba(255,255,255,0.1)` | Hover de botón en barra de herramientas | ~4 | `var(--toolbar-hover)` |
| `rgba(255,255,255,0.2)` | Separador en barra de herramientas | 1 | `var(--toolbar-divider)` |
| `rgba(255,255,255,0.55)` | Texto atenuado en barra de herramientas | 1 | `var(--toolbar-muted)` |
| `rgba(211,47,47,0.4)` | Sombra del icono de error (~L685) | 1 | `var(--error-alpha)` |
| `rgba(211,47,47,0.3)` | `box-shadow` del hover de botón destructivo (~L931) | 1 | `var(--error-alpha)` (unificado con la anterior en 0,35 — se verifica que no cambia perceptiblemente) |
| `rgba(46,125,50,0.4)` | Sombra del icono de éxito (~L705) | 1 | `var(--success-alpha)` |
| `6px 7px 9px 2px rgba(0,0,0,0.35)` | Sombra del estado "levantado" (`.lifted`, ~L3539) | 1 | `var(--shadow-lifted)` |
| `0 2px 4px rgba(0,0,0,0.25)` | Sombra de insignias | ~6 | `var(--shadow-badge)` |
| `9px` (`border-radius`) | Insignia "tiene copias" (~L3068) | 1 | `var(--radius-full)` |
| `2px` (`border-radius`) | Marca del control de rotación (~L1895) | 1 | `var(--radius-xs)` |
| `50%` (`border-radius`) | Ruedas de carga (spinners) e insignias circulares | ~9 | `var(--radius-full)` |

**Valores sueltos que la fase técnica debe examinar pero que NO están en esta lista cerrada** (aparecieron al revisar contra el código y no encajan 1:1 en ningún token propuesto): las sombras del azul de acento con forma distinta de `0 0 0 3px` (`0 2px 6px rgba(44,125,216,0.15)`, `0 2px 5px rgba(44,125,216,0.35)`) — `pv-how` decide si se les da token de sombra semántico o se dejan.

## Referencias en documentación de estilo que quedan desactualizadas

No son valores del CSS a migrar, sino menciones en la documentación que hay que actualizar en la fase de documentación (`pv-do`):

| Documento | Qué dice hoy | Qué pasa a ser |
|---|---|---|
| `design/docs/style/001-tokens-visual.md` | "no 'one-off' colors remain unpromoted"; solo lista `rgba(0,0,0,0.5)` y `rgba(255,255,255,0.1)` como sueltos | Se añaden todos los tokens nuevos; los sueltos listados pasan a token |
| `design/docs/style/001-tokens-visual.md` | "Two-radius scale" | Escala de 6 pasos |
| `design/docs/style/001-tokens-visual.md` | "A 3-level elevation system" | 5 niveles + sombras de estado |
| `design/docs/style/001-tokens-visual.md` | Tamaños "largest to smallest ... do not invent intermediate sizes" (5 tamaños) | Escala de 8 pasos con tokens `--text-*` |
| `design/docs/style/001-tokens-visual.md` | Lista de sueltos: solo `rgba(0,0,0,0.5)` y `rgba(255,255,255,0.1)` | Ambos pasan a token; la afirmación se rehace con la lista real |
| `design/docs/style/002-componentes-layout.md` | Hover de botón primario: `box-shadow: 0 3px 8px rgba(44,125,216,.35)` | Referencia a `var(--accent-blue-alpha-35)` |
| `design/docs/style/002-componentes-layout.md` | Hover de botón destructivo: `box-shadow: 0 3px 8px rgba(211,47,47,.3)` | Referencia a `var(--error-alpha)` |
| `design/docs/style/002-componentes-layout.md` | Botón sobre fondo oscuro / separador: `rgba(255,255,255,0.1)`, `rgba(255,255,255,0.2)` citados literales | Referencia a `var(--toolbar-hover)` / `var(--toolbar-divider)` |
