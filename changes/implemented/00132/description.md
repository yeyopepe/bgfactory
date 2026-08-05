- **Nombre**: Botón para maximizar el editor de cartas
- **Código**: 00132
- **Tipo**: change
- **Fecha creación**: 2026-08-04

## Prompt original del usuario

Idea apuntada previamente en `todo` (código `6e59w`): "Agregar un botón que permita maximizar la pantalla del editor de cartas para aprovechar al máximo el tamaño disponible de la pantalla. Útil cuando se trabaja en cartas complejas y se quiere más espacio de trabajo."

Convertida a change a través de `/ms-new todo 6e59w`, refinando con el usuario los siguientes puntos antes de documentar.

## Descripción completa

Se añade un botón para maximizar el editor de cartas, el panel grande donde se diseñan las dos caras (frontal y trasera) de una carta. Sirve para aprovechar mejor el espacio disponible de la pantalla al trabajar en cartas complejas (muchos cuadros de texto o figuras).

Comportamiento:

- El botón aparece en la cabecera del editor, junto al icono de ayuda (el editor no cierra desde un botón en la cabecera, sino con los botones "Cancelar"/"Aceptar" del pie).
- Es un interruptor: el mismo botón alterna entre tamaño maximizado y tamaño normal, cambiando de icono (expandir/contraer) según el estado actual.
- Al maximizar, el editor pasa a ocupar prácticamente toda la ventana del navegador, y el área donde se ve cada cara de la carta crece para aprovechar ese espacio extra. Los controles laterales (elegir forma, imagen, borde, añadir elementos, etc.) mantienen su tamaño habitual, solo crece el área de las caras de la carta.
- No es una pantalla completa a nivel de sistema operativo (no oculta la barra del navegador ni pide permisos especiales): el editor simplemente ocupa casi todo el espacio disponible dentro del propio navegador.
- El tamaño maximizado no se recuerda entre usos: cada vez que se abre el editor de cartas, empieza siempre en tamaño normal, se haya dejado o no maximizado la última vez.
- Cerrar el editor (incluida la tecla Esc, con su confirmación habitual si hay cambios sin guardar) funciona igual estando en tamaño normal o maximizado, sin comportamiento adicional.
- Los elementos que ya hay en la carta (cuadros de texto, figuras) se siguen viendo y pudiendo mover, redimensionar y editar exactamente igual estando maximizado, solo que se muestran más grandes en pantalla; su posición y tamaño reales dentro de la carta no cambian.
- El botón está siempre visible en la cabecera, sea cual sea el tamaño de la ventana, aunque en pantallas ya pequeñas el efecto de maximizar sea menor.

## Apuntes técnicos

- El editor de cartas es `.card-editor-modal`, implementado en `src/ui/cardEditorModal.js` y estilado en `src/styles/main.css` (bloque "Card editor modal (00053)").
- Ancho actual del modal (CSS): `width: fit-content; max-width: min(1500px, 95vw);`. Al maximizar debería pasar a ocupar prácticamente toda la ventana (p.ej. ~95-100vw / ~95vh), probablemente vía una clase modificadora nueva (p.ej. `.card-editor-modal--maximized`) en vez de tocar el estilo base.
- El tamaño del lienzo de cada cara es una escala de renderizado, no dato guardado: `previewScale = CANVAS_MAX_SIDE / Math.max(designWidth, designHeight)`, con `CANVAS_MAX_SIDE = 380` como constante fija en `cardEditorModal.js` (usada en al menos dos sitios del fichero, buscar todas las referencias a `CANVAS_MAX_SIDE` y `getDesignSize`). Aumentar el tamaño del lienzo al maximizar implica variar este valor (o el cálculo de `previewScale`) según el estado maximizado/normal — las coordenadas de diseño de textboxes/figuras (`designWidth`/`designHeight`, posiciones) no se ven afectadas.
- `.card-editor-modal__toolbar` tiene `max-width: 16rem` — debe mantenerse fijo también en el estado maximizado.
- Estado no persistente: no debe guardarse en `core/state.js` ni en el autoguardado — es transitorio, como otros estados de UI de `editMode.js` (p.ej. `panelStackOrder`), aunque este vive dentro del propio `cardEditorModal.js`, no en `editMode.js`.
- Icono de ayuda ya existente se genera con `createHelpIcon` (`ui/helpIcon.js`); el editor ya sigue un patrón de iconos SVG locales definidos como funciones (`createDeleteIcon`, `createBringToFrontIcon`, etc.) — el icono de maximizar/restaurar debería seguir el mismo patrón.
