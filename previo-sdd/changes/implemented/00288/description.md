- **Name**: Línea visible entre título e Importar/Exportar en modo edición
- **Code**: 00288
- **Type**: fast
- **Creation date**: 2026-09-15

## Full description

Regresión introducida por el cambio 00287 (mismo día): en modo edición, aunque ambas franjas de la cabecera (título y la de "Importar"/"Exportar") ya llevaban la misma trama de rayas diagonales, seguía viéndose una línea/separación visible entre ellas. Debía verse como una única cabecera continua, sin ninguna separación perceptible.

## Applied changes

- `src/test/functional/top-controls.test.js` — nuevo caso `FT-039-09` (carga la hoja de estilos real, monta modo edición, comprueba que `.edit-toolbar` no lleva `box-shadow` propio). Verificado que falla si `.edit-toolbar` conserva su `box-shadow` y pasa una vez retirado.
- `src/styles/main.css` — causa raíz: `h1#app-title` y `.edit-toolbar` son hermanos directos en el flujo normal (mismo fondo, sin separación), pero cada uno aplicaba independientemente `box-shadow: var(--shadow-1)` (la sombra de elevación estándar del proyecto). Al ser dos elementos contiguos con la misma sombra, la sombra de `h1` se dibujaba justo sobre el borde superior de `.edit-toolbar`, generando una línea visible en el punto de contacto. Se retiró el `box-shadow` propio de `.edit-toolbar`: la elevación de la cabecera combinada la sigue aportando solo `h1`. Verificado visualmente (captura de pantalla real en Chromium): ambas franjas se ven ahora como una única cabecera sin separación. `npm run test:all` → 404/404 tests pasando, build check OK.
