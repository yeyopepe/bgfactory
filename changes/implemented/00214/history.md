# Historial de prompts — 00214

Información histórica del proceso de análisis, no información vigente. Recoge, tal cual y sin reformular, los prompts sucesivos con los que el usuario ha ido planteando y ampliando esta entrada — pueden ser incompletos o contradictorios entre sí, ya que reflejan cómo evolucionó la petición sesión a sesión, no el resultado final (eso vive en `description.md`).

**Uso exclusivo de `ms-new` y `ms-fix`.** Ninguna otra skill del framework (`ms-how`, `ms-do`, `ms-status`, etc.) debe leer este fichero ni tenerlo en cuenta: la fuente de la verdad sobre qué se pide es siempre `description.md`.

## 2026-08-15 — sesión inicial

hay operaciones que tardan un tiempo en ejecutarse y dejan al jugador bloqueado hasta que terminan. Debemos implementar un sistema que al menos informe al jugador de lo que está ocurriendo y le devuelva el control cuando todo termine: una pequeña modal con un breve texto descriptivo y una animación.
Impleméntalo y úsalo cuando metemos cartas en un mazo, porque es una operación que puede tardar mucho o poco según el número de cartas que se están intentando introducir en el mazo. Puedes hacer la prueba con 1 carta y con 10.
