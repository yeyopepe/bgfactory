- **Name**: Arrastrar un componente de un grupo mueve también al resto del grupo en modo juego
- **Code**: 00223
- **Type**: fast
- **Creation date**: 2026-08-19

## Full description

En modo juego, si un componente forma parte de un grupo (agrupación creada en modo edición) y ese grupo **no** está bloqueado, al seleccionar y arrastrar uno de sus componentes solo se mueve ese componente individual: el resto de miembros del grupo se queda en su sitio.

Esto es inconsistente con el resto del comportamiento de los grupos: si el grupo está bloqueado, el bloqueo sí se respeta correctamente para todos sus miembros (nadie se mueve).

**Comportamiento esperado**: al arrastrar cualquier componente que pertenezca a un grupo no bloqueado, en modo juego, todo el grupo debe desplazarse junto — cada miembro se mueve el mismo desplazamiento (delta) que se aplica al componente arrastrado, manteniendo sus posiciones relativas entre sí, y ese movimiento conjunto debe verse **en vivo durante el propio arrastre** (no solo al soltar): mientras se arrastra, el resto del grupo debe desplazarse a la vez que el componente seleccionado, sin quedarse quieto hasta el final ni "saltar" de golpe al soltar. Un componente de un grupo bloqueado sigue sin poder moverse, como ya ocurre hoy.

## Technical notes

- Causa raíz en `src/modes/play/playMode.js`, callback `onMove` pasado a `renderComponentsOnTable` (import de `src/ui/componentRenderer.js`): solo actualiza `x, y` del componente arrastrado (`replaceComponent(component.id, updateComponent(component, { x, y }))`), sin considerar `component.groupId` ni desplazar al resto de miembros del grupo.
- `canMove` en ese mismo render (línea ~164) ya usa `getEffectiveGeneralProps(component, groups).bloqueado === 'ninguno'`, que resuelve el bloqueo a nivel de grupo (`core/group.js`, `getEffectiveGeneralProps`) — por eso el bloqueo de grupo sí funciona hoy: ningún miembro puede iniciar el drag.
- Ya existe una implementación de referencia equivalente en modo edición: `src/modes/edit/editMode.js`, `onMove` (línea ~740), calcula `dx = x - component.x`, `dy = y - component.y` y los aplica a todos los componentes que comparten `groupId` (vía `getSelectionUnit`). La solución en modo juego debe replicar esa misma lógica de desplazamiento por delta aplicada a los miembros con el mismo `groupId`, sin las funcionalidades exclusivas de edición (selección múltiple, drop en mazo).
- Aplica al importe de `getComponents()` para localizar los demás miembros del grupo (mismo patrón que `deriveMissingGroups`/`getEffectiveGeneralProps` en `core/group.js`).

## Applied changes

- `src/modes/play/playMode.js`: en el `onMove` de `renderComponentsOnTable` (dentro de `renderTable`), antes de aplicar la actualización de posición del componente arrastrado, se calcula el delta `dx = x - (component.x ?? 0)` y `dy = y - (component.y ?? 0)`, y si `component.groupId != null` se aplica ese mismo delta a la posición de cada componente de `getComponents()` que comparta ese `groupId` (excluyendo al propio componente arrastrado, que ya recibe `x, y` directamente), llamando a `replaceComponent`/`updateComponent` para cada uno. El comportamiento de `canMove` (bloqueo a nivel de grupo) no se modifica.
- Corrección posterior en `src/ui/componentRenderer.js`, función `getBlockDragTargets` (usada por los 7 bloques de drag por tipo de componente, cada uno con su propio `handleMouseMove`): antes solo devolvía elementos "pasajeros" a mover en vivo durante el arrastre cuando había selección múltiple activa (`selectedIds.size > 1`). Sin eso, `onMove` sí movía finalmente a todo el grupo al soltar el ratón (mouseup), pero durante el propio arrastre (mousemove) el resto del grupo no se desplazaba visualmente, dando la sensación de que el grupo "saltaba" de golpe al final. Se amplió `getBlockDragTargets` para que, cuando no aplica la selección múltiple pero el componente arrastrado tiene `groupId`, devuelva como objetivos en vivo a los demás componentes (`components.filter((c) => c.groupId === component.groupId)`) — mismo mecanismo de actualización directa de `el.style.left/top` ya usado por la selección múltiple, sin tocar el estado hasta el `onMove` final.
