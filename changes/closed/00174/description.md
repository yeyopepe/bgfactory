- **Nombre**: Botón de limpiar en las barras de búsqueda de Componentes, Recursos y Grupos
- **Código**: 00174
- **Tipo**: change
- **Fecha creación**: 2026-08-06

## Prompt original del usuario

añade a las ventanas de componentes, recursos y grupos un botón para limpiar la barra de búsqueda si tiene algo escrito

## Descripción completa

En modo edición, las ventanas flotantes de "Componentes", "Recursos" y "Grupos" tienen cada una una barra de búsqueda con la que filtrar su listado escribiendo texto libre. Se añade a las tres, junto al campo de texto, un botón para limpiar ese campo de un solo clic.

El botón está siempre visible junto al campo de búsqueda de las tres ventanas. Si el campo está vacío, pulsarlo no tiene ningún efecto perceptible. Si el campo tiene texto escrito, al pulsarlo se vacía inmediatamente y el listado vuelve a mostrar todos los elementos sin ningún filtro de texto aplicado — limpiar el campo y quitar el filtro son la misma acción, no dos pasos distintos.

El comportamiento y el aspecto del botón son idénticos en las tres ventanas: no hay diferencias entre Componentes, Recursos y Grupos.

Este cambio no afecta a ningún otro filtro o criterio de ordenación que puedan tener estas ventanas (p. ej. filtros u ordenación por columna) — solo limpia el texto libre de búsqueda.

### Preguntas de alcance resueltas con el usuario

- **¿Cuándo debe verse el botón?** Siempre visible junto al campo, no solo cuando hay texto escrito.
- **¿Qué debe hacer al pulsarlo?** Vaciar el campo y quitar el filtro de texto aplicado, en el mismo acto.
- **¿Debe comportarse igual en las tres ventanas?** Sí, sin diferencias entre ellas.

## Apuntes técnicos

Las tres ventanas (`ui/componentList.js`, `ui/resourceList.js`, `ui/groupList.js`) implementan el filtro de texto de forma idéntica pero independiente entre sí: cada módulo mantiene su propio estado `filterText` (variable de módulo, no persistida), con un `<input type="text">` dentro de una `filterBar` (`component-panel__filter` / `resource-panel__filter` / `group-panel__filter`) cuyo `input` handler actualiza `filterText` y vuelve a renderizar la lista filtrada (`matchesFilter(x, filterText)`). El mismo `filterText` controla a la vez el valor visual del input y el filtro aplicado, así que vaciar el input y quitar el filtro son la misma operación (`filterText = ''` + re-render).

No existe en el proyecto ningún patrón previo de "botón de limpiar" en un campo de texto que debiera reutilizarse; habrá que definirlo de cero. Ninguna incongruencia detectada entre `ARCHITECTURE.md`/`STYLE_BIBLE.md` y el código durante el análisis.
