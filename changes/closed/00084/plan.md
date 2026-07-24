## (a) Anotaciones funcionales

- Fuera de alcance: reordenamiento manual (`reorderComponent`), altas nuevas desde cero (`addComponent`, ya resuelto por 00082), eliminación (`removeComponent`) e importación/carga desde guardado (`compactOrders` vía `loadComponents`) — ninguno de estos flujos cambia.
- Dudas ya resueltas con el usuario en `description.md`:
  - ¿El clon pasa a ir siempre a la posición 1? → Sí.
  - ¿El último clonado de una serie queda siempre arriba? → Sí, mismo criterio que las altas nuevas (00082).

## (b) Solución técnica

1. En `core/state.js`, eliminar la función `insertComponentAfter(component, newComponent)` (línea ~67). Su comportamiento actual (`newComponent.order = component.order + 0.5` + `compactOrders`) deja de usarse: el nuevo comportamiento pedido para clonar (colocar en `order = 1`, desplazando +1 el resto) es exactamente el mismo que ya implementa `addComponent(component)` (línea ~51) para altas nuevas desde el cambio 00082. No hace falta una función nueva ni duplicar esa lógica — se reutiliza `addComponent` también para el clon.
2. En `modes/edit/editMode.js`:
   - Quitar `insertComponentAfter` del import de `core/state.js` (línea 5) — `addComponent` ya está importado en esa misma línea (se usa en `onAdd`/`openAddModal`), no hace falta añadirlo.
   - En el manejador de clonar (líneas 282-283), cambiar `insertComponentAfter(component, clone);` por `addComponent(clone);`. `cloneComponent(component, getComponents())` (línea 282) no cambia: sigue calculando id y posición x/y del clon igual que hoy; solo cambia qué función coloca el clon en la lista de componentes y qué `order` recibe.
3. Confirmar tras el cambio que no queda ninguna referencia a `insertComponentAfter` en `src/` (ya verificado durante el análisis: su único llamador era este mismo punto de `editMode.js`).

## (c) Cambios de arquitectura

En `design/docs/ARCHITECTURE.md`, sección 4 (Modelo de datos de componente):

- Eliminar de la lista de funciones de `order` (líneas ~68-74) la entrada dedicada a `insertComponentAfter`, ya que la función desaparece.
- Actualizar la frase de `addComponent` (línea ~70, "cambio 00082") para indicar que ese mismo criterio de posición 1 se usa también al clonar un componente (cambio 00084), en vez de mencionar solo altas nuevas.
- Actualizar el párrafo final sobre `cloneComponent`/`nextCloneId` (línea ~84), que hoy dice "...con `order: null`, que se resuelve al insertarlo con `insertComponentAfter`": sustituir esa frase para reflejar que el clon se añade con `addComponent`, quedando en `order = 1` (arriba de toda la pila) igual que un componente nuevo, en vez de "null" a resolver por inserción posicional.
