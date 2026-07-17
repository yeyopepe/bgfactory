- **Nombre**: Botón de eliminar en la ventana de configuración de componentes
- **Código**: 00013
- **Tipo**: change

## Prompt original del usuario

añade a la ventana de configuración de todos los elementos un botón para eliminar el componente

## Descripción completa

Se añade un botón "Eliminar" a la ventana de configuración de componentes (la ventana de edición de un elemento, común a todos los tipos de elemento existentes), situado en el extremo izquierdo de la zona de botones inferior, con un color rojo que lo distingue visualmente de los botones "Cancelar" y "Aceptar" ya existentes.

El botón aparece siempre en esa ventana, sin importar el tipo de elemento que se esté configurando, ya que la ventana es única y común a todos los tipos.

Al pulsar el botón se pide confirmación al usuario, con el mismo mecanismo de confirmación que ya usa hoy la eliminación desde el listado de elementos, para evitar borrados accidentales. Si se confirma, el elemento se elimina y la ventana de configuración se cierra. Si se cancela, no ocurre nada y la ventana permanece abierta tal cual estaba.

Si el elemento eliminado era el que estaba seleccionado en el editor, esa selección se limpia, para no dejar el editor referenciando un elemento que ya no existe.

Este nuevo botón convive con la opción de eliminar que ya existe hoy en el listado de elementos: no la sustituye ni la elimina, son dos caminos alternativos para el mismo resultado — uno rápido desde el listado, sin necesidad de abrir la ventana de configuración, y otro cómodo mientras ya se está configurando el elemento.

Solo está disponible en modo edición, que es el único modo en el que esta ventana de configuración puede abrirse (en modo jugar no existe forma de abrirla).

### Preguntas de alcance resueltas

- **¿Dónde va el botón y con qué aspecto?** En el extremo izquierdo de la zona de botones inferior de la ventana, con color rojo.
- **¿Pide confirmación?** Sí, igual que la eliminación ya existente desde el listado de elementos.
- **¿Convive con la eliminación ya existente en el listado?** Sí, ambos caminos coexisten sin sustituirse.
- **¿Aplica a todos los tipos de elemento?** Sí, sin distinción, al ser una ventana común a todos los tipos.
- **¿Qué pasa si el elemento eliminado estaba seleccionado?** Se limpia la selección.
- **¿En qué modo está disponible?** Solo en modo edición.

## Apuntes técnicos

- La ventana de configuración es `openComponentModal` en `src/ui/componentModal.js` (líneas 7-258): modal única y genérica para todos los tipos de componente, con tabs "Generales"/"Específicas". Su footer actual (líneas 221-241) solo tiene "Cancelar" y "Aceptar" — ahí debe añadirse el nuevo botón, alineado a la izquierda.
- Se abre desde `src/modes/edit/editMode.js` (`openEditModalFor`, líneas 48-55, y también al pulsar "Editar" en el panel-listado, línea 91).
- La eliminación ya existente hoy vive en `src/ui/componentList.js` (botón "Eliminar" por fila, líneas 132-143): usa `confirm(...)` nativo (línea 138) y, si se acepta, invoca `onRemove(component)`, que en `editMode.js` (líneas 92-94) llama a `removeComponent(component.id)` de `src/core/state.js` (líneas 38-41). Esta función filtra el array de componentes y emite el evento `components:changed` vía `src/core/eventBus.js`. El nuevo botón de la modal debería reutilizar este mismo mecanismo (`confirm()` + `removeComponent(id)`).
- La modal se cierra a sí misma con `overlay.remove()` en tres puntos (líneas 225-227, 233-240, 253-257); el nuevo botón debe seguir el mismo patrón de cierre tras eliminar.
- `selectedComponentId` es estado a nivel de módulo en `editMode.js` (línea 15), independiente del ciclo de vida de la modal. Al eliminar desde la modal, si `selectedComponentId` coincide con el id eliminado, debe resetearse (hoy este reseteo no ocurre automáticamente en ningún flujo).
- No existe hoy en `design/docs/STYLE_BIBLE.md` un patrón de botón "destructivo"/rojo (solo hay un color `--error: #d32f2f` para texto de validación). Se debe introducir una clase siguiendo el patrón no-BEM ya usado por `.btn-cancel`/`.btn-accept` (p.ej. `.btn-eliminar`), reutilizando ese color `--error` como base del rojo.
