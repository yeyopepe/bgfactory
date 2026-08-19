# Versión v1.2 — 2026-08-14

Nuevo: 7 · Cambios: 1 · Eliminado: 0 · Correcciones y ajustes: 4

## Nuevo

- **Agrupar y desagrupar elementos** — En modo edición ahora se pueden agrupar varios componentes en una unidad persistente que se selecciona, mueve y gestiona como un bloque, con una acción para deshacer la agrupación en cualquier momento.
- **Contorno diferenciado al seleccionar un grupo** — Al seleccionar un grupo, el elemento clicado directamente se distingue visualmente del resto de sus miembros, y los componentes agrupados recuperaron la posibilidad de editarse y eliminarse de forma individual sin necesidad de desagrupar antes.
- **Propiedades propias de un grupo** — Cada grupo puede editar ahora su propio id, bloqueo, visibilidad, tooltip y etiquetas desde un botón "Editar" en su fila, con un registro independiente del de sus miembros que se destruye al deshacer la agrupación.
- **Orden y anidación visual de los grupos** — La fila de un grupo tiene ahora su propio campo de Orden, que desplaza a todos sus miembros como bloque, y sus miembros se muestran siempre anidados debajo de su grupo en el panel de Componentes.
- **Voltear carta desde el menú contextual** — En modo edición se añadió la acción "Voltear carta" al menú contextual, que da la vuelta a una o varias cartas seleccionadas sin necesidad de pasar a modo juego.
- **Disposición configurable de la carta revelada del mazo** — Las propiedades de un mazo ganaron controles para elegir en qué lado se revela la carta al sacarla y qué texto se muestra en ese hueco, en vez de estar siempre fijos a la derecha con el texto "Carta revelada".
- **Elegir boca arriba/abajo al revelar carta del mazo** — Las propiedades de un mazo ganaron un campo para decidir si la carta que se saca del mazo queda mostrada boca arriba o boca abajo, y se reorganizaron las secciones de disposición y comportamiento del mazo para acomodarlo.

## Cambios

- **Sliders de rotación con sentido (-360º a 360º)** — Los sliders de rotación de imagen de fondo, forma y caja de texto ampliaron su rango para admitir valores negativos, permitiendo elegir el sentido del giro (antihorario/horario) además de su magnitud; el atajo "Girar 90°" del menú contextual también se amplió con una opción para cada sentido.

## Correcciones y ajustes

- **Filtro de Tipo en mayúsculas** — Los valores del desplegable de filtro por Tipo en el panel de Componentes pasaron a mostrarse con la primera letra en mayúscula, de forma consistente con el resto de valores.
- **Columna Tipo en mayúsculas** — El texto de la columna Tipo en el panel de Componentes pasó a mostrarse con la primera letra en mayúscula.
- **Botones a ancho completo en propiedades del componente** — Los botones "Editar diseño del tablero" y "Ver contenido del mazo" pasaron a ocupar todo el ancho del panel, igual que el resto de botones de esa zona.
- **Separación entre la sección Imagen y "Ver contenido del mazo"** — Se corrigió la falta de separación visual entre la sección "Imagen" del mazo y el botón "Ver contenido del mazo", que quedaban pegados.
