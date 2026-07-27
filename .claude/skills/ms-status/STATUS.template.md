# Estado del proyecto

*Generado: {fechaGeneracion}*

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
{filasImplementar}
-   **Pendientes de análisis técnico** (solo `description.md`, pendientes de planificar con `ms-how`): {pendingTotal}
{filasPendientes}
-   **Listos para revisar y cerrar** (en la carpeta changes/implemented, incluye tanto change/fix como fast): {toCloseTotal}
<!-- SECTION:sinDescripcion -->
-   **Entradas sin `description.md` (anómalas):** {filasSinDescripcion}
<!-- /SECTION:sinDescripcion -->

<!-- SECTION:fast -->
## Cambios fast implementados

{filasFast}
<!-- /SECTION:fast -->

## Ideas en todo/ (fuera del flujo change/fix)

{filasIdeas}

<!-- SECTION:avisos -->
## Avisos

{filasAvisos}
<!-- /SECTION:avisos -->

<!-- ROW_ENTRY: -   {xxxx} — {nombre} ({tipo}) -->
<!-- EMPTY_ENTRY: -   ninguno -->
<!-- ROW_FAST: -   {código} — {nombre} ({fecha}) -->
<!-- ROW_IDEA: -   {codigo}: {idea} -->
<!-- ROW_AVISO: -   {aviso} -->
<!-- EMPTY_IDEAS: *(No hay ninguna idea apuntada en `todo/`.)* -->
