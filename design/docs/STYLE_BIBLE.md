# Errantes — Style Bible

Guía de estilo de la app en `/src`. Documenta las convenciones **ya existentes** en el código (`src/styles/main.css` + los módulos de `src/ui`, `src/modes`). Cualquier UI nueva debe seguir estas reglas para mantener consistencia visual y estructural.

Para la arquitectura técnica general (capas, modelo de datos, build), ver [ARCHITECTURE.md](ARCHITECTURE.md).

## 1. Stack de estilos

- CSS plano, un único fichero: [main.css](../../src/styles/main.css). No hay preprocesador ni CSS-in-JS.
- El DOM se construye con JS vanilla (`document.createElement`, `className`, `classList`), no hay framework de componentes. Los ficheros en `src/ui/*.js` son los "componentes".
- No añadir dependencias de UI (React, Tailwind, etc.) sin acordarlo antes: la app está pensada como vanilla JS + CSS plano.

## 2. Design tokens (`:root`)

Todos los colores viven como custom properties en `:root`. **Nunca hardcodear un color que ya tenga token** — reutilizar el existente o añadir uno nuevo al `:root` si hace falta un tono nuevo y reutilizable.

```css
--bg-table:     #808080;  /* fondo de la mesa infinita */
--bg-toolbar:   #333333;  /* header y toolbars */
--bg-card:      #f5f5f5;  /* paneles/tarjetas (listas, panel de edición) */
--accent-blue:  #2c7dd8;  /* color de acción primario (botones, foco, tabs activas) */
--text-primary: #1a1a1a;  /* texto sobre fondos claros */
--text-light:   #ffffff;  /* texto sobre fondos oscuros/de acento */
--text-muted:   #666666;  /* texto secundario */
```

Colores puntuales que aún no son tokens (usarlos igual, pero si se repiten, promoverlos a `:root`):
- Bordes neutros: `#ddd`, `#eee`, `#f0f0f0`, `#e0e0e0`, `#f9f9f9`
- Error: `#d32f2f`
- Overlays: `rgba(0,0,0,0.5)` (fondo de modal), `rgba(255,255,255,0.1)` (hover en toolbar oscura), `rgba(0,0,0,0.15)` (sombra de modal)

## 3. Tipografía

- Fuente global: `system-ui, sans-serif` (sin webfonts externas).
- Tamaños usados, de mayor a menor — reutilizar estos, no inventar tamaños intermedios:
  - `1.5rem` — título principal (`h1`)
  - `1.125rem` — títulos de panel (`.edit-mode-panel h2`)
  - `0.875rem` — texto de UI por defecto (botones, tabs, labels, inputs, items de lista)
  - `0.75rem` — texto auxiliar (botones pequeños, error de validación, footer de versión)
- `font-weight: 500` para labels de formulario; el resto usa el peso normal del navegador.

## 4. Espaciado

Escala basada en `rem`, en pasos de `0.25rem`: `0.25rem`, `0.5rem`, `0.75rem`, `1rem`, `1.5rem`. No usar píxeles para padding/margin salvo casos ya existentes (bordes `1px`/`2px`).

- Padding de contenedor estándar: `1rem`
- Padding de controles (botones, tabs): `0.5rem 1rem`
- Gap entre elementos en flex: `0.5rem` (ajustado) o `1rem` (holgado)

## 5. Bordes y esquinas

- Radio estándar de controles pequeños (botones, inputs, items): `4px`
- Radio de botones muy pequeños (dentro de items de lista): `3px`
- Radio de contenedores destacados (modal): `8px`
- Bordes: `1px solid` con un gris de la lista de la sección 2 (`#ddd`/`#eee`), o `1px solid var(--text-light)` sobre fondo oscuro (toolbar).

## 6. Sombra y elevación

- Solo el modal tiene sombra: `box-shadow: 0 4px 20px rgba(0,0,0,0.15)`. No añadir sombras a botones ni tarjetas — el resto de la UI es plana.

## 7. Nomenclatura de clases — BEM

El proyecto sigue **BEM** (`bloque__elemento--modificador`). Reglas concretas:

- Bloque en kebab-case: `.component-list`, `.modal`, `.infinite-table`, `.edit-mode-panel`.
- Elemento con doble guion bajo: `.component-list__item`, `.modal__header`, `.modal__tabs`, `.modal__field`, `.infinite-table__world`.
- Modificador con doble guion: `.text-box--selectable`.
- Estados transitorios (no BEM, clases simples añadidas/quitadas por JS): `.grabbing`, `.active` — se usan tal cual, sin prefijo del bloque, y siempre junto a `classList.add/remove`, nunca reemplazando `className` entero.
- Excepción histórica: `.btn-cancel` / `.btn-accept` no siguen BEM (no son `algo__algo`). Si se añaden más variantes de botón standalone, usar el mismo patrón `.btn-<intención>` en vez de mezclar con BEM de otro bloque.
- IDs (`#mode-switcher`, `#content`, `#app-version`, `#edit-toolbar`) se reservan para contenedores de layout únicos definidos en `index.html`, no para componentes reutilizables.

## 8. Patrones de componente (JS)

Cada "componente" es una función que crea y devuelve un `HTMLElement` vía `document.createElement`, asigna `className` una vez en la creación, y usa `classList.add/remove/toggle` solo para estados dinámicos posteriores. Ejemplo de la forma esperada (ver [componentModal.js](../../src/ui/componentModal.js)):

```js
const modal = document.createElement('div');
modal.className = 'modal';
```

- Un fichero por componente en `src/ui/`, nombrado en camelCase (`componentList.js`, `componentModal.js`, `table.js`).
- Los estados de UI (tab activa, arrastrando, seleccionable) se representan como clase, nunca como estilo inline.
- No usar `style.xxx =` desde JS para nada que pueda expresarse como clase/token CSS. Excepción legítima: transforms dinámicos calculados (p. ej. pan/zoom de `.infinite-table__world`), donde el valor es puramente numérico y no tiene sentido como clase.

## 9. Botones

Todos los botones comparten esta base (adaptar el fondo/borde según contexto):

```css
padding: 0.5rem 1rem;   /* o 0.25rem 0.5rem si es un botón pequeño dentro de un item */
border: none;           /* o 1px solid var(--text-light) sobre fondo oscuro */
border-radius: 4px;     /* 3px si es un botón pequeño */
cursor: pointer;
font-size: 0.875rem;    /* o 0.75rem si es pequeño */
```

- Acción primaria: fondo `var(--accent-blue)`, texto `var(--text-light)`, hover `opacity: 0.9`.
- Acción secundaria/cancelar: fondo `#f0f0f0`, texto `var(--text-primary)`, hover `#e0e0e0`.
- Botón sobre fondo oscuro (toolbar): transparente, borde `1px solid var(--text-light)`, hover `rgba(255,255,255,0.1)`.
- Deshabilitado: `opacity: 0.5; cursor: not-allowed`.
- No usar `:active` ni transiciones — el único feedback de interacción es el cambio de `opacity` u `background` en `:hover`.

## 10. Layout

- La app es una columna flex de altura completa (`html, body { height: 100% }`, `body { display:flex; flex-direction:column; height:100vh }`): header fijo (`h1`, `3.5rem`) + `#content` flexible (`flex: 1 1 auto; min-height: 0`).
- Paneles laterales de ancho fijo: `300px` (`.component-list`, `.edit-mode-panel`).
- Los overlays (modal, mode-switcher) usan `position: fixed` con `z-index` crecientes por capa:
  - `10` — footer de versión
  - `99` — toolbar de edición
  - `100` — header
  - `101` — mode switcher
  - `1000` — overlay de modal (siempre el nivel más alto)
- Al añadir un elemento fijo/absoluto nuevo, elegir su `z-index` respetando este orden (por debajo del modal, por encima del contenido normal).

## 11. Qué NO hacer

- No introducir un segundo sistema de tokens de color (Tailwind, otra paleta) — extender `:root` en `main.css`.
- No mezclar `style="color:#..."` inline para colores del catálogo de la sección 2.
- No crear clases de un solo uso sin seguir BEM salvo que encajen en la excepción `.btn-*` ya existente.
- No añadir sombras, bordes redondeados grandes, gradientes o animaciones — el lenguaje visual actual es plano y funcional (prototipo de mesa infinita para juego de tablero), y cualquier cambio de dirección estética debe decidirse explícitamente, no colarse componente a componente.
