## (a) Anotaciones funcionales

Fuera de alcance: no se persiste la posición/zoom de la mesa entre sesiones (recarga de página, guardado a fichero) — el fix solo evita que se resetee dentro de la misma sesión al repintar la pantalla. Si en el futuro se quiere conservar entre sesiones, sería un `change` aparte.

No ha hecho falta resolver dudas adicionales con el usuario: la causa raíz es clara a partir del código y coincide con lo ya diagnosticado en `description.md`.

## (b) Solución técnica

**Causa raíz**: `ui/table.js` (`createInfiniteTable`) guarda `cameraX`/`cameraY`/`zoom` como variables locales a la función, inicializadas siempre a `0, 0, 1`. Tanto `modes/play/playMode.js` como `modes/edit/editMode.js` vuelven a invocar `createInfiniteTable(container)` desde cero cada vez que `main.js` repinta la pantalla activa (`renderAll()`, suscrito a `components:changed` y `mode:changed`), lo que ocurre en cada alta/edición/borrado/movimiento/redimensionado de componente. Cada repintado crea una mesa nueva con la cámara en su posición inicial, aunque el usuario la hubiera desplazado/hecho zoom — de ahí la sensación de "reseteo".

1. En `ui/table.js`, mover `cameraX`, `cameraY` y `zoom` a variables de módulo (fuera de `createInfiniteTable`), igual que `editMode.js` ya hace con `selectedComponentId` para sobrevivir a los remontados completos de la pantalla. `createInfiniteTable` pasa a leer/actualizar esas variables compartidas en vez de inicializarlas localmente, de forma que cada mesa nueva arranca desde la última posición/zoom conocidos en la sesión, en lugar de `0, 0, 1`.
   - Solo hay una mesa activa a la vez (modo juego o modo edición son excluyentes), así que un único estado de cámara compartido a nivel de módulo es coherente y no requiere parametrizar `createInfiniteTable` ni tocar sus llamadas desde `playMode.js`/`editMode.js`.
2. Sin cambios en `modes/play/playMode.js` ni `modes/edit/editMode.js`: siguen llamando a `createInfiniteTable(container)` igual que ahora; el fix es interno a `ui/table.js`.
3. Verificar manualmente el flujo descrito en `description.md`: desplazar/hacer zoom en la mesa, mover un componente movible (o editar/añadir/eliminar uno), y comprobar que la vista se mantiene donde el usuario la había dejado.

## (c) Cambios de arquitectura

En `design/docs/ARCHITECTURE.md`, sección 5 (`ui/table.js`), matizar la frase "La posición y zoom son puramente visuales, no persistidos" para reflejar que ahora se conservan a nivel de módulo entre remontados de la mesa dentro de la misma sesión (no persistidos en `localStorage` ni en el fichero exportado, y se reinician al recargar la página).
