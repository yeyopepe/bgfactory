- **Nombre**: Persistir el estado del panel de lista de componentes en el autoguardado
- **Código**: 00014
- **Tipo**: change

## Prompt original del usuario

el sistema de perisistencia con localstorage debe guardar también el estado de los elementos específicos del modo edición (ahora solo lista de componentes)

## Descripción completa

Hoy el autoguardado en el navegador (localStorage) recuerda únicamente la lista de componentes de la mesa. Al recargar la página, el panel flotante de "Componentes" del modo edición vuelve siempre a su estado inicial (posición por defecto arriba-derecha, ancho por defecto, expandido), aunque el usuario lo haya movido, redimensionado o colapsado antes de recargar.

Se amplía el autoguardado para que también recuerde, específicamente, el estado de ese panel:

- **Posición**: si el usuario ha arrastrado el panel a otro sitio de la mesa, esa posición se recuerda al recargar. Si no se ha movido nunca, se mantiene el anclaje por defecto (arriba-derecha).
- **Ancho**: si el usuario ha redimensionado el panel, ese ancho se recuerda al recargar. Si no se ha redimensionado nunca, se mantiene el ancho por defecto.
- **Colapsado/expandido**: si el usuario ha colapsado el panel (para dejar más mesa visible), ese estado se recuerda al recargar; igualmente si lo ha dejado expandido.

Este guardado es continuo y automático, igual que ya ocurre hoy con los componentes: cada vez que el usuario mueve, redimensiona o colapsa/expande el panel, el cambio queda guardado de inmediato en el navegador, sin necesidad de ninguna acción explícita de guardado.

Lo que **no** se recuerda es qué componente estaba seleccionado (la fila resaltada en el listado): es un estado de trabajo momentáneo mientras se edita, no una preferencia del panel, y además podría referenciar un componente que ya no exista tras recargar (por ejemplo, si se eliminó desde otra pestaña/sesión antes de la recarga). Al recargar, ningún componente aparece seleccionado, igual que al entrar por primera vez en modo edición hoy.

Esto es independiente de la opción "Guardar" de la barra de edición, que exporta un fichero HTML jugable: ese export no incluye ni se ve afectado por el estado del panel, ya que el modo jugar no lo muestra. El nuevo guardado de estado del panel solo aplica al autoguardado en el navegador donde se está editando.

Si no hay ningún estado de panel guardado todavía (por ejemplo, la primera vez que se usa esta funcionalidad, con un guardado previo que aún no incluía este dato), el panel se comporta como hasta ahora: expandido, con posición y ancho por defecto.

### Preguntas de alcance resueltas

- **¿Qué parte del estado del panel se guarda?** Posición, ancho y colapsado/expandido. No se guarda la selección de componente (es momentánea y podría quedar obsoleta).
- **¿Dónde se guarda?** En el mismo autoguardado del navegador que ya guarda la lista de componentes — un único guardado, no dos independientes.
- **¿Cuándo se guarda?** En cada cambio (mover, redimensionar, colapsar/expandir), igual que ya ocurre con los componentes.
- **¿Afecta al "Guardado como" que exporta un HTML jugable?** No, ese export no cambia.
- **¿Qué pasa si no hay estado de panel guardado?** Se usan los valores por defecto actuales (expandido, posición y ancho por defecto).

## Apuntes técnicos

- El estado del panel vive hoy como variables a nivel de módulo en `src/modes/edit/editMode.js` (líneas 15-18): `selectedComponentId`, `collapsed`, `panelPosition` (`{ left, top }` o `null` = anclaje por defecto), `panelWidth` (px o `null` = 300px por defecto de `main.css`). Sobreviven mientras dura la sesión en memoria (se re-renderiza `renderEditMode` completo ante cualquier `components:changed`, pero estas variables quedan fuera de la función), pero se pierden siempre al recargar la página porque nunca se persisten.
- `renderComponentList` (`src/ui/componentList.js`) ya expone los callbacks `onPanelMove` y `onPanelResize` (invocados al soltar el arrastre/redimensionado) y recibe `collapsed`/`onToggleCollapse`; `editMode.js` ya los conecta a sus variables de módulo (líneas 96-108).
- La persistencia actual vive en `src/core/persistence.js`: `saveState(components)`/`loadState()` sobre la clave única `localStorage['errantes:state']`, con forma `{ version, components }`; `parseState` invalida todo el guardado si `version` no coincide con `CURRENT_VERSION` o si `components` no es array. Habría que ampliar esa forma con un campo nuevo para el estado del panel, y ajustar `parseState`/`saveState`/`loadState` en consecuencia.
- El autoguardado se dispara hoy en `src/main.js` (línea 39) vía `on('components:changed', (components) => saveState(components))` — solo se llama a `saveState` cuando cambian los componentes, nunca cuando cambia el panel (mover/redimensionar/colapsar no emiten ningún evento del `eventBus` hoy, solo mutan las variables de módulo de `editMode.js` directamente).
- Al arrancar, `main.js` decide entre `loadState()` (si hay guardado válido), la semilla embebida (`readSeedState()`) o un componente por defecto (`seedDefaultComponent()`) — el estado inicial del panel debería aplicarse solo en el primer caso (guardado válido existente), y usar los valores por defecto actuales en los otros dos.
