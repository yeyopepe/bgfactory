- **Nombre**: Clonar componente desde la lista de componentes
- **Código**: 00043
- **Tipo**: change

## Prompt original del usuario

"posibilidad de clonar un elemento ya existente con un nuveo botón en la lista de elementos"

Preguntas de alcance planteadas y respuestas del usuario:

1. ¿Se añade un botón "Clonar" en la celda de Acciones de cada fila, junto a "Editar"/"Eliminar"? → Sí.
2. ¿Al pulsarlo se crea la copia inmediatamente, sin confirmación (a diferencia de "Eliminar")? → Sí.
3. Identidad del clon: propuesta inicial de id nuevo e independiente → el usuario corrige: "El id del nuevo elemento debería ser el mismo que el del elemento original añadiendo el sufijo "(x)" donde X es el siguiente número entero disponible".
4. ¿El clon aparece con un pequeño desplazamiento en la mesa respecto al original, igual que al añadir un componente nuevo? → Sí (no se ha corregido).
5. Posición en el listado: propuesta inicial de añadirlo al final → el usuario corrige: "No, se añade siempre justo debajo del original".
6. ¿Tras clonar no se abre ningún modal automáticamente? → Sí (no se ha corregido).
7. ¿Disponible solo en modo edición? → Sí (no se ha corregido).

## Descripción completa

Se añade un nuevo botón "Clonar" en la lista de componentes del modo edición, en la celda de acciones de cada fila, junto a los botones "Editar" y "Eliminar" que ya existen ahí.

Comportamiento al pulsar "Clonar":

- Se crea inmediatamente una copia completa del componente (mismo tipo, propiedades, imagen, tamaño, bloqueo, etc.), sin pedir ninguna confirmación previa — a diferencia de "Eliminar", que sí pide confirmación. Es una acción de bajo riesgo y fácilmente reversible, ya que el clon se puede eliminar después como cualquier otro componente.
- El clon es, desde el momento de su creación, un componente independiente del original: modificar uno no afecta al otro.
- Identificador del clon: se construye a partir del id del componente original añadiéndole el sufijo "(x)", donde x es el siguiente número entero disponible para ese id base. Por ejemplo, si el original es "abc" y no existe ningún clon suyo todavía, el primer clon será "abc(1)"; si se clona de nuevo, será "abc(2)"; si "abc(1)" se hubiera eliminado mientras tanto y no quedara ningún otro clon con ese id base, el siguiente clon podría volver a usar "abc(1)".
- Posición en el listado: el clon se inserta siempre justo debajo del componente original, nunca al final de la lista; el resto de componentes que estuvieran por debajo del original pasan a ocupar la posición siguiente.
- Posición en la mesa: el clon aparece con un pequeño desplazamiento respecto a la posición del original, para no quedar exactamente superpuesto y poder distinguirlo a simple vista — mismo criterio de desplazamiento que ya se usa al añadir un componente nuevo.
- Tras clonar no se abre ningún modal de edición automáticamente (a diferencia de "+ Añadir componente", que sí lo abre); el clon queda ya creado y visible tanto en la lista como en la mesa, y el usuario puede pulsar "Editar" sobre él si quiere modificarlo.
- Disponible solo en modo edición, igual que el resto de acciones de esta lista; no aplica al modo juego.
- No sustituye ni modifica el comportamiento de "Editar", "Eliminar" ni "+ Añadir componente".

## Apuntes técnicos

- Lista de componentes: `src/ui/componentList.js` (función `renderComponentList`), celda de Acciones de cada fila (junto a los botones existentes con clase `component-list__action-btn`). Necesitará un nuevo callback `onClone` análogo a `onEdit`/`onRemove`.
- Orquestación en `src/modes/edit/editMode.js` (`renderList`), donde se pasan `onEdit`/`onRemove`/`onAdd` a `renderComponentList`; ahí se conectaría `onClone`.
- Creación/gestión de componentes en `src/core/state.js`: `addComponent` (asigna `order` al final, `state.components.length + 1`) y `reorderComponent` (reordena por `order` comparando con otros componentes). Insertar el clon "justo debajo del original" requerirá una lógica de inserción distinta a `addComponent` (desplazar el `order` de los componentes posteriores al original en vez de añadir al final), posiblemente una función nueva en `state.js`.
- `src/core/component.js`: `createComponent` genera el id con `crypto.randomUUID()`. El id del clon no debe generarse así — debe derivarse del id del original con el sufijo `(x)`, calculando x como el siguiente entero libre entre los componentes existentes cuyo id tenga la forma `{idOriginal}(n)`.
- Desplazamiento de posición en la mesa al añadir: ver `openAddModal` en `editMode.js` (`newComponent.x = 100 + (n % 10) * 30`, análogo para `y`) como referencia del criterio ya usado, aunque para el clon probablemente baste un offset fijo respecto a `component.x`/`component.y` en vez de basarse en `n`.
