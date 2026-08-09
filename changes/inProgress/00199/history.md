# Historial de prompts — 00199

Información histórica del proceso de análisis, no información vigente. Recoge, tal cual y sin reformular, los prompts sucesivos con los que el usuario ha ido planteando y ampliando esta entrada — pueden ser incompletos o contradictorios entre sí, ya que reflejan cómo evolucionó la petición sesión a sesión, no el resultado final (eso vive en `description.md`).

**Uso exclusivo de `ms-new` y `ms-fix`.** Ninguna otra skill del framework (`ms-how`, `ms-do`, `ms-status`, etc.) debe leer este fichero ni tenerlo en cuenta: la fuente de la verdad sobre qué se pide es siempre `description.md`.

## 2026-08-09 — sesión inicial

en la pestaña General de las propiedades de los elementos debe haber un botón para exportar una vista del elemento en formato webp máxima calidad.
Cada elemento debe tener su propio código para exportar su vista que luego usarán otras funcionalidades de la app, además de este botón.
Empezamos implementandolo para las cartas: exporta dos vistas, una de cada cara.

## 2026-08-09 — ampliación

Actualmente en los mazos hay una lista de las cartas que contiene, mostrando la vista previa de la cara frontal. Hay que actualizar esa ventana porque ahora esa lista debe pedir a cada carta que le pase la vista previa de la cara que necesita, para no tener código repetido en diferentes partes y mantener las responsabilidades en sus sitios correctos
