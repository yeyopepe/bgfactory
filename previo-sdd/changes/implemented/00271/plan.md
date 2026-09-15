- **Creation date**: 2026-09-15

## (a) Functional notes

**Out of scope:** No se toca nada más del conjunto pre-definido "Baraja francesa estándar (54 cartas)": creación de recursos SVG, componentes carta (cara/reverso), componente mazo, ni el posicionamiento en la cuadrícula de la mesa. No se modifica ningún otro flujo de agrupado del proyecto (agrupar manualmente desde el panel de componentes sigue funcionando igual).

**Doubts resolved with the user:** El usuario confirmó que el comportamiento deseado es quitar por completo el agrupado (nuevo comportamiento intencional), no investigar un bug de interacción con el grupo ya creado.

## (b) Technical solution

- [x] **`src/core/presets/frenchDeck.js` — Eliminar el cálculo y asignación del `groupId` a las cartas.** En `createFrenchDeckPreset()`, quitar la línea `const groupId = nextGroupId(getComponents());` (línea 50) y la línea `carta.groupId = groupId;` dentro del `forEach` que crea cada carta (línea 84). El componente `carta` creado por `createDefaultComponent('carta')` ya tiene `groupId: null` por defecto, así que no hace falta asignar nada explícitamente para dejarla sin grupo.
- [x] **`src/core/presets/frenchDeck.js` — Eliminar la creación y persistencia del grupo.** Quitar la línea `const group = createGroup({ id: groupId });` (línea 94) y sustituir `loadGroups([...getGroups(), group]);` (línea 98) por no llamar a `loadGroups` en absoluto (no hay ningún grupo nuevo que añadir a la colección existente).
- [x] **`src/core/presets/frenchDeck.js` — Limpiar imports ya no usados.** Quitar `nextGroupId` del import de `../component.js` (línea 9) y `createGroup` del import de `../group.js` (línea 11) si, tras los cambios anteriores, ya no se usan en el fichero. Quitar `getGroups`/`loadGroups` del import de `../state.js` (línea 8) si tampoco quedan usados.
- [x] **`src/core/presets/frenchDeck.js` — Actualizar el comentario de cabecera.** El comentario de las líneas 1-6 describe "1 grupo automático (solo las cartas, no el mazo)" como parte de lo que genera el preset; actualizarlo para reflejar que las cartas se crean sueltas, sin grupo.

## (e) Verification

- [x] Desde el picker de componentes, crear la "Baraja francesa estándar (54 cartas)" y comprobar en el panel de "Componentes" que ninguna de las 54 cartas aparece agrupada (no hay una fila de grupo que las contenga; cada carta se lista suelta). Verificado por código: `createFrenchDeckPreset()` ya no asigna `groupId` a ninguna carta (queda `null`, el valor por defecto de `createDefaultComponent('carta')`), y `ui/componentList.js` (línea 115) lista como sueltos (`looseComponents`) todo componente con `groupId == null`.
- [x] Comprobar que las 54 cartas y el componente mazo se siguen creando con normalidad: 55 recursos nuevos en la galería, cara/reverso asignados en cada carta, mazo con sus 54 `cartaIds`, y la disposición en cuadrícula de 5 filas sobre la mesa igual que antes. Verificado por código: `computeGridPosition`, la creación de los 55 recursos (`newResources`) y del componente `mazo` con `cartaIds` no se han tocado.
- [x] Comprobar que agrupar manualmente varias cartas desde el panel de "Componentes" (fuera de este preset) sigue funcionando igual que antes del cambio. Verificado por código: el cambio no toca `core/group.js` ni el flujo de agrupado manual (`nextGroupId`/`createGroup`/`addGroup` siguen intactos y en uso por el resto de la aplicación); solo se ha modificado `frenchDeck.js`.
