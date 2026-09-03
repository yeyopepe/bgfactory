- **Name**: Editor de cartas/tablero redimensionable con anclas
- **Code**: 00225
- **Type**: change
- **Creation date**: 2026-08-20

## Full description

La ventana del editor visual (usada tanto para "Editar diseño de la carta" como para "Editar diseño del tablero", según el tipo de componente) debe poder redimensionarse manualmente arrastrando el ratón, con dos manejadores — uno en su esquina inferior derecha y otro en su esquina superior izquierda — igual que ya funciona en el panel flotante "Componentes" de la mesa: el manejador inferior derecho ajusta ancho y alto manteniendo fija la esquina superior izquierda de la ventana; el manejador superior izquierdo ajusta en la dirección opuesta, manteniendo fija la esquina inferior derecha.

Al redimensionar, el contenido del editor (el o los lienzos de diseño de cada cara) escala junto con la ventana, aprovechando el espacio disponible o ajustándose a un espacio menor — mismo criterio que ya aplica el botón "Maximizar" existente al recalcular el tamaño de lienzo según el hueco disponible, pero ahora de forma continua mientras se arrastra, no solo en los dos tamaños fijos de ese botón.

### Preguntas de alcance resueltas con el usuario

- **¿El redimensionado también debe cambiar el tamaño de los lienzos de las caras, o solo el espacio en blanco alrededor?** Confirmado: los lienzos escalan junto con la ventana.
- **¿Cómo convive con el botón "Maximizar/Restaurar" ya existente?** Confirmado: "Maximizar" se mantiene tal cual está hoy (alterna a un tamaño casi de pantalla completa). El redimensionado manual con anclas se aplica sobre el tamaño "normal" (no maximizado); al maximizar se ignora temporalmente el tamaño manual elegido, y al pulsar "Restaurar" se vuelve a ese tamaño manual.
- **¿El tamaño elegido se recuerda entre aperturas del editor (como el panel de Componentes recuerda el suyo)?** Confirmado: no. Cada vez que se abre el editor (sobre cualquier carta o tablero) arranca en el tamaño normal por defecto, igual que ya ocurre hoy con el estado "maximizado", que tampoco se recuerda entre aperturas.
- **Límites de tamaño**: mínimo, el necesario para seguir mostrando la cabecera, la barra de herramientas y al menos un lienzo con un tamaño mínimo utilizable, sin límite máximo salvo no salirse del área visible de la ventana del navegador (mismo criterio de "sin límite salvo no salirse del área visible" que ya usa el panel de Componentes respecto a la mesa).
- **¿Es también arrastrable (mover) por la pantalla, como el panel de Componentes?** No — el usuario solo pidió que sea redimensionable; el editor sigue apareciendo centrado como hoy, sin manejador de arrastre por cabecera.

## Notas técnicas

- La ventana del editor de cartas y la del editor de tablero son la **misma** modal: `ui/visualEditorModal.js` (`openVisualEditorModal`), clase `.card-editor-modal`, parametrizada por `faces`/`showProporcionSelector`/`borderStyle`. No hay dos implementaciones distintas que sincronizar.
- Patrón de referencia a reutilizar tal cual (mismo módulo, mismos mínimos, mismo criterio de clamp): `ui/resizeHandle.js` (`attachResizeHandle`, ya soporta `corner: 'br'` y `corner: 'tl'`) tal y como lo usa `ui/componentList.js` (líneas ~574-645) para el panel "Componentes" — doble llamada a `attachResizeHandle` sobre el mismo host, una por esquina, con `clamp` propio por caller y, en el caso `tl`, reposicionando `left`/`top` con el `dx`/`dy` que devuelve el propio módulo.
- Diferencia relevante a resolver en el plan técnico (`pv-how`): el panel de Componentes ya vive en posición absoluta libre sobre la mesa (`left`/`top` en estilo inline). La modal del editor, en cambio, hoy se centra vía flexbox de `.modal-overlay` y tiene `width: fit-content` (CSS `.card-editor-modal`, `main.css` línea ~1712) — sin `position`/`left`/`top` propios. Para que el manejador de la esquina superior izquierda tenga una esquina inferior derecha que anclar, hará falta fijar explícitamente `position`/`left`/`top`/`width`/`height` en el momento de iniciar el resize (mismo ajuste que ya hace `componentList.js` al iniciar su propio arrastre de cabecera).
- El escalado del contenido al redimensionar ya tiene precedente en el propio archivo: `getEffectiveCanvasMaxSide()` (línea ~263) recalcula el tamaño de lienzo según `maximized` y el hueco disponible en la ventana — el nuevo resize continuo necesitará una lectura equivalente pero basada en el tamaño real "normal" que el usuario haya fijado con los manejadores, en vez de los dos valores fijos actuales.
- Botón "Maximizar/Restaurar" existente (`maximizeBtn`, líneas ~277-296, clase `.card-editor-modal--maximized` en CSS): se mantiene sin cambios de comportamiento; solo debe ignorar temporalmente el tamaño manual mientras está maximizado y restaurarlo al pulsar "Restaurar".
- Sin nueva navegación UI (la modal ya se abre/cierra igual) y sin datos estructurados nuevos que persistir (el tamaño no se guarda, ver pregunta de alcance resuelta arriba).
