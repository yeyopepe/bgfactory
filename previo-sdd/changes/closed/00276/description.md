- **Name**: El id del mazo del preset "Baraja Francesa" debe ser legible, sin campo name paralelo
- **Code**: 00276
- **Type**: fix
- **Creation date**: 2026-09-15

## Full description

Al generar el mazo mediante el preset "Baraja Francesa", en la ventana de "Componentes" la fila correspondiente al mazo muestra el texto "Baraja Francesa" en la columna "Id", mientras que su identificador técnico real (visible en la etiqueta flotante sobre el propio mazo en el lienzo) es un GUID sin relación aparente, p. ej. `c9ca9cfe-389a-4d7f-8809-a988e566da86`. El resto de filas (las 54 cartas individuales) sí muestran como id un texto legible (p. ej. `card-treboles-6`, `card-joker`), coherente con lo que se ve en la columna.

Esto es consecuencia de una implementación previa (cambio 00272) que se desvió de lo pedido: la petición original era que el **id** del mazo fuera legible ("Baraja Francesa"), igual que ya ocurre con las cartas del mismo preset. En vez de eso, 00272 añadió un campo `name` nuevo y separado al modelo de componente, y cambió la columna "Id" del panel para mostrar ese `name` en vez del `id` cuando existe — dejando el id real (el GUID) oculto tras esa columna. El resultado es confuso: la columna "Id" no siempre muestra el id.

Comportamiento esperado:
- La columna "Id" del panel de Componentes muestra siempre el identificador técnico real del componente (`component.id`), sin excepciones ni fallback a ningún otro campo.
- El mazo generado por el preset "Baraja Francesa" tiene como identificador técnico real el texto `"Baraja Francesa"` (con desambiguación si ya existe otro componente con ese id, igual que ya hacen las 54 cartas del mismo preset), en vez de un GUID — cumpliendo así, correctamente esta vez, la petición original de que el id del mazo sea legible.
- El campo `name` añadido en 00272 (y su uso exclusivo en la columna "Id") se retira: no tiene ningún otro consumidor en el proyecto ni forma de editarse desde la UI.

## Technical notes

- Causa raíz de lo reportado: `src/ui/componentList.js` línea 351 — `idCell.textContent = (component.name && component.name.trim()) ? component.name : component.id;` (introducido por el cambio 00272). Revertir a `idCell.textContent = component.id;`.
- `src/core/presets/frenchDeck.js`: las 54 cartas ya usan el patrón de id legible con desambiguación — `carta.id = freeId(entry.cardId, [...getComponents(), ...newComponents]);` (función `freeId`, línea 20-24, que usa `nextCloneId` de `core/component.js` para desambiguar si el id candidato ya existe). El mazo debe seguir el mismo patrón: en vez de `mazo.name = t('componentTypeModal.preset.frenchDeck.deckName');` (línea 102, a retirar), asignar `mazo.id = freeId(t('componentTypeModal.preset.frenchDeck.deckName'), [...getComponents(), ...newComponents]);` (o equivalente), sobrescribiendo el GUID que le asigna `createDefaultComponent('mazo')` por defecto.
- Relacionado con el cambio 00272 (`previo-sdd/changes/implemented/00272/`), que introdujo el campo `name` y su fallback en la columna "Id" — se corrige aquí por desviarse de la petición original de ese mismo cambio (ver su `history.md`: "añade a este cambio que el id del mazo debe ser algo legible, como 'Baraja Francesa'").
- Corrección tras verificar contra el código real: el campo `name` **no** fue introducido por 00272 ni es exclusivo del mazo — es un campo genérico del modelo `Component` desde su base (`core/component.js`, parámetro `name = ''` de `createComponent`), ya sincronizado por `updateComponent()`/`syncCopyWithOriginal()` como cualquier otro campo general, y cubierto por tests de CRUD/persistencia previos a 00272 (`FT-002-08` en `component-crud.test.js`, `FT-029-03` en `autosave.test.js`, casos de `export-import.test.js`). **No se retira ni se toca `core/component.js`** — solo se revierte su uso indebido introducido por 00272 en `componentList.js` (columna "Id") y `frenchDeck.js` (asignación al mazo).
- Tests a revisar/retirar (validan el comportamiento que se corrige): `FT-003-18`/`FT-003-19` en `src/test/functional/component-panel.test.js`, `FT-002-19` en `src/test/functional/french-deck-preset.test.js`.
- Claves i18n a revisar: `componentTypeModal.preset.frenchDeck.deckName` en `src/data/i18n.es.js`/`i18n.en.js` — puede seguir usándose como valor del nuevo `mazo.id`, o renombrarse/reubicarse si ya no encaja semánticamente como "nombre".
