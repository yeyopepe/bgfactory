- **Creation date**: 2026-09-06

## (a) Functional notes

**Out of scope:** no se toca ningún fichero de la aplicación (`src/core/*`, `src/ui/*`, `src/modes/*`, `src/main.js`, `src/index.html`) ni la ficha funcional `030` de `design/docs/features/`. No se añaden fixtures (todos los casos parten de estado vacío). No se prueba la funcionalidad `031` ("Guardar a fichero"), ni la traducción del título a varios idiomas, ni ningún aspecto visual (colores, medidas): el marco de pruebas no valida estilo. No se duplican en la batería nueva los casos de guardado/exportación del título que ya viven en `autosave.test.js` (FT-029-07) y `export-import.test.js` (FT-032-02); esos ficheros solo se marcan como cobertura secundaria.

**Doubts resolved with the user:** ninguna pregunta abierta. La documentación técnica (`011-functional-test-framework.md`) y el código real resolvieron todo el contrato del marco y el mecanismo de la funcionalidad 030. Puntos confirmados contra código durante el análisis, sin necesidad de consultar:
- `renderHoverable` recibe `getFullAppTitle(appTitle)` (el texto con versión), mientras que `renderEditing` recibe `appTitle` a secas: el `value` del `<input>` es el título **sin** versión.
- El harness no tiene matcher negado; las comprobaciones "no contiene / no existe" se hacen sobre el booleano directamente (`expect(x.includes(y)).toBe(false)`, `expect(nodo).toBeNull()`), igual que en `top-controls.test.js` (FT-039-04).
- `document.title` se reescribe en **cada** `renderAppTitle`, en los dos modos.
- El flag `editing` de `ui/appTitle.js` nace en `false` con la recarga de página por fichero de Playwright.

## (b) Technical solution

- [x] **`src/test/helpers.js` — añadir el helper `mountAppTitle()`.** Nuevo export, mismo patrón que `mountChrome()`: llama a `ensureI18n()` y luego a `renderAppTitle(document.getElementById('app-title'))`; devuelve ese nodo `#app-title`. Añadir el `import { renderAppTitle } from '../ui/appTitle.js';` al bloque de imports de la cabecera (junto a los `import ... from '../ui/editModeToggle.js'`). Actualizar también el comentario-cabecera de la lista de utilidades del principio del fichero con una línea `//   mountAppTitle()         renderAppTitle(#app-title); devuelve #app-title`. Cuerpo:

  ```js
  export function mountAppTitle() {
    ensureI18n();
    renderAppTitle(document.getElementById('app-title'));
    return document.getElementById('app-title');
  }
  ```

  Se llama tras cada cambio de modo o de estado que el caso quiera ver reflejado en la cabecera, igual que hace `main.js#renderAll` en producción (que también repinta `#app-title` en cada `*:changed`).

- [x] **`src/test/functional/app-title.test.js` — fichero nuevo con los 9 casos.** `registerFeature({ primary: 30 })` una vez, `beforeEach(resetState)` a nivel raíz, todo dentro de un `describe('030 — Título de cabecera editable', () => { ... })`. Imports: de `../harness.js` (`describe, it, expect, beforeEach, afterEach, registerFeature`), de `../helpers.js` (`resetState, mountEditMode, mountPlayMode, mountAppTitle`), de `../../core/state.js` (`getAppTitle, setAppTitle`), de `../../core/eventBus.js` (`on`), de `../../core/appTitle.js` (`getFullAppTitle, formatVersion`). Patrón de espía sobre eventos: variable `offSpy` de bloque + `afterEach(() => { if (offSpy) { offSpy(); offSpy = null; } })`, igual que `top-controls.test.js`. Cabecera del fichero con un comentario que documente las notas de aislamiento (ver más abajo). Casos:

  - **`FT-030-01` (estado) · valor por defecto.** Tras `resetState()` (que hace `loadAppTitle(DEFAULT_APP_TITLE)`), `expect(getAppTitle()).toBe('BG Factory')`.
  - **`FT-030-02` (estado) · cambiar el título emite `appTitle:changed`.** `offSpy = on('appTitle:changed', (v) => seen.push(v));` con `const seen = [];`. `setAppTitle('Mi partida')` → `expect(getAppTitle()).toBe('Mi partida')` y `expect(seen).toEqual(['Mi partida'])`.
  - **`FT-030-03` (interfaz) · entrar en edición.** `mountEditMode()`; `mountAppTitle()`. `const h1 = document.getElementById('app-title');` → `expect(h1.querySelector('.app-title__pencil')).toBeTruthy()` y `expect(h1.querySelector('input')).toBeNull()`. Simular el hover-click: `h1.click()` (dispara `container.onclick` → `editing = true` + repinta). Tras el click: `const input = h1.querySelector('.app-title__input')` → `expect(input).toBeTruthy()` y `expect(input.value).toBe(getAppTitle())` (el `value` es el título **sin** versión). Cerrar la edición al final del caso para no arrastrar `editing = true`: `input.dispatchEvent(new Event('blur'))`.
  - **`FT-030-04` (interfaz) · confirmar con Enter.** `mountEditMode(); mountAppTitle();` `h1.click()` para entrar en edición; `const input = h1.querySelector('.app-title__input')`. `input.value = 'Título nuevo'`; `input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }))`. En producción `setAppTitle` dispara `renderAll`; aquí, tras el Enter, repintar con `mountAppTitle()`. Comprobar: `expect(getAppTitle()).toBe('Título nuevo')`, `expect(h1.querySelector('.app-title__pencil')).toBeTruthy()`, `expect(h1.querySelector('input')).toBeNull()`.
  - **`FT-030-05` (interfaz) · confirmar al perder el foco.** Igual que `FT-030-04` pero en vez del `keydown` Enter: `input.dispatchEvent(new Event('blur'))`. Mismo bloque de comprobaciones (`getAppTitle()` = nuevo texto, cabecera vuelve a lápiz sin `input`).
  - **`FT-030-06` (interfaz) · confirmar vacío no cambia nada.** `mountEditMode(); mountAppTitle();` fijar primero un título conocido: `setAppTitle('Antes'); mountAppTitle();`. Instalar el espía **después** de ese `setAppTitle`: `const seen = []; offSpy = on('appTitle:changed', (v) => seen.push(v));`. `h1.click()` para entrar en edición; `const input = h1.querySelector('.app-title__input')`; `input.value = '   '` (solo espacios); `input.dispatchEvent(new Event('blur'))`. Comprobar: `expect(getAppTitle()).toBe('Antes')` y `expect(seen).toHaveLength(0)`. Repintar `mountAppTitle()` y comprobar que la cabecera está en estado no-edición (`expect(h1.querySelector('.app-title__pencil')).toBeTruthy()`, `expect(h1.querySelector('input')).toBeNull()`), porque el `confirm()` con vacío llama a `renderAppTitle` directo.
  - **`FT-030-07` (interfaz) · título de la pestaña tras confirmar.** `mountEditMode(); mountAppTitle();` entrar en edición con `h1.click()`, `input.value = 'Partida X'`, `keydown` Enter, `mountAppTitle()`. `expect(document.title).toBe(getFullAppTitle('Partida X'))` (equivalente a `` `Partida X ${formatVersion()}` ``).
  - **`FT-030-08` (interfaz) · solo lectura en modo juego.** `mountPlayMode(); mountAppTitle();` `const h1 = document.getElementById('app-title')`. `expect(h1.querySelector('.app-title__pencil')).toBeNull()`, `expect(h1.querySelector('input')).toBeNull()`, `expect(h1.textContent).toBe(getFullAppTitle(getAppTitle()))` (texto plano con versión). Un `h1.click()` no abre edición: tras el click, `expect(h1.querySelector('.app-title__input')).toBeNull()` y `expect(h1.textContent).toBe(getFullAppTitle(getAppTitle()))`.
  - **`FT-030-09` (interfaz) · la versión siempre presente y fuera del campo editable.** Modo juego: `mountPlayMode(); mountAppTitle();` → `expect(h1.textContent).toContain(formatVersion())`. Modo edición sin editar: `mountEditMode(); mountAppTitle();` → `expect(h1.textContent).toContain(formatVersion())`. Modo edición editando: `h1.click()` → `const versionEl = h1.querySelector('.app-title__version')`; `expect(versionEl).toBeTruthy()`; `expect(versionEl.textContent).toBe(formatVersion())`; `expect(h1.querySelector('.app-title__input').value).toBe(getAppTitle())` (la versión no está dentro del `<input>`). Cerrar la edición al final: `h1.querySelector('.app-title__input').dispatchEvent(new Event('blur'))`.

  **Notas de aislamiento a incluir como comentario en la cabecera del fichero:**
  - `document.title` es global de la página headless y `renderAppTitle` lo reescribe en cada render; con la recarga por fichero de Playwright + `resetState()` en `beforeEach` (deja `appTitle` en el valor por defecto) basta. No añadir un `afterEach` que restaure `document.title` salvo que se observe contaminación.
  - El flag `editing` de `ui/appTitle.js` nace en `false` con la recarga por fichero. Cada caso de interfaz que entre en edición debe dejar el título **confirmado** (Enter o `blur`) antes de terminar, para no arrastrar `editing = true` al caso siguiente.

- [x] **`src/test/functional/autosave.test.js` — marcar cobertura secundaria de 030.** Cambiar la línea 19 de `registerFeature({ primary: 29 });` a `registerFeature({ primary: 29, secondary: [30] });`. Nada más en el fichero.

- [x] **`src/test/functional/export-import.test.js` — marcar cobertura secundaria de 030.** Cambiar la línea 15 de `registerFeature({ primary: 32 });` a `registerFeature({ primary: 32, secondary: [30] });`. Nada más en el fichero.

- [x] **`previo-sdd/design/docs/architecture/011-functional-test-framework.md` — documentar el nuevo helper.** En el bloque de código "Helper contract (`helpers.js`)" (el que empieza en `resetState()` ... y lista `mountChrome()`, `mountEditMode()`, `mountPlayMode()`), añadir una línea para `mountAppTitle()` junto a `mountChrome()`, en el mismo formato compacto:

  ```
  mountAppTitle() -> HTMLElement    ensureI18n (idempotent) + renderAppTitle(#app-title); returns #app-title
                                    [motivación] production main.js#renderAll repaints #app-title on every *:changed; tests call it explicitly after a state/mode change
  ```

  En la tabla "Test files" del final, añadir la fila `| functional/app-title.test.js | 030 | state + ui |` (la tabla no es inventario vivo, pero se mantiene consistente). No tocar `TRACEABILITY.md` a mano: se regenera con `npm test`.

## (c) Architecture changes

Afecta a `previo-sdd/design/docs/architecture/011-functional-test-framework.md` (único fichero de `docs.tech.architectureDocDir` implicado): añadir `mountAppTitle()` al "Helper contract (`helpers.js`)" y la fila `functional/app-title.test.js` a la tabla "Test files". Es la actualización descrita en la última tarea de la sección (b); `pv-do` la aplica en su paso de actualización de documentación. Ninguna decisión de arquitectura (`## Decisions`, niveles de test, flujo de `run.js`) cambia.

## (e) Verification

- [x] `npm test` desde la raíz del repo termina en verde: `Total: N — OK: N — FALLOS: 0`, exit code `0`. Los 9 casos `FT-030-01` … `FT-030-09` aparecen entre los `OK`. (Verificado: `Total: 107 — OK: 107 — FALLOS: 0`, exit `0`.)
- [x] `src/test/TRACEABILITY.md`, regenerado por ese `npm test`, muestra en la fila `030 — Título de cabecera editable` los códigos `FT-030-01` … `FT-030-09` (ya no `—`), y debajo, marcados `(secundaria)`, los `FT-029-01 … FT-029-09` y `FT-032-01 … FT-032-11`. (Verificado en la línea 40 de `TRACEABILITY.md`.)
- [x] En `TRACEABILITY.md`, la sección "Tests que declaran una funcionalidad inexistente" sigue diciendo `_Ninguna._` y `030` ya no aparece en "Funcionalidades sin ningún test". (Verificado.)
- [x] `git diff --stat` no muestra ningún fichero modificado bajo `src/core/`, `src/ui/`, `src/modes/`, ni `src/main.js` / `src/index.html`: solo `src/test/helpers.js`, `src/test/functional/app-title.test.js` (nuevo), `src/test/functional/autosave.test.js`, `src/test/functional/export-import.test.js`, `src/test/TRACEABILITY.md` (regenerado) y `previo-sdd/design/docs/architecture/011-functional-test-framework.md`. (Verificado: los cambios de esta implementación se limitan a esos ficheros. `src/index.html` y `src/data/version.js` aparecen como modificados en el árbol de trabajo, pero son cambios previos ajenos a esta implementación, no producidos aquí.)
- [x] `design/docs/features/030-*.md` no ha sido modificado. (Verificado: `git status` no reporta nada bajo `previo-sdd/design/docs/features/`.)
