- **Name**: Rediseño visual de la barra superior del modo edición
- **Code**: 00171
- **Type**: change
- **Creation date**: 2026-08-06

## Full description

La barra superior que aparece en Modo Edición se rediseña visualmente: se reorganizan y restilizan las acciones que ya existen hoy, sin cambiar lo que hace ninguna de ellas. Las cuatro acciones que se mantienen — "Salir del modo edición", "Exportar", "Importar" y "Ajustar zoom" — siguen comportándose exactamente igual que ahora; solo cambia cómo se agrupan y se presentan visualmente dentro de la barra.

La acción **"Guardar" se elimina por completo** de la barra y de la aplicación: ya no existe ninguna forma de guardar el juego como fichero HTML autónomo (ese flujo era distinto del "Exportar" en JSON, que se mantiene sin cambios). No queda ningún resto visual ni funcional de "Guardar".

El nuevo diseño se ha pensado ya teniendo en cuenta dos funcionalidades que se añadirán más adelante, en cambios aparte, para que la barra las pueda acomodar sin necesitar un segundo rediseño:

- **Exportar recursos**: permitirá elegir un tipo de recurso (o todos) y descargarlos en un fichero zip.
- **Exportar hoja de producción**: permitirá exportar en formato csv un listado de todos los elementos del juego con la información necesaria para producirlo.

Estas dos funcionalidades futuras **no se implementan en este cambio** — no hacen nada todavía ni tienen lógica real. Se representan en la maqueta visual como opciones visibles pero desactivadas dentro del desplegable "Exportar", con una etiqueta "Próximamente" junto a cada una, para validar que el nuevo diseño de la barra tiene sitio natural para ellas cuando se construyan.

### Preguntas de alcance resueltas con el usuario

- **Alcance de este cambio**: ¿solo rediseño visual de las acciones actuales, o se implementan ya las 2 funcionalidades futuras? → Solo rediseño visual/organizativo. Las 2 funcionalidades futuras quedan fuera de alcance, se plantearán como cambios independientes más adelante.
- **Agrupación visual de las acciones**: ¿en bloques separados o todas en línea? → En bloques agrupados por su propósito, separados entre sí visualmente:
  1. **Sesión**: "Salir del modo edición".
  2. **Persistencia**: "Importar" (tras eliminar "Guardar", este bloque queda con una sola acción).
  3. **Exportar**: un desplegable "Exportar" que muestra las distintas opciones de exportación disponibles (hoy solo la exportación actual; el diseño deja sitio para que en el futuro aparezcan ahí también "Exportar recursos" y "Exportar hoja de producción", mostradas ya en la maqueta como filas desactivadas con etiqueta "Próximamente").
- **Eliminación de "Guardar"**: ¿se retira solo el botón de la barra o también el código que ya no se usará? → Se elimina también la lógica que ya no tiene ningún punto de entrada (la función `saveAs` y el flujo de exportar a HTML autónomo en `editModeToggle.js`), para no dejar código muerto.

  Aparte de estos tres bloques, la utilidad "Ajustar zoom" (un botón de solo icono) se mantiene independiente, ya que no es una acción sobre los datos del juego sino sobre la vista de la mesa.
- **Selección del tipo de recurso a exportar** (para cuando se implemente "Exportar recursos" más adelante): se hará mediante una ventana de selección, siguiendo el mismo patrón ya usado hoy para elegir qué exportar en la exportación actual.

### Aspecto general del nuevo diseño

Todas las acciones que hoy solo muestran texto pasan a mostrar también un icono identificativo, para que se reconozcan más rápido de un vistazo. El desplegable "Exportar" se abre junto al propio botón y lista las opciones de exportación disponibles como filas seleccionables, cerrándose al elegir una opción o al hacer click fuera de él. El estilo general (colores, franja oscura de fondo, tipografía) se mantiene coherente con el resto de la aplicación — es una reorganización y mejora de la presentación, no un cambio de identidad visual.

## Technical notes

- Franja actual: `.edit-toolbar` (`src/styles/main.css`), renderizada por `renderEditToolbar` en `src/ui/editModeToggle.js`. Hoy es una fila plana de 5 botones (`Salir`, `Guardar`, `Exportar`, `Importar`, botón de icono `createFitButton`), todos con el mismo estilo (`.edit-toolbar button`), alineados a la derecha (`justify-content: flex-end`).
- "Guardar" a eliminar: botón en `editModeToggle.js` líneas 177-184, y la función `saveAs()` (líneas 22-26) que llama a `buildExportHtml`/`downloadHtml` (`src/core/fileExport.js`). Al retirarlo, comprobar si `buildExportHtml` y/o `downloadHtml` quedan sin otros usos en el proyecto (en cuyo caso también se eliminan) o si algo más los sigue usando.
- Las filas "Exportar recursos (.zip)" y "Exportar hoja de producción (.csv)" del desplegable "Exportar" se implementan visualmente como no interactivas (sin `onClick`, cursor `not-allowed`, opacidad reducida) con la etiqueta "Próximamente" junto al texto, siguiendo el patrón ya definido en la maqueta (`.export-menu__item--soon` / `.export-menu__soon-tag`) — ver también el patrón genérico ya existente en el proyecto para filas deshabilitadas, `.context-menu__item--disabled` (`src/styles/main.css` ~línea 2488, usado por `ui/contextMenu.js`), como referencia alternativa si `pv-how` decide construir el desplegable sobre ese componente compartido en lugar de marcado a medida.
- El título editable vive fuera de esta franja (`h1#app-title`, `ui/appTitle.js`, contenedor `#edit-toolbar` separado en `index.html`) — no forma parte del alcance de este cambio.
- "Exportar" (JSON) ya usa hoy un flujo de modal de selección (`ui/exportSelectionModal.js`, clase `.element-selection-modal`) — mismo patrón a reutilizar cuando se implemente "Exportar recursos" más adelante.
- Ya existe en el proyecto un patrón de menú desplegable reutilizable visualmente: `.context-menu` (`ui/contextMenu.js`, `src/styles/main.css` ~línea 2096), con filas (`.context-menu__item`), separador (`.context-menu__separator`) y estado deshabilitado (`.context-menu__item--disabled`) — buena base para el nuevo desplegable "Exportar" de la barra, aunque `pv-how` decidirá si se reutiliza tal cual o se adapta.
- Botones con icono ya usan un lenguaje SVG consistente en la barra: `stroke="currentColor"`, clase `.icon-frame` (16px), ver `createFitButton` en `editModeToggle.js`.
- Design tokens relevantes de `STYLE_BIBLE.md`: `--bg-toolbar`, `--text-light`, `--accent-blue`, `--radius-sm`, `--shadow-1`, `--transition-fast`; botón sobre fondo oscuro (sección 9): transparente, borde `1px solid var(--text-light)`, hover `rgba(255,255,255,0.1)`.
- No se ha detectado ninguna incongruencia entre `ARCHITECTURE.md`/`STYLE_BIBLE.md` y el código real durante este análisis.
