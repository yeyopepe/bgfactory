# Datos — Mapeo de valores sueltos → token

Lista cerrada de los valores hardcodeados identificados en el análisis y el token al que se migran en este cambio. No es una auditoría exhaustiva de las ~3.588 líneas: es el conjunto ya localizado. Cada fila se verifica en la fase técnica (dónde aparece exactamente, cuántas veces, y si la sustitución es 1:1).

| Valor actual (suelto) | Contexto | → Token destino |
|---|---|---|
| `white` / `#fff` / `#ffffff` | Modales y previsualizaciones | `var(--bg-surface)` |
| `rgba(0,0,0,0.5)` | Velo de fondo de modal (`.modal-overlay`) | `var(--bg-overlay)` |
| `rgba(44,125,216,0.15)` | Foco y filas seleccionadas | `var(--accent-blue-alpha-15)` |
| `rgba(44,125,216,0.25)` | Bordes de menús flotantes | `var(--accent-blue-alpha-25)` |
| `rgba(44,125,216,0.35)` | Hover elevado en controles | `var(--accent-blue-alpha-35)` |
| `#999` / `#999999` | Grips e insignias | `var(--gray-600)` |
| `#ccc` | Bordes de patrón de tablero de ajedrez | `var(--gray-500)` |
| `#3a3a3a` | Extremo oscuro del degradado de la cabecera (`h1`) | `var(--gray-800)` |
| `rgba(255,255,255,0.1)` | Hover de botón en barra de herramientas | `var(--toolbar-hover)` |
| `rgba(255,255,255,0.2)` | Separador en barra de herramientas | `var(--toolbar-divider)` |
| `rgba(255,255,255,0.55)` | Texto atenuado en barra de herramientas | `var(--toolbar-muted)` |
| `rgba(211,47,47,0.4)` | Sombra del icono de error | `var(--error-alpha)` |
| `rgba(46,125,50,0.4)` | Sombra del icono de éxito | `var(--success-alpha)` |
| `6px 7px 9px 2px rgba(0,0,0,0.35)` | Sombra del estado "levantado" (`.lifted`) | `var(--shadow-lifted)` |
| `0 2px 4px rgba(0,0,0,0.25)` | Sombra de insignias | `var(--shadow-badge)` |
| `9px` (`border-radius`) | Insignia "tiene copias" | `var(--radius-full)` |
| `2px` (`border-radius`) | Marca del control de rotación | `var(--radius-xs)` |
| `50%` (`border-radius`) | Ruedas de carga (spinners) e insignias circulares | `var(--radius-full)` |

## Referencias en documentación de estilo que quedan desactualizadas

No son valores del CSS a migrar, sino menciones en la documentación que hay que actualizar en la fase de documentación (`pv-do`):

| Documento | Qué dice hoy | Qué pasa a ser |
|---|---|---|
| `design/docs/style/001-tokens-visual.md` | "no 'one-off' colors remain unpromoted"; solo lista `rgba(0,0,0,0.5)` y `rgba(255,255,255,0.1)` como sueltos | Se añaden todos los tokens nuevos; los sueltos listados pasan a token |
| `design/docs/style/001-tokens-visual.md` | "Two-radius scale" | Escala de 6 pasos |
| `design/docs/style/001-tokens-visual.md` | "A 3-level elevation system" | 5 niveles + sombras de estado |
| `design/docs/style/001-tokens-visual.md` | Tamaños "largest to smallest ... do not invent intermediate sizes" (5 tamaños) | Escala de 8 pasos con tokens `--text-*` |
| `design/docs/style/002-componentes-layout.md` | Hover de botón primario: `box-shadow: 0 3px 8px rgba(44,125,216,.35)` | Referencia al token de acento translúcido correspondiente |
| `design/docs/style/002-componentes-layout.md` | Hover de botón destructivo: `box-shadow: 0 3px 8px rgba(211,47,47,.3)` | Referencia al token de error correspondiente |
