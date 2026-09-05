# Área 6 — Micro-interacciones y polish

**Objetivo:** Definir qué elementos de la UI se animan, cuándo, en qué dirección y con qué duración, para dar a la app sensación de respuesta y calidad sin sacrificar la fluidez del flujo de trabajo. El criterio rector es: **la animación refuerza la comprensión, no la decora**.

---

## Estado actual (resumen del análisis)

- Solo 1 `@keyframes` en todo el CSS (`progress-modal-spin` — el spinner).
- Un único token de animación: `--transition-fast: 150ms ease`.
- Toast: sin animación — aparece y desaparece de forma instantánea.
- Modales: sin animación de apertura/cierre.
- Paneles flotantes: sin animación al plegar/desplegar.
- Hover states: mayoría son solo cambios de `background-color` sin transición.
- No hay `focus-visible` definido explícitamente.
- `.lifted` (estado de arrastre) existe pero sin transición de entrada.
- El flip de carta tiene animación CSS (es una feature existente, no a implementar aquí).

---

## 1. Tokens de animación (base del Área 1)

Este plan usa los tokens definidos en el Área 1. Referencia:

| Token | Valor | Uso en este plan |
|---|---|---|
| `--duration-instant` | `80ms` | Cambios de estado sin percepción de movimiento |
| `--duration-fast` | `150ms` | Hovers, foco, checkboxes, cambios de icono |
| `--duration-normal` | `250ms` | Entradas/salidas de elementos de la UI |
| `--duration-slow` | `400ms` | Animaciones grandes (modal, panel) |
| `--ease-default` | `ease` | Transición genérica |
| `--ease-out` | `cubic-bezier(0,0,0.2,1)` | Elementos que entran o aparecen |
| `--ease-in` | `cubic-bezier(0.4,0,1,1)` | Elementos que salen o desaparecen |
| `--ease-spring` | `cubic-bezier(0.34,1.56,0.64,1)` | Microanimaciones con rebote sutil |

**Regla de accesibilidad:** Todos los `@keyframes` y transiciones deben respetar `prefers-reduced-motion`:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

Esta regla única en la sección de animaciones del CSS es suficiente — no hace falta anotarla en cada elemento individual.

---

## 2. Hover states

### 2.1 Problema actual

Muchos hovers no tienen `transition`, por lo que el cambio de color es instantáneo. Esto no es un bug, pero da una sensación más brusca.

### 2.2 Regla global de transición

Añadir una regla base para todos los elementos interactivos:

```css
button, a, [role="button"], input, select, textarea {
  transition: background-color var(--duration-fast) var(--ease-default),
              border-color var(--duration-fast) var(--ease-default),
              box-shadow var(--duration-fast) var(--ease-default),
              color var(--duration-fast) var(--ease-default),
              opacity var(--duration-fast) var(--ease-default);
}
```

**Dudas:**
- ¿Esta regla global puede tener efectos secundarios no deseados en elementos que ahora tienen cambios de estado programáticos rápidos (ej. el modo juego activa/desactiva muchos elementos)? Probablemente no, pero hay que verificarlo.

### 2.3 Botones — hover y active

| Estado | Efecto visual |
|---|---|
| `hover` en `--primary` | Oscurecer ligeramente (`--accent-blue-dark`) + sombra sutil |
| `hover` en `--secondary` | Background `var(--bg-hover)` |
| `hover` en `--ghost` | Background `var(--toolbar-hover)` (si sobre toolbar) o `var(--bg-hover)` |
| `hover` en `--danger` | Oscurecer el rojo ligeramente |
| `active` (keydown) | `transform: translateY(1px)` — hundimiento sutil |
| `active` desaparece | `transform: translateY(0)` con `var(--duration-instant)` |

El hundimiento en `active` (1px hacia abajo) da feedback táctil percibido sin ser exagerado.

### 2.4 Items de menú y filas de tabla

| Elemento | Hover |
|---|---|
| Ítem de menú contextual | Background `var(--bg-hover)`, transición `var(--duration-fast)` |
| Ítem de menú contextual `--danger` | Background `var(--error-subtle)`, color del texto `var(--error)` |
| Fila de tabla de panel | Background `var(--bg-hover)`, transición `var(--duration-fast)` |
| Item de lista (componentTypeModal) | Border en `var(--accent-blue)` + background `var(--accent-blue-light)` |

---

## 3. Focus visible (accesibilidad de teclado)

### 3.1 Problema actual

No hay estilos explícitos para `focus-visible`. Los navegadores aplican su propio focus ring por defecto, que puede ser inconsistente entre navegadores o estar oculto con `outline: none`.

### 3.2 Definición del focus ring

Regla global:

```css
:focus-visible {
  outline: none;
  box-shadow: var(--shadow-focus);
}
```

Donde `--shadow-focus: 0 0 0 3px var(--accent-blue-alpha-15)` (ya definido en Área 1).

Para botones en toolbar (fondo oscuro), el focus ring debe ser visible:

```css
.mode-switcher :focus-visible,
#edit-toolbar :focus-visible {
  box-shadow: 0 0 0 2px var(--accent-blue-light);
}
```

**Dudas:**
- ¿El tablero de juego responde al teclado de alguna manera (flechas para mover piezas, etc.)? Si es así, la gestión de focus en el tablero puede ser más compleja.
- ¿Hay elementos con `tabindex` explícito que no son botones ni inputs (ej. piezas del tablero)?

---

## 4. Animación de apertura/cierre de modales

### 4.1 Especificación

**Apertura:**
1. El overlay (`modal-overlay`) hace fade-in: `opacity 0 → 1`, `var(--duration-normal)`, `var(--ease-out)`.
2. La caja modal (`modal`) hace scale-up: `transform: scale(0.95) → scale(1)`, sincronizado con el fade-in del overlay.

**Cierre:**
1. El overlay hace fade-out: `opacity 1 → 0`, `var(--duration-fast)`, `var(--ease-in)`.
2. La caja modal hace scale-down leve: `transform: scale(1) → scale(0.98)`, sincronizado.
3. El modal se elimina del DOM solo cuando la animación de cierre termina (actualmente se elimina inmediatamente).

**Valores concretos:**

```css
.modal-overlay {
  animation: modal-overlay-in var(--duration-normal) var(--ease-out);
}

.modal {
  animation: modal-in var(--duration-normal) var(--ease-out);
}

@keyframes modal-overlay-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}

@keyframes modal-in {
  from { opacity: 0; transform: scale(0.95); }
  to   { opacity: 1; transform: scale(1); }
}
```

Para el cierre, el modal añade una clase `.modal-overlay--closing` antes de eliminar del DOM, que aplica la animación inversa.

### 4.2 Modales de tipo "grande" (editor visual)

El editor visual (`card-editor-modal`) ya ocupa casi toda la pantalla — el scale podría no tener sentido. Para estos, usar solo fade:

```css
.card-editor-modal {
  animation: modal-fade-in var(--duration-normal) var(--ease-out);
}
```

**Dudas:**
- ¿El mecanismo actual de apertura/cierre de modales permite añadir la animación de cierre sin refactorizar el JS? Actualmente el modal se elimina del DOM directamente al hacer click en "Cancelar" o "Aceptar". Habría que añadir un delay en la eliminación equivalente a la duración de la animación de salida, o escuchar el evento `animationend`.
- ¿Hay modales que se abren unos sobre otros (ej. el editor visual abre sub-modales de forma, texto, color)? Si es así, ¿ambos deben animarse o solo el primero?

---

## 5. Toast — animación de entrada y salida

### 5.1 Especificación

**Entrada:**

```css
@keyframes toast-in {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}
```

- Duración: `var(--duration-normal)` (250ms)
- Easing: `var(--ease-out)`
- El toast sube desde 12px por debajo de su posición final

**Salida:**

```css
@keyframes toast-out {
  from {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
  to {
    opacity: 0;
    transform: translateX(-50%) translateY(-8px);
  }
}
```

- Duración: `var(--duration-fast)` (150ms)
- Easing: `var(--ease-in)`
- El toast sube ligeramente al salir (se va hacia arriba)

**Dudas:**
- ¿Dirección de salida: hacia arriba (se va volando) o hacia abajo (se hunde)? Arriba parece más natural para un mensaje que "se fue".
- Si hay apilamiento de toasts (ver Área 4), cada toast tiene su propia animación de entrada. ¿Los toasts existentes se desplazan hacia arriba cuando aparece uno nuevo?

---

## 6. Paneles flotantes — plegar/desplegar

### 6.1 Estado actual

Los paneles de Componentes, Recursos y Etiquetas son plegables. El cambio entre desplegado y plegado es instantáneo (cambio de `display` o `height`).

### 6.2 Especificación

Usar la técnica `grid-template-rows: 0fr → 1fr` para animar height de forma performativa:

```css
.panel__body-wrapper {
  display: grid;
  grid-template-rows: 1fr;        /* desplegado */
  transition: grid-template-rows var(--duration-slow) var(--ease-out);
  overflow: hidden;
}

.panel__body-wrapper--collapsed {
  grid-template-rows: 0fr;        /* plegado */
}

.panel__body {
  min-height: 0;                  /* necesario para que 0fr funcione */
  overflow: hidden;
}
```

- Duración: `var(--duration-slow)` (400ms) — el panel es un elemento grande
- Easing: `var(--ease-out)` para desplegar, `var(--ease-in)` para plegar

**Nota:** Esta técnica no requiere JavaScript para calcular alturas — es CSS puro. Necesita que el HTML de los paneles tenga un wrapper intermedio.

**Dudas:**
- ¿La estructura HTML actual de los paneles tiene un elemento wrapper entre el header del panel y el body? Si no, habría que añadirlo.
- ¿Los paneles también tienen animación al redimensionarse con el `resizeHandle`? Redimensionar con drag no debería tener transición (interferiría con el arrastre).

---

## 7. Estado de arrastre (`.lifted`)

### 7.1 Estado actual

La clase `.lifted` se aplica al componente mientras se arrastra. Ya tiene:
- `box-shadow: 6px 7px 9px 2px rgba(0,0,0,0.35)` (hardcodeado — migrar a `var(--shadow-lifted)`)
- `opacity: 0.85`
- `cursor: grabbing`
- `z-index` elevado

### 7.2 Mejoras

**Transición de entrada en `.lifted`:**

```css
.component {
  transition: box-shadow var(--duration-fast) var(--ease-out),
              opacity var(--duration-fast) var(--ease-out),
              transform var(--duration-fast) var(--ease-spring);
}

.component.lifted {
  transform: scale(1.02);     /* muy sutil — 2% más grande */
  /* box-shadow y opacity ya están definidos */
}
```

El `scale(1.02)` da sensación de que el componente "se levanta" del tablero al agarrarlo. El easing `spring` añade un pequeño rebote al soltar.

**Transición de salida al soltar (quitar `.lifted`):**
- `transform: scale(1)` con `var(--ease-spring)` — el componente "aterriza" con un pequeño rebote

**Dudas:**
- ¿El `scale(1.02)` puede causar problemas de alineación visual mientras se arrastra (el cursor ya no está en el centro visual del componente)?
- ¿Los grupos de componentes también usan `.lifted`? Si es así, el scale puede ser demasiado pronunciado en grupos grandes.

---

## 8. Menú contextual — animación de apertura

### 8.1 Especificación

El menú contextual aparece en la posición del cursor. Animación de entrada:

```css
@keyframes context-menu-in {
  from {
    opacity: 0;
    transform: scale(0.92) translateY(-4px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.context-menu {
  animation: context-menu-in var(--duration-fast) var(--ease-out);
  transform-origin: top left;    /* o top center, según la dirección de apertura */
}
```

- Duración: `var(--duration-fast)` (150ms) — los menús deben sentirse instantáneos
- Sin animación de cierre — el menú desaparece de forma inmediata (más rápido que aparece)

**Dudas:**
- ¿El `transform-origin` debe depender de si el menú se posiciona hacia arriba o hacia abajo? Cuando el menú se recalcula para no salirse de pantalla, puede abrirse hacia arriba — en ese caso el `transform-origin` debería ser `bottom left`.

---

## 9. Indicador de columna filtrable/ordenada

### 9.1 Estado actual

El icono de embudo (`.column-header-menu__indicator`) en las cabeceras de tabla cambia de estado cuando hay filtro activo o hay un orden aplicado. El cambio es instantáneo.

### 9.2 Mejora

```css
.column-header-menu__indicator {
  transition: opacity var(--duration-fast), color var(--duration-fast);
  opacity: 0.3;
}

.column-header-menu__indicator--active {
  opacity: 1;
  color: var(--accent-blue);
}
```

Efecto: el icono de embudo está siempre visible pero tenue; cuando hay filtro/orden activo, se ilumina en azul. La transición suave hace que el cambio de estado sea fácil de percibir.

---

## 10. Transición en grupos de botones de selección (`.align-group`)

Los botones de alineación/estilo/forma cambian de estado activo al hacer click. Actualmente el cambio es instantáneo.

```css
.align-group__btn {
  transition: background-color var(--duration-fast),
              color var(--duration-fast),
              box-shadow var(--duration-fast);
}
```

---

## 11. Animación del lápiz de edición del título (`appTitle`)

### 11.1 Estado actual

El lápiz aparece en hover sobre el título de la app. Aparición instantánea.

### 11.2 Mejora

```css
.app-title__pencil {
  opacity: 0;
  transition: opacity var(--duration-fast);
}

.app-title:hover .app-title__pencil {
  opacity: 1;
}
```

Sencillo pero da más pulido al detalle.

---

## 12. Scrollbar estilizada en modales

Las scrollbars nativas del sistema son visualmente inconsistentes entre plataformas. Para los navegadores que lo soportan (Chrome, Edge):

```css
.modal__content {
  scrollbar-width: thin;                                      /* Firefox */
  scrollbar-color: var(--border-neutral) transparent;         /* Firefox */
}

.modal__content::-webkit-scrollbar {
  width: 6px;
}

.modal__content::-webkit-scrollbar-track {
  background: transparent;
}

.modal__content::-webkit-scrollbar-thumb {
  background: var(--border-neutral);
  border-radius: var(--radius-full);
}

.modal__content::-webkit-scrollbar-thumb:hover {
  background: var(--gray-600);
}
```

---

## 13. Animación del spinner (mejora del existente)

### 13.1 Estado actual

El único `@keyframes` existente es `progress-modal-spin`. Ya funciona bien.

### 13.2 Mejora opcional

Añadir un segundo `@keyframes` para el caso de que la operación progrese de forma visible — actualmente el spinner es un indicador de "espera indeterminada". Si en el futuro se añade un indicador de progreso real (barra), aquí sería donde añadir la animación de la barra.

*No hay cambio urgente en esta versión.*

---

## Dudas abiertas para la fase técnica

1. **Animación de cierre de modal:** ¿el mecanismo JS actual permite añadir un delay entre "click en cancel/accept" y "eliminación del DOM"? ¿O hay que refactorizar el sistema de modales?
2. **Paneles flotantes:** ¿tienen el wrapper HTML necesario para la técnica `grid-template-rows`?
3. **Arrastre con scale:** ¿el `scale(1.02)` afecta a la lógica de posicionamiento del arrastre?
4. **Transform-origin del menú contextual:** ¿cómo detectar si el menú se abrió hacia arriba o hacia abajo para ajustar el `transform-origin`?
5. **Grupos grandes en `.lifted`:** ¿el scale aplica bien a grupos de múltiples componentes?
6. **`prefers-reduced-motion`:** ¿hay usuarios o casos de uso en los que la app se use en contextos donde este setting esté activo?
7. **Impacto de las transiciones globales en el rendimiento del tablero:** El tablero puede tener docenas de componentes renderizados simultáneamente. Añadir `transition` a los elementos del tablero puede impactar el rendimiento en drag/zoom — hay que asegurarse de que la regla de transición global no se aplica a `.component` en modo arrastre.
8. **Animación del columnHeaderMenu:** ¿tiene alguna animación especial al desplegarse o usa la misma que el menú contextual?
