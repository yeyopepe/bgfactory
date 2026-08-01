- **Nombre**: Duplicar cuadro de texto en el editor de cartas
- **Código**: 00110
- **Tipo**: change

## Prompt original del usuario

en el editor de imágenes, en las propiedades de los cuadros de texto de las cartas, añada un botón para duplicar un texto en la cara actual

## Descripción completa

En el editor de cartas (donde se diseñan las dos caras, frontal y trasera, de una carta), cada cara puede tener varios cuadros de texto. Al hacer doble clic sobre uno de ellos se abre su ventana de propiedades, donde hoy se puede editar su contenido y estilo, cancelar los cambios, aceptarlos o eliminar el cuadro de texto.

Se añade un nuevo botón "Duplicar" en esa misma ventana de propiedades, junto a los botones ya existentes.

Comportamiento:

- Al pulsar "Duplicar" se crea una copia del cuadro de texto con los valores que se estén viendo en ese momento en la ventana (incluidos cambios que el usuario acabe de hacer y aún no haya aceptado): es como si se hubiera pulsado "Aceptar" y, a la vez, se hubiera creado una copia idéntica.
- La copia aparece siempre en la misma cara que se estaba editando (frontal o trasera) — nunca cambia a la otra cara ni a otra carta.
- La copia queda ligeramente desplazada respecto al original, para que no se solapen exactamente y se puedan diferenciar y seleccionar por separado a simple vista.
- Tras duplicar, la ventana de propiedades se cierra y se vuelve al editor de cartas, donde ya se ve tanto el cuadro de texto original (con los cambios aplicados) como la copia nueva.
- No hay ningún límite al número de veces que se puede duplicar un mismo cuadro de texto, ni a duplicar una copia ya duplicada.
- Esta funcionalidad es exclusiva de los cuadros de texto dentro del editor de cartas; no afecta a ningún otro tipo de componente ni a ningún otro sitio de la aplicación.

### Preguntas de alcance resueltas

- **Qué contenido se duplica**: el que se ve en ese momento en la ventana (incluyendo ediciones sin guardar), no solo el texto original tal cual estaba antes de abrir la ventana. Confirmado por el usuario.
- **En qué cara aparece la copia**: siempre en la cara que se estaba editando, nunca en la otra. Confirmado por el usuario.
- **Posición de la copia**: desplazada respecto al original, para que no queden exactamente superpuestas. Confirmado por el usuario.
- **Qué pasa tras duplicar**: la ventana de propiedades se cierra (mismo comportamiento que ya tiene "Eliminar"). Confirmado por el usuario.

## Apuntes técnicos

- La ventana de propiedades de un cuadro de texto es `ui/cardTextBoxModal.js` (`openCardTextBoxModal`), invocada desde `ui/cardEditorModal.js` con `{ textBox, onAccept, onDelete }`. Hay que añadir un callback nuevo (p.ej. `onDuplicate`) simétrico a `onDelete`, con su propio botón en el footer de la modal (mismo patrón de botones ya usado: `btn-eliminar`/`btn-cancel`/`btn-accept`).
- Quien añade de verdad el `TextBox` nuevo a `cara.textBoxes` es el caller (`ui/cardEditorModal.js`), igual que ya hace `onDelete` (filtra `cara.textBoxes`) y el botón "+ Texto" ya existente (que genera `id: crypto.randomUUID()`, hace `cara.textBoxes.push(...)` y llama a `renderFaces()`). El nuevo `onDuplicate` debería seguir el mismo patrón: partir de `working` (el objeto que la modal ya mantiene con los cambios en curso, no del `textBox` original sin editar), clonarlo con un id nuevo y una posición desplazada, y hacer push + `renderFaces()`.
- El desplazamiento de posición debe expresarse en "unidades de diseño" (`core/cardProportions.js`, `CARD_DESIGN_WIDTH = 300`), ya que `x`/`y`/`width`/`height` de un `TextBox` no están en píxeles reales de pantalla. El patrón de desplazamiento "+30/+30" que usan `cloneComponent`/`createCopy` en `core/component.js` está en píxeles de la mesa y no es directamente reutilizable tal cual — conviene un valor propio en unidades de diseño, a decidir en el plan técnico.
