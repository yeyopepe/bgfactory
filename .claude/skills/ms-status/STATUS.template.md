# Estado del proyecto — {nombreProyecto}

_Generado: {fecha}_

## Resumen

| Tipo | Total |
|---|---|
| Change | {totalChange} |
| Fix | {totalFix} |
| Todo | {totalTodo} |
| **Total** | **{granTotal}** |

## Por estado

| Estado | Change | Fix | Todo | Total |
|---|---|---|---|---|
| Todo | — | — | {todoTotal} | {todoTotal} |
| En progreso | {inProgressChange} | {inProgressFix} | — | {inProgressTotal} |
| Implementado | {implementedChange} | {implementedFix} | — | {implementedTotal} |
| Cerrado | {closedChange} | {closedFix} | — | {closedTotal} |

## En progreso — detalle

- **Descritos** (solo `description.md`, pendientes de planificar con `ms-implement`): {descritoTotal}
  - {xxxx} — {nombre} ({tipo})
  - ...
- **Listos para implementar** (`description.md` + `plan.md`, pendientes de implementar): {listoTotal}
  - {xxxx} — {nombre} ({tipo})
  - ...

_(Omitir cualquiera de las dos listas si su total es 0, indicando "ninguno".)_

## Ideas en todo/ (fuera del flujo change/fix)

- {codigo}: {resumenIdea}
- ...

_(Listar los códigos de `{changesDir}/todo/`; si no hay ninguna, indicarlo.)_


_(Incluir esta sección solo si `collect_status.py` devolvió algún elemento en `warnings` — p.ej. entradas sin `description.md`, o sin campo `**Tipo**` reconocible. Omitir la sección entera si no hay avisos.)_
