- **Nombre**: Foco explícito y posiciones fijas en el ajuste de imagen de las dos caras de una carta
- **Código**: 00060
- **Tipo**: change

## Prompt original del usuario

el comportamiento para editar imágenes de las dos caras de una carta es un poco extraño. Quiero que se vean las dos caras y que al hacer clic sobre una se active y la edición se aplique solo sobre la cara de la carta seleccionada. Pero quiero que cada cara tenga su titulo (frontal, trasera) y se mantengan en su sitio: al hacer clic sobre una cambiamos el foco.

Me refiero a la ventana para editar/ajustar la imagen de las caras de las cartas.

## Descripción completa

Al ajustar la imagen de una carta (que tiene dos caras, frontal y trasera), la ventana emergente de ajuste muestra ambas caras a la vez, pero hoy la cara que se está editando ("Activa") siempre aparece a la izquierda y la otra cara ("Otra cara") siempre a la derecha. Para cambiar de cara a editar hay que hacer clic sobre la miniatura de "Otra cara", y al hacerlo la ventana se cierra y se vuelve a abrir con los papeles intercambiados: la cara que antes estaba a la derecha pasa a mostrarse a la izquierda. Este salto de posición es el comportamiento que resulta extraño.

Comportamiento nuevo:

1. **Posiciones fijas**: la cara frontal se muestra siempre en la misma posición (izquierda) y la trasera siempre en la otra (derecha), sin importar cuál de las dos se esté editando en cada momento.
2. **Títulos fijos**: cada cara lleva su propio título fijo, "Frontal" o "Trasera", que nunca cambia de texto ni de sitio al cambiar cuál se está editando.
3. **Clic para cambiar el foco**: hacer clic sobre cualquiera de las dos caras la activa para edición (se resalta visualmente, por ejemplo con el mismo borde de color que hoy indica la cara activa). A partir de ese momento, arrastrar para mover la imagen y el control de Zoom afectan solo a la cara activa; la otra cara se ve atenuada pero permanece visible en su sitio, sin desaparecer ni desplazarse.
4. **Foco inicial**: al abrir la ventana de ajuste, queda activa la misma cara que hoy se elige por defecto (la frontal si tiene una imagen asignada; si no la tiene, la trasera).
5. **Cara sin imagen**: si una cara todavía no tiene ninguna imagen asignada, no se puede activar para edición (no hay nada que ajustar) — se ve su hueco vacío y no reacciona al clic.
6. **Guardado**: los botones "Aceptar" y "Cancelar" no cambian de comportamiento. "Aceptar" guarda el ajuste de todas las caras que se hayan tocado durante esa sesión de edición; "Cancelar" descarta todo lo hecho en ella.
7. **Alcance**: este cambio afecta solo a la ventana de ajuste de imagen cuando se usa para las dos caras de una carta. El ajuste de imagen de otros elementos que solo tienen una imagen (sin cara alternativa que mostrar al lado) no cambia.

## Apuntes técnicos

- El mecanismo a sustituir vive en `ui/imageAdjustModal.js` (parámetro `secondaryPreview`, con su `onSelect`) y en `ui/cardEditorModal.js` (función `openForKey(activeKey)`, que hoy cierra y reabre `openImageAdjustModal` completo para cambiar de cara activa — de ahí el intercambio de posición, porque el "stage" primario siempre se pinta a la izquierda y el secundario a la derecha).
- El nuevo comportamiento requiere que el propio popup mantenga un estado de foco interno (qué cara está activa) y reaccione a clics sobre cualquiera de los dos "stages" sin cerrar/reabrir el modal ni reordenar el DOM: los dos stages deben mantener su columna fija (frontal/trasera) y solo cambiar cuál de los dos recibe los listeners de arrastre/zoom y el resaltado visual.
- Documentado en `ARCHITECTURE.md` sección 5 (`ui/imageAdjustModal.js`, cambios 00029/00053/00058): el parámetro `secondaryPreview: { shape, width, height, resource, adjustment, onSelect }` y su mecanismo de "sesión de ajuste" con intercambio de roles quedarán obsoletos con este cambio y habrá que actualizar esa sección al implementarlo.
