# Prompt history — 00199

Historical information about the analysis process, not current information. Records, verbatim and without rephrasing, the successive prompts with which the user raised and expanded this entry — they can be incomplete or contradictory with each other, since they reflect how the request evolved session by session, not the final result (that lives in `description.md`).

**Exclusive use of `pv-new` and `pv-fix`.** No other skill in the framework (`pv-how`, `pv-do`, `pv-status`, etc.) should read this file or take it into account: the source of truth for what's being asked is always `description.md`.

## 2026-08-09 — initial session

en la pestaña General de las propiedades de los elementos debe haber un botón para exportar una vista del elemento en formato webp máxima calidad.
Cada elemento debe tener su propio código para exportar su vista que luego usarán otras funcionalidades de la app, además de este botón.
Empezamos implementandolo para las cartas: exporta dos vistas, una de cada cara.

## 2026-08-09 — session 2

Actualmente en los mazos hay una lista de las cartas que contiene, mostrando la vista previa de la cara frontal. Hay que actualizar esa ventana porque ahora esa lista debe pedir a cada carta que le pase la vista previa de la cara que necesita, para no tener código repetido en diferentes partes y mantener las responsabilidades en sus sitios correctos

## 2026-09-04 — sesión de re-análisis

199 borra el mockup actual y reanaliza desde el principio
