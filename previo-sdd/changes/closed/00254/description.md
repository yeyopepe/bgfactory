- **Name**: Eliminar el separador entre "Importar" y "Exportar" en modo edición
- **Code**: 00254
- **Type**: change
- **Creation date**: 2026-09-04

## Full description

En la barra de herramientas de modo edición hay actualmente un separador vertical (una fina línea) entre el botón "Importar" y el botón "Exportar". Se pide eliminar ese separador, de forma que "Importar" y "Exportar" queden contiguos, separados únicamente por el espacio normal que la barra deja entre sus elementos, sin ninguna línea divisoria entre ambos.

### Alcance y decisiones confirmadas con el usuario

- **Solo modo edición.** El cambio afecta exclusivamente a la barra de herramientas de modo edición. En modo juego, la fila de controles de la esquina superior derecha tiene un separador análogo entre el bloque de fichero (Importar/Exportar) y el bloque de acciones (Modo, Ajustar zoom, Configuración); ese separador de modo juego **no se toca** y se mantiene igual.
- **Espaciado resultante.** Tras quitar la línea divisoria, "Importar" y "Exportar" quedan con la separación estándar de la barra. No se pegan del todo ni se añade una separación extra entre ellos.
- **Sin lógica asociada.** El separador es puramente decorativo: no tiene ningún comportamiento, estado ni condición asociada. No hay casos límite ni estados especiales que considerar.

### Definición visual de alto nivel

Antes: `[Importar]  │  [Exportar]` en la barra de modo edición.
Después: `[Importar]  [Exportar]` en la barra de modo edición, sin la línea vertical entre ambos.

## Technical notes

- El separador se renderiza en `src/ui/editModeToggle.js`, función `renderEditToolbar`, como un `<div class="toolbar-divider">` insertado entre el grupo de "Importar" (`createImportControls()`, wrapper `persistenceGroup`) y el grupo de "Exportar" (`createExportMenu()`, wrapper `exportGroup`).
- El comentario de cabecera de esa función (describe el layout `[Importar] │ [Exportar]`) debe actualizarse junto con el cambio.
- CSS en `src/styles/main.css`: reglas `.toolbar-divider` (`width: 1px; height: 1.5rem; background: rgba(255,255,255,0.2)`) y `.toolbar-group` (`display: flex; align-items: center; gap: 0.5rem`). La regla `.toolbar-divider` **debe conservarse**: sigue en uso para el separador de modo juego en `renderModeSwitcher`.
- Se acordó fusionar los dos wrappers `.toolbar-group` de la `.edit-toolbar` en uno solo, para que ambos botones queden en el mismo contenedor flex con `gap` uniforme. La forma técnica exacta la decide `pv-how`.
- **Style bible a actualizar** — `previo-sdd/design/docs/style/002-componentes-layout.md` documenta este separador de modo edición en varios puntos; hay que ajustarlos para reflejar que ya no existe en modo edición (sí en modo juego):
  - Punto "Header control-row separator": indica que el `.toolbar-divider` está presente "solo en modo juego"; sigue siendo cierto, revisar redacción para que no dé a entender que también aplica en la banda `.edit-toolbar`.
  - Punto "Edit mode: `.edit-toolbar` band keeps only `[Importar] │ [Exportar]` (its own `.toolbar-divider` between the two groups, unchanged)": debe pasar a describir la banda `.edit-toolbar` con `[Importar] [Exportar]` contiguos, sin `.toolbar-divider` entre ambos.
  - Fila de tabla "Importar" / "Exportar": revisar si menciona el divisor.
  - Tabla de z-index / capas: la entrada "Header control row" enumera "Importar/Exportar/separator/Modo/Ajustar zoom/Configuración" (describe modo juego); revisar que quede claro y que no implique separador en modo edición.
- Sin componente de datos estructurados. Sin superficie de seguridad (solo DOM de UI, sin entrada de usuario ni datos sensibles).
