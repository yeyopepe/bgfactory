- **Nombre**: Exportar/importar componentes en JSON
- **Código**: 00024
- **Tipo**: change

## Prompt original del usuario

"incorporar botones para exportar/importar en formato json todo el estado del juego. El objetivo es que el usuario añada sus componentes, los exporte y luego los pueda volver a cargar cuando haya una nueva versión de la aplicación."

Aclaraciones posteriores confirmadas por el usuario:
- Al importar: reemplazo completo de los componentes actuales (no fusión).
- Cualquier error al importar se muestra en una ventana modal con el detalle del error (no un toast).
- El resto de propuestas iniciales (qué se exporta, disponibilidad solo en modo edición, confirmación previa antes de reemplazar, tolerancia a versión distinta al importar, selector de fichero, prompt de nombre al exportar) quedan confirmadas tal cual se propusieron.

## Descripción completa

Se añaden dos botones nuevos, "Exportar" e "Importar", en la barra de herramientas del modo edición, junto al botón "Guardar" ya existente. El objetivo es que el usuario pueda exportar únicamente los datos de sus componentes (no la aplicación completa) a un fichero JSON, y volver a importarlos más adelante — típicamente en una versión más nueva de la aplicación — sin perder su trabajo.

**Diferencia con "Guardar" (ya existente):** "Guardar" descarga una copia completa de la aplicación (HTML) con el estado embebido, quedando fijada a la versión en la que se generó. Los botones nuevos exportan/importan solo los datos de los componentes en un JSON ligero, pensado explícitamente para sobrevivir a cambios de versión de la aplicación.

**Exportar:**
- Disponible solo en modo edición, junto a "Guardar".
- Al pulsar, se pide el nombre de fichero (mismo patrón que "Guardar"), precargado con un nombre por defecto (p.ej. `errantes-componentes.json`).
- Descarga un fichero JSON con los componentes actuales y la versión de la aplicación con la que se generó — sin incluir la configuración del panel flotante de edición, que no es contenido de partida.

**Importar:**
- Disponible solo en modo edición, junto a "Exportar".
- Al pulsar, abre un selector de fichero limitado a `.json`.
- El fichero seleccionado se valida: debe ser un JSON con la lista de componentes reconocible. **A diferencia de la comprobación que ya existe para el guardado automático del navegador, no se rechaza por venir de una versión distinta a la actual de la aplicación** — ese es precisamente el objetivo del cambio: poder cargar componentes exportados desde una versión anterior en una versión nueva.
- Si la validación falla (fichero vacío, JSON corrupto, estructura inesperada, o cualquier otro error durante la importación), se muestra una **ventana modal con el detalle del error**, para que el usuario pueda leer con calma qué ha fallado. No se usa un aviso breve tipo toast para este caso.
- Si la validación es correcta, se pide **confirmación previa** al usuario (mismo patrón que otras acciones destructivas de la aplicación, p.ej. borrar un componente), advirtiendo de que se van a reemplazar todos los componentes actuales.
- Si se confirma, los componentes actuales se **reemplazan por completo** (no se combinan/fusionan) por los del fichero importado, y el resultado queda guardado automáticamente igual que cualquier otro cambio de componentes.
- Si se cancela la confirmación, no se aplica ningún cambio.

**Flujo de importación:**

```mermaid
flowchart TD
    A[Usuario pulsa Importar] --> B[Selector de fichero .json]
    B --> C{Fichero seleccionado?}
    C -->|No| Z[Sin cambios]
    C -->|Sí| D[Leer y parsear JSON]
    D --> E{JSON valido con lista de componentes?}
    E -->|No| F[Modal con detalle del error]
    E -->|Si| G[Confirmacion: reemplazar componentes actuales]
    G -->|Cancela| Z
    G -->|Confirma| H[Reemplazar componentes]
    H --> I[Guardado automatico del nuevo estado]
```

**Casos límite confirmados:**
- Fichero vacío, JSON corrupto, o sin lista de componentes válida → modal de error, sin tocar el estado actual.
- Versión del JSON distinta a la versión actual de la aplicación → se acepta igualmente (no es un error, es el caso de uso principal del cambio).
- Cancelar el selector de fichero o la confirmación → no se aplica ningún cambio, el estado actual permanece intacto.
- Ambos botones solo visibles/disponibles en modo edición, igual que "Guardar".

## Apuntes técnicos

- `src/ui/editModeToggle.js`: `renderEditToolbar` construye la barra de edición (`.edit-toolbar`) con los botones "Salir del modo edición" y "Guardar" (este último vía `saveAs()`, que usa `buildExportHtml`/`downloadHtml` de `src/core/fileExport.js`). Los botones "Exportar"/"Importar" son candidatos a añadirse aquí, junto al de "Guardar".
- `src/core/fileExport.js` ya tiene el patrón de descarga de fichero (`downloadHtml`, `Blob` + `<a download>`); se puede reutilizar un patrón análogo para descargar el JSON de componentes.
- `src/core/persistence.js` (`parseState`) ya valida forma de un estado guardado (versión + `components` como array) para `localStorage`/semilla embebida, pero **rechaza si `parsed.version !== CURRENT_VERSION`** — la validación de importación deberá ser una función distinta (o una variante) que no aplique esa condición de versión, ya que el objetivo del cambio es justo tolerarla.
- `src/core/state.js`: `loadComponents(components)` ya reemplaza `state.components` por completo y emite `components:changed` — es la función a reutilizar para aplicar el reemplazo tras confirmar la importación; el autoguardado (`core/persistence.js`, suscrito a ese evento) se dispara solo.
- Patrón de modal ya existente en la app (`modal-overlay`/`modal`, botón "Cerrar") usado por `ui/helpIcon.js` y `ui/componentModal.js` — reutilizable para la modal de error de importación en vez de crear un patrón visual nuevo.
- Patrón de confirmación ya existente (usado, p.ej., al borrar un componente desde el panel o desde la modal) — reutilizable para la confirmación previa al reemplazo de componentes al importar.
