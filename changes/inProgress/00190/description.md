- **Nombre**: Renombrar "Grupos" a "Etiquetas"
- **Código**: 00190
- **Tipo**: change
- **Fecha creación**: 2026-08-07

## Prompt original del usuario

los Grupos ahora cambian de nombre a Etiquetas

## Descripción completa

El concepto que hoy se llama "Grupo"/"Grupos" en toda la aplicación pasa a llamarse "Etiqueta"/"Etiquetas". Es un cambio de nombre e identidad del concepto, no de comportamiento: un elemento sigue pudiendo pertenecer a varias etiquetas a la vez, exactamente igual que hoy puede pertenecer a varios grupos. Todo lo demás sobre cómo funciona (alta, edición, borrado, filtrado, asignación desde un componente, aviso al borrar una etiqueta en uso, etc.) se mantiene tal cual, solo cambiando el texto mostrado al usuario.

Alcance del renombrado:
- Todos los textos visibles en la interfaz: título y contador del panel flotante ("Grupos (N)" → "Etiquetas (N)"), botón de alta ("+ Añadir grupo" → "+ Añadir etiqueta"), placeholders de filtro, cabeceras de columna, mensajes vacíos ("No hay grupos todavía" → "No hay etiquetas todavía"), modal de alta/edición (título, etiquetas de campo, mensajes de validación de nombre duplicado), confirmación de borrado en uso, menú contextual de asignación, sección "Grupos" de la pestaña "Generales" de cualquier componente, mensajes de error de importación/exportación, toasts de confirmación.
- La documentación funcional y técnica del proyecto que describe este concepto.

Se pregunto al usuario sobre el alcance y confirmó:
- **¿Es solo un cambio de terminología, sin tocar el comportamiento actual?** Sí — solo terminología, el comportamiento (multi-pertenencia) no cambia.
- **¿Debe renombrarse también por dentro (identificadores de código, nombres de fichero, claves guardadas en el fichero exportado/autoguardado), o solo lo que ve el usuario?** Sí, se renombra también por dentro, asumiendo el trabajo de compatibilidad hacia atrás que eso implica: las partidas guardadas o exportadas antes de este cambio deben poder seguir cargándose con normalidad.

No hay elementos visuales nuevos ni cambios de disposición en pantalla — mismo aspecto (iconos, colores, posición y tamaño de paneles/modales), solo cambia el texto mostrado. No se ha generado maqueta ni diagrama de navegación por no haber ninguna decisión visual que fijar.

## Apuntes técnicos

- El proyecto ya tiene un precedente de este mismo tipo de renombrado: "Mazo" → "Grupo". `core/persistence.js` (`parseState`) mantiene compatibilidad hacia atrás leyendo las claves antiguas `decks`/`deckPanelState` si las nuevas (`groups`/`groupPanelState`) no están presentes en el guardado. El mismo patrón debería aplicarse para `groups`/`groupPanelState` → las claves nuevas que se decidan para "etiquetas", conservando lectura de las claves antiguas.
- Documentación técnica a actualizar: `design/docs/architecture/03-groups-resources.md` (sección "Modelo de datos de grupo" y referencias cruzadas en otros ficheros hermanos vía `INDEX.md`), y posiblemente convenciones de `design/docs/style/`.
- Documentación funcional a actualizar: `design/docs/features/008-grupos-organizacion-de-elementos-por-nombre.md` (contenido y, si el proyecto numera por nombre de fichero de forma estable, valorar si el nombre de fichero también debe reflejar "etiquetas").
- Ficheros con texto visible "Grupo(s)" detectados en el análisis: `ui/componentModal.js`, `ui/groupList.js`, `ui/groupModal.js`, `ui/groupDeleteConfirmModal.js`, `ui/contextMenu.js`, `ui/columnHeaderMenu.js`, `ui/elementSelectionModal.js`, `ui/importReportModal.js`, `ui/exportSelectionModal.js`, `ui/styleClipboardSelectionModal.js`, `ui/styleClipboardErrorModal.js`, `modes/edit/editMode.js`, `core/styleClipboard.js`.
- Identificadores/estructura interna relacionados con "grupo" que quedarían dentro del alcance de renombrado por dentro: fichero `core/group.js`, funciones `getComponentsUsingGroup`/`isGroupNameTaken`/`addGroup`/`replaceGroup`/`removeGroup`/`loadGroups`/`getGroups` (`core/state.js`), eventos `groups:changed`/`groupPanelState:changed`, campos `component.grupoIds`/`grupoNames` (usados también por `core/styleClipboard.js`, `core/importMerge.js`, `core/fichaMigration.js`), ficheros `ui/groupList.js`/`ui/groupModal.js`/`ui/groupDeleteConfirmModal.js`.
- Decidir en `plan.md` (ms-how) el nuevo vocabulario técnico exacto en inglés/español para identificadores (p.ej. `tag`/`tagIds` vs. mantener parcialmente `grupo` en algún sitio) y el criterio de qué se renombra primero para minimizar el riesgo de una entrega tan extendida.
