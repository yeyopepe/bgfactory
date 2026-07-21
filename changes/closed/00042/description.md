- **Nombre**: Filtro de texto en la ventana de recursos
- **Código**: 00042
- **Tipo**: change

## Prompt original del usuario

[Origen: idea `x4h9z` de `todo/`] Filtro de texto en la ventana de recursos. Añadir a la ventana de recursos un cuadro de texto en la parte superior a modo de filtro: según se escriba en el cuadro de texto, debe ir mostrando solamente los elementos cuyo id, tipo o contenido (en el caso de texto) coincidan de alguna manera con lo que se vaya escribiendo.

Respuesta del usuario a las dudas de alcance planteadas antes de documentar: confirmó todas las propuestas, con una corrección — el filtro también debe comparar contra el identificador del recurso, porque el usuario puede llegar a necesitarlo.

## Descripción completa

En la parte superior del cuerpo de la ventana de recursos (justo debajo de la cabecera/título del panel, encima de la tabla de recursos), se añade un cuadro de texto de filtro con un texto de ejemplo tipo "Filtrar recursos…".

**Comportamiento del filtro**

Según el usuario va escribiendo en el cuadro, la lista de recursos se actualiza en vivo, carácter a carácter, sin necesidad de pulsar ningún botón ni esperar, mostrando solamente los recursos cuyo nombre, tipo o identificador coincidan parcialmente con el texto escrito. La coincidencia es parcial (no hace falta que el texto escrito sea exacto ni completo) e insensible a mayúsculas/minúsculas y tildes.

Se compara el texto escrito contra:
- El nombre visible del recurso.
- El tipo de recurso (usando la etiqueta tal y como se muestra, p.ej. "Imagen" / "Tipografía").
- El identificador interno del recurso — aunque este no se muestre normalmente en la tabla, el usuario puede conocerlo y necesitarlo para localizar un recurso concreto.

**Casos límite y estados**

- Cuadro de filtro vacío: se muestran todos los recursos, igual que el comportamiento actual sin filtro.
- Sin coincidencias: la tabla queda vacía y en su lugar se muestra un mensaje indicando que no hay recursos que coincidan con el filtro escrito.
- No existen estados de carga ni cancelaciones a medio camino: todo el filtrado ocurre de forma local e inmediata mientras se escribe.

**Convivencia con lo existente**

Es la primera vez que aparece este tipo de filtro/búsqueda en el proyecto. El resto de la ventana de recursos (tabla con nombre, tipo y acciones de cada recurso, botón para añadir un recurso nuevo, edición y eliminación de recursos) no cambia.

**Alcance de los datos**

El texto escrito en el filtro es un estado transitorio de la interfaz: no se guarda en ningún sitio y se resetea cada vez que se recarga la página o se vuelve a abrir la ventana. Los recursos en sí siguen siendo una lista compartida y guardada como hasta ahora; el filtro solo afecta a qué filas se muestran, no a los datos de los recursos.

**Quién puede usarlo**

La ventana de recursos solo existe en modo edición, así que el filtro queda disponible automáticamente solo ahí, sin necesitar ninguna restricción adicional.

**Definición visual de alto nivel**

Un cuadro de texto se añade en la parte superior del cuerpo de la ventana de recursos, por encima de la tabla, con el mismo estilo que el resto de controles pequeños de la interfaz. Al escribir, la tabla se actualiza en vivo mostrando solo las filas que coinciden. Cuando no hay ninguna coincidencia, la tabla se sustituye por un mensaje de "sin resultados".

## Apuntes técnicos

- Ventana de recursos: `src/ui/resourceList.js` (renderizado del panel), montada solo en modo edición desde `src/modes/edit/editMode.js`.
- Modelo de datos del recurso: `src/core/resource.js` — `createResource({ name, type, dataUrl, fileName, mimeType })` genera `{ id (UUID), name, type ('imagen'|'tipografia'), dataUrl, fileName, mimeType }`. No existe un campo de "contenido" textual aparte: el contenido es el fichero embebido (imagen o tipografía).
- Estructura actual del panel: `.resource-panel__header` (título + colapsar, arrastrable) → `.resource-panel__body` (tabla scrollable con columnas Nombre/Tipo/Acciones) → `.resource-panel__footer` (botón "+ Añadir recurso"). El cuadro de filtro se insertaría al inicio de `.resource-panel__body`, antes de la tabla.
- No existe ningún patrón de filtro/búsqueda ya implementado en el proyecto (se comprobó también en el panel análogo de componentes, `componentList.js`) — no hay convención previa que reutilizar.
- Convenciones de estilo aplicables (`design/docs/stylebible/STYLE_BIBLE.md`): tamaño de fuente de controles `0.875rem`, radio de borde `4px` para controles pequeños.
- Acceso al estado de recursos: `getResources()` / evento `resources:changed` en `src/core/state.js`.
