- **Nombre**: Elimina el componente de texto sembrado por defecto
- **Código**: fast-elimina-componente-de-texto-por-defecto_20260803
- **Tipo**: fast
- **Fecha**: 2026-08-03

## Prompt original del usuario

elimina el recurso por defecto de un texto que dice "Hola, esto es una mesa de juego infinita"

## Descripción completa

Al arrancar la app por primera vez (sin estado guardado previo ni semilla), se creaba automáticamente un componente de texto por defecto sobre la mesa con el contenido "Hola, esta es una mesa de juego infinita." Se ha eliminado ese sembrado: ahora, al arrancar sin estado previo, la mesa queda vacía de componentes (los recursos por defecto de la galería sí se siguen sembrando igual que antes, sin cambios).

## Cambios aplicados

En [`src/main.js`](../../../src/main.js):
- Se elimina la función `seedDefaultComponent()` (creaba un componente `texto` con el contenido "Hola, esta es una mesa de juego infinita.").
- Se eliminan sus dos llamadas: en el manejo de error al recuperar estado guardado, y en el arranque sin estado previo ni semilla.
- Se eliminan los imports ya no usados `addComponent` (de `./core/state.js`) y `createComponent` (de `./core/component.js`).
- Se actualiza el comentario de cabecera del fichero, que mencionaba la creación del "componente por defecto".
