- **Nombre**: Reordenar componentes en la lista para controlar el apilado en la mesa
- **Código**: 00027
- **Tipo**: change

## Prompt original del usuario

en la lista de componentes se debe poder reordenar los elementos y ese orden se corresponderá con el orden en la mesa de juego para indicar cuáles están por encima o por debajo. El sentido es de arriba a bajo: El elemento en primer lugar de la lista está por encima de todos y el último debajo de todos.
Para mover los elementos de la lista añade una columna en primer lugar (con el título orden) con un cuadro de texto numérico en cada fila indicando su posición (1 arriba del todo, n la última). Cuando el usuario cambie el número de una fila, reordena la lista teniendo ese nuevo valor en cuenta. Si el valor que introduce ya existe, suma 1 al orden del otro elemento que tuviera el mismo valor y todos los siguientes.

revisa si falta algo por definir

## Descripción completa

En el panel de "Componentes" del modo edición, se añade una nueva columna en primer lugar de la tabla, con título "Orden", que contiene en cada fila un cuadro de texto numérico indicando la posición de ese componente (1 = el más arriba de todos en la mesa de juego, n = el más abajo de todos, siendo n el número total de componentes).

El orden de la lista se corresponde exactamente con el orden de apilado visual en la mesa de juego: el componente en primera posición de la lista se dibuja por encima de todos los demás, y el de última posición por debajo de todos. Este orden sustituye al criterio actual (orden de inserción/creación), que hasta ahora determinaba implícitamente el apilado visual.

### Cambiar el orden de un componente

Cuando el usuario edita el número en el cuadro de texto "Orden" de una fila:
- El campo solo admite escribir dígitos (igual que el saneado del campo "Id" en el modal de edición): cualquier otro carácter tecleado (punto, coma, signo, letras...) se descarta al vuelo y ni siquiera llega a aparecer en el cuadro de texto, para impedir valores decimales o no numéricos desde el origen.
- El reordenamiento (y, en su caso, el descarte de un valor inválido) se aplica al confirmar el cambio (evento `change`: perder el foco o pulsar Enter), no en cada pulsación — así el usuario puede borrar el campo para escribir un número nuevo sin que se restaure de inmediato a mitad de la edición.
- Al confirmar, la lista se reordena para reflejar el nuevo valor, y la mesa de juego actualiza el apilado visual en consecuencia.
- El componente que se mueve se saca primero de su posición actual (los que quedaban detrás de él se compactan un puesto hacia arriba) y después se inserta en la posición indicada (los que estén en esa posición o después se desplazan un puesto hacia abajo). Con este orden de operaciones el resultado es siempre una permutación válida de 1..n, tanto si el componente se mueve hacia arriba como hacia abajo en la lista.
- Si el valor introducido está fuera de rango (menor que 1, o mayor que el número total de componentes n), se ajusta automáticamente al límite más cercano (1 o n).
- Si al confirmar el campo queda vacío, se descarta el cambio y el campo vuelve a mostrar el valor anterior.

### Orden inicial al añadir un componente

Al crear un componente nuevo (botón "+ Añadir componente"), se le asigna automáticamente el último puesto (orden = n+1), es decir, queda por debajo de todos los componentes existentes. No hace falta que el usuario indique el orden al crearlo.

### Recálculo al eliminar un componente

Al eliminar un componente, los órdenes de los componentes restantes se recalculan para que sigan siendo consecutivos de 1 a n, sin huecos (por ejemplo, si se elimina el componente con orden 2 de un conjunto 1,2,3,4, los restantes pasan a ser 1,2,3).

### Persistencia

El orden de cada componente se guarda como parte de su estado, igual que el resto de sus propiedades (id, tipo, posición, etc.), por lo que se conserva al recargar la página o recuperar una partida guardada.

### Alcance

El orden aplica a todos los componentes por igual, con independencia de su tipo o de si están bloqueados; no hay restricción de quién puede reordenar (cualquier usuario en modo edición, igual que el resto de acciones del panel de componentes).

### Preguntas de alcance resueltas

- **Modelo de datos**: se añade un valor de orden persistente por componente, que gobierna tanto la lista como el apilado visual en la mesa (sustituye al orden de inserción actual).
- **Orden inicial de un componente nuevo**: al fondo del todo (por debajo de todos los existentes).
- **Al eliminar un componente**: se compactan automáticamente los órdenes restantes para que sean consecutivos, sin huecos.
- **Validación del cuadro de texto numérico**: solo se puede teclear dígitos (los demás caracteres se descartan al vuelo); los valores fuera de rango se ajustan al límite más cercano al confirmar; si el campo queda vacío al confirmar, se descarta el cambio y se restaura el valor anterior.
- **Momento de aplicar el cambio**: al confirmar (perder el foco o pulsar Enter), no en cada pulsación — evita restaurar el valor a mitad de la edición.
- **Algoritmo de desplazamiento**: al mover un componente a una posición ya ocupada, primero se saca de su posición actual (compactando a los que iban detrás) y luego se inserta en la posición indicada (desplazando hacia abajo a los que estén en esa posición o después); así el resultado siempre es una permutación válida de 1..n en cualquier sentido de movimiento.

## Apuntes técnicos

- El apilado visual actual en la mesa lo determina implícitamente el orden de inserción en el DOM (`src/ui/componentRenderer.js`, `worldEl.appendChild(...)`), sin ningún campo de orden explícito. Hay que sustituir ese criterio por el nuevo campo de orden.
- El modelo de componente (`src/core/component.js`, función `createComponent`) no tiene actualmente ningún campo de orden/z-index; solo `id, type, name, properties, image, x, y, width, height, bloqueado`.
- La tabla de la lista se renderiza en `src/ui/componentList.js` (función `renderComponentList`, cabecera de columnas en la línea ~97: `Id`, `Tipo`, `Acciones`). Ahí se debe insertar la nueva columna "Orden" en primer lugar, con un `<input type="number">` por fila.
- Como referencia de patrón de input numérico ya usado en el proyecto: `src/ui/componentModal.js` (campo "Grosor del borde (px)"), con `type='number'`, `min`/`max` y `parseInt` en el listener de `input` — para el campo "Orden" el clamp/descarte va en `change`, no en `input`, según quedó resuelto arriba.
- Para impedir teclear caracteres no numéricos en el campo "Orden", reutilizar el patrón de saneado ya usado en el campo "Id" del modal (`componentModal.js`, línea ~152: `idInput.addEventListener('input', ...)` con `replace()` sobre el valor tecleado), adaptado a solo permitir dígitos.
- Los mutadores de estado que ya disparan re-render (`src/core/state.js`: `addComponent`, `replaceComponent`, `removeComponent`, `loadComponents`, todos emiten `components:changed`) son el punto natural para recalcular/compactar el orden tras añadir o eliminar.
- Persistencia actual en `src/core/persistence.js` (`saveState`/`loadState`, localStorage bajo `errantes:state`); el nuevo campo de orden viaja igual que el resto de propiedades del componente, sin cambios adicionales de esquema de persistencia.
