**Fecha creación**: 2026-08-05

## (a) Anotaciones funcionales

Fuera de alcance: no se toca el flujo "Guardar" (export HTML), que ya persiste/restaura el título por su cuenta. No se añade ningún control visual nuevo (checkbox, campo) en los modales de exportación/importación — el título viaja siempre de forma transparente dentro del JSON.

Dudas resueltas con el usuario (durante `ms-new`): el título importado solo se aplica en modo de importación "Sobrescribir todo el juego"; en modo "Añadir a lo existente" el título actual se mantiene siempre, aunque el JSON traiga uno.

## (b) Solución técnica

1. **`core/persistence.js` → `buildComponentsExport(components, resources, groups)`**: añadir un cuarto parámetro `appTitle` y devolverlo como campo `appTitle` en el objeto resultante (`{ version, components, resources, groups, appTitle }`), mismo patrón que ya usa `saveState`/`parseState` para incluir `appTitle` en el JSON.

2. **`ui/editModeToggle.js` → `openExportFlow()`**: en la llamada a `buildComponentsExport(...)`, pasar `getAppTitle()` (ya importado en el fichero) como cuarto argumento.

3. **`core/persistence.js` → `parseImportedComponents(raw)`**: leer el campo `appTitle` del JSON parseado igual que hace `parseState` — `const appTitle = (typeof parsed.appTitle === 'string' && parsed.appTitle.trim() !== '') ? parsed.appTitle : null;` (aquí `null` en vez de `DEFAULT_APP_TITLE`, porque a diferencia de `parseState` este resultado no siempre se aplica — un fichero sin título no debe forzar el título por defecto sobre la partida actual) — y añadirlo al objeto devuelto: `{ components, resources, groups, appTitle }`.

4. **`ui/editModeToggle.js` → `importComponentsFromFile(file)`**: dentro del callback `onAccept` de `openImportConfirmModal` (que ya recibe `{ mode, conflictMode }`), tras la llamada a `proceedWithImport(...)` (o al principio de `proceedWithImport`, indistinto ya que no depende de los componentes migrados), añadir:
   ```js
   if (mode === 'overwrite' && result.appTitle) {
     setAppTitle(result.appTitle);
   }
   ```
   `result` es la variable ya existente en el ámbito (retorno de `parseImportedComponents`, capturado más arriba en la función). Añadir `setAppTitle` al import ya existente de `../core/state.js` en la cabecera del fichero (junto a `getAppTitle`, que ya se importa).

No hace falta tocar `core/importMerge.js` (`mergeImportedGame`): el título no es una colección que fusionar por id, es un valor único aparte que se resuelve directamente en `editModeToggle.js` a partir del `mode` ya disponible.

`setAppTitle` (no `loadAppTitle`) es la función correcta aquí: emite `appTitle:changed`, que ya tiene un listener que vuelve a pintar el `<h1>` (`ui/appTitle.js`) — necesario porque la importación ocurre en caliente durante una sesión ya renderizada, a diferencia de `loadAppTitle` (sin emitir evento), reservada para la carga inicial antes del primer render.

## (c) Cambios de arquitectura

En `design/docs/ARCHITECTURE.md`, sección "**Título de cabecera editable** (cambio 00147)", añadir al final del párrafo una frase señalando que, desde el cambio 00150, el JSON de exportación ligera (`ui/editModeToggle.js` → "Exportar"/"Importar", `core/persistence.js` → `buildComponentsExport`/`parseImportedComponents`) también incluye el título, y que al importar solo se aplica en modo de importación "Sobrescribir todo el juego" — dejando explícito que en modo "Añadir a lo existente" el título actual no se toca.
