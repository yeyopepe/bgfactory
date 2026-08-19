- **Creation date**: 2026-08-19
- **Risk**: 1/10 — Riesgo mínimo

## (a) Notas funcionales

**Fuera de alcance:** no se toca ningún otro flujo, botón o punto de la aplicación distinto del botón "Importar" del diálogo de confirmación final de importación. La pantalla de resultado/informe de la importación (`openImportReportModal`) se sigue mostrando igual que hoy, sin la ventana de espera activa. La espera no es cancelable y el manejo de errores durante la importación no cambia.

**Dudas resueltas con el usuario:** ninguna — `description.md` ya documenta la solución técnica exacta (fichero, función y componente reutilizable a usar), sin ambigüedad que resolver.

## (b) Solución técnica

- [x] **`src/ui/editModeToggle.js` — importar `runWithProgressModal`.** Añadir `import { runWithProgressModal } from './progressModal.js';` junto al resto de imports de `ui/` (tras la línea de `openImportConversionErrorModal`).
- [x] **`src/ui/editModeToggle.js` — envolver el cuerpo de `proceedWithImport` en `runWithProgressModal`.** Dentro de `importComponentsFromFile` (función `proceedWithImport`, líneas ~78-108), envolver todo el cuerpo actual de la función (desestructuración de `mergeImportedGame`, las cuatro llamadas `loadComponents`/`loadResources`/`loadTags`/`loadGroups`, el bloque de fusión de grupos, `setAppTitle` y la apertura condicional de `openImportReportModal`) en una llamada a `runWithProgressModal('Importando…', () => { ... })`, siguiendo el mismo patrón ya usado en `src/modes/edit/editMode.js` (líneas ~766-769) para "Añadiendo N carta(s) al mazo…". El cuerpo de `proceedWithImport` pasa a ser exactamente el callback `work` de `runWithProgressModal`; la firma y el punto de invocación de `proceedWithImport` no cambian.

## (d) Cambios de estilo

- [x] **`previo-sdd/design/docs/style/03-modales-menus.md`, sección "12.1.2 Modal de operación en curso".** Añadir, junto a la línea existente "Primer uso: arrastrar una selección múltiple de cartas sobre un mazo en modo edición (...)", una nueva línea documentando este segundo uso: confirmar importación de fichero (`ui/importConfirmModal.js`, botón "Importar") — texto "Importando…", `work` ejecuta la migración de fichas, `mergeImportedGame` y las cargas (`loadComponents`/`loadResources`/`loadTags`/`loadGroups`) en `ui/editModeToggle.js` (cambio 00222).

## (e) Verificación

- [x] Importar un fichero con componentes seleccionados, confirmar el diálogo final ("Importar — confirmar") pulsando "Importar": aparece de inmediato una ventana de espera centrada, sin header/footer, con spinner girando y el texto "Importando…", sin botones ni forma de cerrarla manualmente (ni click fuera ni ESC).
- [x] Al terminar el procesamiento, la ventana de espera se cierra sola y, si el resultado de la importación genera informe, se muestra `openImportReportModal` con normalidad — sin que la ventana de espera siga visible ni se muestren ambas a la vez.
- [x] Si la importación no genera informe (report vacío), la ventana de espera se cierra sola y no se abre ningún modal adicional — el comportamiento posterior a la espera es idéntico al actual.
- [x] El resto de puntos de entrada del flujo de importación (selección de fichero, modal de selección de componentes, modal de conflictos de conversión de fichas) no muestran ninguna ventana de espera nueva — solo aparece tras pulsar "Importar" en el diálogo de confirmación final.
