# Área 4 — Componentes UI core

**Objetivo:** Definir un sistema homogéneo de componentes de interfaz (botones, inputs, toasts, menú contextual, modales) con variantes explícitas, estados visuales completos y comportamiento consistente en toda la app.

---

## Estado actual (resumen del análisis)

- **Botones:** 5 clases genéricas (`btn-accept`, `btn-cancel`, `btn-eliminar`, `btn-duplicate`, `btn-sacar`) más decenas de clases BEM de panel (cada panel tiene sus propias clases de botón de acción de fila). El sistema no está normalizado.
- **Inputs:** estilizados exclusivamente por selector de contexto (`.modal__field input[type="text"]`), sin clases propias. Los inputs fuera de `.modal__field` quedan sin estilo.
- **Toast:** un solo tipo sin animación, texto plano, aparece y desaparece instantáneamente.
- **Menú contextual:** funcional pero con selects nativos sin estilo, sin hover states diferenciados, sin iconos coherentes.
- **Modales:** estructura HTML bastante homogénea (overlay → caja → header/content/footer), pero variación visual en cabeceras de error/éxito limitada a un borde de color.

---

## 1. Sistema de botones

### 1.1 Variantes semánticas

Definir **5 variantes** basadas en el uso real identificado:

| Variante | Clase | Semántica | Uso actual |
|---|---|---|---|
| Primary | `.btn--primary` | Acción principal confirmativa | `btn-accept` — "Aceptar", "Exportar", "Sincronizar todo" |
| Secondary | `.btn--secondary` | Acción secundaria o neutra | `btn-cancel` cuando se usa para acciones secundarias (no cancelar), ej. "Editar", "Seleccionar imagen" |
| Ghost | `.btn--ghost` | Acción terciaria, no intrusiva | Botones de panel/cabecera, ej. "Ajustar zoom", "Configuración" |
| Danger | `.btn--danger` | Acción destructiva | `btn-eliminar` |
| Cancel | `.btn--cancel` | Cancelar o cerrar, siempre como escape | `btn-cancel` en footer de modal (cierra sin confirmar) |

**Nota sobre `btn-cancel` actual:** la misma clase se usa para semánticas muy distintas (cancelar un modal Y acciones secundarias como "Editar título"). En el nuevo sistema, "Cancelar" tiene su variante dedicada (`--cancel`) y las acciones secundarias pasan a `--secondary` o `--ghost`.

**Dudas:**
- ¿El botón "Cancelar" debe tener aspecto diferente del "Secondary"? Actualmente son idénticos. Podría diferenciarse solo por posición (siempre último en el footer) o tener un estilo ligeramente más atenuado.
- `btn-sacar` y `btn-duplicate` son acciones de dominio muy específicas — ¿deben tener su propio estilo o adoptar `--secondary`?

### 1.2 Estados de cada variante

Todos los botones deben definir los mismos 5 estados:

| Estado | Descripción |
|---|---|
| `default` | Reposo |
| `hover` | Cursor encima — ligero cambio de color/elevación |
| `active` | Click / keydown — feedback táctil (hundimiento de 1px) |
| `focus-visible` | Navegación por teclado — focus ring visible (nunca ocultar el focus) |
| `disabled` | No disponible — reducción de opacidad, cursor `not-allowed`, sin interacción |

### 1.3 Tamaños

Definir **2 tamaños** base:

| Tamaño | Clase | Altura | Padding horizontal | Font-size | Uso |
|---|---|---|---|---|---|
| Normal | (por defecto) | `32px` | `1rem` | `--text-sm` (0.875rem) | Footer de modal, acciones principales |
| Small | `.btn--sm` | `26px` | `0.625rem` | `--text-xs` (0.75rem) | Botones de acción de fila en tablas de paneles |

### 1.4 Botones icono-solo

Para botones que contienen solo un icono (sin texto), como "Ajustar zoom", "Configuración", "Limpiar filtro":

- Clase modificadora: `.btn--icon`
- Área mínima de toque: `32×32px`
- Sin padding horizontal asimétrico
- Deben tener siempre `aria-label` o `title`

### 1.5 Normalización de clases de acción de fila en paneles

Los paneles de Componentes, Recursos y Etiquetas tienen cada uno su propia clase de botón de fila (`component-list__action-btn`, `resource-list__action-btn`, `tag-list__action-btn`) con estilos casi idénticos. Unificar en:

- `.panel-action-btn` — botón de acción de fila genérico (equivale a `--ghost` + `--sm`)
- `.panel-action-btn--danger` — variante destructiva

---

## 2. Sistema de inputs

### 2.1 Problema actual

Los inputs están estilizados únicamente cuando están dentro de `.modal__field`. Si un input aparece en otro contexto, hereda solo el estilo de agente. Además, el estilo aplicado al checkbox es mínimo (`cursor: pointer`) y el del range es casi nativo.

### 2.2 Inputs de texto, número y select

Definir clases propias para que el estilo no dependa del padre:

| Elemento | Clase nueva | Hereda de |
|---|---|---|
| `input[type="text"]` | `.input` | — |
| `input[type="number"]` | `.input .input--number` | `.input` |
| `input[type="color"]` | `.input--color` | — (comportamiento especial) |
| `select` | `.select` | — |
| `textarea` | `.textarea` | — |

**Especificación común para `.input`, `.select`, `.textarea`:**
- Padding: `var(--space-2) var(--space-2)` (8px)
- Border: `1px solid var(--border-neutral)`
- Border-radius: `var(--radius-sm)` (4px)
- Font-size: `var(--text-sm)` (0.875rem)
- Color: `var(--text-primary)`
- Background: `var(--bg-surface)` (blanco)
- `width: 100%` cuando están en un campo de formulario
- Transición: `border-color var(--duration-fast)`, `box-shadow var(--duration-fast)`

**Estado focus:**
- Border: `var(--accent-blue)`
- Box-shadow: `var(--shadow-focus)` (focus ring azul)

**Estado disabled:**
- Background: `var(--bg-subtle)`
- Color: `var(--text-muted)`
- Cursor: `not-allowed`

**Dudas:**
- El `rotationSlider` ya tiene sus propias clases BEM y un estilo propio completo. ¿Lo dejamos como está o lo adaptamos al nuevo sistema de inputs?
- ¿El `input[type="number"]` debe ocultar los spinners nativos del navegador (las flechitas arriba/abajo)? Actualmente parece que no están ocultos.

### 2.3 Input de color

El `input[type="color"]` tiene comportamiento especial del navegador. Especificación:
- Alto: `40px` (igual que ahora)
- Ancho: `60px` (suficiente para el picker nativo)
- Borde, radio: igual que `.input`
- Cursor: `pointer`
- Sin padding (el relleno de color lo gestiona el navegador)

### 2.4 Checkboxes

Actualmente solo tienen `cursor: pointer`. Dos opciones:

**Opción A (conservadora):** Usar `accent-color: var(--accent-blue)` en CSS — el checkbox nativo adopta el color de acento con cero código. Resultado inmediato, pero aspecto aún nativo.

**Opción B (completa):** Checkbox personalizado con `appearance: none` + CSS puro, usando `::after` para el checkmark. Resultado visual perfectamente coherente con el sistema.

**Dudas:** ¿Opción A o B? La A es más rápida y segura; la B requiere más trabajo pero da un resultado más pulido.

### 2.5 Rangos (sliders)

Solo hay 2-3 sliders en la app (opacidad, rotación ya tiene su componente propio). Para los nativos:
- `accent-color: var(--accent-blue)` — misma opción rápida que los checkboxes
- Altura de la pista: `4px` (si es personalizable en el navegador)
- Thumb: `14px × 14px`, color `var(--accent-blue)`

---

## 3. Toast / notificaciones

### 3.1 Tipos de toast

Añadir **4 tipos** con variantes visuales distintas:

| Tipo | Clase | Semántica | Cuándo usar |
|---|---|---|---|
| Info | `.toast--info` | Información neutra | Acción completada sin implicación de éxito/error |
| Success | `.toast--success` | Operación exitosa | Exportación completada, importación exitosa, cambio guardado |
| Warning | `.toast--warning` | Aviso — no es un error pero requiere atención | Componentes ignorados en importación, recursos sin referencia |
| Error | `.toast--error` | Error — algo ha fallado | Fallo de importación, fichero inválido |

**Diferenciación visual de cada tipo:**

| Tipo | Borde izquierdo | Icono | Color texto |
|---|---|---|---|
| Info | `var(--accent-blue)` | `info` (Lucide) | `var(--text-light)` |
| Success | `var(--success)` | `check-circle` | `var(--text-light)` |
| Warning | `var(--warning)` | `alert-triangle` | oscuro sobre fondo claro |
| Error | `var(--error)` | `x-circle` | `var(--text-light)` |

**Dudas:**
- ¿El tipo por defecto (cuando no se especifica) es `info`?
- ¿El toast de warning debe tener fondo claro (para que el texto oscuro sea legible) o fondo oscuro como los demás? El warning suele tener fondo amarillo/ámbar, lo cual puede chocar con el estilo oscuro del resto.
- El sistema actual usa `showToast(message)` sin tipo — ¿cambiamos la API a `showToast(message, type)` o añadimos funciones separadas (`showToastSuccess()`, etc.)?

### 3.2 Comportamiento y posición

- **Posición:** centro inferior, `1.25rem` desde el borde (como ahora). Sin cambio.
- **Duración visible:** 3000ms para info/success, 5000ms para warning/error (dar más tiempo para leer mensajes de error).
- **Múltiples toasts:** si hay varios en cola, mostrarlos apilados verticalmente (el más reciente arriba). El sistema actual solo maneja uno.

**Dudas:**
- ¿Apilamiento de toasts o solo uno a la vez como ahora? El apilamiento es más profesional pero requiere más lógica de gestión.
- ¿Debe el usuario poder cerrar el toast manualmente (botón ×) o solo por timeout?

### 3.3 Animación

El toast actual aparece y desaparece instantáneamente. Con el nuevo sistema:
- **Entrada:** deslizamiento desde abajo + fade-in, `var(--duration-normal)` (250ms), `var(--ease-out)`
- **Salida:** fade-out, `var(--duration-fast)` (150ms), `var(--ease-in)`

*(La implementación CSS de estas animaciones es responsabilidad del Área 6.)*

---

## 4. Menú contextual

### 4.1 Estructura actual y mejoras

La estructura HTML del menú contextual es ya bastante buena. Las mejoras son principalmente visuales:

| Elemento | Estado actual | Mejora |
|---|---|---|
| Ítem en hover | Sin diferenciación o básica | Background `var(--bg-hover)` con transición suave |
| Ítem disabled | Opacidad reducida | Añadir `cursor: not-allowed` + tooltip si es útil |
| Separador | Línea horizontal neutra | Más espacio vertical (`margin: var(--space-1) 0`) |
| Sección descripción | Texto plano sin fondo | Fondo `var(--bg-subtle)`, texto `var(--text-muted)` |
| Sección "Interacciones" | Título + filas | Título en `var(--text-muted)` uppercase pequeño |
| Select inline | Native, sin estilo | Usar `.select` del nuevo sistema de inputs |
| Icono de ítem | Cualquier SVGElement | Usar `icon()` del sistema de iconos (Área 3) + tamaño fijo `16px` |

### 4.2 Dimensiones

- Ancho mínimo: `180px` — suficiente para las etiquetas más largas
- Ancho máximo: `260px`
- Padding vertical del menú: `var(--space-1)` (4px)
- Padding de cada ítem: `var(--space-2) var(--space-3)` (8px 12px)
- Gap entre icono y label: `var(--space-2)` (8px)
- Altura de ítem: `32px` mínimo

### 4.3 Animación de apertura

*(Implementación en Área 6)*
- El menú aparece con un pequeño scale desde el punto de apertura + fade-in
- Duración: `var(--duration-fast)` (150ms)

**Dudas:**
- ¿Los ítems de menú con select inline (`addSelectRow`) tienen el select fuera del área de click del ítem o dentro? ¿Qué ocurre con el hover en estos ítems?
- ¿El `columnHeaderMenu` (menú dropdown de cabeceras de tabla) comparte estilos con el menú contextual o tiene su propio sistema?

---

## 5. Sistema de modales

### 5.1 Estructura base (sin cambios funcionales)

La estructura HTML actual (`overlay → modal → header/content/footer`) ya es buena y no se cambia. Las mejoras son visuales:

| Zona | Estado actual | Mejora |
|---|---|---|
| Overlay | `rgba(0,0,0,0.5)` sólido | `var(--bg-overlay)` + `backdrop-filter: blur(4px)` sutil |
| Cabecera (`.modal__header`) | Fondo `var(--accent-blue-dark)`, texto blanco | Mantener + definir variantes completas |
| Separación header/content | Ninguna | Borde inferior sutil `1px solid rgba(255,255,255,0.1)` |
| Separación content/footer | Ninguna | Borde superior `1px solid var(--border-neutral)` |
| Footer (`.modal__footer`) | Fila de botones sin padding consistente | Padding `var(--space-4) var(--space-4)` (16px), gap `var(--space-2)` |
| Scroll en content | Funcional pero sin `scrollbar-width` | Añadir `scrollbar-width: thin` + `scrollbar-color` con tokens |

**Dudas:**
- ¿El `backdrop-filter: blur` en el overlay afecta al rendimiento de manera notable en el tablero con muchos componentes? Puede ser costoso con muchos elementos DOM.
- ¿El borde inferior en el header debe ser `rgba` sobre el azul oscuro o ningún borde y simplemente dejar la separación visual que ya da el contraste de color?

### 5.2 Variantes de cabecera

Ampliar las 3 variantes actuales (normal, error, success) con especificación completa:

| Variante | Clase | Background | Icono |
|---|---|---|---|
| Normal | `.modal__header` | `var(--accent-blue-dark)` | Ninguno (igual que ahora) |
| Error | `.modal__header--error` | `var(--error)` | `alert-circle` (Lucide) a la izquierda del título |
| Success | `.modal__header--success` | `var(--success)` | `check-circle` (Lucide) a la izquierda del título |
| Warning | `.modal__header--warning` | `var(--warning)` | `alert-triangle` (Lucide) |

**Nota:** el icono en la cabecera reemplaza los actuales `.modal__error-icon` y `.modal__success-icon` (círculos con icono definidos en CSS) que flotan fuera de la cabecera. Simplifica la estructura.

**Dudas:**
- Los `.modal__error-icon` y `.modal__success-icon` actuales son círculos que aparecen bajo el header (en el content), no en el header mismo. ¿Los movemos al header o los mantenemos en su posición actual y solo añadimos el icono al header?
- ¿Se añade la variante `--warning` que actualmente no existe?

### 5.3 Animación de apertura/cierre

*(Implementación en Área 6)*
- **Apertura:** fade-in del overlay + scale desde 95% a 100% de la caja modal
- **Cierre:** fade-out + scale a 98%
- Duración: `var(--duration-normal)` (250ms)

### 5.4 Scrollbar en modales

Los modales con contenido largo tienen scroll. Estilizar:

```css
.modal__content {
  scrollbar-width: thin;
  scrollbar-color: var(--border-neutral) transparent;
}
```

---

## 6. Campos de formulario (layout)

### 6.1 `.modal__field` — contenedor de campo

Sin cambios estructurales, solo normalizar:
- `margin-bottom: var(--space-4)` (16px) — consistente
- Label: `font-size: var(--text-xs)`, `color: var(--text-muted)`, `margin-bottom: var(--space-1)`
- Descripción auxiliar / hint: texto pequeño bajo el input en `var(--text-muted)`, `font-size: var(--text-2xs)`

### 6.2 Campos inline (dos columnas)

Algunos modales tienen campos en dos columnas (ancho/alto). Definir un modificador `.modal__field--inline` con `display: flex; gap: var(--space-2)` para estos casos.

### 6.3 Grupos de botones de selección exclusiva (`.align-group`)

Los grupos de botones de alineación y tipo de forma son controles de selección exclusiva (radio groups visuales). Estado activo actual: fondo diferenciado.

Mejoras:
- Estado `--active`: background `var(--accent-blue)`, icono en `var(--text-light)`
- Estado `hover` (no activo): background `var(--bg-hover)`
- Estado `focus-visible`: focus ring visible
- Border-radius del grupo: los extremos redondeados (`--radius-sm`), los intermedios sin radio

---

## Dudas abiertas para la fase técnica

1. **Migración de clases de botón:** La migración de `btn-accept` → `btn--primary` implica cambiar llamadas en ~20 archivos JS. ¿Lo hacemos con find-replace directo o gradualmente?
2. **Checkbox custom (Opción A vs B):** ¿`accent-color` (simple) o diseño propio (completo)?
3. **API del toast:** ¿`showToast(message, type)` o funciones separadas por tipo?
4. **Apilamiento de toasts:** ¿uno a la vez o cola apilada?
5. **Toast de warning:** ¿fondo oscuro o claro?
6. **`backdrop-filter` en overlay:** ¿rendimiento aceptable con el tablero de juego de fondo?
7. **Error/success icons:** ¿mover al header o mantener en el content?
8. **`rotationSlider`:** ¿integrar en el sistema de inputs o dejarlo como componente independiente?
9. **Número de variantes de modal:** ¿añadir `--warning` o solo error/success?
10. **`btn-sacar` y `btn-duplicate`:** ¿variante propia o adoptan `--secondary`?
