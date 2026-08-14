# Historial de prompts — 00201

Información histórica del proceso de análisis, no información vigente. Recoge, tal cual y sin reformular, los prompts sucesivos con los que el usuario ha ido planteando y ampliando esta entrada — pueden ser incompletos o contradictorios entre sí, ya que reflejan cómo evolucionó la petición sesión a sesión, no el resultado final (eso vive en `description.md`).

**Uso exclusivo de `ms-new` y `ms-fix`.** Ninguna otra skill del framework (`ms-how`, `ms-do`, `ms-status`, etc.) debe leer este fichero ni tenerlo en cuenta: la fuente de la verdad sobre qué se pide es siempre `description.md`.

## 2026-08-13 — sesión inicial

cuando se selecciona un elemento que forma parte de un grupo, se selecciona el grupo entero:
- El elemento que se ha intentado seleccionar con el marco habitual
- El resto de elementos del grupo con un marco de color gris oscuro, indicando que forman parte de un todo.

Cuando un elemento forma parte de un grupo, en la ventana con la lista de componentes deben aparecer sus botones de acciones deshabilitados menos el de editar y el de eliminar, ya que podremos editar y eliminar ese componente de manera independiente aunque forme parte del grupo.
