- **Creation date**: 2026-09-03
- **Risk**: 2/10 — Minimal risk — local change, with a safety net (tests) or easily reversible

## (a) Functional notes

**Out of scope:** No se modifica en absoluto el flujo de importación (parseo del fichero, modales de selección/confirmación/conversión/reporte, `mergeImportedGame`, carga de estado): se reutiliza tal cual. No se toca el botón "Importar" del modo edición ni su barra. No se añade reencuadre ("Ajustar zoom") automático tras importar. No se crea suite de tests (el proyecto no tiene una).

**Doubts resolved with the user:** Sin dudas técnicas abiertas. Las dudas funcionales ya se resolvieron y confirmaron en `pv-new` (ubicación del botón a la izquierda de "Entrar en modo edición", aspecto azul de esa zona, mismo flujo de importación, permanecer en modo juego al terminar, sin ajuste de zoom automático).

## (b) Technical solution

- [x] **`src/ui/editModeToggle.js` — extraer la creación del botón "Importar" + su input a una función reutilizable.** Hoy el `<input type="file" accept=".json" hidden>` y el `<button>` "Importar" se crean inline dentro de `renderEditToolbar()` (aprox. líneas 254-276). Extraer esa lógica a una función a nivel de módulo, p. ej. `function createImportControls()` que devuelva un fragmento/contenedor con el input oculto y el botón ya cableados: el `change` del input llama a `importComponentsFromFile(file)` y resetea `input.value`; el `click` del botón hace `importInput.click()`. Reutilizar `importComponentsFromFile` existente sin duplicarla ni modificarla. `renderEditToolbar()` pasa a usar esa función para poblar su `.toolbar-group` de persistencia, de modo que el modo edición queda visualmente idéntico (el markup del botón no cambia; hereda el estilo de `.edit-toolbar button` como ahora).
  - Nota: el botón de edición no lleva clase propia hoy; al extraer, mantener el botón sin clase para no alterar su estilo actual en `.edit-toolbar`. El SVG del icono es el de "flecha hacia arriba saliendo de bandeja" que ya usa hoy (mismo `viewBox`/paths).
- [x] **`src/ui/editModeToggle.js` — añadir el botón "Importar" en `renderModeSwitcher()`.** En `renderModeSwitcher(container)` (aprox. líneas 230-241), tras el early-return `if (getState().mode !== MODES.PLAY) return;`, insertar los controles de importación como **primer** contenido del contenedor, antes del botón "Entrar en modo edición", para que el orden visual sea "Importar · Entrar en modo edición". Usar la función `createImportControls()` del punto anterior. Añadir al botón (solo en este uso de modo juego) la clase `mode-switcher__import-btn` para poder aplicarle CSS de icono sin afectar al botón de edición: `createImportControls()` debe aceptar un parámetro opcional (p. ej. `{ buttonClassName }`) que, si se pasa, se añade al `className` del botón. El `.mode-switcher__fit-btn` se sigue añadiendo al final como ahora (`container.appendChild(createFitButton('mode-switcher__fit-btn'))`).
  - No llamar a `setMode` en ningún punto de este flujo: al importar desde modo juego, `loadComponents`/`loadResources`/`loadTags`/`loadGroups` emiten sus eventos, `main.js` re-renderiza `renderAll()` → `renderPlayMode()` y la app permanece en modo juego. Comportamiento deseado sin código extra.
- [x] **`src/styles/main.css` — regla para el botón "Importar" del modo juego con icono + texto.** El bloque `#mode-switcher button` (aprox. líneas 112-121) no tiene `display: inline-flex` ni regla para `.icon-frame`, a diferencia de `.edit-toolbar button`. Añadir, junto a las reglas de `#mode-switcher`:
  ```css
  #mode-switcher .mode-switcher__import-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
  }

  #mode-switcher .mode-switcher__import-btn .icon-frame {
    width: 16px;
    height: 16px;
    display: block;
  }
  ```
  El resto del aspecto (fondo `var(--accent-blue)`, color, padding, `border-radius`, `font-size`, `:hover { opacity: 0.9 }`) lo hereda de `#mode-switcher button` / `#mode-switcher button:hover` ya existentes. El `gap` de `#mode-switcher` (`0.5rem`) separa el botón "Importar" del de "Entrar en modo edición" sin cambios.

## (c) Architecture changes

`previo-sdd/design/docs/architecture/005-modes.md`:
- El primer bloque de viñetas describe `renderModeSwitcher` como "(play mode, "Entrar en modo edición" button)". Actualizar para reflejar que en modo juego `#mode-switcher` contiene ahora también el botón "Importar" (a la izquierda de "Entrar en modo edición"), además del `.mode-switcher__fit-btn`.
- La viñeta de `.edit-toolbar` ("group order left→right ... `Importar | Exportar | Salir del modo edición`") sigue vigente; añadir que "Importar" ya no es exclusivo de esa barra: el mismo control (misma función `importComponentsFromFile`) está disponible en la barra del modo juego.
- Añadir que importar desde el modo juego **no** cambia de modo (no se invoca `setMode`): al terminar se permanece en modo juego y `playMode` se repinta vía `components:changed`/`resources:changed`/`tags:changed`/`groups:changed`. Importar desde edición sigue dejando la app en edición.

`previo-sdd/design/docs/architecture/007-persistence-build.md`:
- En la sección "Export/Import with selection", el flujo **Import** se describe centrado en `ui/editModeToggle.js` / `.edit-toolbar`. Añadir una nota de que el punto de entrada "Importar" existe en dos sitios (barra de modo edición y `#mode-switcher` de modo juego), ambos invocando el mismo `importComponentsFromFile`; el modo activo tras importar es el que estuviera al lanzarlo (la importación no fuerza cambio de modo).

## (d) Style changes

`previo-sdd/design/docs/style/002-componentes-layout.md`:
- La sección "Buttons" describe el esquema de `#mode-switcher button` (fondo azul primario) y contrasta con los botones transparentes de `.edit-toolbar` ("Importar"/"Exportar"). Añadir que el botón "Importar" del modo juego (`#mode-switcher .mode-switcher__import-btn`) usa el esquema azul primario de esa zona (no el transparente que tiene en `.edit-toolbar`), y que lleva una regla propia de icono (`display: inline-flex; align-items: center; gap: 0.375rem` + `.icon-frame` a `16×16`), análoga a la de `.edit-toolbar button .icon-frame`, porque `#mode-switcher button` no la trae de serie.
- El "mismo control con dos aspectos según la barra que lo aloja" es un patrón nuevo a dejar anotado (el botón de edición mantiene el estilo transparente-con-borde de `.edit-toolbar`; el de modo juego, el azul de `#mode-switcher`).

## (e) Verification

- [x] Compilar (`python src/scripts/build.py`) y abrir el deliverable / `src/index.html` con Live Server. En **modo juego**, la esquina superior derecha muestra, de izquierda a derecha: botón "Importar" (azul, con icono de importar + texto), botón "Entrar en modo edición" (azul, solo texto) y el botón cuadrado "Ajustar zoom". El botón "Importar" tiene el mismo aspecto azul que "Entrar en modo edición", no el transparente-con-borde.
- [x] En modo juego, pulsar "Importar" abre el selector de fichero del sistema filtrado a `.json`. Cancelar el selector no cambia nada y se sigue en modo juego.
- [x] En modo juego, elegir un `.json` de juego válido (p. ej. `src/test/errantes-componentes.json`) muestra el modal de selección de elementos, luego el de confirmación (modo Añadir/Sobrescribir + ids duplicados), luego el indicador "Importando…" y, si procede, el modal de reporte. Al terminar, **la app sigue en modo juego** (se ve la barra del modo juego, no la `.edit-toolbar`) y el tablero refleja los componentes importados.
- [x] Importar en modo "Sobrescribir todo el juego" desde modo juego: al terminar, el tablero muestra el juego importado, sigue en modo juego, y si el fichero traía título se aplica en la cabecera.
- [x] Elegir un fichero no válido (p. ej. un `.json` que no sea un export de juego) muestra el aviso de error de siempre; al cerrarlo se sigue en modo juego sin cambios.
- [x] En **modo edición**, la `.edit-toolbar` sigue mostrando "Importar | Exportar | Salir del modo edición" con el botón "Importar" idéntico a antes (estilo transparente-con-borde), y su flujo de importación funciona como siempre; tras importar desde edición se permanece en modo edición.
- [x] Tras importar en modo juego, la vista **no** se reencuadra automáticamente (el zoom/scroll del tablero no cambia por la importación); el botón "Ajustar zoom" sigue disponible y funcional.
