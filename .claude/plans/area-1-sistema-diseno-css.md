# Área 1 — Sistema de diseño CSS

**Objetivo:** Establecer un sistema de tokens completo y coherente que sirva de base para todas las demás áreas de mejora. Todas las decisiones visuales de la app (colores, espacios, tipografía, sombras) deben derivarse de este sistema. Nada debe quedar hardcodeado.

---

## Estado actual (resumen del análisis)

- 21 variables CSS en `:root` — buen punto de partida pero incompletas.
- 11 valores de `font-size` distintos, todos literales (ej. `0.875rem`), sin tokens.
- Espaciado (`margin`/`padding`) completamente ad-hoc; los 15 valores más frecuentes no siguen ninguna escala.
- Solo 2 tokens de `border-radius` (`--radius-sm: 4px`, `--radius-lg: 8px`).
- Solo 2 tokens de sombra (`--shadow-1`, `--shadow-2`), pero ~13 sombras hardcodeadas adicionales.
- ~20 colores hardcodeados fuera de variables, principalmente derivados del azul de acento (`rgba(44,125,216,...)`) y blancos semi-transparentes.
- Sin tokens de animación más allá de `--transition-fast: 150ms ease`.
- Sin dark mode.
- Sin escala de grises completa.
- Sin colores semánticos para `warning` ni `info`.
- Un único archivo CSS monolítico de 3.589 líneas sin partición.

---

## 1. Paleta de color

### 1.1 Superficies

Mantener los tokens actuales y añadir:

| Token | Valor propuesto | Uso |
|---|---|---|
| `--bg-table` | `#c2c2c2` | ✓ ya existe — fondo del tablero infinito |
| `--bg-toolbar` | `#333333` | ✓ ya existe — barra de herramientas superior |
| `--bg-card` | `#f5f5f5` | ✓ ya existe — fondo de paneles flotantes |
| `--bg-subtle` | `#f0f0f0` | ✓ ya existe — fondos neutros en reposo |
| `--bg-hover` | `#e8e8e8` | ✓ ya existe — hover neutro genérico |
| `--bg-surface` | `#ffffff` | 🆕 reemplaza todos los `white`/`#fff` hardcodeados en modales y previews |
| `--bg-overlay` | `rgba(0,0,0,0.5)` | 🆕 reemplaza el `rgba(0,0,0,0.5)` hardcodeado en `.modal-overlay` |

### 1.2 Acento (azul)

| Token | Valor propuesto | Uso |
|---|---|---|
| `--accent-blue` | `#2c7dd8` | ✓ ya existe |
| `--accent-blue-dark` | `#123a66` | ✓ ya existe |
| `--accent-blue-light` | `#eaf3fc` | ✓ ya existe |
| `--accent-blue-alpha-15` | `rgba(44,125,216,0.15)` | 🆕 focus rings, filas seleccionadas |
| `--accent-blue-alpha-25` | `rgba(44,125,216,0.25)` | 🆕 bordes de menus flotantes |
| `--accent-blue-alpha-35` | `rgba(44,125,216,0.35)` | 🆕 hover elevado en controles |

### 1.3 Colores semánticos

Ampliar los dos existentes y añadir los que faltan:

| Token | Valor propuesto | Uso |
|---|---|---|
| `--error` | `#d32f2f` | ✓ ya existe |
| `--error-subtle` | `rgba(211,47,47,0.08)` | 🆕 fondo de zonas en error |
| `--error-alpha` | `rgba(211,47,47,0.35)` | 🆕 sombra del icono de error (actualmente hardcodeado) |
| `--success` | `#2e7d32` | ✓ ya existe |
| `--success-subtle` | `rgba(46,125,50,0.08)` | 🆕 fondo de zonas de éxito |
| `--success-alpha` | `rgba(46,125,50,0.4)` | 🆕 sombra del icono de éxito |
| `--warning` | `#e65100` | 🆕 naranja oscuro — para avisos no destructivos |
| `--warning-subtle` | `rgba(230,81,0,0.08)` | 🆕 fondo de avisos |
| `--info` | `#0277bd` | 🆕 azul informativo (distinto del acento) |
| `--info-subtle` | `rgba(2,119,189,0.08)` | 🆕 fondo de mensajes informativos |

### 1.4 Escala de grises

Escala de 9 pasos para sustituir los grises hardcodeados:

| Token | Valor | Uso actual / propuesto |
|---|---|---|
| `--gray-100` | `#f5f5f5` | = `--bg-card` (alias o mismo valor) |
| `--gray-200` | `#f0f0f0` | = `--bg-subtle` |
| `--gray-300` | `#e8e8e8` | = `--bg-hover` |
| `--gray-400` | `#dcdcdc` | = `--border-neutral` |
| `--gray-500` | `#cccccc` | 🆕 bordes secundarios (actualmente `#ccc` hardcodeado) |
| `--gray-600` | `#999999` | 🆕 iconos y puntos decorativos sin semántica (actualmente `#999` hardcodeado) |
| `--gray-700` | `#666666` | = `--text-muted` |
| `--gray-800` | `#3a3a3a` | 🆕 gradiente oscuro del `h1` (actualmente hardcodeado) |
| `--gray-900` | `#1a1a1a` | = `--text-primary` |

### 1.5 Colores de la barra de herramientas (toolbar)

Los blancos semi-transparentes sobre fondo oscuro merecen tokens propios:

| Token | Valor | Uso |
|---|---|---|
| `--toolbar-hover` | `rgba(255,255,255,0.1)` | 🆕 hover de botones en toolbar |
| `--toolbar-divider` | `rgba(255,255,255,0.2)` | 🆕 separadores visuales en toolbar |
| `--toolbar-muted` | `rgba(255,255,255,0.55)` | 🆕 texto/badges atenuados sobre toolbar |

---

## 2. Escala tipográfica

### 2.1 Tamaños

Definir 8 pasos que consoliden los 11 valores actuales:

| Token | Valor | px aprox. | Reemplaza |
|---|---|---|---|
| `--text-2xs` | `0.7rem` | 11.2px | `0.7rem`, `0.72rem` (labels de componente en tabla) |
| `--text-xs` | `0.75rem` | 12px | `0.75rem` (errores, hints, toasts, badges pequeños) |
| `--text-sm` | `0.875rem` | 14px | `0.875rem` (el más usado — controles, labels, texto general de UI) |
| `--text-base` | `1rem` | 16px | `1rem` (botones de cabecera de paneles) |
| `--text-md` | `1.125rem` | 18px | `1.125rem` (títulos de modales, preview de fuente de dado) |
| `--text-lg` | `1.5rem` | 24px | `1.5rem` (h1 — título de la aplicación) |
| `--text-xl` | `2rem` | 32px | (reservado para uso futuro) |
| `--text-display` | `4rem` | 64px | `4rem` (resultado del dado a pantalla completa) |

**Dudas / preguntas abiertas:**
- `0.8125rem` (13px) y `0.9375rem` (15px) son valores intermedios que encajan mal en la escala — ¿los consolidamos en `--text-xs` (12px) y `--text-sm` (14px) aceptando la diferencia visual, o añadimos un paso intermedio?
- `0.95rem` (solo en `.progress-modal__text`) — ¿lo absorbe `--text-sm` o `--text-base`?

### 2.2 Pesos

Actualmente no hay tokens de font-weight. Los valores usados son solo `normal` y `600`. Añadir:

| Token | Valor |
|---|---|
| `--font-normal` | `400` |
| `--font-medium` | `500` |
| `--font-semibold` | `600` |

### 2.3 Line-height

No hay tokens de line-height. Añadir tres niveles:

| Token | Valor | Uso |
|---|---|---|
| `--leading-tight` | `1.2` | Títulos y cabeceras |
| `--leading-normal` | `1.5` | Texto de UI general |
| `--leading-relaxed` | `1.65` | Contenido de lectura (documentos embebidos) |

---

## 3. Escala de espaciado

Sistema de 8 pasos basado en múltiplos de 4px. Cada token es `--space-N`:

| Token | Valor rem | px |
|---|---|---|
| `--space-1` | `0.25rem` | 4px |
| `--space-2` | `0.5rem` | 8px |
| `--space-3` | `0.75rem` | 12px |
| `--space-4` | `1rem` | 16px |
| `--space-5` | `1.25rem` | 20px |
| `--space-6` | `1.5rem` | 24px |
| `--space-8` | `2rem` | 32px |
| `--space-12` | `3rem` | 48px |

**Mapeo de los valores actuales más frecuentes:**
- `0.25rem` → `--space-1`
- `0.5rem` → `--space-2`
- `0.75rem` → `--space-3`
- `1rem` → `--space-4`
- `1.25rem` → `--space-5`
- `1.5rem` → `--space-6`
- `1.75rem` → entre `--space-6` y `--space-8` (solo 1 uso en `.progress-modal`) — ¿absorber en `--space-8`?

---

## 4. Escala de border-radius

Ampliar de 2 a 5 pasos:

| Token | Valor | Uso |
|---|---|---|
| `--radius-xs` | `2px` | Detalles muy pequeños (actualmente hardcodeado en `.rotation-slider__mark`) |
| `--radius-sm` | `4px` | ✓ ya existe — controles: botones, inputs, items |
| `--radius-md` | `6px` | 🆕 paso intermedio para elementos medianos |
| `--radius-lg` | `8px` | ✓ ya existe — contenedores: modal, paneles, carta |
| `--radius-xl` | `12px` | 🆕 elementos grandes o destacados |
| `--radius-full` | `9999px` | 🆕 reemplaza `50%` en insignias/badges y el `9px` hardcodeado en `.component-has-copies-badge` |

**Dudas:**
- El `9px` de `.component-has-copies-badge` es exactamente la mitad de su altura `18px` para crear una píldora. Con `--radius-full` (9999px) se logra el mismo efecto de forma más robusta. ¿Aceptamos este cambio?

---

## 5. Escala de sombras (elevación)

Ampliar de 2 a 5 niveles de elevación:

| Token | Valor | Nivel | Uso |
|---|---|---|---|
| `--shadow-0` | `none` | Plano | Estado de arrastre activo, sin sombra |
| `--shadow-1` | (actual) | Flotante sutil | ✓ ya existe — paneles y piezas en reposo |
| `--shadow-2` | (actual) | Overlay/modal | ✓ ya existe — modales y overlays |
| `--shadow-3` | `0 8px 24px rgba(0,0,0,0.18)` | Modal grande | Editor visual, modales de selección complejos |
| `--shadow-lifted` | `6px 7px 9px 2px rgba(0,0,0,0.35)` | Arrastre activo | Reemplaza el valor hardcodeado en `.lifted` |

**Sombras de estado que necesitan tokens:**

| Token | Valor | Uso |
|---|---|---|
| `--shadow-focus` | `0 0 0 3px var(--accent-blue-alpha-15)` | Focus ring en inputs |
| `--shadow-focus-strong` | `0 0 0 3px var(--accent-blue-alpha-25)` | Focus ring en elementos seleccionados |
| `--shadow-badge` | `0 2px 4px rgba(0,0,0,0.25)` | Insignias flotantes (lock, hidden, copies) |

---

## 6. Tokens de animación

Ampliar el único token actual:

| Token | Valor | Uso |
|---|---|---|
| `--duration-instant` | `80ms` | Cambios de estado sin necesidad de percibir la transición |
| `--duration-fast` | `150ms` | ✓ ya existe (en `--transition-fast`) — hovers, checkboxes |
| `--duration-normal` | `250ms` | Animaciones de entrada/salida de elementos |
| `--duration-slow` | `400ms` | Animaciones más grandes (modales, paneles) |
| `--ease-default` | `ease` | Transición genérica |
| `--ease-out` | `cubic-bezier(0,0,0.2,1)` | Elementos que entran o aparecen |
| `--ease-in` | `cubic-bezier(0.4,0,1,1)` | Elementos que salen o desaparecen |
| `--ease-spring` | `cubic-bezier(0.34,1.56,0.64,1)` | Microanimaciones con rebote sutil |

**Nota:** los tokens de duración y easing se usarán extensamente en el Área 6 (micro-interacciones).

---

## 7. Organización del CSS

### 7.1 Estructura propuesta del archivo (o partición)

El archivo monolítico de 3.589 líneas puede mantenerse como único archivo pero debe reorganizarse en secciones bien delimitadas mediante comentarios de bloque:

```
/* ═══════════════════════════════════════
   01 - TOKENS (variables en :root)
   ═══════════════════════════════════════ */

/* ═══════════════════════════════════════
   02 - RESET Y BASE
   ═══════════════════════════════════════ */

/* ═══════════════════════════════════════
   03 - LAYOUT GLOBAL (app, toolbar, table)
   ═══════════════════════════════════════ */

/* ═══════════════════════════════════════
   04 - COMPONENTES DE TABLERO (piezas del juego)
   ═══════════════════════════════════════ */

/* ═══════════════════════════════════════
   05 - PANELES FLOTANTES (component-list, resource-list, tag-list)
   ═══════════════════════════════════════ */

/* ═══════════════════════════════════════
   06 - SISTEMA DE MODALES
   ═══════════════════════════════════════ */

/* ═══════════════════════════════════════
   07 - MODALES ESPECÍFICAS (por orden alfabético)
   ═══════════════════════════════════════ */

/* ═══════════════════════════════════════
   08 - MENÚ CONTEXTUAL Y MENÚS DROPDOWN
   ═══════════════════════════════════════ */

/* ═══════════════════════════════════════
   09 - CONTROLES REUTILIZABLES (rotationSlider, resizeHandle, etc.)
   ═══════════════════════════════════════ */

/* ═══════════════════════════════════════
   10 - TOAST Y NOTIFICACIONES
   ═══════════════════════════════════════ */

/* ═══════════════════════════════════════
   11 - ANIMACIONES (@keyframes)
   ═══════════════════════════════════════ */
```

**Dudas:**
- ¿Preferimos mantener el archivo único o partir el CSS en múltiples archivos que el `build.py` concatena en orden? La partición facilitaría la navegación pero requiere un cambio en el build.
- Si se parte, ¿los estilos de cada modal van en su propio archivo `.css` junto al `.js`, o se mantiene un único `modales.css`?

### 7.2 Migración de valores hardcodeados

Todo color, tamaño o valor fuera del sistema de tokens debe migrarse. Listado de los hardcodeados identificados en el análisis y su nuevo token:

| Valor actual | → Token nuevo |
|---|---|
| `white`, `#fff`, `#ffffff` en modales/previews | `var(--bg-surface)` |
| `rgba(0,0,0,0.5)` en overlay | `var(--bg-overlay)` |
| `rgba(44,125,216,0.15)` en focus/selección | `var(--accent-blue-alpha-15)` |
| `rgba(44,125,216,0.25)` en bordes de menus | `var(--accent-blue-alpha-25)` |
| `rgba(44,125,216,0.35)` en hover elevado | `var(--accent-blue-alpha-35)` |
| `#999`, `#999999` en grips/badges | `var(--gray-600)` |
| `#ccc` en bordes checkerboard | `var(--gray-500)` |
| `#3a3a3a` en gradiente de h1 | `var(--gray-800)` |
| `rgba(255,255,255,0.1)` hover toolbar | `var(--toolbar-hover)` |
| `rgba(255,255,255,0.2)` divider toolbar | `var(--toolbar-divider)` |
| `rgba(255,255,255,0.55)` muted toolbar | `var(--toolbar-muted)` |
| `rgba(211,47,47,0.4)` sombra error icon | `var(--error-alpha)` |
| `rgba(46,125,50,0.4)` sombra success icon | `var(--success-alpha)` |
| `6px 7px 9px 2px rgba(0,0,0,0.35)` en `.lifted` | `var(--shadow-lifted)` |
| `0 2px 4px rgba(0,0,0,0.25)` en badges | `var(--shadow-badge)` |
| `9px` border-radius en copies-badge | `var(--radius-full)` |
| `2px` border-radius en rotation-mark | `var(--radius-xs)` |
| `50%` border-radius en spinners e insignias | `var(--radius-full)` |

---

## Dudas abiertas para la fase técnica

1. **Escala tipográfica:** Los valores `0.8125rem` (13px) y `0.9375rem` (15px) no encajan limpiamente en la escala propuesta. ¿Absorber en los pasos más cercanos o crear pasos intermedios? Si se absorben, hay un cambio visual menor pero la escala queda más limpia.

2. **Partición del CSS:** ¿Un archivo único reorganizado o múltiples archivos concatenados por el build? La partición implica modificar `build.py`.

3. **`--bg-card` vs `--gray-100`:** Tienen el mismo valor (`#f5f5f5`). ¿Los unificamos en un token o mantenemos ambos con semánticas distintas (uno para paneles, otro para la escala de grises)?

4. **`--border-neutral` vs `--gray-400`:** Mismo conflicto (ambos `#dcdcdc`). ¿Alias o unificación?

5. **`rgba(0,0,0,0.55)` vs `rgba(0,0,0,0.5)` en overlays:** Dos valores muy cercanos usados en contextos similares. ¿Unificar en `--bg-overlay`?

6. **Valores de `--shadow-focus`:** El focus ring usa `0 0 0 3px rgba(44,125,216,0.15)` en la mayoría de inputs pero `0 0 0 3px rgba(44,125,216,0.25)` en algunos elementos. ¿Un token o dos?

7. **`--accent-blue-alpha-*` vs tokens semánticos:** ¿Preferimos tokens de alpha genéricos o tokens por uso semántico (ej. `--focus-ring-color`, `--selected-row-bg`)? Los semánticos son más legibles pero multiplican los tokens; los de alpha son más flexibles pero menos autodocumentados.
