- **Name**: Ventana de espera al importar
- **Code**: 00222
- **Type**: change
- **Creation date**: 2026-08-19

## Full description

Al pulsar el botón "Importar" del diálogo final de confirmación de importación (la ventana "Importar — confirmar", con los selects "Modo de importación" y "Comportamiento ante id duplicado"), la aplicación debe mostrar una ventana de espera mientras dura el procesamiento de la importación.

Actualmente, al confirmar la importación no aparece ningún indicador visual de que la operación está en curso, aunque puede tratarse de una operación larga. Esto puede hacer que el usuario piense que la aplicación se ha quedado congelada o que su pulsación no ha tenido efecto.

Con este cambio, justo después de pulsar "Importar" en ese diálogo, se muestra una ventana de espera (con indicador de tipo spinner y el texto "Importando…") que cubre todo el tiempo que dura el procesamiento de la importación, y se cierra automáticamente en cuanto termina, dando paso al resultado de la importación como ocurre hoy.

### Puntos de alcance resueltos

- **Qué cubre la espera**: todo el procesamiento de la importación disparado al confirmar el diálogo (migración de datos, fusión de lo importado con lo existente, y la recarga de los distintos elementos del juego). No cubre la posterior pantalla de resultado/informe de la importación, que se muestra ya sin la ventana de espera activa, por tratarse de un resultado y no de una espera.
- **Cancelación**: la espera no es cancelable por el usuario; una vez confirmada la importación, debe completarse.
- **Errores durante la importación**: el comportamiento ante errores no cambia respecto al actual; si la importación falla, la ventana de espera se retira igualmente y el error se maneja como hoy.
- **Alcance del cambio**: afecta exclusivamente al botón "Importar" de este diálogo de confirmación final del proceso de importación. No afecta a ningún otro flujo, botón o punto de la aplicación distinto de este.

## Technical notes

- El diálogo de confirmación es `src/ui/importConfirmModal.js` (`openImportConfirmModal`); su botón "Importar" (`acceptBtn`) es hoy totalmente síncrono y dispara `onAccept`.
- La orquestación del flujo tras confirmar está en `src/ui/editModeToggle.js`, función `proceedWithImport` (dentro de `importComponentsFromFile`): ahí se ejecuta la migración de fichas, la llamada a `mergeImportedGame` (`src/core/importMerge.js`) y las cargas (`loadComponents`/`loadResources`/`loadTags`/`loadGroups`), todo síncrono, y al final se abre `openImportReportModal` con el informe de resultado.
- Ya existe en el proyecto un componente reutilizable para este exacto propósito: `runWithProgressModal` en `src/ui/progressModal.js`. Es una modal especial (`.progress-modal`, sin header/content/footer/botones, con spinner y texto) que se inserta en el DOM, espera doble `requestAnimationFrame` para garantizar que el spinner se pinte antes de bloquear el hilo, ejecuta el `work` síncrono recibido dentro de un `try/finally`, y se retira sola al terminar (incluso si `work` lanza error). Es el único mecanismo de "ventana de espera" presente hoy en la app, usado actualmente para "Añadiendo N carta(s) al mazo…" al soltar una selección de cartas sobre un mazo en modo edición.
- El punto de inserción natural es envolver el bloque de trabajo de `proceedWithImport` (líneas ~78-108 de `editModeToggle.js`, antes de abrir `openImportReportModal`) en `runWithProgressModal('Importando…', () => { ... })`, siguiendo el mismo criterio ya usado para el caso de añadir cartas al mazo.
- El patrón está documentado como excepción única al esqueleto estándar de modales (`.modal-overlay > .modal` con header/content/footer) en `previo-sdd/design/docs/style/03-modales-menus.md`, sección 12.1.2, incluyendo la nota sobre por qué se usa doble `requestAnimationFrame` en vez de `setTimeout(fn, 0)` (referencia al bug 00218).
