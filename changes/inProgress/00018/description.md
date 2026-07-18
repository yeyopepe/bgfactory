- **Nombre**: Invertir checkbox "Mover en Modo Juego" a "Bloqueado"
- **Código**: 00018
- **Tipo**: change

## Prompt original del usuario

invertir la propiedad general de componentes para marcar si el elemento se puede mover en modo juego:
- Debe llamarse Bloqueado y funcionar al revés que ahora: si está marcada no se puede mover en modo juego (por defecto) y si no está marcada sí se puede mover
- Actualizar el texto de ayuda

## Descripción completa

Se invierte el significado del checkbox general de configuración de componentes que hoy se llama "Mover en Modo Juego". A partir de este cambio, el checkbox pasa a llamarse "Bloqueado" y funciona al contrario que antes:

- **Marcado (comportamiento por defecto en todo componente nuevo)**: el componente NO se puede arrastrar mientras se juega (Modo Juego). Queda fijo en su sitio.
- **Desmarcado**: el componente SÍ se puede arrastrar libremente por toda la mesa mientras se juega, igual que antes hacía la opción "Mover en Modo Juego" cuando estaba marcada.

Sigue siendo una propiedad general, válida para cualquier tipo de componente (no específica de ningún tipo en concreto), y se sigue editando únicamente desde la ventana de configuración del componente, en el modo edición, en la pestaña "Generales", en el mismo lugar donde estaba la casilla anterior (justo debajo del campo "ID del componente").

El icono de ayuda junto al checkbox se actualiza para reflejar la nueva semántica: explica que, por defecto, el componente está bloqueado y no se puede mover en Modo Juego, y que al desmarcar la casilla se permite arrastrarlo libremente por la mesa mientras se juega.

### Convivencia con lo existente / partidas guardadas

No se necesita ninguna migración de datos para componentes o partidas ya guardadas. La aplicación ya descarta automáticamente cualquier estado guardado (autoguardado en el navegador, o partidas exportadas a fichero) cuya versión no coincida con la versión actual de la app. Como este cambio se publica en una versión nueva, cualquier partida guardada con el comportamiento antiguo dejará de cargarse (se trata como incompatible), igual que ocurre hoy con cualquier otro cambio de versión — no hace falta ningún tratamiento especial adicional para este cambio.

### Preguntas de alcance resueltas

- **¿Cambia la ubicación del checkbox en el modal?** No, se mantiene en el mismo sitio (pestaña "Generales", debajo del ID del componente).
- **¿Se añade algún elemento visual nuevo?** No: es la misma casilla de siempre, con la etiqueta y el texto de ayuda actualizados y el significado invertido.
- **¿Hace falta migrar componentes o partidas ya guardadas?** No: el mecanismo de versión ya existente en la persistencia del proyecto invalida automáticamente los estados guardados de versiones anteriores.

## Apuntes técnicos

- El campo vive hoy como `moverEnModoJuego` (booleano, `false` por defecto) en `src/core/component.js` (`createComponent`). Al invertir la semántica, conviene renombrarlo a algo como `bloqueado` (booleano, `true` por defecto) para que el nombre del campo sea coherente con su significado, en vez de mantener el nombre antiguo con valor invertido.
- El checkbox se define en `src/ui/componentModal.js` (pestaña "Generales"): `moveCheckbox`, su etiqueta `moveLabel` ("Mover en Modo Juego") y el texto pasado a `createHelpIcon` ("Permite arrastrar este componente por toda la mesa mientras se juega. Desactivado por defecto.").
- La condición de arrastre en Modo Juego está en `src/modes/play/playMode.js`, línea `canMove: (component) => component.moverEnModoJuego === true` — pasa a evaluar la condición contraria sobre el nuevo campo.
- Revisar también `src/_graph/graph.json`, que documenta `moverEnModoJuego=false` como valor por defecto de `createComponent` en su descripción del propósito de la función.
