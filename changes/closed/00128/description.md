- **Nombre**: Tirador de redimensionado en la esquina superior izquierda
- **Código**: 00128
- **Tipo**: change

## Prompt original del usuario

añade un nuevo tirado en la esquina superior izquierda para redimensionar los elementos que ya lo tenga incorporado.
Haz una lista de todos los elementos de la app que pueden redimensarionarse y en los que hay que añadir ese tirador

## Descripción completa

Hoy, cualquier elemento redimensionable de la app solo puede redimensionarse arrastrando un único tirador situado en su esquina inferior derecha. Se pide añadir un segundo tirador, en la esquina superior izquierda, a todos esos mismos elementos, para poder redimensionar también agarrando por esa esquina.

**Elementos afectados** (todo elemento que hoy ya tiene el tirador inferior derecho lo recibe también en la esquina superior izquierda):

- Componentes colocados sobre la mesa en modo edición, cuando están seleccionados en solitario: Cuadro de texto, Tablero, Dado, Visor de documentos, Carta/Ficha y Mazo.
- Los tres paneles flotantes del modo edición: "Componentes", "Recursos" y "Grupos".
- Los elementos internos del editor de cartas (por cada cara de la carta): el cuadro de texto y la figura geométrica.

**Qué queda explícitamente fuera**: el ajuste de ancho de columna de las tablas de los paneles no es un tirador de esquina (es un borde vertical que se arrastra), así que no recibe este segundo tirador.

**Comportamiento al arrastrar el nuevo tirador**: la esquina inferior derecha del elemento queda siempre fija (no se mueve); el elemento crece o decrece "hacia fuera" por la esquina superior izquierda. Es el comportamiento en espejo del tirador ya existente, que en cambio ancla la esquina superior izquierda y mueve la inferior derecha.

**Aspecto visual**: el nuevo tirador tiene el mismo aspecto que el actual (icono de grip diagonal, mismo tamaño, mismo resaltado en azul al pasar el ratón por encima o mientras se arrastra), solo que ubicado en la esquina opuesta. El cursor al pasar sobre él es el mismo de redimensionado diagonal que ya usa el tirador existente (ambas esquinas están sobre la misma diagonal).

**Restricciones de proporción**: el nuevo tirador respeta exactamente las mismas reglas que ya aplica hoy el tirador existente, según el tipo de elemento — proporción libre (con Shift para forzar temporalmente forma cuadrada/circular perfecta) en Cuadro de texto, Tablero, Visor de documentos y Carta/Ficha con proporción "Circular"; proporción siempre fija, sin importar Shift, en Dado y en Carta/Ficha con cualquier proporción no circular.

**Tamaños mínimos**: se mantienen sin cambios los mínimos ya definidos hoy por tipo de elemento (por ejemplo, 40×24px para Cuadro de texto, 40×40px para Tablero/Dado, 80×80px para Visor de documentos, 60×60px para Carta/Ficha, 290px de ancho mínimo para los paneles). El nuevo tirador no introduce ningún límite máximo ni cambia ningún mínimo existente; solo ofrece un punto de anclaje adicional para redimensionar.

**Persistencia**: igual que con el tirador ya existente, el resultado de usar el nuevo tirador (nueva posición y nuevo tamaño) se guarda de inmediato, sin ningún paso de confirmación adicional.

**Selección múltiple**: sin cambios respecto a hoy — los tiradores de redimensionado (el existente y el nuevo) solo se muestran sobre un componente de la mesa cuando hay exactamente un elemento seleccionado.

**Preguntas de alcance resueltas con el usuario**:
- ¿Se aplica a los 11 elementos identificados, o solo a un subconjunto? → A los 11, de manera uniforme.
- ¿Qué esquina debe quedar fija al arrastrar el nuevo tirador? → La esquina inferior derecha, en espejo del comportamiento ya existente.

## Apuntes técnicos

El mecanismo de redimensionado es único y compartido: `ui/resizeHandle.js` (`attachResizeHandle`), usado por `ui/componentRenderer.js` (los 6 tipos de componente sobre la mesa), `ui/componentList.js`, `ui/resourceList.js` y `ui/groupList.js` (los 3 paneles flotantes), y `ui/cardEditorModal.js` (cuadro de texto y figura geométrica dentro del editor de cartas). El tirador de columna de tabla (`ui/tableColumnResize.js`) usa el mismo mecanismo con `axis: 'x'`, pero no es un tirador de esquina — queda fuera de este cambio.

Hoy `attachResizeHandle` solo calcula `width`/`height` (delta de ratón desde el tamaño inicial), sin tocar la posición del elemento — el tirador está fijado por CSS en la esquina inferior derecha (`.resize-handle { right: 0; bottom: 0; }`, `src/styles/main.css`) y cada llamador aplica el resultado a su propio modelo de posición (`x`/`y` en los componentes de la mesa vía `core/component.js`/`core/state.js`; `left`/`top` en los paneles vía su propio `panelState`). Para que el nuevo tirador superior izquierdo mantenga fija la esquina inferior derecha, cada llamador tendrá que ajustar también la posición en función del delta de tamaño, no solo el tamaño — queda pendiente de resolver como solución técnica en `ms-how`.
