# Historial de prompts — 00080

Información histórica del proceso de análisis, no información vigente. Recoge, tal cual y sin reformular, los prompts sucesivos con los que el usuario ha ido planteando y ampliando esta entrada — pueden ser incompletos o contradictorios entre sí, ya que reflejan cómo evolucionó la petición sesión a sesión, no el resultado final (eso vive en `description.md`).

**Uso exclusivo de `ms-new` y `ms-fix`.** Ninguna otra skill del framework (`ms-how`, `ms-do`, `ms-status`, etc.) debe leer este fichero ni tenerlo en cuenta: la fuente de la verdad sobre qué se pide es siempre `description.md`.

## 2026-08-08 — migrado desde description.md

quiero crear un script /src/scripts/build_game.py para generar una nueva versión pero solo la mesa de juego, sin el modo edición. Para ello supongo que es más fácil primero tener marcadores en el código que diferencien código exclusivo de cada código para que el script pueda hacer limpieza, no solo eliminar el botón del modo edición.
No hace falta borrar el 100% del código del modo edición, pero sí todo lo que sea exclusivo de ese modo. Lo que sea compartido o del modo juego, se queda

**Ampliación:** añade que además se deben eliminar todos los recursos que no están siendo usados en ningún elemento del juego.

**Ampliación:** en la realidad, generar la variante "solo mesa" ofuscada no debe requerir ejecutar ningún script Python desde terminal — debe poder hacerse desde dentro de la propia app, con un botón "Publicar" que guarde el fichero html ofuscado de la app (con el sufijo "game").

**Ampliación:** sí se mantiene un script Python para la build completa (mesa + edición) ya ofuscada: `build_obf.py`, que ejecuta `build.py` y, con el fichero que genere, lo ofusca y genera otro con el sufijo `_obf`.
