# Prompt history — 00194

Historical information about the analysis process, not current information. Records, verbatim and without rephrasing, the successive prompts with which the user raised and expanded this entry — they can be incomplete or contradictory with each other, since they reflect how the request evolved session by session, not the final result (that lives in `description.md`).

**Exclusive use of `pv-new` and `pv-fix`.** No other skill in the framework (`pv-how`, `pv-do`, `pv-status`, etc.) should read this file or take it into account: the source of truth for what's being asked is always `description.md`.

## 2026-08-08 — migrated from description.md

quiero que las copias puedan convertirse en elementos originales. Es decir: convertir copias en clones.
- en la pestaña Copias añade un botón "Convertir copias en originales" que convierta todas las copias de ese elemento en uno original, desvinculándolos para siempre. Requiere confirmación del usuario.
- añadir a las propiedades de cada elemento copia un botón "Convertir en original" para convertir esa copia en un elemento original. Requiere confirmación del usuario.
- cada vez que una copia se convierta en original, asígnale un id igual al elemento original que tenía añadiendo un sufijo numérico correcto y único; mismo mecanismo que tenemos ahora cuando sacamos clones de un elemento.
