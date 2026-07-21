- **Nombre**: Intercambiar cara activa en el ajuste de imagen de cartas
- **Código**: 00058
- **Tipo**: change

## Prompt original del usuario

"ms-new en la pantalla de edición de las imágenes de las cartas, quiero poder pulsar sobre cualquiera de las dos caras y editar la imagen de la cara seleccionada."

Aclaración posterior: "Ahora solo hace falta un botón de ajustar imagen, no dos, porque siempre iremos a la pantalla donde se ven ambas caras y podremos editarlas."

Ampliación posterior: "Añade también que el control de zoom debe tener debajo un control de texto con el valor del zoom. Este cuadro es editable por el usuario (se actualiza el slider) y si se mueve el slider, se actualiza el valor"

## Descripción completa

En la pantalla de ajuste de imagen del editor de cartas (donde se ve la cara que se está ajustando junto a "Otra cara" en modo solo lectura), se podrá pulsar sobre cualquiera de las dos caras para que esa pase a ser la cara activa (la que se puede arrastrar para mover la imagen y cuyo zoom controla el deslizador "Zoom"), mientras la otra pasa a mostrarse en modo solo lectura. Ninguna de las dos cambia de posición en pantalla al intercambiar: solo cambia cuál de ellas está activa en cada momento.

Además, el editor de cartas pasa a tener un único botón "Ajustar imagen…" (hoy hay uno por cada cara/columna), ubicado debajo de las dos columnas de caras, ya que desde esa misma pantalla se pueden ajustar ambas caras indistintamente. El botón "Elegir imagen…" (para asignar qué imagen usa cada cara) no se ve afectado por este cambio y sigue existiendo uno por cara, porque cada cara puede tener una imagen distinta y esa elección sigue siendo independiente.

Reglas de comportamiento acordadas:

- Al pulsar el único botón "Ajustar imagen…", la pantalla se abre con la cara frontal activa por defecto, salvo que la frontal no tenga ninguna imagen elegida y la trasera sí, en cuyo caso se abre con la trasera activa. Si ninguna de las dos caras tiene imagen elegida, el botón permanece deshabilitado (mismo criterio que ya existía para el botón de ajustar de una sola cara sin imagen).
- Pulsar sobre la cara que está en modo solo lectura, cuando sí tiene una imagen elegida, la convierte en la activa (intercambiando roles con la que era activa hasta ese momento).
- Pulsar sobre una cara sin imagen elegida no hace nada: sigue en modo solo lectura, no se puede activar una cara que no tiene nada que mostrar.
- Pulsar sobre la cara que ya es la activa no hace nada (ya está en modo edición).
- Al aceptar los cambios de la pantalla de ajuste, se guarda el ajuste final de ambas caras, no solo el de la que estaba activa al abrir la pantalla — durante la misma sesión de ajuste se ha podido intercambiar la cara activa y ajustar ambas.
- Al cancelar, se descartan los cambios de ajuste de ambas caras (igual que hoy se descartan los de la única cara editable).
- La etiqueta "Otra cara" se mantiene, mostrada siempre sobre la cara que en cada momento está en modo solo lectura (sin importar cuál sea).
- Definición visual: la cara activa se distingue con algún resaltado (p.ej. un borde de acento). La cara inactiva que sí tiene imagen elegida muestra el cursor en forma de mano/puntero y algún efecto sutil de resaltado al pasar el ratón por encima, para dar a entender que se puede pulsar sobre ella. La cara inactiva sin imagen elegida no muestra ningún indicio de que se pueda interactuar con ella.
- Este cambio no afecta al ajuste de imagen de otros tipos de componente que solo tienen una única cara/imagen (como la ficha): ahí no existe "otra cara" con la que intercambiar el rol, y su comportamiento actual no cambia.

Ampliación — valor de zoom editable como texto:

- Debajo del deslizador de "Zoom" se añade un cuadro de texto con el valor numérico del zoom, sincronizado en ambos sentidos con el deslizador: mover el deslizador actualiza el número mostrado en el cuadro, y escribir un valor en el cuadro mueve el deslizador y aplica el zoom a la cara activa.
- El cuadro solo admite valores dentro del mismo rango que ya permite el deslizador (100–300); un valor fuera de rango se ajusta (clamp) al mínimo o máximo permitido al confirmarlo.
- Esta ampliación afecta a la pantalla de ajuste de imagen en general (el control de zoom es el mismo, tenga o no la pantalla una segunda cara en modo solo lectura), por lo que también se aplica al caso de una sola cara (como la ficha).

## Apuntes técnicos

- El editor de cartas está en `ui/cardEditorModal.js` (función `openCardEditorModal`); hoy renderiza cada cara (`renderFace`) con su propio botón "Ajustar imagen…" que llama a `openImageAdjustModal` pasando la otra cara como `secondaryPreview` (solo lectura, sin listeners de arrastre).
- La pantalla de ajuste de imagen reutilizable está en `ui/imageAdjustModal.js` (función `openImageAdjustModal`), usada también por `'ficha'` (vía `ui/componentModal.js`) sin `secondaryPreview` — ese caso de uso de una sola cara no debe verse afectado.
- Hoy `openImageAdjustModal` asume una única cara "primaria" editable y un único `onAccept({ zoom, posX, posY })`; para soportar el intercambio de roles y que "Aceptar" guarde ambas caras, su API interna tendrá que extenderse (recibir los datos de las dos caras y devolver el ajuste final de ambas) — el diseño concreto de esa extensión, sin romper el caso de uso de una sola cara de `'ficha'`, queda para `ms-implement`.
- `applyImageAdjustStyle(imgEl, adjustment)` (mismo fichero) ya se reutiliza para pintar el resultado final en `ui/componentRenderer.js` y en las previsualizaciones de `ui/cardEditorModal.js`; no debería necesitar cambios.
