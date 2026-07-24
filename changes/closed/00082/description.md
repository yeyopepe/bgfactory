- **Nombre**: Posición por defecto de nuevos componentes (orden 1)
- **Código**: 00082
- **Tipo**: change

## Prompt original del usuario

cuando se crea un nuevo elemento, su posición por defecto es 1

## Descripción completa

Cambiar el comportamiento por defecto de la posición de apilado cuando se crea un nuevo componente en modo edición.

**Comportamiento actual**: Al crear un componente nuevo, se le asigna automáticamente la posición más baja del orden de apilado (`order = n + 1`), apareciendo debajo de todos los componentes existentes en la mesa.

**Comportamiento esperado**: Al crear un componente nuevo, se le asigna automáticamente la posición más alta del orden de apilado (`order = 1`), apareciendo encima de todos los componentes existentes en la mesa.

**Impacto**: 
- Cada componente nuevo creado se coloca automáticamente arriba de toda la pila, siendo visible por encima de los demás.
- Los componentes que estaban abajo se desplazan un nivel hacia abajo en el orden de apilado (su `order` se incrementa en 1).
- Si se crean varios componentes seguidos en la misma sesión, el último creado estará siempre encima de los anteriores.
- El cambio solo afecta al acto de crear un componente nuevo en modo edición. Las operaciones existentes de reordenamiento, inserción después de otro componente, eliminación y clonación siguen funcionando exactamente igual.
- Las importaciones y cargas desde guardado (autoguardado o cargas desde fichero) no se ven afectadas, ya que tienen su propia lógica de normalización de órdenes (`compactOrders`).

## Apuntes técnicos

Ubicación de cambio: `core/state.js`, función `addComponent()`, línea 52 aproximadamente.

Estructura actual:
```
export function addComponent(component) {
  component.order = state.components.length + 1;  // ← cambiar a: component.order = 1;
  state.components.push(component);
  emit('components:changed', state.components);
}
```

Funciones relacionadas que no se ven afectadas:
- `compactOrders(components)` — normaliza órdenes a 1..n (usada por importación y carga)
- `removeComponent(id)` — elimina y recompacta
- `reorderComponent(id, rawOrder)` — mueve a una posición específica
- `insertComponentAfter(component, newComponent)` — inserta debajo de otro y compacta

Al cambiar `addComponent`, todos estos mantienen su semántica sin cambios.

Impacto en datos: el campo `order` de cada componente se persiste en `core/persistence.js` (autoguardado y exportaciones). Los guardados existentes cargan sus órdenes vía `loadComponents()` que llama a `compactOrders()`, así que la migración es automática y sin pérdida de datos.
