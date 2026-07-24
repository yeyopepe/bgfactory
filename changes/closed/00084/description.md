- **Nombre**: Clonar un componente lo coloca en la posición 1
- **Código**: 00084
- **Tipo**: change

## Prompt original del usuario

relacionado con el 00082: al clonar un elemento, también debe colocarse en la posición 1

## Descripción completa

Cambiar el comportamiento por defecto de la posición de apilado cuando se clona un componente existente en modo edición, extendiendo a la clonación el mismo criterio que el cambio 00082 (ya implementado) fijó para la creación de componentes nuevos.

**Comportamiento actual**: al clonar un componente desde el panel de "Componentes" en modo edición, el clon se coloca automáticamente justo debajo del componente original en el orden de apilado.

**Comportamiento esperado**: al clonar un componente, el clon se coloca automáticamente en la posición más alta del orden de apilado (posición 1), apareciendo encima de todos los componentes existentes en la mesa — igual criterio que ya aplica hoy al crear un componente nuevo desde cero (cambio 00082).

**Impacto**:
- Cada componente clonado se coloca automáticamente arriba de toda la pila, siendo visible por encima de los demás (incluido el propio componente original del que se clonó).
- Todos los demás componentes, incluido el original clonado, se desplazan un nivel hacia abajo en el orden de apilado.
- Si se clonan varios componentes seguidos en la misma sesión, el último clonado estará siempre encima de los clones/componentes anteriores (mismo criterio que ya aplica a altas nuevas por el cambio 00082).
- El clon deja de aparecer "pegado" justo debajo del original; puede quedar en cualquier punto de la mesa visualmente separado de él, ya que solo cambia el orden de apilado, no la posición en la mesa (que sigue desplazándose ligeramente respecto al original, sin cambios).
- Alcance: aplica únicamente a la clonación de componentes desde el panel de "Componentes" en modo edición (única entidad clonable hoy en el proyecto — los mazos no tienen acción de clonar). El resto de operaciones existentes (reordenamiento manual, eliminación, creación desde cero) siguen funcionando exactamente igual.
- Las importaciones y cargas desde guardado (autoguardado o cargas desde fichero) no se ven afectadas, ya que tienen su propia lógica de normalización de órdenes, ajena a la clonación.
- Definición visual: no se añaden ni modifican elementos visuales. El botón "Clonar" y su icono siguen siendo los mismos; solo cambia dónde queda apilado el resultado.

### Preguntas de alcance resueltas

- ¿El clon deja de colocarse justo debajo del original y pasa a ir a la posición 1? → Sí, siempre.
- ¿Si se clonan varios componentes seguidos, el último clonado queda siempre arriba? → Sí, mismo criterio que las altas nuevas (cambio 00082).

## Apuntes técnicos

- Ubicación relevante: `core/state.js`, función `insertComponentAfter(component, newComponent)` (línea ~67), hoy asigna `newComponent.order = component.order + 0.5` y llama a `compactOrders`. Es la única función usada para clonar (invocada desde `modes/edit/editMode.js:282-283`: `cloneComponent()` + `insertComponentAfter(component, clone)`) — no tiene otros llamadores en el proyecto.
- `addComponent(component)` (línea ~51) ya implementa el criterio de "posición 1" para altas nuevas desde el cambio 00082 (`state.components.forEach(c => c.order += 1); component.order = 1;`), y puede servir de referencia directa para la nueva lógica de clonación.
- `compactOrders`, `removeComponent`, `reorderComponent` no se ven afectados y mantienen su semántica sin cambios.
- No se detectó ninguna incongruencia entre `design/docs/ARCHITECTURE.md` (sección 4, que documenta correctamente `insertComponentAfter` como "usado para clonar un componente desde el panel de componentes", con `order = component.order + 0.5`) y el código real: la documentación describe fielmente el comportamiento actual que este cambio va a modificar.
