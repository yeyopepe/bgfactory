- **Nombre**: Persistencia de estado en localStorage y guardado a fichero
- **Código**: 00011
- **Tipo**: change

## Prompt original del usuario

Quiero un sistema que incorpore persistencia inmediata (via localstorage) de todos los elementos que haya y del estado completo de la app. No quiero que haya que actualizar nada de este sistema cada vez que implementamos algo nuevo: debe funcionar siempre con todo lo que haya, sea lo que sea.
También un botón de guardar que permita reescribir el fichero actual o copiarlo en uno nuevo para conservar el estado actual de la app.

## Descripción completa

Se añaden dos mecanismos de persistencia complementarios: uno automático e inmediato en el propio navegador, y otro manual para guardar el trabajo como fichero.

### Autoguardado inmediato en el navegador

Cada vez que se añade, edita, mueve, redimensiona o elimina un elemento, ese cambio se guarda automáticamente en el navegador (localStorage), sin que el usuario tenga que hacer nada. No hace falta ningún botón ni confirmación para esto: ocurre en el momento, de forma transparente.

Al volver a abrir la aplicación en el mismo navegador, si hay un estado guardado previamente se recupera tal cual (los mismos elementos que había antes de cerrar), en vez de arrancar con el elemento de ejemplo que trae la aplicación por defecto hoy en día. Si nunca se ha guardado nada (primera vez que se abre), se sigue mostrando ese elemento de ejemplo por defecto.

Este guardado automático es local a ese navegador y ese ordenador/perfil: no hay conservación entre distintos navegadores ni dispositivos, ni ningún concepto de usuario o partida — encaja con que la aplicación es de uso individual y local, sin servidor.

Si al abrir la aplicación el estado guardado resulta estar corrupto o pertenece a una versión incompatible de la aplicación, se muestra un aviso breve al usuario indicando que no se ha podido recuperar el estado guardado, y la aplicación arranca igualmente con el elemento de ejemplo por defecto (nunca se bloquea ni falla la carga por esto).

### Botón de guardar a fichero

En modo edición aparece un nuevo botón de guardado, junto al botón existente de salir de modo edición. No está disponible en modo jugar, ya que solo en modo edición se crean o modifican elementos.

Este botón ofrece dos acciones:

- **Guardar**: descarga una nueva copia del fichero de la aplicación con el estado actual, usando el mismo nombre que tenía el fichero abierto. Al no poder la aplicación sobrescribir de verdad el fichero que el usuario tiene abierto (se ejecuta como fichero local, sin servidor), es el propio navegador quien decide, según su configuración de descargas habitual, si sustituye el fichero anterior o añade un sufijo al nombre — esto queda fuera del control de la aplicación.
- **Guardar como...**: descarga una copia nueva con un nombre distinto, que el usuario puede editar en el propio diálogo de descarga del navegador. Sirve para conservar varias versiones del trabajo sin perder la anterior.

En ambos casos, el fichero descargado es una copia completa y autónoma de la aplicación (igual que la que se abrió), pero con el estado actual (los elementos existentes en el momento de guardar) ya incorporado, de forma que al abrir ese fichero descargado la aplicación arranca directamente con ese mismo contenido.

### Preguntas de alcance resueltas

- **¿Qué se guarda automáticamente y cuándo?** Solo los elementos existentes, en cada cambio (no se guarda si la aplicación estaba en modo jugar o editar, por ser un detalle puramente de la interfaz en ese momento).
- **¿Dónde está disponible el botón de guardar?** Solo en modo edición.
- **¿Cómo se comporta "guardar" dado que no se puede sobrescribir de verdad el fichero abierto?** Descarga con el mismo nombre de fichero, dejando que sea el navegador quien decida si sustituye o no el fichero anterior según su propia configuración.
- **¿Qué pasa si el estado guardado en el navegador está corrupto o es incompatible?** Se avisa brevemente al usuario y se arranca con el estado por defecto, sin bloquear la aplicación.

## Apuntes técnicos

- El estado de los elementos vive en `src/core/state.js` (`state.components`), con mutaciones que ya emiten eventos (`components:changed`) vía `src/core/eventBus.js` — punto natural para enganchar el autoguardado. Ya existe `loadComponents(components)` como entrada de carga masiva, reutilizable para restaurar desde localStorage.
- `src/main.js` (líneas ~38-47) siembra hoy un componente de tipo `'texto'` por defecto en cada carga; este es el punto a condicionar según haya o no estado guardado.
- No existe hoy ningún uso de `localStorage`, ni de `Blob`/`download`/`showSaveFilePicker`/`JSON.stringify`/`JSON.parse` en `src/` — toda la serialización y descarga es funcionalidad nueva.
- El botón de guardar encaja en `src/ui/editModeToggle.js` (`renderEditToolbar()`, montado en `#edit-toolbar`), junto al botón existente "Salir del modo edición".
- Restricción confirmada: la app se abre vía `file://` sin servidor (ver `design/docs/ARCHITECTURE.md` §1 y §6), por lo que File System Access API (`showSaveFilePicker`) no es una opción fiable en este contexto — el mecanismo viable es descarga (`Blob` + enlace de descarga) con el nombre de fichero como único diferenciador entre "Guardar" y "Guardar como...".
- El fichero final se genera hoy mediante `src/scripts/build.py`, que inlinea todo en un único HTML autocontenido y lo escribe versionado en `src/_output/versions/index-v{NNNN}.html` (NNNN = `CURRENT_VERSION` de `src/data/version.js`); "guardar" en tiempo de ejecución debe producir una copia de ese mismo tipo de HTML (el que el usuario tiene abierto, sea cual sea su nombre) con el estado embebido (p.ej. inyectando el JSON de `state.components` en el propio documento antes de descargarlo), reutilizando el mismo formato/deserialización que el autoguardado de localStorage.
