- **Creation date**: 2026-09-02
- **Risk**: 1/10 — Minimal risk — local change, with a safety net (tests) or easily reversible

## (a) Functional notes

**Out of scope:** solo se toca la lista de tipos de la modal "Añadir componente" (`ui/componentTypeModal.js`). No se toca el panel flotante "Componentes" (componentes ya creados), ni menús contextuales, ni el renderizado en la mesa, ni ninguna otra parte de la app. No se añade librería de iconos ni assets en `src/img`.

**Doubts resolved with the user:** en el análisis funcional (pv-new) se confirmaron: formato SVG inline en el propio módulo; un icono por cada uno de los 7 tipos; posición entre el radio y el texto; color `var(--text-muted)` en reposo y `var(--accent-blue)` en hover / tipo seleccionado; clase BEM nueva `.component-type-modal__icon`. Sin dudas técnicas adicionales pendientes.

## (b) Technical solution

- [x] **`src/ui/componentTypeModal.js` — añadir el marcado SVG de cada tipo a `COMPONENT_TYPES`.** A cada objeto del array añadir una propiedad `icon` con el string del SVG inline (estilo del proyecto: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">…</svg>`, mismo patrón que `ui/editModeToggle.js` / `ui/componentList.js`). Un icono representativo por tipo:
  - `'texto'` (Cuadro de texto): líneas de texto horizontales, la última más corta.
  - `'tableroSimple'` (Tablero simple): `<rect>` con cuadrícula 3×3 (dos líneas verticales + dos horizontales interiores).
  - `'tableroPersonalizado'` (Tablero personalizado): cuadrícula parcial + trazo de lápiz superpuesto.
  - `'dado'` (Dado Configurable): `<rect rx="3">` con 5 puntos (`<circle fill="currentColor" stroke="none">`).
  - `'documento'` (Visor de documentos): hoja con esquina doblada y dos líneas de texto.
  - `'carta'` (Carta/Ficha): `<rect>` vertical con esquinas redondeadas y un par de líneas cortas.
  - `'mazo'` (Mazo): dos `<rect>` tipo carta apilados y desplazados.
- [x] **`src/ui/componentTypeModal.js` — insertar el icono en cada fila dentro del bucle de `openComponentTypeModal`.** En el `for (const { value, label } of COMPONENT_TYPES)` (desestructurar también `icon`), tras crear `radio` y antes de crear `text`, crear un `<span class="component-type-modal__icon">`, asignarle `icon.setAttribute('aria-hidden', 'true')` y `span.innerHTML = icon`. Orden de `appendChild` en `item`: `radio`, luego el `span` del icono, luego `text`. No cambia nada más del bucle ni de la lógica de selección/aceptar/cancelar.
- [x] **`src/styles/main.css` — añadir la regla `.component-type-modal__icon`.** Junto a las reglas existentes `.component-type-modal__list` / `.component-type-modal__item` / `.component-type-modal__item:hover` (~línea 1527):
  ```css
  .component-type-modal__icon {
    flex-shrink: 0;
    width: 22px;
    height: 22px;
    color: var(--text-muted);
    transition: color var(--transition-fast);
  }

  .component-type-modal__icon svg {
    display: block;
    width: 100%;
    height: 100%;
  }

  .component-type-modal__item:hover .component-type-modal__icon,
  .component-type-modal__item:has(input:checked) .component-type-modal__icon {
    color: var(--accent-blue);
  }
  ```
  Usar `:has(input:checked)` es coherente con el uso ya existente de `:has()` en `main.css` (regla `.document-viewer__content li:has(...)`). Confirmar el nombre exacto del token de transición en `main.css` (`--transition-fast`) antes de usarlo; si no existe con ese nombre, usar el que corresponda o `0.15s ease`.

## (d) Style changes

`design/docs/style/03-modales-menus.md` — añadir una subsección breve (numeración `12.x` siguiendo el orden del fichero) que documente el patrón "icono por tipo en la lista de la modal 'Añadir componente'":
- Cada fila (`.component-type-modal__item`) lleva un icono SVG inline (`.component-type-modal__icon`, `22×22`, `stroke="currentColor"`), decorativo (`aria-hidden`), entre el radio y la etiqueta.
- Color `var(--text-muted)` en reposo; `var(--accent-blue)` con `:hover` del item o con su radio marcado (`:has(input:checked)`) — coherente con el resaltado de borde ya existente del item.
- SVG hardcodeados en `ui/componentTypeModal.js` (propiedad `icon` de cada entrada de `COMPONENT_TYPES`), mismo patrón de iconografía lineal que el resto de la app (`ui/editModeToggle.js`, `ui/componentList.js`). No usa `.icon-frame` (esa clase no tiene regla base propia, su tamaño depende del contexto).

No aplica cambio en `design/docs/architecture/*` (`05-ui-layer.md`): `ui/componentTypeModal.js` ya está descrito como la lista de tipos disponibles; añadir un icono decorativo no cambia su responsabilidad ni su contrato.

## (e) Verification

- [x] En modo edición, pulsar "+ Añadir componente": la ventana "Añadir componente" muestra las 7 filas y cada una tiene un icono entre el selector redondo y el nombre del tipo.
- [x] Cada tipo muestra un icono distinto y reconociblemente relacionado con él (líneas de texto, cuadrícula, cuadrícula+lápiz, dado con puntos, hoja de documento, carta, cartas apiladas).
- [x] Con una fila seleccionada (su radio marcado), su icono se ve en azul de acento; las demás filas tienen el icono en gris.
- [x] Al pasar el cursor por encima de una fila no seleccionada, su icono pasa a azul de acento mientras el cursor está encima y vuelve a gris al salir.
- [x] Seleccionar un tipo y pulsar "Aceptar" crea el componente de ese tipo igual que antes (el icono no ha alterado el comportamiento); "Cancelar" y clic fuera del overlay siguen cerrando la ventana.
- [x] El build de un solo fichero (`src/scripts/build.py`) sigue generando el HTML sin errores y la modal se ve igual en el fichero empaquetado.
