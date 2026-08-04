- **Nombre**: Menú contextual de elementos en el editor de cartas
- **Código**: 00124
- **Tipo**: change

## Prompt original del usuario

quiero añadir en el editor de cartas un menú contextual (botón derecho del ratón) para cada elemento insertado en una cara (textos y figuras geométricas) con 3 opciones:
- eliminar
- Colocar arriba (coloca el elemento por encima de todos los demás)
- Colocar abajo (coloca el elemento por debajo de todos los demás)

## Descripción completa

En el editor de cartas, cada cara (frontal o trasera) puede tener varios elementos insertados: cuadros de texto y figuras geométricas. Se añade un menú contextual que aparece al hacer click derecho sobre cualquiera de estos elementos, con tres opciones:

- **Eliminar**: borra el elemento al instante, sin pedir confirmación previa (mismo comportamiento que ya tiene hoy el botón "Eliminar" dentro de la ventana de edición del elemento, a la que se llega con doble click).
- **Colocar arriba**: el elemento pasa a estar por encima de todos los demás elementos de esa misma cara, sin importar si son texto o figura.
- **Colocar abajo**: el elemento pasa a estar por debajo de todos los demás elementos de esa misma cara (texto o figura), pero siempre por encima de la imagen de fondo de la cara, que permanece fija en el extremo inferior.

El click derecho selecciona el elemento (si no lo estaba ya) y abre el menú junto al cursor. El menú se cierra haciendo click fuera de él, pulsando Escape, o al elegir cualquiera de las tres opciones. Si el elemento ya está en el extremo correspondiente (ya es el más alto o el más bajo del apilado, según el caso) y se pulsa esa misma opción, no ocurre nada visible.

Al elegir "Colocar arriba" o "Colocar abajo", el lienzo se actualiza al instante mostrando el elemento en su nueva posición de apilado — se nota inmediatamente si pasa a tapar, o queda tapado por, otros elementos que se solapen con él.

Esto aplica de forma independiente a cada cara de la carta: la cara frontal y la trasera mantienen cada una su propio orden de apilado, sin afectarse entre sí. La imagen de fondo de una cara no es un "elemento insertado" (no tiene menú contextual propio) y siempre queda en el fondo, ajena a este orden.

### Preguntas de alcance resueltas

- **¿Aplica solo a texto y figuras, o también a la imagen de fondo?** Solo a los elementos insertados (texto y figuras). La imagen de fondo no participa de este menú ni del nuevo orden entre elementos — siempre queda debajo de todos ellos.
- **¿"Eliminar" pide confirmación?** No, igual que el borrado ya existente desde la ventana de edición del elemento.
- **¿Qué pasa si el elemento ya está en el extremo?** No pasa nada visible; la opción sigue disponible igualmente.
- **¿Puede una figura quedar por encima de un texto, o al revés?** Sí. Aunque hoy el texto siempre se dibuja por delante de las figuras sin excepción, este cambio introduce un orden único y mezclado entre ambos tipos dentro de cada cara: cualquier elemento (texto o figura) puede colocarse por encima o por debajo de cualquier otro, sin que su tipo determine ya un orden fijo. La única excepción es la imagen de fondo, que se mantiene siempre en el extremo inferior pase lo que pase.

## Apuntes técnicos

- **Incongruencia con la documentación técnica**: `design/docs/ARCHITECTURE.md` (sección de tipos de componente, tipo `'carta'`) documenta hoy: "Orden de apilado dentro de una cara: imagen de fondo → formas → textBoxes (el texto siempre por delante)". Este cambio invalida esa frase — pasa a ser un orden mezclado por elemento, con la imagen de fondo como única invariante fija al fondo. `ms-how` debe actualizar esa sección como parte del plan.
- **Modelo de datos actual**: no existe ningún campo de orden explícito por elemento. `cara.formas` y `cara.textBoxes` (`src/ui/cardEditorModal.js`) son arrays independientes donde los nuevos elementos se añaden con `push` (líneas ~427-442) y el renderizado (`src/ui/componentRenderer.js` ~280-320, y el propio `cardEditorModal.js`) siempre pinta primero todas las `formas` y después todos los `textBoxes`, sin intercalarlos. La nueva funcionalidad necesita poder intercalar ambos tipos en un único orden — la solución técnica concreta (p.ej. un campo `order`/`zIndex` por elemento, o una lista combinada de referencias) la decide `ms-how`.
- **Menú contextual reutilizable existente**: `src/ui/contextMenu.js` (`openContextMenu`) ya es un componente genérico usado en `src/modes/play/playMode.js` para el menú contextual de componentes en la mesa (acciones generales + específicas por tipo, cierre con click fuera/ESC). Candidato natural a reutilizar aquí en vez de crear un menú nuevo desde cero; en este caso no harían falta secciones de "specificItems", descripción ni interacciones, solo las 3 filas generales.
- **Interacción ya existente en `cardEditorModal.js`**: los elementos ya tienen selección con click (`selectTextBox`/`selectShape`), edición con doble click (abre `src/ui/cardTextBoxModal.js` / `src/ui/cardShapeModal.js`, que ya exponen `onDelete`/`onDuplicate` invocados desde dentro), arrastre (`mousedown`+`mousemove`) y redimensionado (`attachResizeHandle`). No existe hoy ningún manejo de click derecho dentro de este editor.
