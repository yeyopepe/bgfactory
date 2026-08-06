- **Nombre**: Rediseño visual de la barra superior del modo edición
- **Código**: 00171
- **Tipo**: change
- **Fecha creación**: 2026-08-06

## Prompt original del usuario

vamos rediseñar la barra superior del modo edición. Quiero mockup de un nuevo estilo visual para esa barra teniendo en cuenta las funcionalidades actuales y las futuras.

Funcionalidades futuras:
- Exportar recursos: permite seleccionar un tipo de recursos (o todos) y exportarlos en un zip
- Exportar hoja de producción: permite exportar en formato csv una lista de todos los elementos con su información necesaria para producir el juego.

## Descripción completa

La barra superior que aparece en Modo Edición se rediseña visualmente: se reorganizan y restilizan las acciones que ya existen hoy, sin cambiar lo que hace ninguna de ellas. Las cinco acciones actuales — "Salir del modo edición", "Guardar", "Exportar", "Importar" y "Ajustar zoom" — siguen comportándose exactamente igual que ahora; solo cambia cómo se agrupan y se presentan visualmente dentro de la barra.

El nuevo diseño se ha pensado ya teniendo en cuenta dos funcionalidades que se añadirán más adelante, en cambios aparte, para que la barra las pueda acomodar sin necesitar un segundo rediseño:

- **Exportar recursos**: permitirá elegir un tipo de recurso (o todos) y descargarlos en un fichero zip.
- **Exportar hoja de producción**: permitirá exportar en formato csv un listado de todos los elementos del juego con la información necesaria para producirlo.

Estas dos funcionalidades futuras **no se implementan en este cambio** — no hacen nada todavía ni tienen lógica real. Se representan únicamente en la maqueta visual, para validar que el nuevo diseño de la barra tiene sitio natural para ellas cuando se construyan.

### Preguntas de alcance resueltas con el usuario

- **Alcance de este cambio**: ¿solo rediseño visual de las acciones actuales, o se implementan ya las 2 funcionalidades futuras? → Solo rediseño visual/organizativo. Las 2 funcionalidades futuras quedan fuera de alcance, se plantearán como cambios independientes más adelante.
- **Agrupación visual de las acciones**: ¿en bloques separados o todas en línea? → En bloques agrupados por su propósito, separados entre sí visualmente:
  1. **Sesión**: "Salir del modo edición".
  2. **Persistencia**: "Guardar", "Importar".
  3. **Exportar**: un desplegable "Exportar" que muestra las distintas opciones de exportación disponibles (hoy solo la exportación actual; el diseño deja sitio para que en el futuro aparezcan ahí también "Exportar recursos" y "Exportar hoja de producción").

  Aparte de estos tres bloques, la utilidad "Ajustar zoom" (un botón de solo icono) se mantiene independiente, ya que no es una acción sobre los datos del juego sino sobre la vista de la mesa.
- **Selección del tipo de recurso a exportar** (para cuando se implemente "Exportar recursos" más adelante): se hará mediante una ventana de selección, siguiendo el mismo patrón ya usado hoy para elegir qué exportar en la exportación actual.

### Aspecto general del nuevo diseño

Todas las acciones que hoy solo muestran texto pasan a mostrar también un icono identificativo, para que se reconozcan más rápido de un vistazo. El desplegable "Exportar" se abre junto al propio botón y lista las opciones de exportación disponibles como filas seleccionables, cerrándose al elegir una opción o al hacer click fuera de él. El estilo general (colores, franja oscura de fondo, tipografía) se mantiene coherente con el resto de la aplicación — es una reorganización y mejora de la presentación, no un cambio de identidad visual.

## Apuntes técnicos

- Franja actual: `.edit-toolbar` (`src/styles/main.css`), renderizada por `renderEditToolbar` en `src/ui/editModeToggle.js`. Hoy es una fila plana de 5 botones (`Salir`, `Guardar`, `Exportar`, `Importar`, botón de icono `createFitButton`), todos con el mismo estilo (`.edit-toolbar button`), alineados a la derecha (`justify-content: flex-end`).
- El título editable vive fuera de esta franja (`h1#app-title`, `ui/appTitle.js`, contenedor `#edit-toolbar` separado en `index.html`) — no forma parte del alcance de este cambio.
- "Exportar" (JSON) ya usa hoy un flujo de modal de selección (`ui/exportSelectionModal.js`, clase `.element-selection-modal`) — mismo patrón a reutilizar cuando se implemente "Exportar recursos" más adelante.
- Ya existe en el proyecto un patrón de menú desplegable reutilizable visualmente: `.context-menu` (`ui/contextMenu.js`, `src/styles/main.css` ~línea 2096), con filas (`.context-menu__item`), separador (`.context-menu__separator`) y estado deshabilitado (`.context-menu__item--disabled`) — buena base para el nuevo desplegable "Exportar" de la barra, aunque `ms-how` decidirá si se reutiliza tal cual o se adapta.
- Botones con icono ya usan un lenguaje SVG consistente en la barra: `stroke="currentColor"`, clase `.icon-frame` (16px), ver `createFitButton` en `editModeToggle.js`.
- Design tokens relevantes de `STYLE_BIBLE.md`: `--bg-toolbar`, `--text-light`, `--accent-blue`, `--radius-sm`, `--shadow-1`, `--transition-fast`; botón sobre fondo oscuro (sección 9): transparente, borde `1px solid var(--text-light)`, hover `rgba(255,255,255,0.1)`.
- No se ha detectado ninguna incongruencia entre `ARCHITECTURE.md`/`STYLE_BIBLE.md` y el código real durante este análisis.
