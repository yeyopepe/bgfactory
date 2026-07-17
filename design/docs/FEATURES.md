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

### Panel flotante de componentes, con selección y resaltado

Panel flotante sobre la mesa (esquina superior derecha), colapsable, con el listado de componentes en tabla (columnas Id, Tipo, Acciones). El botón "Editar" abre la modal de edición; "Eliminar" borra el componente, pidiendo confirmación previa. Al hacer click sobre una fila se selecciona (selección única, con toggle al volver a hacer click) y se resalta con un contorno discontinuo la representación del componente en la mesa. La tabla soporta scroll vertical si el contenido supera la altura disponible. La selección de fila y el estado colapsado/expandido son solo de la sesión de edición en curso, no se persisten.

- **Disponible en**: modo edición.
- **Código**: 00005, 00007.

### Posición independiente y arrastre de componentes

Cada componente tiene su propia posición (`x`, `y`) en la mesa. Al crear un componente nuevo desde el modo edición, se le asigna automáticamente una posición inicial que no se solapa con los componentes ya existentes. En modo edición, cada componente puede arrastrarse individualmente sobre la mesa (independiente del pan/zoom de la mesa y de los demás componentes); la nueva posición se guarda de inmediato.

- **Disponible en**: modo edición (arrastre); la posición resultante se refleja también en modo juego (solo lectura).
- **Código**: 00006.

### Componente "cuadro de texto"

Primer tipo de componente concreto: un bloque de texto con contenido, tamaño de fuente, color de texto y color de fondo configurables (fondo transparente por defecto). Se precarga automáticamente una instancia al arrancar la app sin datos persistidos.

- **Disponible en**: renderizado sobre la mesa en modo juego y modo edición.
- **Código**: 00002.
