- **Nombre**: Avisar antes de reemplazar un recurso con nombre duplicado
- **Código**: 00166
- **Tipo**: fix
- **Fecha creación**: 2026-08-06

## Prompt original del usuario

cuando añado un recurso nuevo que tiene el mismo nombre que otro ya existente, debería avisar de que se va a reemplazar el recurso y si el usuario acepta, reemplazarlo

## Descripción completa

Al añadir un recurso nuevo (imagen o tipografía) a la galería de recursos del modo edición, si su nombre coincide con el de un recurso ya existente, el sistema no avisa de nada: simplemente da de alta el recurso nuevo como una entrada adicional, dejando dos recursos distintos con el mismo nombre conviviendo en la galería sin que el usuario se entere de la coincidencia.

Se espera que, en su lugar, al detectar que el nombre del recurso que se está añadiendo coincide con el de uno ya existente, se avise al usuario de que va a reemplazar ese recurso existente y se le pida confirmación antes de continuar:

- Si el usuario confirma, el recurso existente se reemplaza por el nuevo (mismo nombre, contenido nuevo).
- Si el usuario cancela, ese recurso concreto no se añade, sin afectar al resto de la operación en curso.

Esto aplica a las tres formas de añadir recursos que ya existen hoy: subir un único fichero, subir varios ficheros a la vez, y subir una carpeta entera. Cuando se suben varios ficheros o una carpeta a la vez, el aviso/confirmación debe cubrir cada nombre duplicado que aparezca entre los ficheros seleccionados y los recursos ya existentes, sin bloquear ni descartar silenciosamente el resto de ficheros que no tengan conflicto de nombre.

### Casos límite a tener en cuenta

- Dos ficheros seleccionados en la misma operación de subida (varios ficheros o carpeta) que comparten nombre entre sí, además de o en lugar de coincidir con un recurso ya existente.
- Diferencias de mayúsculas/minúsculas o de extensión entre el nombre del fichero nuevo y el del recurso existente (p.ej. `Logo.png` subido cuando ya existe `logo.png`).

## Apuntes técnicos

- Modelo de recurso: `src/core/resource.js` (`createResource`, `updateResource`, `resourceTypeForFileName`). Los recursos se identifican por `id` (`crypto.randomUUID()`), no por `name` — hoy nada impide ni detecta que dos recursos distintos compartan `name`.
- Alta/reemplazo de recursos en estado: `src/core/state.js` — `addResource(resource)` (línea ~295, añade sin comprobar nada), `replaceResource(id, updatedResource)` (línea ~300, ya existe y podría reutilizarse para el reemplazo manteniendo el `id` original), `getResources()`.
- Los tres flujos de subida (fichero único, varios ficheros, carpeta) están en `src/modes/edit/editMode.js` (~líneas 199-286) y comparten la función interna `loadResourceFromFile(file)` (~líneas 205-218), que hoy resuelve el `name` a partir de `file.name` sin extensión y llama a `addResource(createResource(...))` directamente. Ahí es donde habría que insertar la detección de nombre duplicado contra `getResources()`.
- Los flujos de varios ficheros y carpeta ya recogen resultados con `Promise.all` y muestran al final `ui/batchUploadSummaryModal.js` con el recuento de añadidos y omitidos (por formato, y en el caso de carpeta también por subcarpeta) — el nuevo caso de "reemplazado tras confirmación" y "omitido por no confirmar el reemplazo" tendría que encajar en ese mismo resumen o patrón equivalente.
- Patrones de confirmación ya existentes en el proyecto: `confirm()` nativo para confirmaciones simples de un solo elemento (usado hoy para borrar un recurso o grupo sin uso, en `attemptDeleteResource` de `editMode.js`); modales dedicados para consecuencias enumerables de varios elementos a la vez (`ui/bulkDeleteConfirmModal.js`, `ui/groupDeleteConfirmModal.js`).
- No se ha detectado ninguna incongruencia entre `design/docs/ARCHITECTURE.md` y el código: el documento no menciona unicidad de nombre de recurso, consistente con que el código tampoco la implementa.
