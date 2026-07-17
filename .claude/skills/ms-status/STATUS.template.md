# Estado del proyecto — {nombreProyecto}

*Generado: {fecha}*

## Estado

| Estado | Change | Fix | Todo | Total |
| --- | --- | --- | --- | --- |
| Todo | — | — | {todoTotal} | **{todoTotal}** |
| En progreso | {inProgressChange} | {inProgressFix} | — | **{inProgressTotal}** |
| Implementado | {implementedChange} | {implementedFix} | — | **{implementedTotal}** |
| Cerrado | {closedChange} | {closedFix} | — | **{closedTotal}** |
| **Total** | **{changeTotal}** | **{fixTotal}** | **{todoTotal}** | **{totalTotal}** |

## En progreso

-   **Pendientes de análisis técnico** (solo `description.md`, pendientes de planificar con `ms-implement`): {pendingTotal}
    -   {xxxx} — {nombre} ({tipo})
    -   …
-   **Listos para implementar** (`description.md` + `plan.md`, pendientes de implementar): {toImplementTotal}
    -   {xxxx} — {nombre} ({tipo})
    -   …
-   **Listos para revisar y cerrar** (en la carpeta changes/implemented): {toCloseTotal}
*(Omitir cualquiera de las tres listas si su total es 0, indicando "ninguno".)*

## Ideas en todo/ (fuera del flujo change/fix)

-   {codigo}: {idea}
-   …

*(Listar los códigos de `{changesDir}/todo/`; si no hay ninguna, indicarlo.)*

## Avisos

*(Incluir esta sección solo si `collect_status.py` devolvió algún elemento en `warnings` — p.ej. entradas sin `description.md`, o sin campo `**Tipo**` reconocible. Omitir la sección entera si no hay avisos.)*
