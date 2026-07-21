- **Nombre**: Búsqueda de imagen en el modal "Elegir imagen"
- **Código**: 00055
- **Tipo**: change

## Prompt original del usuario

ms-new en la pantalla de elegir imagen debe aparecer un cuadro de texto para efectuar una búsqueda entre todas las imágenes que hay.

## Descripción completa

En el modal "Elegir imagen" (usado tanto al elegir la imagen de fondo de un componente/tablero como al elegir la imagen de una carta), se añade un cuadro de texto de búsqueda encima de la galería de imágenes disponibles, para poder localizar rápidamente una imagen por su nombre cuando hay muchas.

Comportamiento:

- El cuadro de búsqueda solo aparece cuando el modal tiene imágenes disponibles para mostrar. Si no hay ninguna imagen (estado actual "No hay imágenes disponibles"), no se muestra el cuadro de búsqueda.
- El filtrado ocurre en tiempo real a medida que se escribe (sin botón de buscar aparte), comparando el texto introducido con el nombre de cada imagen, ignorando mayúsculas/minúsculas y acentos.
- Si hay imágenes pero ninguna coincide con el texto buscado, se muestra un mensaje del tipo "No hay imágenes que coincidan con «texto»" en el lugar de la galería.
- Si ya había una imagen seleccionada (resaltada) y el texto de búsqueda oculta esa imagen, la selección se mantiene internamente aunque no sea visible: el botón "Aceptar" sigue aplicando esa imagen si el usuario no cambia la selección.
- El campo de búsqueda se reinicia vacío cada vez que se abre el modal.
- No cambia nada más del modal: misma cuadrícula de miniaturas + nombre, mismos botones Cancelar/Aceptar.

Definición visual de alto nivel: el cuadro de texto se ubica en la parte superior del contenido del modal, justo encima de la cuadrícula de imágenes, con un placeholder tipo "Buscar imagen…". Ocupa el ancho disponible del modal. No introduce icono de lupa ni botón adicional, solo el input de texto.

### Preguntas de alcance resueltas

- **Criterio de búsqueda**: se confirmó buscar por nombre de la imagen, con el mismo criterio de normalización (minúsculas, sin acentos) que ya usa el filtro existente del panel de Recursos en modo edición, en vez de introducir un criterio distinto o campos adicionales de búsqueda.

## Apuntes técnicos

- El modal está en `src/ui/boardImageModal.js` (función `openBoardImageModal`), compartido por `src/ui/componentModal.js` y `src/ui/cardEditorModal.js` — un único cambio ahí cubre ambos puntos de entrada de "Elegir imagen".
- Ya existe un patrón equivalente de filtro de texto en `src/ui/resourceList.js` (estado `filterText`, función `normalize()` que hace minúsculas + NFD sin diacríticos, y `matchesFilter()`) que debe reutilizarse como referencia para mantener el mismo criterio de normalización y estilo de mensaje de "sin coincidencias".
