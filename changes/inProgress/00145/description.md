- **Nombre**: Mover componentes de la mesa de juego con las flechas del teclado
- **Código**: 00145
- **Tipo**: change
- **Fecha creación**: 2026-08-05

## Prompt original del usuario

en algún momento se perdió la funcionalidad de poder mover los elementos sobre la mesa de juego usando los cursores y la tecla SHIFT (en ambos modos).
Todavía funciona en el editor de cartas, pero no en la mesa de juego

## Descripción completa

Actualmente, en la mesa de juego (tanto en modo edición como en modo juego), la única forma de mover un componente es arrastrándolo con el ratón. Se pide añadir movimiento con las flechas de dirección del teclado, con el mismo comportamiento que ya existe hoy en el editor de cartas: con un elemento seleccionado y sin el foco puesto en un campo de texto, las flechas arriba/abajo/izquierda/derecha desplazan su posición 1 píxel por cada pulsación, o 10 píxeles si se mantiene pulsada la tecla SHIFT.

**Nota sobre el origen de esta petición**: se planteó inicialmente como un fallo (funcionalidad que "se había perdido"). Tras revisar a fondo la documentación técnica del proyecto y todo el historial de cambios, se confirmó que esta funcionalidad **nunca ha existido** en la mesa de juego — solo existe en el editor de cartas. El usuario confirmó que se trata de una funcionalidad nueva a añadir, no de una regresión que corregir.

### Alcance acordado

- **Disponible solo en modo edición** (no en modo juego, ver nota más abajo), sobre el/los componente(s) actualmente seleccionado(s), sea cual sea su tipo.
- **Selección múltiple**: si hay varios componentes seleccionados a la vez, las flechas los mueven todos en bloque, manteniendo las distancias relativas entre ellos — mismo comportamiento que ya tiene hoy el arrastre con ratón de una selección múltiple.
- **Foco en un campo de texto**: si el foco está en un campo de texto (por ejemplo, el buscador de un panel flotante o un campo dentro de una ventana modal abierta), las flechas no mueven ningún componente y siguen funcionando con su comportamiento normal de edición de texto.
- **Componentes bloqueados**: respeta la misma restricción que ya aplica hoy al arrastre con ratón — un componente que no se puede arrastrar en el modo actual (por su ajuste de "Bloqueado") tampoco se puede mover con las flechas.
- **Sin nada seleccionado**: las flechas no hacen nada.
- **Paso de movimiento**: 1 píxel por pulsación; 10 píxeles si se mantiene pulsado SHIFT.
- **Guardado**: cada movimiento con flechas se guarda automáticamente igual que ya se guarda cada movimiento con el ratón.
- No introduce ningún elemento visual nuevo ni cambia ninguna pantalla o navegación existente: es un atajo de teclado que reproduce el mismo efecto que ya provoca hoy el arrastre con el ratón.

### Nota: por qué no incluye modo juego

Al analizar la solución técnica se confirmó que, a diferencia de modo edición, en modo juego no existe una selección persistente de componente: la única "selección" que existe (`selectedComponentId` en `playMode.js`) se activa exclusivamente al abrir el menú contextual de click derecho, y se limpia en cuanto ese menú se cierra. Preguntado por esto, el usuario decidió dejar el modo juego fuera de esta entrada — se podrá abordar como una entrada aparte si en el futuro se quiere que el modo juego tenga una selección persistente equivalente a la del modo edición.

## Apuntes técnicos

- Referencia de implementación ya existente y funcional, a replicar: `src/ui/cardEditorModal.js:323-345` (`handleKeyDown`, incluye también el borrado con SUPR).
- `src/ui/globalShortcuts.js` centraliza hoy los atajos de teclado globales (ESC/INTRO/SUPR), pero es explícitamente agnóstico de `modes/*` (ver comentario de cabecera del propio fichero). El caso SUPR se resuelve vía callback `onDeleteSelected` desde `main.js`, condicionado a `isEditMode()` — pero a diferencia de SUPR (que hoy solo actúa en modo edición), el movimiento por flechas debe funcionar en ambos modos, así que el diseño de cableado (posible callback adicional, o listener propio en cada modo) queda por decidir en la fase de solución técnica.
- `modes/edit/editMode.js` mantiene `selectedComponentIds` (`Set`) a nivel de módulo; `modes/play/playMode.js` mantiene `selectedComponentId` (único) a nivel de módulo — ninguno de los dos está hoy exportado para uso externo (a diferencia de `deleteSelectedComponent`, que sí lo está desde `editMode.js`).
- El criterio de si un componente se puede mover (`canMove`) ya existe parametrizado por modo en `ui/componentRenderer.js`, reutilizable tal cual para decidir si las flechas pueden moverlo.
