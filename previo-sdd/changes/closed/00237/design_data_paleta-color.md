# Datos — Paleta de color (tokens)

Definición funcional de los tokens de color del sistema de diseño. No define cómo se almacenan ni se aplican (eso lo resuelve `pv-how`): es la lista de qué tokens existen, su valor y para qué sirven.

Convención de la columna **Estado**: `existe` = ya está en `:root` hoy, se mantiene sin cambios · `nuevo` = se añade en este cambio · `alias` = se añade como referencia (`var(--otro)`) a un token que ya existe, sin repetir el valor literal.

## 1.1 Superficies

| Token | Valor | Estado | Uso funcional |
|---|---|---|---|
| `--bg-table` | `#c2c2c2` | existe | Fondo del tablero infinito |
| `--bg-toolbar` | `#333333` | existe | Barra de herramientas superior / cabecera |
| `--bg-card` | `#f5f5f5` | existe | Fondo de paneles flotantes y tarjetas |
| `--bg-subtle` | `#f0f0f0` | existe | Fondos neutros en reposo (cabecera de tabla, botón secundario) |
| `--bg-hover` | `#e8e8e8` | existe | Cualquier hover neutro (fila, botón secundario, tab) |
| `--bg-surface` | `#ffffff` | nuevo | Superficie blanca de modales y previsualizaciones (sustituye ~9 usos sueltos de `white`/`#fff`/`#ffffff`) |
| `--bg-overlay` | `rgba(0,0,0,0.5)` | nuevo | Velo oscuro tras un modal (sustituye el único valor suelto de `.modal-overlay`, línea ~509) |

## 1.2 Acento (azul)

| Token | Valor | Estado | Uso funcional |
|---|---|---|---|
| `--accent-blue` | `#2c7dd8` | existe | Color de acción principal (botones, foco, tabs activas) |
| `--accent-blue-dark` | `#123a66` | existe | Fondo de la etiqueta identificadora de componente en modo edición |
| `--accent-blue-light` | `#eaf3fc` | existe | Fondo claro para paneles interactivos sin azul sólido |
| `--accent-blue-alpha-15` | `rgba(44,125,216,0.15)` | nuevo | Anillos de foco y filas seleccionadas |
| `--accent-blue-alpha-25` | `rgba(44,125,216,0.25)` | nuevo | Bordes de menús flotantes |
| `--accent-blue-alpha-35` | `rgba(44,125,216,0.35)` | nuevo | Hover elevado en controles (incl. `box-shadow: 0 3px 8px rgba(44,125,216,.35)` del hover de botón primario, hoy suelto y citado literalmente en `002-componentes-layout.md`) |

**Opacidad suelta pendiente de decidir (fase técnica):** el código real usa además `rgba(44,125,216,0.2)` en el anillo de foco de un elemento concreto (línea ~1903 de `main.css`). `pv-how` decide si se consolida en `--accent-blue-alpha-15` o `--accent-blue-alpha-25` (diferencia visual mínima) o si merece un cuarto token `--accent-blue-alpha-20`. También hay varias *formas* de sombra sobre este azul (`0 0 0 3px`, `0 2px 6px`, `0 2px 5px`, `0 3px 8px`) que la fase técnica valora si pasan a tokens de sombra semánticos.

## 1.3 Colores semánticos

| Token | Valor | Estado | Uso funcional |
|---|---|---|---|
| `--error` | `#d32f2f` | existe | Estados de error y acciones destructivas |
| `--error-subtle` | `rgba(211,47,47,0.08)` | nuevo | Fondo de zonas en error |
| `--error-alpha` | `rgba(211,47,47,0.35)` | nuevo | Sombra del icono de error y hover del botón destructivo. Sustituye dos valores sueltos cercanos: `rgba(211,47,47,0.4)` (sombra del icono, línea ~685) y `rgba(211,47,47,0.3)` (`box-shadow: 0 3px 8px rgba(211,47,47,.3)` del hover destructivo, línea ~931, citado literal en `002-componentes-layout.md`). La fase técnica confirma que unificar ambos en 0,35 no cambia perceptiblemente la sombra. |
| `--success` | `#2e7d32` | existe | Estados de éxito / confirmación positiva |
| `--success-subtle` | `rgba(46,125,50,0.08)` | nuevo | Fondo de zonas de éxito |
| `--success-alpha` | `rgba(46,125,50,0.4)` | nuevo | Sombra del icono de éxito (hoy suelta) |
| `--warning` | `#e65100` | nuevo | Naranja oscuro para avisos no destructivos |
| `--warning-subtle` | `rgba(230,81,0,0.08)` | nuevo | Fondo de avisos |
| `--info` | `#0277bd` | nuevo | Azul informativo, distinto del azul de acento (informativo ≠ interactivo) |
| `--info-subtle` | `rgba(2,119,189,0.08)` | nuevo | Fondo de mensajes informativos |

## 1.4 Escala de grises (9 pasos)

| Token | Valor | Estado | Uso funcional |
|---|---|---|---|
| `--gray-100` | `#f5f5f5` | alias de `--bg-card` | Paso más claro de la escala |
| `--gray-200` | `#f0f0f0` | alias de `--bg-subtle` | — |
| `--gray-300` | `#e8e8e8` | alias de `--bg-hover` | — |
| `--gray-400` | `#dcdcdc` | alias de `--border-neutral` | — |
| `--gray-500` | `#cccccc` | nuevo | Bordes secundarios (hoy `#ccc` suelto en bordes de tablero de ajedrez) |
| `--gray-600` | `#999999` | nuevo | Iconos y puntos decorativos sin semántica (hoy `#999` suelto en grips e insignias) |
| `--gray-700` | `#666666` | alias de `--text-muted` | — |
| `--gray-800` | `#3a3a3a` | nuevo | Extremo oscuro del degradado de la cabecera (hoy suelto) |
| `--gray-900` | `#1a1a1a` | alias de `--text-primary` | Paso más oscuro de la escala |

**Nota de decisión:** los seis pasos marcados `alias` se definen como `var(--token-existente)`, no repitiendo el valor. Motivo: un único valor de verdad, no se toca el estilo que ya usa el nombre semántico, y ambos nombres no pueden divergir en el futuro.

## 1.5 Colores de la barra de herramientas (sobre fondo oscuro)

| Token | Valor | Estado | Uso funcional |
|---|---|---|---|
| `--toolbar-hover` | `rgba(255,255,255,0.1)` | nuevo | Hover de botones en la barra de herramientas |
| `--toolbar-divider` | `rgba(255,255,255,0.2)` | nuevo | Separadores verticales en la barra de herramientas |
| `--toolbar-muted` | `rgba(255,255,255,0.55)` | nuevo | Texto e insignias atenuados sobre la barra oscura |

## Tokens de color existentes que NO cambian y NO entran en ninguna escala

| Token | Valor | Motivo |
|---|---|---|
| `--bg-table-dot` | `rgba(0,0,0,0.09)` | Punteado de fondo del tablero, valor muy específico |
| `--section-accent` | `#5b5f97` | Color exclusivo del título de sección de modal, excepción ya documentada de uso único |
