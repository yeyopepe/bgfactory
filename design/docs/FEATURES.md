# Features

## Mesa de juego

### Mesa infinita con navegación pan/zoom

Superficie de juego navegable arrastrando (pan) y con la rueda del ratón (zoom, acotado a un rango razonable), donde se renderizan los componentes de la partida.

- **Disponible en**: modo juego y modo edición.
- **Código**: 00002.

### Alta/edición/borrado de componentes con modal de tabs

Modal con dos pestañas ("Generales" con el `id` editable, y "Específicas" según el tipo de componente) para crear o editar un componente, con validación de `id` no vacío y único.

- **Disponible en**: modo edición — desde el panel flotante de componentes o haciendo doble click directamente sobre la representación del componente en la mesa.
- **Código**: 00002, 00003, 00004.

### Panel flotante de componentes, con selección, resaltado, arrastre y redimensionado

Panel flotante sobre la mesa (por defecto en la esquina superior derecha), colapsable, con el listado de componentes en tabla (columnas Id, Tipo, Acciones). El botón "Editar" abre la modal de edición; "Eliminar" borra el componente, pidiendo confirmación previa. Al hacer click sobre una fila, o directamente sobre la representación del componente en la mesa, se selecciona (selección única, con toggle al volver a hacer click en cualquiera de los dos sitios) y se resalta con un contorno discontinuo la representación del componente en la mesa. La tabla soporta scroll vertical si el contenido supera la altura disponible.

El panel puede arrastrarse por la pantalla agarrando su cabecera (restringido al área visible de la mesa) y redimensionarse en ancho arrastrando un manejador en su esquina inferior derecha (entre 290 y 600px, o la mitad del ancho del viewport si es menor, sin salir tampoco del área de la mesa) — funciona igual expandido o colapsado. La selección de fila, el estado colapsado/expandido y la posición/ancho del panel son solo de la sesión de edición en curso, no se persisten (se restablecen a sus valores por defecto al recargar la página).

- **Disponible en**: modo edición.
- **Código**: 00005, 00007, 00009.

### Posición independiente, arrastre y redimensionado de componentes

Cada componente tiene su propia posición (`x`, `y`) en la mesa, y opcionalmente un tamaño explícito (`width`, `height`; automático según contenido mientras no se fije). Al crear un componente nuevo desde el modo edición, se le asigna automáticamente una posición inicial que no se solapa con los componentes ya existentes. En modo edición, cada componente puede arrastrarse individualmente sobre la mesa (independiente del pan/zoom de la mesa y de los demás componentes); la nueva posición se guarda de inmediato.

Además, cuando un componente de tipo "cuadro de texto" está seleccionado (haciendo click en él sobre la mesa, o en su fila del panel), muestra un manejador de redimensionado en su esquina inferior derecha (mismo patrón que el del panel de componentes) que ajusta el ancho y el alto de la caja (mínimo 40×24px, sin máximo) — el tamaño de la fuente no cambia; si el contenido no cabe en el nuevo tamaño, se recorta. El tamaño resultante se guarda de inmediato, igual que la posición.

- **Disponible en**: modo edición (arrastre y redimensionado); la posición y el tamaño resultantes se reflejan también en modo juego (solo lectura).
- **Código**: 00006, 00009.

### Componente "cuadro de texto"

Primer tipo de componente concreto: un bloque de texto con contenido, tamaño de fuente, color de texto y color de fondo configurables (fondo transparente por defecto). Se precarga automáticamente una instancia al arrancar la app sin datos persistidos.

- **Disponible en**: renderizado sobre la mesa en modo juego y modo edición.
- **Código**: 00002.
