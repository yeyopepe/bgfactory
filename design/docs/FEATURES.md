# Features

## Mesa de juego

### Mesa infinita con navegación pan/zoom

Superficie de juego navegable arrastrando (pan) y con la rueda del ratón (zoom, acotado a un rango razonable), donde se renderizan los componentes de la partida.

- **Disponible en**: modo juego y modo edición.
- **Código**: 00002.

### Alta/edición/borrado de componentes con modal de tabs

Modal con dos pestañas ("Generales" con el `id` editable, y "Específicas" según el tipo de componente) para crear o editar un componente, con validación de `id` no vacío y único.

- **Disponible en**: modo edición — desde el listado lateral o haciendo doble click directamente sobre la representación del componente en la mesa.
- **Código**: 00002, 00003, 00004.

### Componente "cuadro de texto"

Primer tipo de componente concreto: un bloque de texto con contenido, tamaño de fuente, color de texto y color de fondo configurables (fondo transparente por defecto). Se precarga automáticamente una instancia al arrancar la app sin datos persistidos.

- **Disponible en**: renderizado sobre la mesa en modo juego y modo edición.
- **Código**: 00002.
