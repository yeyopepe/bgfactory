- **Nombre**: El icono de colapso del panel de componentes no colapsa/expande la lista
- **Código**: 00066
- **Tipo**: fix

## Prompt original del usuario

el icono de la parte superior derecha de la lista de componentes del modo edición no des/colapsa la lista

## Descripción completa

En el modo edición, el panel flotante "Componentes" tiene un icono en la esquina superior derecha de su cabecera cuya función es colapsar o expandir la lista que muestra debajo (la tabla de componentes, la barra de filtro y el pie con las acciones).

**Comportamiento actual**: al pulsar ese icono, no pasa nada visible — la lista no se colapsa si estaba expandida, ni se expande si estaba colapsada. El icono en sí tampoco cambia de aspecto para reflejar el nuevo estado.

**Comportamiento esperado**: al pulsar el icono, la lista debe colapsarse o expandirse de inmediato, y el propio icono debe reflejar el estado resultante. Este es exactamente el comportamiento que ya tiene, correctamente, el icono equivalente del panel flotante de recursos ("Recursos"), que está justo al lado y sirve de referencia de cómo debería comportarse también el de componentes.

El resto de funcionalidad del panel de componentes (arrastrarlo, redimensionarlo, filtrar, editar/clonar/eliminar filas, etc.) no está afectada y debe seguir funcionando igual.

## Apuntes técnicos

- El toggle vive en `src/ui/componentList.js` (botón de la cabecera, `renderComponentList`) y se conecta en `src/modes/edit/editMode.js`, función `renderList()`, callback `onToggleCollapse`.
- En `renderEditMode` (`src/modes/edit/editMode.js`), `collapsed` se obtiene con `const { collapsed, ... } = getPanelState()` (línea ~30) y nunca se reasigna localmente. El callback `onToggleCollapse` hace `setPanelState({ collapsed: !collapsed }); renderList();` — pero `renderList()` vuelve a leer el mismo `collapsed` (const, capturado por closure, sin actualizar), así que el re-render inmediato no refleja el cambio.
- El panel de recursos, en el mismo fichero, sí funciona: usa `let resourceCollapsed = getResourcePanelState().collapsed;` y en su `onToggleCollapse` hace `resourceCollapsed = !resourceCollapsed;` antes de `setResourcePanelState(...)` y `renderResourcePanel()`. Ese patrón (variable local mutable, actualizada antes de re-renderizar) es el que falta replicar para el panel de componentes.
- El estado sí se persiste correctamente vía `setPanelState`; el problema es puramente de que el re-render inmediato no usa el valor actualizado hasta que algo más fuerza un `renderEditMode` completo (que sí vuelve a leer `getPanelState()` desde cero).
