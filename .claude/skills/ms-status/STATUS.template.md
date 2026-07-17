# Estado del proyecto — {nombreProyecto}

*Generado: {fecha}*

## Estado

| Estado | Change | Fix | Fast | Todo | Total |
| --- | --- | --- | --- | --- | --- |
| Todo | — | — | — | {todoTotal} | **{todoTotal}** |
| En progreso | {inProgressChange} | {inProgressFix} | — | — | **{inProgressTotal}** |
| Implementado | {implementedChange} | {implementedFix} | {implementedFast} | — | **{implementedTotal}** |
| Cerrado | {closedChange} | {closedFix} | {closedFast} | — | **{closedTotal}** |
| **Total** | **{changeTotal}** | **{fixTotal}** | **{fastTotal}** | **{todoTotal}** | **{totalTotal}** |

*(La columna Fast solo puede tener valores en "Implementado" y "Cerrado": los cambios `fast` de `ms-fast` se aplican y documentan directamente en `implemented`, sin pasar nunca por `inProgress`.)*

## En progreso

-   **Implementando o pendientes de implementar** (`description.md` + `plan.md`, pendientes de implementar): {toImplementTotal}
    -   {xxxx} — {nombre} ({tipo})
    -   …
-   **Pendientes de análisis técnico** (solo `description.md`, pendientes de planificar con `ms-implement`): {pendingTotal}
    -   {xxxx} — {nombre} ({tipo})
    -   …
-   **Listos para revisar y cerrar** (en la carpeta changes/implemented, incluye tanto change/fix como fast): {toCloseTotal}
*(Omitir cualquiera de las tres listas si su total es 0, indicando "ninguno".)*

## Cambios fast implementados

-   {código} — {nombre} ({fecha})
    -   …
*(Listar las entradas `fast` de `implemented` y `closed` — código de carpeta, nombre y fecha. Si no hay ninguna, indicarlo. Omitir esta sección solo si `totalsByType.fast` es 0 o no existe.)*

## Ideas en todo/ (fuera del flujo change/fix)

-   {codigo}: {idea}
-   …

*(Listar los códigos de `{changesDir}/todo/`; si no hay ninguna, indicarlo.)*

## Avisos

*(Incluir esta sección solo si `collect_status.py` devolvió algún elemento en `warnings` — p.ej. entradas sin `description.md`, o sin campo `**Tipo**` reconocible. Omitir la sección entera si no hay avisos.)*
