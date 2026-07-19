- **Nombre**: Cursor de mano en elementos interactivos y temblor del dado al tirar
- **Código**: 00031
- **Tipo**: change

## Prompt original del usuario

al colocar el cursor sobre cualquier elemento que tenga interacción debe aparecer el cursor estándar del dedo para indicar que se puede pulsar. Además, en los dados, además de la secuencia de valores antes de mostrar el resultado, añade un temblor del dado durante el mismo tiempo para aumentar la sensación de interacción al usuario

## Descripción completa

Este cambio tiene dos partes independientes:

### 1. Cursor de mano en cualquier elemento interactivo

Al pasar el ratón por encima de cualquier elemento en el que se pueda pulsar (botones, pestañas, filas de listado seleccionables, items de galería, checkboxes/radios y sus etiquetas, controles de colapso, componentes seleccionables sobre la mesa, etc.), el cursor debe mostrar la mano estándar de "se puede pulsar" en todos los sitios donde hoy se queda con el cursor por defecto de flecha.

Esto **no sustituye** ningún cursor especial que ya exista y que comunique un tipo de interacción más concreto que un simple click — arrastrar (mano abierta/cerrada), mover un componente, redimensionar (flecha diagonal), acción no disponible, o el icono de interrogación de ayuda: esos se mantienen tal cual, ya cumplen el mismo propósito de indicar que el elemento es interactivo, solo que de una forma más específica. El cursor de mano de "pulsar" se añade únicamente donde un elemento reacciona a un click y hoy no muestra ningún cursor especial.

Aplica a toda la app, ambos modos, sin distinción de rol.

### 2. Temblor del dado durante la tirada

Al lanzar un dado (modo juego, ver "Lanzamiento" del componente dado, cambio 00020), mientras dura el parpadeo de resultados aleatorios (~1 segundo), el propio dado tiembla: se desplaza unos pocos píxeles al azar en distintas direcciones repetidas veces durante ese mismo segundo (sin ninguna rotación), para reforzar la sensación de que está "en juego" antes de fijarse. El temblor empieza y termina exactamente a la vez que el parpadeo de resultados: en el instante en que se fija el resultado final, el dado también deja de temblar y vuelve a su posición exacta de partida.

El desplazamiento es sutil (unos pocos píxeles, proporcional al tamaño del dado) y en ningún momento el dado se sale del hueco que ocupa habitualmente en la mesa ni se solapa de forma perceptible con componentes vecinos.

## Apuntes técnicos

- Cursor de mano: revisar en particular `ui/componentList.js` (filas de la tabla, control de colapso), `ui/resourceList.js` (análogo), `.modal__tab` (pestañas de `componentModal.js`), checkboxes/radios y sus `<label>` en `componentModal.js`/`componentTypeModal.js`, y cualquier otro elemento clicable de `src/ui/*.js` que hoy no tenga `cursor: pointer` ni ningún otro cursor especial ya asignado (`grab`/`grabbing`/`move`/`nwse-resize`/`not-allowed`/`help`).
- Temblor del dado: implementarlo en `ui/componentRenderer.js`, dentro del mismo `setInterval` que ya gestiona el parpadeo de resultados del dado (rama `'dado'` de `renderComponentsOnTable`, cambio 00020) — mismo intervalo y duración (`DICE_ROLL_INTERVAL_MS`/`DICE_ROLL_DURATION_MS`), aplicando en cada tick un pequeño desplazamiento aleatorio vía `transform: translate(...)` (o ajustando `top`/`left` puntualmente) sobre el elemento `.dice`, y restaurándolo a `translate(0, 0)` (o su posición exacta) al terminar, justo cuando se fija el resultado final. Al ser un valor de transform puramente numérico calculado en JS (no una transición/keyframe CSS), encaja en la excepción ya documentada en `STYLE_BIBLE.md` sección 8 para transforms dinámicos (como el pan/zoom de la mesa) — a decidir en el plan si conviene dejarlo anotado explícitamente junto a esa excepción o junto a la nota ya existente sobre el parpadeo (sección 13, cambio 00020) para que quede claro que tampoco es una animación CSS de las prohibidas en esa sección.
