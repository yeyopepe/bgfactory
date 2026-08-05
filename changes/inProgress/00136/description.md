- **Nombre**: Renombrar "tablero" a "tablero simple"
- **Código**: 00136
- **Tipo**: change
- **Fecha creación**: 2026-08-05

## Prompt original del usuario

Renombrar el elemento actual llamado "tablero" a "tablero simple" para clarificar que es una versión básica, en contraste con el nuevo "tablero personalizado" que se está considerando agregar con mayores capacidades visuales.

## Descripción completa

El tipo de componente que hoy se llama "Tablero" pasa a llamarse "Tablero simple", tanto en el texto que ve el usuario como en el valor que se guarda internamente para identificarlo. El objetivo es dejar el nombre preparado para poder distinguirlo claramente de un futuro tipo "Tablero personalizado" (con mayores capacidades visuales) que se está considerando añadir más adelante — ese tipo nuevo no se implementa en este cambio, solo se libera y aclara el nombre del existente.

Con este cambio, en cualquier sitio donde hoy aparece el texto "Tablero" identificando este tipo de componente (el selector de tipo al pulsar "+ Añadir componente", el aviso que aparece al pasar el ratón por encima de un componente en la mesa, y las listas de confirmación al borrar varios componentes o un grupo) pasará a decir "Tablero simple". El comportamiento y las opciones de configuración del componente (bordes, fondo de color/patrón o imagen, etc.) no cambian en absoluto — solo su nombre.

Las partidas y plantillas ya guardadas con tableros creados antes de este cambio se siguen abriendo con normalidad: la migración de nombre ocurre de forma automática y transparente al cargarlas, sin ninguna acción por parte del usuario.

### Preguntas de alcance resueltas con el usuario

- **¿Se cambia solo el texto visible, o también el identificador interno con el que se guarda cada tablero?** Se cambia también el identificador interno (no solo la etiqueta visible), para que quede coherente de cara a cuando exista "Tablero personalizado" — de lo contrario "Tablero simple" seguiría guardándose internamente sin más como "tablero" a secas.
- **¿Qué forma debe tener el nuevo identificador interno?** `tableroSimple`, consistente con el resto de nombres usados en el proyecto para conceptos compuestos por varias palabras.

### Fuera de alcance

- No se implementa "Tablero personalizado" ni ninguna funcionalidad nueva — este cambio es puramente un renombrado del tipo existente, más la compatibilidad con lo ya guardado.
- No cambian nombres en inglés usados solo internamente en el código (no visibles para el usuario) que hoy contienen la palabra "board" — no aportan nada renombrarlos ahora y sería ampliar el alcance sin necesidad funcional.

## Apuntes técnicos

- Etiqueta visible del tipo, en dos sitios que hay que mantener sincronizados por duplicar el mapeo hoy: array `COMPONENT_TYPES` en `ui/componentTypeModal.js` (fuente de `getComponentTypeLabel()`, reutilizada por `bulkDeleteConfirmModal.js`, `groupDeleteConfirmModal.js` y `groupModal.js`) y el mapa `COMPONENT_TYPE_LABELS` en `ui/componentRenderer.js` (usado por `formatComponentIdentifier()` para el tooltip "Tipo: id" al pasar el ratón sobre un componente en la mesa).
- Comprobaciones `component.type === 'tablero'` a actualizar a `'tableroSimple'`: `ui/componentModal.js` (líneas ~125 y ~592), `ui/componentRenderer.js` (línea ~653), `modes/play/playMode.js` (línea ~176). Revisar también el comentario de `ui/cardShapeModal.js` (línea ~95) que menciona `'tablero'` como referencia.
- Compatibilidad con datos guardados: `core/state.js` ya tiene el patrón exacto a replicar — funciones `migrateFichas`/`migrateDeckIdToGrupo`, ambas invocadas desde `loadComponents(components)`, migración in-place, best-effort, con el criterio explícito de "nunca debe bloquear el arranque". Se puede añadir una función análoga (p.ej. `migrateTableroSimple`) que convierta `type: 'tablero'` a `type: 'tableroSimple'`.
- Los ficheros de prueba (`src/test/*.json`) que ya tienen `"type": "tablero"` no hace falta actualizarlos — sirven como caso real que ejercita la migración al cargarlos.
- Documentación técnica a actualizar como parte de este cambio (no es un ajuste "fast", afecta a `docs.tech`):
  - `design/docs/ARCHITECTURE.md`: sección 4 "Modelo de datos de componente" (el ejemplo de valores posibles de `type`), la entrada específica del tipo (línea ~117, hoy bajo `'tablero'`), y la mención cruzada de la sección de checklist para tipos nuevos (línea ~321).
  - `design/docs/FEATURES.md`: sección "### Componente 'tablero'" (línea ~187) y las menciones de "tablero" como uno de los tipos de componente en listados (líneas ~145, ~173, ~247, ~324).
  - `design/docs/stylebible/STYLE_BIBLE.md`: menciones del identificador en las excepciones de estilo del bisel (línea ~85, sección 5, y línea ~236, sección 12.5) — dejar claro que la clase CSS `.board` (y demás nombres en inglés) no cambian de nombre pese a este cambio.
- No se ha detectado ninguna incongruencia entre la documentación técnica y el código real durante este análisis — la documentación actual describe correctamente el tipo `'tablero'` tal y como existe hoy en el código.
