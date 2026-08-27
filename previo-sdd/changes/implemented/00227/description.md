- **Name**: Fix: ventana del editor no sobrepasa el 90% de la ventana del navegador al maximizar
- **Code**: 00227
- **Type**: fast
- **Creation date**: 2026-08-27

## Full description

Al pulsar el botón para maximizar la ventana del editor (de cartas o de tableros), el modal crece hasta ocupar más espacio del que la ventana del navegador puede mostrar. Esto deja los botones de restaurar tamaño, cancelar y aceptar fuera del área visible, haciendo imposible interactuar con ellos.

El comportamiento correcto es:
- Al maximizar, el editor ocupa como máximo el 90% del ancho y del alto de la ventana del navegador en ese momento.
- Si el usuario cambia el tamaño de la ventana del navegador mientras el editor está maximizado, el editor se reajusta automáticamente para mantenerse siempre dentro del 90% del nuevo tamaño.

## Technical notes

- La clase CSS `.card-editor-modal--maximized` actualmente establece `width: 97vw` y `max-height: none`, lo que permite que el contenido crezca sin límite vertical. El fix cambia esto a `max-width: 90vw` y `max-height: 90vh`.
- En `src/ui/visualEditorModal.js` ya existe un listener `handleWindowResize` (línea 397) que, cuando el modal está maximizado, llama a `renderFaces()`. Este listener ya garantiza el reajuste del lienzo interno al cambiar el tamaño de la ventana — no requiere cambios de JS, solo el CSS debe limitarse al 90%.
- La función `getEffectiveCanvasMaxSide()` (línea 263) ya usa `window.innerHeight` y `window.innerWidth` para calcular el tamaño del lienzo en modo maximizado, por lo que se beneficia automáticamente del resize.

## Applied changes

- `src/styles/main.css` — clase `.card-editor-modal--maximized`: eliminado `width: 97vw` y `max-width: none`; añadidos `max-width: 90vw` y `max-height: 90vh`. El modal maximizado queda ahora limitado al 90% de las dimensiones de la ventana del navegador en ambas dimensiones. El listener `handleWindowResize` ya existente en `visualEditorModal.js` hace que el lienzo interno se recalcule automáticamente al redimensionar la ventana.
