- **Creation date**: 2026-09-03
- **Risk**: 1/10 — Minimal risk — local change, with a safety net (tests) or easily reversible

## (a) Functional notes

**Out of scope:** no se añade ningún aviso de confirmación extra al importar en modo "Sobrescribir". No se toca el desplegable "Comportamiento ante id duplicado" (sigue visible y habilitado siempre, aunque no tenga efecto en modo "Sobrescribir"). No se modifica la lógica de fusión (`core/importMerge.js`), ni el tratamiento de grupos ni de título de cabecera en modo "Sobrescribir": ese comportamiento ya existe y solo pasa a activarse por defecto. Ninguna otra parte del flujo de importación se toca.

**Doubts resolved with the user:**
- ¿Salvaguarda extra al pasar "Sobrescribir" a valor por defecto? → No: se deja tal cual, la confirmación del botón "Importar" del modal y el resultado posterior se consideran suficientes.
- ¿Cambiar el desplegable "Comportamiento ante id duplicado" ahora que "Sobrescribir" es el defecto? → No: se deja como está, visible y habilitado siempre.

## (b) Technical solution

- [x] **`src/ui/importConfirmModal.js` — cambiar el valor inicial de `working.mode` a `'overwrite'`.** En la línea donde se declara el objeto de trabajo del modal:

  ```js
  const working = { mode: 'add', conflictMode: 'overwrite' };
  ```

  sustituir por:

  ```js
  const working = { mode: 'overwrite', conflictMode: 'overwrite' };
  ```

  No hay nada más que tocar en el fichero: el bucle que construye los `<option>` del desplegable "Modo de importación" ya marca `option.selected = true` cuando `value === working.mode`, así que con este cambio "Sobrescribir todo el juego" aparecerá preseleccionada. El `conflictMode` inicial no se modifica.

## (c) Architecture changes

- **`previo-sdd/design/docs/architecture/006-ui-layer.md`**, entrada de `ui/importConfirmModal.js`: donde dice que el desplegable "Modo de importación" tiene `Añadir a lo existente` **por defecto** y `Sobrescribir todo el juego` como alternativa, invertir cuál es el valor por defecto: `Sobrescribir todo el juego` pasa a ser el valor por defecto, `Añadir a lo existente` la alternativa. El desplegable "Comportamiento ante id duplicado" no cambia (`Sobrescribir el existente` sigue siendo su valor por defecto).

## (d) Style changes

*No aplica.* El cambio no modifica ni extiende ninguna convención visual: no aparecen elementos nuevos, no cambia el layout ni el estilo del modal, solo qué opción de un `<select>` viene seleccionada al abrirlo.

## (e) Verification

- [x] Abrir la app, pulsar "Importar" (desde modo juego o modo edición), elegir un fichero `.json` válido y continuar hasta el segundo modal ("Importar — confirmar"): el desplegable "Modo de importación" aparece con **"Sobrescribir todo el juego"** seleccionado de entrada, y "Comportamiento ante id duplicado" sigue mostrando "Sobrescribir el existente". _Verificado por lectura del código resultante: `working.mode = 'overwrite'` y el bucle de `<option>` marca `option.selected` para ese valor; `conflictMode` sin cambios._
- [x] En ese mismo modal, sin tocar nada, pulsar "Importar": el juego queda únicamente con los elementos seleccionados del fichero (se ha borrado el contenido previo), confirmando que el valor por defecto que se propaga es `overwrite`. _Verificado: `onAccept({ ...working })` propaga `mode: 'overwrite'` a `mergeImportedGame`; `mergeCollection` con `mode === 'overwrite'` descarta `existing` y devuelve solo `selected`; `editModeToggle.js` sustituye grupos y título en esa rama._
- [x] En el segundo modal, cambiar manualmente "Modo de importación" a "Añadir a lo existente" y pulsar "Importar": el contenido actual se conserva y se le suman los elementos del fichero, confirmando que la opción alternativa sigue funcionando. _Verificado: el listener `change` de `modeSelect` fija `working.mode = 'add'`; `mergeCollection` en rama `add` conserva `existing` y fusiona `selected` según `conflictMode`._
