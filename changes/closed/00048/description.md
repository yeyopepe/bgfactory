- **Nombre**: Cierre indebido de ventanas de edición al soltar un arrastre fuera del control de origen
- **Código**: 00048
- **Tipo**: fix

## Prompt original del usuario

ms-fix cuando estoy en cualquier ventana del modo edición  (propiedades, edición de imagen, etc), mantengo pulsado el botón izquierdo (por ejemplo: para seleccionar un texto dentro de un cuadro de texto) y lo suelto fuera del control en vez de dentro, siempre sale de la ventana en la que esté.

## Descripción completa

En cualquier ventana o modal del modo edición (por ejemplo el modal de propiedades o el de edición de imagen), si el usuario mantiene pulsado el botón izquierdo del ratón dentro de un control interactivo de esa ventana (por ejemplo, para seleccionar texto dentro de un campo) y suelta el botón fuera de ese control, la ventana se cierra igualmente, como si se hubiera hecho clic fuera de ella. Esto ocurre aunque el gesto haya empezado claramente dentro de la ventana, en un control válido.

Comportamiento esperado: si el gesto (mousedown) se originó dentro de la ventana, soltar el botón en cualquier otro punto — dentro o fuera del control original, e incluso fuera de la propia ventana — no debe cerrarla. La ventana solo debe cerrarse por una interacción que empiece y termine claramente fuera de ella, o por las acciones explícitas de cierre ya existentes (botón de cerrar, tecla Escape, etc.), nunca como efecto colateral de arrastrar una selección de texto u otro arrastre iniciado dentro.

Esto afecta a todas las ventanas/modales del modo edición que hoy se cierran al detectar una interacción fuera de ellas (propiedades, edición de imagen, y cualquier otro modal equivalente), no a un modal concreto.
