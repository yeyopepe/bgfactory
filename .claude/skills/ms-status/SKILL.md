---
name: ms-status
description: Recopila y presenta el estado actual del proyecto según el framework ms-* — totales de elementos por tipo (todo/change/fix) y por estado (carpetas de {changesDir}), diferenciando dentro de "en progreso" entre entradas descritas (solo description.md) y listas para implementar (description.md + plan.md). Devuelve el informe como respuesta de chat; no escribe ningún fichero salvo que el usuario lo pida explícitamente. Trigger: /ms-status, o cuando el usuario pide un resumen/vista general del estado del proyecto, cuántos changes/fixes hay pendientes, etc.
metadata:
  version: 1.0.0
---

# ms-status

Da una vista general del estado del proyecto dentro del framework `ms-*`, basada exclusivamente en el contenido de `{changesDir}` (sus subcarpetas de estado: `todo`, `inProgress`, `implemented`, `closed`, o cualquier otra que exista).

Esta skill es de solo lectura: no crea, mueve ni modifica ninguna carpeta o fichero de `{changesDir}`. El informe se entrega como respuesta de chat; **no se escribe en ningún fichero salvo que el usuario lo pida explícitamente** (ver paso 4).

## 0. Cargar el contexto del proyecto

Lee `.claude/ms-context.json` en la raíz del repo. Si no existe, o le falta `framework.changesDir`, no continúes: dile al usuario que primero debe ejecutar la skill `ms-init` para inicializar el framework, y detente ahí.

## 1. Recopilar los datos

Toda la mecánica de recorrido y parseo la hace, de forma determinista y gratis en tokens, el script [`scripts/collect_status.py`](scripts/collect_status.py) (Python estándar, sin dependencias externas) — no la reimplementes a mano ni leas tú mismo cada `description.md`. Ejecuta desde la raíz del repo:

```
python .claude/skills/ms-status/scripts/collect_status.py
```

El script:

- Lee `changesDir` de `.claude/ms-context.json` (o usa `--changes-dir` si se lo pasas).
- Recorre cada subcarpeta directa de `{changesDir}` (un "estado") y, dentro, cada entrada.
- Para cada entrada determina su **tipo**: `todo` si el estado es `todo` (ms-todo no usa campo `Tipo`); en cualquier otro estado, parsea `**Tipo**` dentro de `description.md` (`change`/`fix`; `unknown` si no se encuentra o no hay `description.md`).
- Para las entradas del estado `inProgress`, calcula además `subStatus`: `listo_para_implementar` (existen `description.md` y `plan.md`), `descrito` (solo `description.md`), o `sin_descripcion` (anómalo: ni siquiera tiene `description.md`).
- Imprime por stdout un único JSON con: `states` (detalle y totales por estado, con `subStatus` agregado para `inProgress`), `totalsByType` (agregado global por tipo), `grandTotal`, y `warnings` (avisos de datos que no se han podido interpretar, p.ej. `Tipo` no reconocido).

Parsea ese JSON para el resto del proceso.

## 2. Redactar el informe

Usa como base la plantilla [`STATUS.template.md`](STATUS.template.md) — sigue su estructura y secciones, pero rellénala con los datos reales del JSON del paso 1:

- **Resumen**: totales globales por tipo (`todo`/`change`/`fix`) y el gran total, desde `totalsByType` y `grandTotal`.
- **Por estado**: tabla con el desglose por tipo dentro de cada estado (`states[estado].byType`), usando exactamente los nombres de estado que existan en `{changesDir}` (no asumas que siempre son los cuatro habituales; si hay un estado adicional o falta alguno, refleja lo que hay realmente).
- **En progreso — detalle**: las dos listas (`descrito` / `listo_para_implementar`) a partir de `states.inProgress.entries`, mostrando código, nombre (si `name` no es null) y tipo de cada una. Si alguna lista está vacía, dilo explícitamente en vez de omitirla en silencio. Si hay entradas `sin_descripcion`, menciónalas también (son anómalas).
- **Ideas en todo/**: lista simple de los códigos presentes en `states.todo.entries` (con su `name` si lo tienen).
- **Avisos**: solo si `warnings` no está vacío — inclúyelos tal cual los da el script, sin suavizarlos ni omitirlos.

No inventes datos que no estén en el JSON (p.ej. no le asignes un tipo a una entrada `unknown` solo por adivinarlo del nombre de la carpeta).

## 3. Presentar el informe

Entrega el informe redactado como respuesta directa en el chat. No lo guardes en ningún fichero en este paso.

## 4. Guardar en fichero (solo si el usuario lo pide)

Si el usuario, en este mismo turno o en uno posterior, pide explícitamente que el informe se guarde (p.ej. "guárdalo", "déjalo en un fichero"), y no ha indicado ninguna ruta concreta, pregúntale dónde quiere guardarlo (p.ej. `{changesDir}/STATUS.md` u otra ruta de su elección) antes de escribir nada — no asumas una ruta por defecto.
