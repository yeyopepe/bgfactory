# Versión v1.1 — 2026-08-07

Nuevo: 4 · Cambios: 5 · Eliminado: 0 · Fixes: 0

## Nuevo

- **Imagen propia del mazo** — Los mazos ahora pueden tener una imagen propia elegida por el usuario, con ajuste de zoom, posición, rotación y transparencia, en vez de mostrar siempre el dorso de la carta que tengan arriba. Mientras no se elija ninguna imagen propia, el mazo se sigue comportando como hasta ahora.
- **Pestaña "Copias" en las propiedades de un componente** — Se añadió una pestaña nueva que muestra el total de copias vinculadas a un elemento original, con un listado de solo lectura, un botón para sincronizar todas las copias de golpe y un checkbox para desincronizarlas todas fijando su estado "Oculto".
- **Icono de mazo vacío con imagen propia configurada** — Cuando un mazo tiene una imagen propia configurada y se queda sin cartas, ahora muestra el icono de "mazo vacío" en vez de seguir mostrando su imagen propia; en cuanto vuelve a tener alguna carta, se muestra de nuevo la imagen configurada.
- **Texto "Copias: XXX" en la pestaña "Copias"** — La fila que indica el número de copias vinculadas en la pestaña "Copias" pasó a mostrar un único texto combinado ("Copias: 5", por ejemplo) en vez de una etiqueta y un número en columnas separadas.

## Cambios

- **Renombrar tipo "Dado" a "Dado Configurable"** — El elemento de tipo "Dado" pasó a llamarse "Dado Configurable" en todos los sitios donde se muestra su nombre, sin cambiar su comportamiento.
- **Renombrar "Grupos" a "Etiquetas"** — El concepto que se llamaba "Grupo"/"Grupos" pasó a llamarse "Etiqueta"/"Etiquetas" en toda la aplicación, manteniendo exactamente el mismo comportamiento (un elemento puede pertenecer a varias etiquetas a la vez).
- **Transparencia para el fondo de imagen de las figuras geométricas** — Las figuras geométricas (círculo, cuadrado, rectángulo redondeado) que usan una imagen como fondo ahora admiten un nivel de transparencia ajustable, igual que ya era posible con el fondo de color.
- **Slider de rotación de imágenes y formas en vez de botón de 90º** — El botón que giraba una imagen en saltos fijos de 90º se sustituyó por un slider que permite elegir cualquier ángulo entre 0 y 360 grados, con marcas imantadas cada 90º y un campo numérico editable; además, las formas y cajas de texto ganaron este mismo slider como ajuste adicional de precisión en su ventana de edición detallada.
- **Quitar confirmación al añadir cartas a un mazo en modo edición** — Arrastrar una o varias cartas hasta un mazo en modo edición ya no pide confirmación antes de añadirlas, igual que ya ocurría en modo juego.
