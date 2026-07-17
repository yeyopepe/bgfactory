# Corrección de mesa infinita, listado en modo juego y visibilidad de componentes en modo edición

- **Código**: 00003
- **Tipo**: fix

## Prompt original del usuario

> - infinite-table__world no ocupa toda la pantalla, solo una pequeña fracción.
> - elimina la lista de componentes que hay en el modo juego
> - cuando entro en el modo edición desaparece el elemento de texto que hay

## Descripción completa

Tras implementar el cambio 00002 (mesa de juego infinita, restyle general y modal de edición de componentes), se han detectado tres problemas de comportamiento:

1. **`.infinite-table__world` no ocupa toda la pantalla**: la capa interior de la mesa infinita (`ui/table.js`, elemento `worldEl`) se está mostrando en una fracción pequeña del espacio disponible, en vez de llenar el 100% del viewport bajo la barra superior. Se espera que la superficie de la mesa (tanto el viewport como el mundo interior) ocupe todo el espacio visible disponible bajo la barra, en ambos modos.

2. **Eliminar el listado de componentes del modo juego**: 00002 mantenía en modo juego, junto a la mesa, un panel lateral con el listado de componentes en solo lectura (decisión tomada entonces como "sin cambios de comportamiento" respecto a antes de 00002). Se pide ahora revertir esa decisión: en modo juego solo debe verse la mesa con los componentes renderizados directamente sobre ella (p.ej. el cuadro de texto), sin ningún listado aparte.

3. **En modo edición no se ve el cuadro de texto sobre la mesa**: 00002 decidió explícitamente que el "cuadro de texto" solo se renderiza sobre la mesa en modo juego, para no duplicar la vista de la partida en modo edición (en ese modo solo se veía el listado lateral con las acciones de editar/eliminar). Se pide invertir esa decisión: en modo edición debe verse la mesa completa con **todos** sus componentes renderizados directamente sobre ella (igual que en modo juego), de forma que se puedan seleccionar y editar haciendo click sobre su representación en la mesa (abriendo el modal de edición), y no solo desde un listado lateral aparte.

### Preguntas de alcance resueltas con el usuario

- **¿Eliminar el listado del modo juego es intencionado, pese a que 00002 decía que se mantenía "sin cambios de comportamiento"?** → Sí, se confirma eliminarlo: en modo juego solo se ve la mesa con los componentes renderizados.
- **¿Se quiere que el cuadro de texto también se vea en modo edición, revirtiendo la decisión explícita de 00002 de solo mostrarlo en modo juego?** → Sí: en modo edición se debe ver la mesa entera con todos sus componentes, para poder seleccionarlos y editarlos directamente ahí (no solo desde el listado lateral).
