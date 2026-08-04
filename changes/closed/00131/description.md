- **Nombre**: Ver y sacar elementos individualmente desde la modal de edición de un grupo
- **Código**: 00131
- **Tipo**: change

## Prompt original del usuario

cuando pulsamos el botón editar de un grupo en la lista de grupos (modo edición), la modal que se muestra debe ofrecer también una lista de los nombres de los elementos que forman parte del grupo y la posibilidad de sacar del grupo individualmente cualquier elemento

## Descripción completa

Al pulsar el botón "Editar" de un grupo desde el panel flotante "Grupos" (modo edición), la ventana que se abre para editar ese grupo debe mostrar, además del campo "Nombre" ya existente, la lista de los elementos que pertenecen a ese grupo en ese momento, y permitir sacar del grupo individualmente cualquiera de ellos, sin salir de esa misma ventana.

**Qué se muestra de cada elemento**: su tipo y su identificador (misma información e igual formato — "Tipo: Identificador" — que ya se usa hoy en la ventana de confirmación al borrar un grupo que está en uso por varios elementos), ordenados alfabéticamente por identificador.

**Grupo sin elementos**: si el grupo no tiene ningún elemento asignado, en vez de una lista vacía se muestra un mensaje indicándolo ("No hay elementos en este grupo.").

**Sacar un elemento del grupo**: cada elemento de la lista tiene su propia acción para sacarlo del grupo. Al pulsarla, el elemento se desvincula de inmediato, sin pedir confirmación (a diferencia de "Eliminar" un grupo o un componente, que sí siempre confirman) — no se borra el elemento ni el grupo, el elemento simplemente pasa a quedar "Sin grupo" y sigue existiendo con normalidad en el resto de la app. La lista dentro de la propia ventana se actualiza al instante para reflejar la salida, sin necesidad de cerrarla y volver a abrirla. Al cerrar la ventana, el número de elementos que muestra el panel "Grupos" para ese grupo también queda ya actualizado.

**Sacar el último elemento**: si se saca así el último elemento de un grupo, el grupo no se elimina automáticamente — sigue existiendo, ahora con 0 elementos, igual que ya puede existir un grupo recién creado sin ningún elemento todavía.

**Cuándo aparece esta lista**: solo al editar un grupo ya existente. Al crear un grupo nuevo (ventana "+ Añadir grupo") no se muestra, porque un grupo recién creado nunca tiene elementos asignados todavía — mismo criterio que ya sigue el botón "Eliminar" del grupo, que tampoco aparece en ese caso.

**Dónde se ubica**: justo debajo del campo "Nombre", antes de los botones de la parte inferior de la ventana (Eliminar/Cancelar/Aceptar).

La maqueta de la ventana resultante (con y sin elementos) está en `design_modal-editar-grupo.html`, y el diagrama de la navegación/interacción dentro de la modal en `design_navigation_editar-grupo.md`.

## Apuntes técnicos

- Modelo: `component.grupoId` (string|null) es una propiedad plana de primer nivel de cualquier tipo de componente (`src/core/component.js`), no anidada en `properties`.
- `core/group.js` → `getComponentsUsingGroup(groupId, components)` ya devuelve los ids de los componentes de un grupo; reutilizable para obtener la lista de elementos del grupo que se está editando.
- Sacar un elemento del grupo puede seguir el mismo patrón ya usado en `modes/edit/editMode.js` → `attemptDeleteGroup` para los componentes afectados al borrar un grupo en uso: `replaceComponent(componentId, updateComponent(component, { grupoId: null }))`.
- `ui/groupModal.js` (`openGroupModal`) hoy solo recibe `{ group, onAccept, onDelete }` y no recibe la lista de componentes ni ningún callback para sacar un elemento del grupo — habrá que ampliar su firma (p.ej. nuevos parámetros `components` y un callback `onRemoveFromGroup`) y el punto de llamada en `modes/edit/editMode.js` (`renderGroupPanel` → `onEdit`), que ya tiene acceso a `getComponents()`.
- Para mostrar "Tipo: Id" en cada fila puede reutilizarse `getComponentTypeLabel` de `ui/componentTypeModal.js`, ya usado con el mismo propósito en `ui/groupDeleteConfirmModal.js`.
- Como `openGroupModal` se monta como overlay independiente en `document.body` (no dentro del contenedor que remonta `renderEditMode()` al recibir el evento `components:changed`), tras sacar un elemento la propia modal deberá refrescar su lista interna directamente en el callback, sin depender del remontado general de `editMode.js` mientras la modal sigue abierta.
- Ya existe un precedente directo de este mismo patrón (lista dentro de una modal + botón "Sacar" por fila que repinta la lista sin cerrar la modal ni pedir confirmación): `src/ui/mazoContentModal.js` (modal "Contenido del mazo"), con su propia función interna `renderBody()` invocada tras cada `onSacar`, y el botón reutilizando ya la clase `btn-sacar` existente en `src/styles/main.css` (línea ~952) — misma clase que puede reutilizarse aquí tal cual, sin CSS nuevo.
