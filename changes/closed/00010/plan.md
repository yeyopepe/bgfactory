## (a) Anotaciones funcionales

Sin dudas de alcance adicionales sobre `description.md`. Fuera de alcance: cualquier otro comportamiento de arrastre/guardado de posición no relacionado con este bug (se deja tal cual).

## (b) Solución técnica

**Causa raíz.** En [`src/ui/componentRenderer.js`](../../../src/ui/componentRenderer.js), el listener `mousedown` que habilita el arrastre de un `text-box` registra `handleMouseUp`, que llama **siempre** a `onMove(component, currentX, currentY)` al soltar el ratón, incluso si no hubo desplazamiento (un simple clic). En [`src/modes/edit/editMode.js`](../../../src/modes/edit/editMode.js) ese `onMove` llama a `replaceComponent`, que en [`src/core/state.js`](../../../src/core/state.js) emite `components:changed`. Ese evento dispara en [`src/main.js`](../../../src/main.js) un `renderAll()` → `renderEditMode(contentEl)`, que hace `container.innerHTML = ''` y reconstruye **todo** el modo edición desde cero (tabla, componentes y listeners incluidos).

Como consecuencia, el primer clic de un doble clic ya destruye y recrea el elemento `text-box` (mousedown → mouseup sin movimiento → guardado → re-render completo). El segundo clic del doble clic aterriza entonces sobre un nodo DOM distinto al del primer clic, por lo que el navegador no lo cuenta como parte de la misma secuencia y el evento nativo `dblclick` nunca llega a dispararse — de ahí que la ventana de configuración no se abra.

**Tareas:**

1. En `src/ui/componentRenderer.js`, dentro de `handleMouseUp` (bloque `if (onMove)` del renderizado de `cuadro-texto`), invocar `onMove` únicamente si hubo desplazamiento real, comparando `currentX`/`currentY` con `startX`/`startY`. Si no cambiaron, no llamar a `onMove` (evita el guardado/re-render espurio en un simple clic o en el primer clic de un doble clic).
2. No se toca nada más: el guardado de posición tras un arrastre real, el listener `dblclick` existente y el resto del flujo de `onSelect`/`openEditModalFor` ya son correctos y no requieren cambios.
