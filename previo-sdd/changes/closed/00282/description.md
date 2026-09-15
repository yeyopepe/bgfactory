- **Name**: Icono de la última pestaña del panel de propiedades se sale del borde redondeado del modal
- **Code**: 00282
- **Type**: fast
- **Creation date**: 2026-09-15

## Full description

En el panel de propiedades de un elemento (la modal que se abre al editar un componente de la mesa), la última pestaña ("Copias") se sale ligeramente por la esquina superior derecha del modal, rompiendo visualmente el borde redondeado de la modal.

Se reproduce simplemente abriendo el panel de propiedades de cualquier componente: la fila de pestañas llega justo hasta el borde derecho de la modal y el icono de la última pestaña queda parcialmente fuera del contorno redondeado, en vez de quedar recortado por él como el resto del contenido de la modal.

Con el fix, la fila de pestañas queda recortada por el borde redondeado de la modal igual que el resto de su contenido, sin ningún elemento asomando por fuera del contorno.

## Technical notes

Causa: la clase base `.modal` (`src/styles/main.css`, reutilizada por todos los modales de la app) no tenía `overflow: hidden`. La fila de pestañas (`.modal__tabs`) llega justo al borde derecho del modal, así que su contenido no se recortaba con el `border-radius` del contenedor. Antes del cambio 00269 (iconos en las pestañas del panel de propiedades) no era visible porque las pestañas, solo con texto, eran más estrechas y no llegaban a tocar la esquina; con el icono añadido a cada pestaña la fila ahora sí la alcanza.

## Applied changes

- `src/styles/main.css` — añadida la propiedad `overflow: hidden;` a la regla base `.modal`. Mismo patrón ya usado en el proyecto para casos similares (`.splash-window`, con el comentario "la barra inferior respeta el border-radius"). No cambia ningún layout ni comportamiento: `.modal__content` ya tiene su propio `overflow-y: auto` para el scroll interno, así que el recorte solo afecta al borde exterior redondeado del modal.
- `src/test/functional/component-modal-tabs.test.js` — nuevo test `FT-002-19` que carga la hoja de estilos real (`loadRealStylesheet`) y comprueba que `.modal` resuelve `overflow: hidden`. Verificado manualmente que falla sin el fix (`obtenido: "visible"`) y pasa con él.
