# Prompt history — 00244

Historical information about the analysis process, not current information. Records, verbatim and without rephrasing, the successive prompts with which the user raised and expanded this entry — they can be incomplete or contradictory with each other, since they reflect how the request evolved session by session, not the final result (that lives in `description.md`).

**Exclusive use of `pv-new` and `pv-fix`.** No other skill in the framework (`pv-how`, `pv-do`, `pv-status`, etc.) should read this file or take it into account: the source of truth for what's being asked is always `description.md`.

## 2026-09-03 — initial session

convertir esta aplicación en multi-idioma:
- todos los textos que no introduzca manualmente el usuario deben ser traducibles con un sistema óptimo
- implementamos ahora español (actual) e inglés (traducir)

### Aclaraciones dadas por el usuario durante el análisis

1. Idioma por defecto en sesión nueva: autodetección (inglés por defecto si el navegador no es español).
2. Ubicación del selector de idioma: crear un botón de configuración visible siempre y ahí organizar información de este tipo (selector de idioma, información de la versión actual, etc.). Consultar el cambio 00231, que está pendiente. → Decisión: panel de configuración nuevo, propio de este cambio; el changelog de 00231 se integrará después como una sección más.
3. Cambio de idioma: todo al vuelo (incluidos los modales abiertos).
4. Persistencia del idioma: sí, en clave de almacenamiento separada del estado del juego.
5. Ordenación/comparación de textos (`localeCompare`): que use el idioma activo.
6. "Ten en cuenta que quiero que este sistema esté totalmente desacoplado y que el riesgo de modificaciones en él (cambios de traducciones) sea cero."
7. "También pon especial atención a la traducción teniendo en cuenta el contexto."
