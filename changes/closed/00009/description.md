- **Nombre**: Panel de componentes y cajas de texto arrastrables/redimensionables en modo edición
- **Código**: 00009
- **Tipo**: change

## Prompt original del usuario

el usuario debe poder arrastrar, mover y ajustar el ancho de la lista de componentes del modo edición

el usuario debe poder arrastrar, mover y ajustar el ancho de la lista de componentes del modo edición

## Descripción completa

El usuario debe poder arrastrar y mover por la pantalla el panel flotante de la lista de componentes en modo edición, agarrando la barra de título del panel (cabecera con el texto "Componentes" y el botón de colapsar).

Comportamiento esperado:

- **Zona de arrastre**: solo la cabecera del panel inicia el arrastre (excluyendo el botón de colapsar, que conserva su clic normal). El resto del panel (filas de la tabla de componentes, botón "Añadir componente") no inicia el arrastre, para no interferir con sus interacciones actuales.
- **Mecanismo**: solo ratón (sin soporte táctil ni drag&drop del sistema), coherente con el resto de arrastres ya existentes en el proyecto.
- **Límites**: el panel queda restringido al viewport durante el arrastre — no puede moverse fuera de los bordes visibles de la ventana.
- **Persistencia**: la posición del panel es solo de la sesión actual, no se persiste. Al recargar la página, el panel vuelve a su posición por defecto (arriba a la derecha), igual que ya ocurre con el estado de selección/colapso del panel.
- **Estado colapsado/expandido**: el arrastre funciona igual con el panel expandido o colapsado, ya que la cabecera sigue visible y arrastrable en ambos estados.
- **Fuera de alcance**: este cambio no afecta al orden de la lista de componentes ni a qué componente se dibuja por encima de otro sobre el tablero — es puramente un cambio de posición en pantalla del panel, sin relación con el orden de los componentes ni su pintado.

### Ampliación: ajuste de ancho del panel

Además de arrastrarlo, el usuario debe poder ajustar el ancho del panel de componentes, fijo hoy.

- **Zona de redimensionado**: un manejador en la **esquina inferior derecha** del panel (cursor diagonal, patrón habitual de "resize"), independiente de la cabecera de arrastre — no interfiere con el punto de agarre del drag.
- **Patrón reutilizable en toda la app**: este manejador de esquina se establece como el patrón estándar de redimensionado para cualquier elemento de la app que en el futuro necesite ajustarse de tamaño (no exclusivo de este panel) — mismo aspecto visual (grip en la esquina) allá donde se use. Queda documentado aquí como referencia para cuando se implemente, de modo que futuros paneles/elementos redimensionables reutilicen el mismo patrón en vez de crear uno nuevo cada vez.
- **Eje en este panel**: aunque el manejador de esquina soporta redimensionado en ambos ejes como patrón general, en este panel concreto solo se ajusta el ancho — la altura del panel no cambia, y su contenido conserva su scroll propio si no cabe.
- **Límites de ancho**: mínimo ~290px (evita que la tabla y los botones de acción se solapen) y máximo ~600px o la mitad del ancho del viewport (lo que sea menor).
- **Disponibilidad según estado**: el manejador está visible y funcional tanto con el panel expandido como colapsado, igual que el arrastre.
- **Persistencia**: igual que la posición — solo de la sesión actual, no se guarda. Al recargar la página, el panel vuelve a su ancho por defecto.
- **Convivencia con el arrastre y el viewport**: si al ensanchar el panel su borde derecho superaría el borde de la ventana, el ancho se recorta para no salirse del viewport (mismo criterio que ya aplica al arrastre).
- **Fuera de alcance**: no se ajustan individualmente las columnas de la tabla interna (p.ej. el ancho fijo de la celda de Id) — la tabla ocupa el 100% del ancho del panel y crece con él de forma natural, sin lógica adicional por columna.

### Ampliación: redimensionado de cajas de texto en el tablero

Además del panel, los componentes de tipo cuadro de texto renderizados sobre el tablero infinito deben poder redimensionarse con el mismo manejador de esquina inferior derecha establecido como patrón estándar.

- **Ejes**: a diferencia del panel (solo ancho), aquí el manejador ajusta **ambos ejes** (ancho y alto) — la caja de texto no tiene hoy un alto predefinido (crece según contenido), así que redimensionar en las dos dimensiones tiene sentido como elemento libre sobre el tablero.
- **Modelo de datos**: el componente pasa a guardar su ancho y alto explícitos, sin valor por defecto (auto — comportamiento actual de crecer según contenido) hasta el primer redimensionado, que fija un tamaño explícito.
- **Persistencia**: a diferencia de la posición/ancho del panel (solo sesión), el ancho/alto de la caja de texto persisten al guardar/recargar la partida, igual que su posición en el tablero.
- **Contenido vs. caja**: redimensionar cambia solo el espacio que ocupa la caja — no reescala ni cambia el tamaño de fuente del texto. Si la caja queda más pequeña que el contenido, el texto se recorta, sin scroll ni auto-ajuste de fuente.
- **Tamaño mínimo**: mínimo pequeño (~40px de ancho, ~24px de alto) para que la caja no colapse a un tamaño inválido. Sin máximo explícito (el tablero es infinito).
- **Visibilidad del manejador**: solo visible cuando la caja está seleccionada, para no saturar el tablero con manejadores en todas las cajas a la vez.
- **Convivencia con mover/editar**: el manejador no dispara el arrastre de mover la caja ni el doble-clic que abre el modal de edición.
- **Fuera de alcance**: no aplica a otros tipos de componente distintos del cuadro de texto (hoy es el único tipo soportado); si se añaden tipos nuevos en el futuro, decidir entonces si reutilizan este mismo patrón.

### Preguntas de alcance resueltas con el usuario

1. ¿Zona de arrastre — solo la barra de título, o todo el panel? → Solo la barra de título.
2. ¿La posición del panel debe persistir entre recargas, o solo durante la sesión? → Solo durante la sesión actual, no persiste.
3. ¿El panel debe quedar restringido al viewport al arrastrarlo? → Sí, restringido al viewport.
4. ¿Zona de agarre para redimensionar? → Manejador en la esquina inferior derecha del panel, separado de la cabecera de arrastre, establecido como patrón estándar reutilizable para redimensionar cualquier elemento de la app.
5. ¿Se redimensiona también la altura del panel? → No, solo el ancho.
6. ¿Límites de ancho mínimo/máximo del panel? → Mínimo ~290px, máximo ~600px o mitad del viewport.
7. ¿El manejador del panel está disponible colapsado y expandido? → Sí, en ambos estados.
8. ¿El ancho del panel persiste entre recargas? → No, solo durante la sesión, igual que la posición.
9. ¿Qué pasa si el ensanchado del panel se sale del viewport? → Se recorta al borde de la ventana.
10. ¿Las cajas de texto redimensionan ambos ejes o solo ancho? → Ambos ejes (ancho y alto).
11. ¿El tamaño de las cajas de texto persiste? → Sí, junto con el resto de datos del componente (igual que su posición), a diferencia del panel.
12. ¿Cambia el tamaño de fuente al redimensionar la caja? → No, solo cambia el espacio ocupado; el texto se recorta si no cabe.
13. ¿Tamaño mínimo de la caja de texto? → ~40px ancho, ~24px alto.
14. ¿El manejador de la caja de texto siempre visible o solo seleccionada? → Solo cuando está seleccionada.

(Nota: inicialmente se interpretó la petición como "reordenar arrastrando las filas de la lista de componentes"; el usuario aclaró que se refiere a mover el panel completo por la pantalla arrastrando su barra de título. El ajuste de ancho del panel y, después, el redimensionado de las cajas de texto quedaron pendientes de esa primera vuelta y se documentan en ampliaciones sucesivas.)

## Apuntes técnicos

- Panel de componentes: `.component-panel`, renderizado por `componentList.js` y anclado en `editMode.js`. Cabecera arrastrable = barra de título con el texto "Componentes" y el botón de colapsar.
- Mecanismo de arrastre: mismo patrón ya usado en el resto del proyecto — mousedown/mousemove/mouseup manual sobre `document` — igual que el paneo de la tabla (`table.js`) y el arrastre de componentes sobre el tablero (`componentRenderer.js`). No se introduce drag&drop HTML5 ni soporte táctil.
- Persistencia de posición/ancho del panel: no se guarda en `localStorage`, igual que ya ocurre con el estado de selección/colapso del panel (ver `FEATURES.md`).
- Redimensionado de ancho del panel: manejador `resize-handle` en la esquina inferior derecha, mismo mecanismo mousedown/mousemove/mouseup que el resto de arrastres. Solo se aplica el delta horizontal; el vertical se ignora. El cuerpo (`.component-panel__body`) conserva su `max-height` con scroll propio. Ancho fijo hoy en 300px.
- No se ajustan individualmente las columnas de la tabla interna (p.ej. el `max-width` fijo de la celda de Id); la tabla ocupa el 100% del ancho del panel.
- Redimensionado de cajas de texto: componentes de tipo `cuadro-texto` en `componentRenderer.js`. Se añaden `width` y `height` al modelo de componente (`createComponent` en `component.js`, junto a `x`/`y`), sin valor por defecto hasta el primer redimensionado.
- Persistencia del tamaño de la caja de texto: `width`/`height` forman parte de `state.components` igual que `x`/`y`.
- Redimensionar no cambia `properties.tamañoFuente`; si la caja queda más pequeña que el contenido, el texto se recorta con `overflow: hidden`.
- Visibilidad del manejador de la caja de texto: mismo criterio que el borde `.text-box--selected`.
- El manejador de la caja de texto frena la propagación del evento (`stopPropagation`) para no disparar el arrastre de mover la caja (que usa mousedown) ni el doble-clic que abre el modal de edición.
