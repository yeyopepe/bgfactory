# Prompt history — 00276

Historical information about the analysis process, not current information. Records, verbatim and without rephrasing, the successive prompts with which the user raised and expanded this entry — they can be incomplete or contradictory with each other, since they reflect how the request evolved session by session, not the final result (that lives in `description.md`).

**Exclusive use of `pv-new` and `pv-fix`.** No other skill in the framework (`pv-how`, `pv-do`, `pv-status`, etc.) should read this file or take it into account: the source of truth for what's being asked is always `description.md`.

## 2026-09-15 — initial session

cuando se genera el mazo de cartas francesa ocurre algo raro: el ide del mazo es un GUID pero en la ventana de componentes aparece "Baraja Francesa"

## 2026-09-15 — clarification after investigation

ese cambio 272 era incorrecto y no lo verifiqué, porque según mi prompt, lo que quería era cambiar solo el id, no añadir ningún campo name adicional

Confirmado con el usuario: el id del mazo generado por el preset debe ser literalmente "Baraja Francesa" (id de texto legible, con desambiguación, mismo patrón que usan las 54 cartas del mismo preset vía `freeId`), no un GUID. Se retira el campo `name` y su fallback en la columna "Id" del panel de componentes, introducidos por el cambio 00272 al desviarse de la petición original de ese mismo cambio.
