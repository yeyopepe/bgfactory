- **Nombre**: Figuras geométricas en el editor de cartas
- **Código**: 00118
- **Tipo**: change

## Prompt original del usuario

en el editor de cartas quiero  poder añadir un nuevo elemento (además de una imagen y cuadros de texto) que son figuras geométricas:
- permitidas: circular/elíptica o cuadrada
- la redimensión de las circulares/elípticas debe ser igual que la redimensión que usamos en otras partes de la app
- configuración: color de fondo, grosor y color de borde.

(Ampliación posterior) Como ahora ya hay 3 cosas diferentes que se pueden añadir a las cartas (imagen, texto y figuras), necesitamos redefinir esa pantalla con alguna de estas opciones:
- Quitar el texto de los botones y usar solo iconos, así podremos añadir más
- Cambia el sistema para seleccionar qué vamos a insertar (un combo o similar)

## Descripción completa

En el editor de cartas, cada cara de una carta admite hoy dos tipos de contenido: una imagen de fondo (única) y varios cuadros de texto (se pueden añadir tantos como se quiera, cada uno seleccionable, arrastrable, redimensionable y editable de forma independiente). Se añade un tercer tipo de elemento con ese mismo comportamiento: **figuras geométricas**.

### Figuras geométricas

- Tipo permitido: círculo/elipse o cuadrado.
- Se pueden añadir varias figuras a una misma cara, igual que ya ocurre con los cuadros de texto: cada una se selecciona, arrastra, redimensiona, edita, duplica y elimina de forma independiente.
- Configuración de cada figura: color de fondo (o transparente si no se define ninguno), color de borde y grosor de borde.
- Redimensión, igual que ya se usa en otras partes de la app para elementos circulares/elípticos: libre en ambos ejes, manteniendo proporción 1:1 (círculo perfecto) si se mantiene pulsada la tecla Shift mientras se arrastra el tirador de redimensión — mismo comportamiento que ya tiene hoy la proporción circular disponible para las cartas. La figura cuadrada, en cambio, se redimensiona libremente en ambos ejes sin ninguna restricción de proporción.
- Al cambiar el tipo de una figura ya creada de cuadrada a circular/elíptica, se ajusta automáticamente para que quede como un círculo perfecto (ancho = alto), igual que ya ocurre al cambiar la proporción de una carta a circular.
- Orden de apilado dentro de la cara: la imagen de fondo queda siempre detrás, las figuras encima de la imagen, y los cuadros de texto siempre por delante de las figuras.
- Se guarda como parte del diseño de esa cara de la carta, por lo que viaja con ella al exportar, importar, duplicar o copiar la carta, igual que ocurre hoy con los cuadros de texto.
- Disponible únicamente en modo edición, para cartas — mismo alcance que el resto del editor de cartas.
- Si una cara no tiene ninguna figura añadida, no cambia nada respecto al comportamiento actual.

### Rediseño de la pantalla para añadir elementos

Al pasar de 2 a 3 tipos de elemento que se pueden añadir a una cara (imagen, texto, figura), se sustituye la fila de botones de texto actual ("Elegir imagen…", "+ Texto") por un único botón "Añadir elemento" que despliega un menú con una opción por tipo (Imagen de fondo / Cuadro de texto / Figura geométrica). Esta opción se ha preferido frente a convertir cada botón en un icono suelto porque escala mejor si en el futuro se añaden más tipos de elemento, sin tener que rediseñar de nuevo la pantalla cada vez.

**Validación visual confirmada por el usuario**: opción A, el mockup `design_selector-menu-desplegable.html` (menú desplegable "Añadir elemento"). `design_selector-botones-icono.html` (fila de botones icono-solo) queda en esta misma carpeta como referencia de la alternativa descartada. `design_modal-figura.html` (modal de configuración de una figura) también validado.

## Apuntes técnicos

- Modelo de datos actual (`design/docs/ARCHITECTURE.md` sección 4, tipo `'carta'`): cada cara (`caraFrontal`/`caraTrasera`) tiene `imagenResourceId`/`ajusteImagen` (imagen de fondo, única) y `textBoxes` (array de cuadros de texto independientes). Se propone añadir una colección paralela `formas` con el mismo criterio de independencia por elemento.
- `ui/cardEditorModal.js`: los cuadros de texto se renderizan con `renderTextBox` (selección por click, edición por doble click abriendo `ui/cardTextBoxModal.js`, arrastre con `mousedown`/`mousemove`/`mouseup`, y redimensión con `attachResizeHandle` de `ui/resizeHandle.js`, `axis: 'both'`, clamp de tamaño mínimo). Las figuras deberían seguir el mismo patrón, con una modal nueva análoga (`ui/cardShapeModal.js`) y su propio helper de render (p. ej. `renderShape`).
- Redimensión libre con Shift forzando 1:1 en `axis: 'both'` ya es un comportamiento genérico de `ui/resizeHandle.js` (usado hoy por la proporción `'circular'` de `'carta'`, ver ARCHITECTURE.md sección 4) — no hace falta implementarlo de nuevo, solo no pasar un `clamp` que fuerce otra cosa para el tipo círculo/elipse.
- El botón "Elegir imagen…" (línea ~304 de `cardEditorModal.js`) y "+ Texto" (línea ~323) pasan a ser opciones de un menú desplegable nuevo, siguiendo el patrón ya documentado en `STYLE_BIBLE.md` sección 12.7 (`ui/resourceList.js`, `createAddMenu`, usado hoy por "+ Añadir recurso" del panel Recursos) en vez de introducir un patrón de menú nuevo.
- Borde de la figura: línea simple (`border` CSS), sin el bisel especial que `STYLE_BIBLE.md` sección 13 reserva únicamente a `'tablero'`/`'dado'`.
