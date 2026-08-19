# Prompt history — 00198

Heredado tal cual del cambio 00080 (dividido en 00197 y 00198, ver `description.md`) — el historial original no distinguía todavía entre `build_obf.py` y el botón "Publicar", así que se conserva íntegro en ambas entradas.

Historical information about the analysis process, not current information. Records, verbatim and without rephrasing, the successive prompts with which the user raised and expanded this entry — they can be incomplete or contradictory with each other, since they reflect how the request evolved session by session, not the final result (that lives in `description.md`).

**Exclusive use of `pv-new` and `pv-fix`.** No other skill in the framework (`pv-how`, `pv-do`, `pv-status`, etc.) should read this file or take it into account: the source of truth for what's being asked is always `description.md`.

## 2026-08-08 — migrated from description.md

quiero crear un script /src/scripts/build_game.py para generar una nueva versión pero solo la mesa de juego, sin el modo edición. Para ello supongo que es más fácil primero tener marcadores en el código que diferencien código exclusivo de cada código para que el script pueda hacer limpieza, no solo eliminar el botón del modo edición.
No hace falta borrar el 100% del código del modo edición, pero sí todo lo que sea exclusivo de ese modo. Lo que sea compartido o del modo juego, se queda

**Ampliación:** añade que además se deben eliminar todos los recursos que no están siendo usados en ningún elemento del juego.

**Ampliación:** en la realidad, generar la variante "solo mesa" ofuscada no debe requerir ejecutar ningún script Python desde terminal — debe poder hacerse desde dentro de la propia app, con un botón "Publicar" que guarde el fichero html ofuscado de la app (con el sufijo "game").

**Ampliación:** sí se mantiene un script Python para la build completa (mesa + edición) ya ofuscada: `build_obf.py`, que ejecuta `build.py` y, con el fichero que genere, lo ofusca y genera otro con el sufijo `_obf`.
