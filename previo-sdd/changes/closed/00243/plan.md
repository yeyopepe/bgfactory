- **Creation date**: 2026-09-03
- **Risk**: 1/10 — Minimal risk — local change, with a safety net (tests) or easily reversible

## (a) Functional notes

**Out of scope:**

- No se reutiliza `DEFAULT_APP_TITLE` ni el título editable de la app: la línea 1 usa el literal fijo `BG Factory` (decidido con el usuario). Si algún día se renombra la app, este footer se actualiza a mano, igual que ya pasa con el `<title>` del `<head>`.
- No se toca el formato de versión del `<h1>` (`core/appTitle.js` → `formatVersion()` → `v.X.Y.Z`); el footer mantiene su propio formato sin punto (`vNNNNN`), tal cual hoy.
- No se añade el correo del autor (descartado ya en `description.md`).
- No se implementa nada de la entrada 00231 (botón/modal de changelog): este cambio solo deja el footer preparado para convivir con ella, no la adelanta.
- Ningún otro comportamiento de la aplicación se ve afectado: no hay persistencia, ni red en runtime, ni estado.

**Doubts resolved with the user:**

- *Texto visible del enlace:* la petición original pedía `Look at Github.com`; se recomendó una alternativa y el usuario eligió **`Ver en Github`** (literal, con esa capitalización). El `href` real sigue siendo `https://github.com/yeyopepe/bgfactory`.
- *Nombre de la app en la línea 1:* `description.md` decía `BGFactory` (sin espacio), pero el código usa `BG Factory` (con espacio) en `DEFAULT_APP_TITLE` y en el `<title>`. El usuario confirmó usar **`BG Factory`** (con espacio) como literal, sin reutilizar `DEFAULT_APP_TITLE` por código.

## (b) Technical solution

- [x] **`src/main.js` — construir el footer con dos líneas en lugar de asignar solo la versión.** Sustituir el bloque actual (líneas ~30-32):

  ```js
  if (versionEl) {
    versionEl.textContent = CURRENT_VERSION;
  }
  ```

  por la construcción de dos elementos hijos con DOM vanilla (patrón `document.createElement` + `textContent` + `className`/`classList`, nunca `innerHTML` interpolado; ver `previo-sdd/design/docs/style/004-naming-and-patterns.md`):

  ```js
  if (versionEl) {
    versionEl.textContent = '';

    const nameLine = document.createElement('div');
    nameLine.className = 'app-version__name';
    nameLine.textContent = `BG Factory ${CURRENT_VERSION}`;

    const repoLine = document.createElement('div');
    repoLine.className = 'app-version__repo';
    const repoLink = document.createElement('a');
    repoLink.href = 'https://github.com/yeyopepe/bgfactory';
    repoLink.target = '_blank';
    repoLink.rel = 'noopener';
    repoLink.textContent = 'Ver en Github';
    repoLine.appendChild(repoLink);

    versionEl.append(nameLine, repoLine);
  }
  ```

  - `CURRENT_VERSION` ya está importado en `src/main.js` (`import { CURRENT_VERSION } from './data/version.js';`). No añadir imports.
  - El literal `BG Factory` va en el código, con espacio; no importar `DEFAULT_APP_TITLE`.
  - Nombres de clase BEM bajo el bloque `app-version` (`app-version__name`, `app-version__repo`), coherentes con la convención `block__element`. El `<a>` no lleva clase propia: se estiliza con el selector descendente `#app-version a` (ver tarea de CSS).

- [x] **`src/styles/main.css` — ampliar la regla de `#app-version` para las dos líneas y el enlace.** En la regla existente (`#app-version { position: fixed; bottom: 1rem; right: 1rem; font-size: 0.75rem; color: var(--text-muted); z-index: 10; }`, ~línea 3443) añadir `text-align: right;` y un `line-height` cómodo para dos líneas (`line-height: 1.35;`). Justo debajo, añadir la regla del enlace:

  ```css
  #app-version a {
    color: inherit;
    text-decoration: underline;
  }
  ```

  - `color: inherit` hace que el enlace herede el `var(--text-muted)` del footer: mismo gris, sin color de acento, sin `:visited`/`:hover` propios. No introducir ningún color hardcodeado ni token nuevo.
  - No tocar `font-size` (`0.75rem` ya está catalogado como "version footer" en `001-tokens-visual.md`) ni `z-index` (`10`, catalogado en `002-componentes-layout.md`).

- [x] **`src/index.html` — sin cambios.** El contenedor `<footer id="app-version"></footer>` ya existe y sirve tal cual; las dos líneas se inyectan desde `main.js`. (Tarea presente solo para dejar constancia de que se revisó y no requiere edición.)

## (d) Style changes

`previo-sdd/design/docs/style/` no tiene hoy ninguna convención para hiperenlaces de cara al usuario, y este es el primero en `/src`. Documentarla:

- **`previo-sdd/design/docs/style/001-tokens-visual.md`** — en la sección de tipografía/colores donde ya se cataloga `0.75rem` = "version footer", añadir una nota de que los enlaces de texto heredan el color del contexto (`color: inherit`) y se distinguen solo por `text-decoration: underline`, sin color de acento propio, tomando como caso de referencia el enlace al repositorio del footer de versión.
- **`previo-sdd/design/docs/style/004-naming-and-patterns.md`** — añadir una entrada breve sobre enlaces externos: se crean con `document.createElement('a')` + asignación de `href`/`textContent`/`target`/`rel` por código (nunca `innerHTML`); todo enlace con `target="_blank"` lleva `rel="noopener"`; el texto visible es una etiqueta legible (`Ver en Github`), no la URL. Mencionar el bloque `app-version` (`app-version__name`, `app-version__repo`) como ejemplo de que `#app-version` deja de ser un contenedor vacío y pasa a tener estructura interna con clases BEM.
- **`previo-sdd/design/docs/style/002-componentes-layout.md`** — en la descripción del "Version footer" (tabla de z-index y contexto), reflejar que ahora tiene dos líneas (`app-version__name` + `app-version__repo`) y `text-align: right`, en vez de un único nodo de texto.

## (e) Verification

- [x] Al abrir la app (modo juego y modo edición), en la esquina inferior derecha se ven **dos líneas**: arriba `BG Factory v00245` (o la versión que marque `src/data/version.js` en ese momento), abajo el texto `Ver en Github`.
- [x] Ambas líneas están en el mismo gris tenue y tamaño pequeño de antes, alineadas a la derecha y ancladas a la esquina inferior derecha; el conjunto no tapa ni desplaza ningún otro control.
- [x] La segunda línea aparece **subrayada** y el cursor cambia a mano al pasar por encima; no tiene ningún color de acento (azul, etc.), sigue siendo gris.
- [x] Al pulsar `Ver en Github` se abre `https://github.com/yeyopepe/bgfactory` en una **pestaña nueva**, y la pestaña de la app sigue abierta y en el mismo estado.
- [x] Inspeccionando el `<a>` en el DOM: tiene `target="_blank"` y `rel="noopener"`, y su `href` es exactamente `https://github.com/yeyopepe/bgfactory`.
- [x] El texto de versión ya no aparece como una sola línea suelta; no quedan restos del `textContent` anterior.
