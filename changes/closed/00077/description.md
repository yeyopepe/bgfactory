- **Nombre**: Destacar visualmente el desplegable de "Añadir recurso"
- **Código**: 00077
- **Tipo**: change

## Prompt original del usuario

el desplegable para elegir cuántos recursos quiero añadir (uno, varios, carpeta) pasa un poco desapercibido. Puedes darle un fondo azul claro y la opción seleccionada que sea el mismo azul que el botón "+ Añadir recurso"?

## Descripción completa

El menú desplegable que aparece al pulsar el botón "+ Añadir recurso" en el panel de Recursos (con las opciones "Subir fichero", "Subir varios ficheros" y "Subir carpeta") pasa desapercibido hoy porque su fondo es blanco, casi sin diferenciarse del resto del panel.

Se pide destacarlo visualmente:

- El fondo del menú desplegable pasa de blanco a un azul claro, para que se distinga con claridad del panel que tiene detrás.
- Al pasar el ratón (o el foco) por encima de una opción del menú, esa opción se resalta con el mismo azul que ya usa el botón "+ Añadir recurso", en vez del gris neutro que usa hoy como hover.
- El texto de la opción resaltada (y su texto de ayuda, en el caso de "Subir carpeta") pasa a un color claro en ese estado, para seguir siendo legible sobre el azul oscuro del resaltado.
- Los separadores entre las tres opciones del menú se ajustan a un tono acorde al nuevo fondo azul claro, en vez del gris neutro actual.

### Dudas de alcance resueltas con el usuario

- **¿Qué es "la opción seleccionada"?** Este desplegable no es un `<select>` nativo que recuerde una opción marcada entre aperturas: es un menú de acciones que se ejecuta al momento al hacer clic. Se ha confirmado que "la opción seleccionada" se refiere al estado de resaltado (hover/foco) de cada opción mientras el menú está abierto, no a un estado guardado.
- **Alcance**: el cambio afecta solo al aspecto de este menú desplegable concreto, dentro del panel de Recursos. No afecta al aspecto del propio botón "+ Añadir recurso", ni a ningún otro desplegable o selector del proyecto.
- **Comportamiento**: no hay lógica nueva ni casos de error/carga distintos — es un ajuste puramente visual sobre un componente ya existente y funcional. Abrir/cerrar el menú, cerrar al hacer clic fuera, y ejecutar la acción correspondiente al hacer clic en una opción se mantienen exactamente igual.

## Apuntes técnicos

- Componente: `createAddMenu()` en [src/ui/resourceList.js](../../../src/ui/resourceList.js), que genera `.resource-add` / `.resource-add__button` / `.resource-add__menu` / `.resource-add__item` (con `.resource-add__item-label` y, opcionalmente, `.resource-add__hint`).
- Estilos actuales en `src/styles/main.css` (~línea 1525): `.resource-add__menu` tiene `background: #fff`; `.resource-add__item:hover` usa `background: var(--bg-hover)` (gris neutro genérico, compartido con otros hovers del proyecto); los separadores usan `border-bottom: 1px solid var(--border-neutral)`.
- El botón "+ Añadir recurso" (`.resource-add__button`) ya usa `background: var(--accent-blue)` (`#2c7dd8`) — es el azul de referencia a reutilizar en el hover de las opciones.
- No existe todavía en el proyecto una variable CSS de "azul claro" para fondos; habrá que introducir un tono nuevo (o una variable nueva) para el fondo del menú, sin reutilizar `--accent-blue` (reservado para el estado resaltado/interactivo) ni `--bg-hover` (gris neutro genérico usado en otros muchos sitios del proyecto, no se debe tocar su valor global).
