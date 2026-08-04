- **Nombre**: La lista de componentes pierde la posición de scroll al seleccionar un elemento
- **Código**: 00123
- **Tipo**: fix

## Prompt original del usuario

cuando selecciono un elemento de la lista de componentes en el modo edición, siempre se sube hasta el primer elemento, en lugar de quedarse en la posición actual

## Descripción completa

En el modo edición, el panel lateral muestra la lista de componentes del proyecto y permite seleccionar uno o varios haciendo clic sobre ellos.

Comportamiento roto: al hacer clic para seleccionar un elemento de la lista, la lista salta automáticamente hasta el principio (el primer elemento queda visible arriba del todo), perdiendo la posición de scroll en la que el usuario estaba trabajando. Esto ocurre con cualquier elemento que se seleccione, especialmente molesto cuando la lista es larga y el elemento seleccionado está más abajo: el usuario tiene que volver a desplazarse manualmente cada vez que selecciona algo.

Cómo reproducir:
1. Entrar en modo edición con una lista de componentes lo bastante larga para tener scroll.
2. Desplazar la lista hacia abajo, de forma que el primer elemento ya no sea visible.
3. Hacer clic sobre un elemento de la lista para seleccionarlo.
4. La lista salta de vuelta arriba, mostrando el primer elemento, en vez de mantenerse en la posición donde estaba.

Comportamiento esperado: al seleccionar un elemento, la posición de scroll de la lista no debe cambiar. El elemento seleccionado simplemente debe quedar marcado como seleccionado (resaltado visualmente), sin que la vista salte a ningún otro punto de la lista.

## Apuntes técnicos

- La lista se renderiza en `src/ui/componentList.js`, función `renderComponentList(container, components, {...})` (líneas ~184-342). Hace `container.innerHTML = ''` (línea ~205) y reconstruye todo el panel desde cero en cada llamada, incluyendo el div scrollable del cuerpo (`.component-panel__body`, creado en líneas ~290-298). Al ser un `<div>` nuevo cada vez, su `scrollTop` siempre arranca en 0.
- La selección se maneja en `src/modes/edit/editMode.js`, función `toggleSelect(component, event)` (líneas ~359-375), que muta el `Set` `selectedComponentIds` y llama incondicionalmente a `renderList()` (línea ~373) y `renderTable()` (línea ~374).
- `renderList()` (`editMode.js` líneas ~413-454) invoca `renderComponentList(listContainer, ...)` en cada cambio de selección, provocando el reset de scroll descrito.
- No existe en `componentList.js` ni en `editMode.js` ningún código que capture o restaure el `scrollTop` antes/después del re-render, ni uso de `scrollIntoView`.
- Causa raíz probable: la selección dispara un re-render completo (destructivo) del panel de lista en vez de solo alternar la clase CSS de fila seleccionada (`component-list__row--selected`) sobre el DOM ya existente. La solución debería, como mínimo, capturar el `scrollTop` del body antes de reconstruir el panel y reaplicarlo tras el render (o evitar el re-render completo en cambios puros de selección).
