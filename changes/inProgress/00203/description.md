es- **Nombre**: Sentido de rotación en los sliders (-360º a 360º)
- **Código**: 00203
- **Tipo**: change
- **Fecha creación**: 2026-08-14

## Descripción completa

Hoy, todos los sliders de rotación de la aplicación (los que permiten girar la imagen de fondo de una cara, una forma de una tarjeta, o una caja de texto) solo admiten valores de 0º a 360º, es decir, únicamente permiten definir la magnitud del giro pero no su sentido: siempre giran en la misma dirección.

Este cambio amplía esos sliders para que su rango pase de [0º, 360º] a [-360º, 360º]. El signo del valor pasa a indicar el sentido del giro: los valores negativos giran en sentido antihorario y los positivos en sentido horario. No se añade ningún control adicional para elegir el sentido por separado — el propio slider, ahora con signo, permite elegir sentido y magnitud a la vez arrastrándolo hacia la izquierda o la derecha del centro.

El slider ya cuenta con "marcas magnéticas" (posiciones a las que el valor se ajusta automáticamente si se suelta cerca de ellas) en 0º, 90º, 180º, 270º y 360º. Estas marcas se amplían de forma simétrica al lado negativo, quedando en -360º, -270º, -180º, -90º, 0º, 90º, 180º, 270º y 360º, con el mismo margen de imantación que hoy.

El campo de texto que acompaña al slider, para escribir el valor exacto a mano, sigue funcionando igual pero ahora acepta también valores negativos dentro del nuevo rango.

Los elementos ya existentes en las partidas guardadas, con un valor de rotación entre 0º y 360º, se siguen mostrando y editando exactamente igual que hoy — no hace falta ningún proceso de actualización de datos, porque el rango nuevo incluye por completo al actual.

Además del slider, existe un atajo en el menú contextual del elemento, "Girar 90°", que gira el elemento 90º cada vez que se pulsa, siempre en el mismo sentido. Este atajo también se amplía como parte de este cambio: pasa a ofrecer dos opciones, "Girar 90° (horario)" y "Girar 90° (antihorario)", cada una girando el elemento 90º en su sentido correspondiente.

Esta funcionalidad sigue estando disponible únicamente en modo edición, igual que hoy — no cambia quién puede usarla.

### Definición visual de alto nivel

El slider deja de tener el valor 0º en su extremo izquierdo (como hoy) y pasa a tener el 0º aproximadamente en el centro de la pista, con el resto de valores repartidos simétricamente hacia ambos lados. Al ser un único control reutilizado en los tres sitios donde se puede rotar algo (ajuste de imagen de fondo, forma de una tarjeta, caja de texto), el cambio visual se aplica de forma idéntica en los tres.

### Preguntas de alcance resueltas

- **¿Un único slider con signo, o un selector de sentido aparte más un slider de magnitud?** → Un único slider con signo: el valor negativo ya indica el sentido antihorario, sin necesidad de un control adicional.
- **¿Las marcas magnéticas se reflejan también en el lado negativo?** → Sí, de forma simétrica.
- **¿El atajo "Girar 90°" del menú contextual queda fuera de este cambio, al no ser un slider?** → No, también se amplía, añadiendo la opción equivalente en sentido antihorario.

### Fuera de alcance

Los sliders que no son de rotación (zoom, opacidad/transparencia) no se ven afectados por este cambio.

## Apuntes técnicos

- Existe un único widget reutilizable de slider de rotación, `createRotationSliderField()` en `src/ui/rotationSlider.js`, consumido de forma idéntica por tres modales: `src/ui/imageAdjustModal.js:270` (rotación de imagen de fondo, `ajusteImagen.rotation`), `src/ui/cardShapeModal.js:323` (rotación de forma, `working.rotation`) y `src/ui/cardTextBoxModal.js:481` (rotación de caja de texto, `working.rotation`). El cambio de rango se hace en un único punto y se propaga a los tres.
- Configuración actual del slider: `<input type="range" min="0" max="360" step="1">`, con marcas magnéticas en `[0, 90, 180, 270, 360]` y `ROTATION_SNAP_THRESHOLD_DEG = 8`. El input de texto emparejado hace `clamp()` a `[0, 360]` en `commitTextInput()`.
- El renderizado ya usa `transform: rotate(${rotation}deg)` (`componentRenderer.js:351,391`; `visualEditorModal.js:904,1058`), que soporta valores negativos sin cambios — la restricción actual es solo del widget/clamp, no del render.
- La documentación de arquitectura (`design/docs/architecture/02-component-types.md`, líneas 116 y 140) documenta hoy `rotation: number (0-360) | undefined`; habrá que actualizarla a `(-360-360)`.
- El atajo "Girar 90°" del menú contextual vive en `src/ui/visualEditorModal.js:609-614` y es un mecanismo independiente del slider: `element.rotation = ((element.rotation ?? 0) + 90) % 360`, cíclico y siempre positivo. Al ampliarlo, esta lógica deberá revisarse (el `% 360` ya no sería válido con valores negativos).
- El style bible documenta el patrón de "slider con marcas magnéticas" en `design/docs/style/03-modales-menus.md`, sección 12.12 (líneas 291-299), incluyendo la mención explícita a que existen "dos mecanismos" (slider preciso y atajo cíclico de 90°) — esa sección también deberá actualizarse.
