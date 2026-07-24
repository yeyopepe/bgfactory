- **Nombre**: No permitir mazos con el mismo nombre
- **Código**: 00081
- **Tipo**: fix

## Prompt original del usuario

no se deben permitir mazos con el mismo nombre. Revisa el proceso de creación (en la lista y en las cartas) y la importación.

## Descripción completa

Actualmente el juego permite que existan dos o más mazos con exactamente el mismo nombre. Esto puede pasar en tres situaciones distintas:

1. **Al crear o renombrar un mazo desde la lista de mazos**: si se escribe un nombre que ya usa otro mazo existente, el sistema lo acepta sin avisar, y quedan dos mazos indistinguibles por nombre en la lista.
2. **Al crear un mazo nuevo desde dentro de la pantalla de edición de una carta** (la opción de crear un mazo nuevo directamente al asignar una carta a un mazo): igual que en el caso anterior, si el nombre coincide con uno ya existente, se crea igualmente sin avisar.
3. **Al importar una colección de mazos y cartas desde un fichero**: si el fichero importado trae un mazo con el mismo nombre que uno ya existente en la colección actual, el proceso de importación no lo detecta como conflicto y termina creando un mazo duplicado por nombre, aunque técnicamente el sistema los reconozca como mazos distintos internamente.

**Comportamiento esperado**: en los tres flujos, no debe quedar nunca más de un mazo con el mismo nombre en la colección (ignorando mayúsculas/minúsculas y espacios al principio/final). Si el usuario intenta crear o renombrar un mazo con un nombre ya en uso, debe impedirse la operación y avisarle claramente de que ese nombre ya está en uso, de forma consistente con cómo el resto de la aplicación muestra este tipo de avisos. En el caso de la importación, si el fichero importado trae un mazo con un nombre que ya existe en la colección actual, debe tratarse como un conflicto más y resolverse con el mismo mecanismo que ya usa el proceso de importación para otros conflictos, en vez de crear el duplicado silenciosamente.

## Apuntes técnicos

- **Estructura de datos**: los mazos son un array plano `state.decks` de objetos `{id, name}` (`src/core/deck.js:3-5`, `src/core/state.js:12`), no un mapa por nombre. La unicidad solo está garantizada hoy sobre `id` (UUID), nunca sobre `name`. Cualquier validación de duplicados debe implementarse como una búsqueda explícita tipo `getDecks().some(d => d.name.trim().toLowerCase() === trimmedName.toLowerCase() && d.id !== currentId)`.
- **Puntos de creación/renombrado de mazo confirmados como independientes entre sí (ambos deben corregirse)**:
  - `src/ui/deckModal.js` (~líneas 60-70): al aceptar el modal solo se comprueba `nameInput.value.trim() === ''`; no hay comprobación de nombre duplicado. `createDeck`/`updateDeck` (`src/core/deck.js`) y `addDeck`/`replaceDeck` (`src/core/state.js:175-184`) tampoco validan nada.
  - `src/ui/componentModal.js` (~líneas 1075-1143, especialmente 1129-1138): opción "+ Crear nuevo mazo…" del selector de mazo dentro del editor de cartas. El handler solo comprueba `if (!name) return;` y llama directamente a `createDeck({ name })` + `addDeck(deck)`, sin comprobar duplicados.
- **Patrón de UX de validación ya existente a reutilizar**: `deckModal.js` ya tiene un `updateAcceptState` que deshabilita el botón Aceptar mientras el nombre está vacío (~líneas 59-63) — sitio natural para añadir también la comprobación de nombre duplicado.
- **Patrón de errores ya existente en el proyecto**: `showErrorModal(title, message, detail)` (`src/ui/errorModal.js`) es el mecanismo estándar para mostrar errores; el propio fichero documenta que cualquier error debe mostrarse así en vez de con un aviso ad-hoc.
- **Importación**: `src/core/importMerge.js` — `mergeCollection` (~líneas 30-64) resuelve conflictos de mazos exclusivamente por `id` (modos `keepBoth`/`overwrite`, con sufijos `-imported`/`-imported(n)` sobre el `id`, nunca sobre el `name`). `mergeImportedGame` (~líneas 140-201, especialmente 181-195) auto-crea mazos a partir de un `deckId` referenciado que no existe, sin comprobar si ya hay un mazo con ese mismo nombre. Ya existe un mecanismo de reporte de conflictos de importación (array `report` con `tipoError`/`solucion`/`elemento`, construido en `importMerge.js` y mostrado en `src/ui/importConfirmModal.js`) que sería el sitio natural para integrar el aviso/resolución de nombre duplicado, en vez de inventar uno nuevo.
