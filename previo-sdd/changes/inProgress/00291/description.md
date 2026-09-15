- **Name**: Mover Importar/Exportar a la fila de controles en modo edición
- **Code**: 00291
- **Type**: change
- **Creation date**: 2026-09-15

## Full description

En modo edición, los botones «Importar» y «Exportar» pasan a mostrarse en la fila de controles de la esquina superior derecha, en primera posición, con un separador vertical antes del botón «Ir al Modo Juego» — exactamente la misma estructura que ya tiene esa fila en modo juego (bloque de fichero, separador, bloque de acciones).

Actualmente esos dos botones viven integrados dentro de la propia cabecera del título, en modo edición. Con este cambio se sacan de ahí y se colocan en la fila de controles, igual que en modo juego.

El indicador de texto «Modo Edición» que aparece debajo del título en modo edición no se ve afectado: sigue en su sitio, dentro de la cabecera del título.

Puntos de alcance resueltos con el usuario:
- Los botones Importar/Exportar salen de la cabecera del título y pasan a la fila de controles, en primera posición (antes del botón de cambio de modo), con un separador vertical entre ellos y el botón «Ir al Modo Juego» — misma estructura que ya existe en modo juego.
- El indicador «Modo Edición» bajo el título no cambia de sitio ni de aspecto.
- El aspecto visual de los botones Importar/Exportar no cambia (mismo estilo, mismo desplegable de Exportar) — solo cambia su ubicación.
- La cabecera del título en modo edición vuelve a contener solo el título y el indicador de modo, sin los botones de fichero.
- Este cambio está directamente relacionado con el cambio 00290 (implementado hoy), que había movido esos botones a la cabecera del título para resolver un problema de costura visual entre dos elementos separados. Ese problema no reaparece aquí porque la fila de controles de la esquina superior derecha es un elemento flotante sin fondo ni trama propios, y nunca formó parte de ese problema.

## Technical notes

- Los botones se generan hoy en `src/ui/appTitle.js` (`renderControls`, integrado en `renderAppTitle`, cambio 00290) y deben volver a generarse mediante `renderModeSwitcher` en `src/ui/editModeToggle.js` — esa función ya construye la estructura objetivo (bloque de fichero + `.toolbar-divider` + bloque de acciones) para modo juego; solo falta dejar de condicionar ese bloque a `isPlay` y aplicarlo también en modo edición.
- `createImportControls()`/`createExportMenu()` (exportadas de `src/ui/editModeToggle.js`) ya son factories agnósticas del contenedor, reutilizadas hoy tanto por `#mode-switcher` (modo juego) como por `h1#app-title` (modo edición, 00290) — no requieren cambios en sí mismas, solo el punto donde se invocan.
- Al salir de `h1`, la clase `.app-title__controls` (añadida por 00290 en `src/styles/main.css`) queda sin uso y debe retirarse junto con su bloque de estilos; `h1.app-title-bar--edit` conserva su trama (sigue albergando título + indicador).
- El selector CSS existente `#mode-switcher .export-menu-wrap > button, #mode-switcher > button:not(.mode-switcher__mode-btn):not(.mode-switcher__fit-btn):not(.mode-switcher__settings-btn)` ya no está condicionado a modo juego — aplica igual si esos botones aparecen en modo edición, sin cambios necesarios ahí.
- Tests afectados (a revisar en el análisis técnico): `FT-039-02`, `FT-039-04`, `FT-039-08` en `src/test/functional/top-controls.test.js` (afirman hoy que Importar/Exportar viven dentro de `h1` en modo edición — deben invertirse); `FT-030-13` en `src/test/functional/app-title.test.js` (comprueba ausencia de `.app-title__controls` en modo juego, clase que desaparece del todo con este cambio).
- Documentación funcional a actualizar: `previo-sdd/design/docs/features/039-...md` (dónde viven hoy Importar/Exportar en modo edición) y `previo-sdd/design/docs/features/030-...md` (que hoy afirma que título+indicador+botones forman "una única pieza continua" — deja de ser cierto).
