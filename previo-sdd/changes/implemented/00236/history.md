# Prompt history — 00236

Historical information about the analysis process, not current information. Records, verbatim and without rephrasing, the successive prompts with which the user raised and expanded this entry — they can be incomplete or contradictory with each other, since they reflect how the request evolved session by session, not the final result (that lives in `description.md`).

**Exclusive use of `pv-new` and `pv-fix`.** No other skill in the framework (`pv-how`, `pv-do`, `pv-status`, etc.) should read this file or take it into account: the source of truth for what's being asked is always `description.md`.

## 2026-09-03 — initial session

revisa este plan @.claude/plans/fix-tech-doc.md , añade lo que vea que falta

---

actualiza la documentación técnica. Usa el plan @.claude/plans/fix-tech-doc.md como base

---

Notas de la sesión (respuestas a las preguntas de alcance de `pv-new`):

- Sobre qué se trabaja: sobre la documentación real del proyecto (`previo-sdd/design/docs/{architecture,style}`), migrándola in situ y verificando anclas contra `/src`. El plan se reinterpreta con las rutas y supuestos correctos (el borrador apuntaba a una carpeta de datos de prueba inexistente en este repo).
- Ficheros nuevos: sí, tal como propone el plan — vaciar `INDEX.md` de contenido sustantivo y repartirlo en documentos numerados nuevos (visión general, convenciones de código, lista de comprobaciones transversal).
- Carpeta huérfana `previo-sdd/docs/` (arquitectura/features/estilo vacías): ignorarla en este cambio; solo se menciona como hallazgo en las notas técnicas.
- Profundidad de la reescritura *notation-first*: "Estructura + gaps" — renumerar, cabeceras, índices, poblar `00-namespace.md`, arreglar referencias, y reescribir a notación solo donde hoy hay prosa real; respetar lo ya tabulado. No reescritura completa.
- Árbol de nombres: "Conceptos + decisiones clave", no árbol exhaustivo de todos los campos de todos los tipos.
- Entrega: documentar y encadenar `pv-how` a continuación para planificar la solución técnica.
