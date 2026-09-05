# Datos — Espaciado, esquinas redondeadas, sombras y animación (tokens)

Definición funcional de las escalas de espaciado, esquinas redondeadas (`border-radius`), sombras (elevación) y tokens de animación.

## 3. Escala de espaciado (8 pasos, múltiplos de 4px)

| Token | Valor | px | Estado | Valor(es) actual(es) que mapea |
|---|---|---|---|---|
| `--space-1` | `0.25rem` | 4px | nuevo | `0.25rem` |
| `--space-2` | `0.5rem` | 8px | nuevo | `0.5rem` (gap ajustado entre elementos flex) |
| `--space-3` | `0.75rem` | 12px | nuevo | `0.75rem` |
| `--space-4` | `1rem` | 16px | nuevo | `1rem` (relleno estándar de contenedor; gap holgado) |
| `--space-5` | `1.25rem` | 20px | nuevo | `1.25rem` |
| `--space-6` | `1.5rem` | 24px | nuevo | `1.5rem` |
| `--space-8` | `2rem` | 32px | nuevo | Absorbe `1.75rem` (único uso, en la ventana de progreso) |
| `--space-12` | `3rem` | 48px | nuevo | — |

**Decisión:** `1.75rem` (28px, entre `--space-6` y `--space-8`, un solo uso) se consolida en `--space-8` (32px). Se revisa en la fase técnica.

## 4. Escala de esquinas redondeadas (6 pasos)

| Token | Valor | Estado | Uso funcional |
|---|---|---|---|
| `--radius-xs` | `2px` | nuevo | Detalles muy pequeños (hoy `2px` suelto en las marcas del control de rotación) |
| `--radius-sm` | `4px` | existe | Controles: botones (incl. pequeños), inputs, items pequeños de lista/galería |
| `--radius-md` | `6px` | nuevo | Paso intermedio para elementos medianos |
| `--radius-lg` | `8px` | existe | Contenedores destacados: modal, paneles flotantes, componente "Carta" |
| `--radius-xl` | `12px` | nuevo | Elementos grandes o destacados |
| `--radius-full` | `9999px` | nuevo | Píldora / círculo: sustituye `50%` en insignias y ruedas de carga, y el `9px` suelto de la insignia "tiene copias" |

**Decisión:** la insignia "tiene copias" usa hoy `9px` (mitad de su altura de 18px, para forma de píldora). Se cambia a `--radius-full`, que da el mismo efecto sin depender de que la altura sea exactamente 18px. Se revisa en la fase técnica.

## 5. Escala de sombras / elevación (5 niveles + sombras de estado)

### Niveles de elevación

| Token | Valor | Estado | Nivel / uso funcional |
|---|---|---|---|
| `--shadow-0` | `none` | nuevo | Plano — estado de arrastre activo sin sombra |
| `--shadow-1` | `0 2px 6px rgba(0,0,0,0.10), 0 1px 2px rgba(0,0,0,0.08)` | existe | Flotante sutil — paneles y piezas del tablero en reposo, cabecera, toast |
| `--shadow-2` | `0 4px 20px rgba(0,0,0,0.15)` | existe | Overlay — modales y tooltips (el nivel más alto actual) |
| `--shadow-3` | `0 8px 24px rgba(0,0,0,0.18)` | nuevo | Modal grande — editor visual, modales de selección complejos |
| `--shadow-lifted` | `6px 7px 9px 2px rgba(0,0,0,0.35)` | nuevo | Arrastre activo — sustituye el valor suelto del estado "levantado" (`.lifted`) |

### Sombras de estado

| Token | Valor | Estado | Uso funcional |
|---|---|---|---|
| `--shadow-focus` | `0 0 0 3px var(--accent-blue-alpha-15)` | nuevo | Anillo de foco en campos normales |
| `--shadow-focus-strong` | `0 0 0 3px var(--accent-blue-alpha-25)` | nuevo | Anillo de foco en elementos seleccionados |
| `--shadow-badge` | `0 2px 4px rgba(0,0,0,0.25)` | nuevo | Insignias flotantes (bloqueo, oculto, copias) |

**Decisión:** dos tokens de anillo de foco (normal y reforzado), porque reflejan una distinción real que ya existe hoy en la app (campos normales usan opacidad 0,15; elementos seleccionados usan 0,25).

## 6. Tokens de animación

Hoy solo existe `--transition-fast: 150ms ease`.

### Duraciones

| Token | Valor | Estado | Uso funcional |
|---|---|---|---|
| `--duration-instant` | `80ms` | nuevo | Cambios de estado sin necesidad de percibir la transición |
| `--duration-fast` | `150ms` | ya en `--transition-fast` | Hovers, checkboxes |
| `--duration-normal` | `250ms` | nuevo | Entrada / salida de elementos |
| `--duration-slow` | `400ms` | nuevo | Animaciones grandes (modales, paneles) |

### Curvas de aceleración (easing)

| Token | Valor | Estado | Uso funcional |
|---|---|---|---|
| `--ease-default` | `ease` | nuevo | Transición genérica |
| `--ease-out` | `cubic-bezier(0,0,0.2,1)` | nuevo | Elementos que entran o aparecen |
| `--ease-in` | `cubic-bezier(0.4,0,1,1)` | nuevo | Elementos que salen o desaparecen |
| `--ease-spring` | `cubic-bezier(0.34,1.56,0.64,1)` | nuevo | Microanimaciones con rebote sutil |

**Nota:** estos tokens se definen ahora como base; su uso intensivo llega con el Área 6 (microinteracciones). El token de 150ms puede quedar disponible por dos nombres durante la transición (`--transition-fast` existente y `--duration-fast`); la fase técnica decide si se unifican.
