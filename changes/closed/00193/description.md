- **Nombre**: Slider de rotación de imágenes y formas en vez de botón de 90º
- **Código**: 00193
- **Tipo**: change
- **Fecha creación**: 2026-08-07

## Prompt original del usuario

en varios sitios hay un botón para girar imágenes 90º. Quiero quitar ese botón y usar un slider para girar la imagen entre 0 y 360º, con pequeñas marcas cada 90º que sean fácilmente seleccionables

## Descripción completa

Hoy, para rotar el contenido de una imagen dentro del recuadro donde se coloca (por ejemplo el fondo de una forma o de un componente), existe un botón "Girar 90º" que cada vez que se pulsa gira la imagen 90 grados más, ciclando 0→90→180→270→0. Este control aparece en el modal de "Ajustar imagen", que se reutiliza desde varios sitios distintos del proyecto (siempre que se pueda ajustar una imagen de fondo), por lo que el cambio se aplica en todos esos sitios a la vez al tratarse del mismo control compartido.

Se sustituye ese botón por un slider (control deslizante) que permite elegir cualquier ángulo de rotación entre 0 y 360 grados, no solo saltos de 90 en 90. El slider incluye marcas visuales en 0º, 90º, 180º, 270º y 360º que son fácilmente seleccionables: al arrastrar el control cerca de una de esas marcas, el valor se "imanta" y se ajusta automáticamente al ángulo exacto de la marca, facilitando parar justo en un giro de cuarto de vuelta sin perder la posibilidad de elegir un ángulo intermedio en cualquier otro punto del recorrido. Junto al slider hay también un campo numérico editable que muestra el grado exacto y permite escribirlo directamente, igual que ya ocurre hoy con otros controles de ese mismo modal (por ejemplo el de zoom o el de transparencia).

Por separado, existe otro punto de la aplicación donde también se puede rotar de 90 en 90, pero en este caso rotando una forma o una caja de texto completa (no solo la imagen que contiene), mediante una opción "Girar 90°" dentro de un menú que aparece al hacer clic derecho sobre el elemento. Esa opción de menú se mantiene exactamente igual, sin ningún cambio: sigue girando 90 grados cada vez que se pulsa. Lo que se añade es el mismo slider de rotación (0-360º, con las mismas marcas imantadas cada 90º y el mismo campo numérico) dentro de la ventana de edición detallada que ya se abre al hacer doble clic sobre esa forma o caja de texto, como una forma adicional y más precisa de ajustar el ángulo exacto, que convive con la opción rápida del menú contextual. Esa ventana de edición no tiene hoy ningún control de rotación, así que ahí es una incorporación nueva, no una sustitución.

### Casos límite y comportamiento
- 0º y 360º representan visualmente el mismo giro completo; ambos son posiciones distintas y válidas en los extremos del slider, sin forzar que uno se convierta automáticamente en el otro al guardar.
- El valor de rotación por defecto sigue siendo 0 en todos los sitios donde ya lo era.
- No se introducen estados de carga ni de error nuevos: es un cambio en el control con el que se edita un dato que ya existía.
- No cambia dónde ni cómo se guarda el ángulo de rotación, solo la manera en que el usuario lo elige.

### Dudas de alcance resueltas con el usuario
- **¿Afecta solo a la rotación de imágenes o también a la de formas/cajas de texto?** Afecta a ambas, pero de forma distinta: la rotación de imágenes cambia por completo (el botón desaparece y se sustituye por el slider); la rotación de formas/cajas de texto mantiene su acción rápida de menú tal cual y además gana el slider como control adicional dentro de su ventana de edición.
- **¿Las marcas de 90º solo son una guía visual o "atraen" el valor del slider?** Atraen el valor (imán): al soltar cerca de una marca, el ángulo se ajusta exactamente a ella.
- **¿Se mantiene un campo numérico junto al slider?** Sí, slider más número editable, igual que los controles similares que ya existen en el proyecto.

## Apuntes técnicos

- El botón a eliminar es el de `src/ui/imageAdjustModal.js` (icono + texto "90º", clase `btn-rotate`), con estilos en `src/styles/main.css`. El dato es `state[key].rotation`, hoy siempre 0/90/180/270.
- La función `applyImageAdjustStyle()` de `imageAdjustModal.js` tiene una rama que intercambia ancho/alto del "marco virtual" de encuadre únicamente cuando `rotation` es exactamente 90 o 270 (hay un comentario explicando por qué). Con rotación libre en grados intermedios, esa lógica de intercambio binario deja de ser válida y debe rehacerse con geometría continua (bounding box / trigonometría) — a resolver en el plan técnico, no es una decisión funcional.
- El menú contextual "Girar 90°" que se mantiene sin cambios está en `src/ui/visualEditorModal.js` (rotación de `Forma`/`TextBox`, campo `element.rotation`).
- Los modales de edición donde se añade el slider nuevo son `src/ui/cardShapeModal.js` (formas) y `src/ui/cardTextBoxModal.js` (cajas de texto), abiertos hoy por doble clic desde `visualEditorModal.js`. Ninguno de los dos tiene hoy control de rotación.
- Patrón de slider ya existente y reutilizable como referencia: `input type="range"` + input de texto numérico sincronizado + listener `input`, usado para opacidad en `cardShapeModal.js:162-202`, `cardTextBoxModal.js:413-453` y para zoom/transparencia en `imageAdjustModal.js:300-348`. No hay precedente de `<datalist>` ni de marcas con imán en el proyecto — es un patrón nuevo a introducir.
- Renderizado final que consume `rotation` vía `transform: rotate(${rotation}deg)`: `componentRenderer.js:351,391`, `visualEditorModal.js:904,1058`, `imageAdjustModal.js:51`. Ya acepta cualquier grado a nivel CSS, sin cambios necesarios ahí.
