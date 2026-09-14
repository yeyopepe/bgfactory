- **Name**: Arranque roto tras centralización de iconos
- **Code**: 00267
- **Type**: fix
- **Creation date**: 2026-09-14

## Full description

Tras el cambio 00244 (centralización del sistema de iconos), la aplicación entregable (el fichero HTML autocontenido que genera el proceso de construcción) dejaba de arrancar correctamente: no aparecía la pantalla de bienvenida (splash) ni ninguno de los botones de la barra superior (Importar, Exportar, Modo, Ajustar zoom, Configuración), solo se veía el fondo punteado vacío de la mesa.

El motivo era un error de sintaxis introducido en un punto concreto del código durante el cambio 00244, que rompía la ejecución completa del script principal de la aplicación nada más arrancar — de ahí que ni siquiera la pantalla de bienvenida, que es lo primero que debería pintarse, llegara a mostrarse.

El problema solo se manifestaba en la versión ya construida/entregable de la aplicación, no al trabajar directamente con el código fuente sin construir — por eso no se detectó durante el desarrollo ni con la batería de pruebas automáticas existente, que hasta ahora no comprobaba el resultado final de ese proceso de construcción.

Se ha corregido el error y se ha añadido una comprobación automática nueva que verifica, a partir de ahora, que el resultado de ese proceso de construcción es válido, precisamente para detectar este tipo de problema antes de que llegue a producirse de nuevo.

## Technical notes

- **Síntoma**: `SyntaxError: Unexpected identifier 'as'` en el HTML entregable (`src/_output/versions/index-v*.html`), visible en la consola del navegador al cargar ese fichero — no al servir `src/` directamente (los tests con `npm test` corren así, por eso pasaban en verde pese al bug).
- **Causa raíz**: `src/scripts/build.py` reescribe cada `import { X } from '...'` literalmente a `const { X } = require('...')`. `src/ui/resourceModal.js` (tocado en 00244) tenía `import { iconSvg as buildIconSvg, ICON_SIZE } from './icons.js'` — la sintaxis de renombrado `as` es válida en un `import` ES pero **no** en una destructuración de objeto JS normal, así que el bundle generado (`const { iconSvg as buildIconSvg, ... } = require(...)`) era JS inválido. Esto detenía toda la evaluación del script antes de que `main.js` ejecutara su primera línea (`showSplashScreen()`), de ahí que ni la splash ni la barra aparecieran.
- **Por qué el alias existía**: para evitar colisionar con el parámetro local `iconSvg` de `createZoomButton(title, iconSvg)` en el mismo fichero — parámetro que en realidad ya se había renombrado a `iconMarkup` en el mismo cambio 00244, dejando el alias innecesario.
- **Corrección**: se quitó el alias (`import { iconSvg, ICON_SIZE } from './icons.js'` sin `as`) y se actualizaron sus dos usos.
- **Comprobación añadida**: `src/test/build-check.js` — ejecuta `src/scripts/build.py` y valida que el `<script>` del HTML resultante es sintácticamente válido (`new Function(...)`), antes de que llegara a un navegador real. Integrado en `npm run test:all` (nuevo script `test:build` disponible también suelto). Verificado: el test falla exactamente con el mismo error antes de la corrección, y pasa después.
- Verificado además con Chromium headless (Playwright) sirviendo `src/index.html` directamente: splash y barra de herramientas se renderizan correctamente tras la corrección, sin errores de consola.

## Applied changes

- `src/ui/resourceModal.js`: quitado el alias `as buildIconSvg` del import de `iconSvg`; actualizados sus dos usos (`createZoomButton` para zoom-in/zoom-out/zoom-reset) para usar `iconSvg` directamente.
- `src/test/build-check.js` (nuevo): ejecuta `src/scripts/build.py` y comprueba con `new Function(...)` que el `<script>` del HTML entregable resultante es sintácticamente válido.
- `package.json`: nuevo script `test:build`; `test:all` ahora también ejecuta `build-check.js` tras la batería funcional.

