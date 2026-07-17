- **Nombre**: Panel de componentes arrastrable en modo edición
- **Código**: 00009
- **Tipo**: change

## Prompt original del usuario

el usuario debe poder arrastras y mover la lista de componentes del modo edición

## Descripción completa

El usuario debe poder arrastrar y mover por la pantalla el panel flotante de la lista de componentes en modo edición (`.component-panel`, renderizado por `componentList.js` y anclado en `editMode.js`), agarrando la barra de título del panel (cabecera con el texto "Componentes" y el botón de colapsar).

Comportamiento esperado:

- **Zona de arrastre**: solo la cabecera del panel inicia el arrastre (excluyendo el botón de colapsar, que conserva su clic normal). El resto del panel (filas de la tabla de componentes, botón "Añadir componente") no inicia el arrastre, para no interferir con sus interacciones actuales.
- **Mecanismo**: mismo patrón ya usado en el resto del proyecto para arrastres — mousedown/mousemove/mouseup manual sobre `document` — igual que el paneo de la tabla (`table.js`) y el arrastre de componentes sobre el tablero (`componentRenderer.js`). No se introduce drag&drop HTML5 ni soporte táctil (solo ratón, coherente con el resto del código).
- **Límites**: el panel queda restringido al viewport durante el arrastre — no puede moverse fuera de los bordes visibles de la ventana.
- **Persistencia**: la posición del panel es solo de la sesión actual, no se persiste en `localStorage`. Al recargar la página, el panel vuelve a su posición por defecto (arriba a la derecha), igual que ya ocurre con el estado de selección/colapso del panel (ver `FEATURES.md`).
- **Estado colapsado/expandido**: el arrastre funciona igual con el panel expandido o colapsado, ya que la cabecera sigue visible y arrastrable en ambos estados.
- **Fuera de alcance**: este cambio no afecta al orden de `state.components` ni al z-order de renderizado de componentes sobre el tablero — es puramente un cambio de posición en pantalla del panel, sin relación con el array de componentes ni su orden de pintado.

### Preguntas de alcance resueltas con el usuario

1. ¿Zona de arrastre — solo la barra de título, o todo el panel? → Solo la barra de título.
2. ¿La posición del panel debe persistir entre recargas, o solo durante la sesión? → Solo durante la sesión actual, no persiste.
3. ¿El panel debe quedar restringido al viewport al arrastrarlo? → Sí, restringido al viewport.

(Nota: inicialmente se interpretó la petición como "reordenar arrastrando las filas de la lista de componentes"; el usuario aclaró que se refiere a mover el panel completo por la pantalla arrastrando su barra de título.)
