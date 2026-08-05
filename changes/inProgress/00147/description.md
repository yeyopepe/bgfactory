- **Nombre**: Título de cabecera editable
- **Código**: 00147
- **Tipo**: change
- **Fecha creación**: 2026-08-05

## Prompt original del usuario

La app tiene una cabecera que actualmente tiene el título "Errantes, un juego de mesa de SJ Martínez v.00111". Quiero que este título se pueda editar en cualquier momento (modo edición). La versión no se puede editar, se debe seguir actualizando como hasta ahora.
Cuando usemos la opción de exportar (modo edición), el nombre por defecto del fichero debe ser el mismo título de la cabecera (incluyendo la versión).

## Descripción completa

Hoy la cabecera de la app muestra un título fijo, "Errantes, un juego de mesa de SJ Martínez v.NNNNN", donde la parte de versión se actualiza automáticamente con cada nueva versión del proyecto, pero el texto no se puede cambiar de ninguna forma.

Este cambio hace que el texto libre del título (todo excepto la versión) se pueda editar en cualquier momento mientras la app está en modo edición. La versión sigue funcionando exactamente igual que hoy: se sigue mostrando pegada al final del título y se sigue actualizando sola con cada nueva versión del proyecto — en ningún caso es editable por el usuario.

**Cómo se edita**: haciendo click directamente sobre el título de la cabecera (con alguna señal visual, como un icono de lápiz al pasar el ratón por encima, que indique que es editable), el texto se convierte en un campo editable in-place. El cambio se confirma al salir del campo (perder el foco) o al pulsar Enter.

**Dónde se ve y quién puede editarlo**: el título (con el texto que el usuario haya puesto) se muestra igual en la cabecera y en el título de la pestaña del navegador, tanto en modo edición como en modo juego. Solo se puede editar estando en modo edición; en modo juego se ve igual pero no se puede tocar.

**Persistencia**: el título editado se guarda junto con el resto de la partida/proyecto (igual que ya pasa hoy con los componentes, recursos, etc.), de forma que:
- Sobrevive a recargar la página.
- Si se exporta el juego a fichero, el título editado viaja dentro de ese fichero (al volver a abrirlo, aparece con el mismo título, no con el de fábrica).

**Título vacío**: si el usuario borra todo el texto y confirma, no se permite quedarse sin título — se recupera automáticamente el texto que había justo antes de empezar a editar.

**Nombre de fichero al exportar**: en modo edición existen dos acciones distintas para generar un fichero ("Guardar", que genera el fichero completo del juego, y "Exportar", que genera un fichero con una selección de elementos del juego). En ambas, el nombre de fichero que aparece propuesto por defecto pasa a ser el título completo de la cabecera tal cual se ve en pantalla, incluyendo la versión (por ejemplo, "Errantes, un juego de mesa de SJ Martínez v.00111"), en vez del nombre genérico que se proponía hasta ahora. El usuario sigue pudiendo cambiar ese nombre propuesto antes de confirmar la descarga, igual que puede hacer hoy.

### Preguntas de alcance resueltas con el usuario

- **¿A qué acción de exportar se aplica el nombre por defecto?** Se aplica a las dos ("Guardar" el juego completo y "Exportar" una selección de elementos), no solo a una.
- **¿Cómo se activa la edición del título?** Con un click directo sobre el propio título en la cabecera, no con un botón/icono aparte.
- **¿Dónde se guarda el título editado?** Junto con el resto del estado del juego (no solo en el navegador local), para que viaje también en los ficheros exportados.
- **¿Qué pasa si se deja vacío?** Se revierte automáticamente al valor anterior; no se permite un título vacío.

## Apuntes técnicos

- El título fijo vive hoy en `src/index.html` (`<title>` y `<h1>` idénticos), con un marcador `{VERSION}` que `src/scripts/build.py` sustituye en tiempo de build por `v.NNNNN` a partir de `CURRENT_VERSION` (`src/data/version.js`, gestionada solo por la skill `ms-version` — fuera de alcance de este cambio). No existe hoy ningún campo de estado para un "título de app": este cambio introduce por primera vez composición dinámica del título en runtime (hoy `src/main.js` solo rellena `footer#app-version`, no toca `h1`/`title`).
- Las dos acciones de exportar son distintas funcionalmente: "Guardar" (`src/ui/editModeToggle.js`, `saveAs`/`buildExportHtml` de `src/core/fileExport.js`) exporta el HTML completo del juego con el estado embebido, hoy con nombre por defecto = nombre del fichero actualmente abierto o `errantes.html`. "Exportar" (`openExportFlow` en el mismo fichero) exporta un JSON con una selección de componentes/recursos/grupos, hoy con nombre por defecto = `errantes-componentes.json`.
- Para la persistencia del título, seguir el mismo patrón ya usado por `panelState` en `core/state.js`/`core/persistence.js`: incluirlo en el objeto guardado en `localStorage` y en el objeto embebido por `buildExportHtml`/`core/persistence.js`.
- No se han detectado incongruencias entre `design/docs/ARCHITECTURE.md` y el código real relevantes para este cambio.
