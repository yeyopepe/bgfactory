---
name: ms-status
description: Recopila y presenta el estado actual del proyecto según el framework ms-* — totales de elementos por tipo (todo/change/fix/fast) y por estado (carpetas de {changesDir}), diferenciando dentro de "en progreso" entre entradas descritas (solo description.md) y listas para implementar (description.md + plan.md), y listando aparte los cambios `fast` (aplicados directamente en `implemented` por `ms-fast`, sin pasar por `inProgress`). Devuelve el informe como respuesta de chat; no escribe ningún fichero salvo que el usuario lo pida explícitamente. Trigger: /ms-status, o cuando el usuario pide un resumen/vista general del estado del proyecto, cuántos changes/fixes hay pendientes, etc. Con el argumento `todo` (`/ms-status todo`), en vez del informe completo devuelve solo el listado de ideas de `{changesDir}/todo/` con su código y el texto completo de la idea. Con cualquier otro nombre de carpeta de estado existente (`/ms-status closed`, `/ms-status implemented`, `/ms-status inProgress`...), devuelve la lista completa de esa carpeta con columnas Código, Tipo, Descripción y Fecha.
argument-hint: "[todo|<estado>]"
metadata:
  version: 1.5.0
  uses: []
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

## 1.b Modo `todo`: solo listar ideas

Si el usuario invocó la skill con el argumento `todo` (`/ms-status todo`, o pidió explícitamente "solo las ideas de todo"/"lista los todos"), no redactes el informe completo del paso 2 — salta directamente a esto:

- Recorre `states.todo.entries` del JSON del paso 1.
- Por cada entrada, muestra su `code` y el texto completo (sin truncar) de `name` (la sección `## Idea` de su `description.md`). Si `name` es `null` (idea sin esa sección, o sin `description.md`), dilo explícitamente en vez de omitir la entrada.
- Si `states.todo.entries` está vacío, dilo así ("no hay ninguna idea apuntada en todo/") en vez de no responder nada.
- No incluyas la tabla de estados, ni las secciones de "En progreso" ni "Avisos" — este modo es solo el listado de ideas.
- Entrega el resultado como respuesta de chat (no lo guardes en fichero salvo que el usuario lo pida, igual que en el paso 4).

Si no se pidió este modo, sigue con 1.c o, si tampoco aplica, con el informe completo.

## 1.c Modo `<estado>`: listado filtrado de una carpeta de estado

Si el usuario invocó la skill con el nombre de una carpeta de estado existente en `{changesDir}` distinta de `todo` (p.ej. `/ms-status closed`, `/ms-status implemented`, `/ms-status inProgress`), o pidió explícitamente "la lista completa de lo que está en <estado>", no redactes el informe completo del paso 2 — salta directamente a esto:

- Ejecuta [`scripts/filter_status.py`](scripts/filter_status.py) con el nombre de esa carpeta como argumento:

  ```
  python .claude/skills/ms-status/scripts/filter_status.py <estado>
  ```

  Si el estado indicado no existe como carpeta de `{changesDir}`, el script falla con un mensaje que lista los estados disponibles — muéstraselo al usuario tal cual en vez de improvisar una lista.

- El script ya aplica internamente la plantilla [`STATUS.filtered.template.md`](STATUS.filtered.template.md) e imprime por stdout el informe en markdown listo para mostrar (tabla Código/Tipo/Descripción/Fecha, o el mensaje de "sin entradas" si el estado está vacío) — no es JSON, no vuelvas a aplicar la plantilla tú ni reformatees nada, limítate a pegar la salida tal cual como respuesta.

Si no se pidió ninguno de estos dos modos, continúa con el informe completo:

## 2. Redactar el informe

Usa como base la plantilla [`STATUS.template.md`](STATUS.template.md) — sigue su estructura y secciones, pero rellénala con los datos reales del JSON del paso 1. Mapeo de los marcadores de la plantilla a campos del JSON:

- **Tabla "Estado"**: una fila por cada estado que exista realmente en `{changesDir}` (no asumas que siempre son los cuatro habituales — `todo`/`inProgress`/`implemented`/`closed`; si hay uno adicional o falta alguno, refleja lo que hay). Para cada fila, `{estadoChange}`/`{estadoFix}`/`{estadoFast}` salen de `states[estado].byType.change` / `.fix` / `.fast` (0 si no aparecen), y `{estadoTotal}` de `states[estado].total`. La columna Fast solo tendrá valores en `implemented`/`closed` (las entradas `fast` de `ms-fast` nunca pasan por `inProgress`); dale 0/`—` en las demás filas. La fila `Todo` solo tiene columna Todo (`states.todo.total`), ya que `ms-todo` no usa `**Tipo**`. La fila de totales sale de `totalsByType.change`, `totalsByType.fix`, `totalsByType.fast`, `states.todo.total` y `grandTotal`.
- **En progreso**: tres listas, todas derivadas de `states.inProgress`:
  - "Pendientes de análisis técnico" ({pendingTotal}) = entradas con `subStatus == "descrito"`.
  - "Listos para implementar" ({toImplementTotal}) = entradas con `subStatus == "listo_para_implementar"`.
  - "Listos para revisar y cerrar" ({toCloseTotal}) = `states.implemented.total` (ya implementadas en código, pendientes de revisar y mover a `closed` con `ms-close`; incluye tanto entradas `change`/`fix` como `fast`); si esta entrada existe en la plantilla, no confundirla con `inProgress` — es información de otro estado agrupada aquí porque forma parte del ciclo "en progreso" de trabajo del usuario.
  - Para las dos primeras, lista cada entrada como código, nombre (si `name` no es null) y tipo. Si alguna de las tres listas está vacía, dilo explícitamente ("ninguno") en vez de omitirla en silencio. Si hay entradas con `subStatus == "sin_descripcion"`, menciónalas aparte (son anómalas).
- **Cambios fast implementados**: lista las entradas con `type == "fast"` de `states.implemented.entries` y, si los hay, de `states.closed.entries` (código, nombre y, si se necesita, indica si ya está `closed`). Si `totalsByType.fast` es 0 o no existe, omite la sección entera en vez de dejarla vacía.
- **Ideas en todo/**: lista simple de los códigos presentes en `states.todo.entries`, usando el texto completo (sin truncar) de `name` como `{idea}`.
- **Avisos**: solo si `warnings` no está vacío — inclúyelos tal cual los da el script, sin suavizarlos ni omitirlos.

No inventes datos que no estén en el JSON (p.ej. no le asignes un tipo a una entrada `unknown` solo por adivinarlo del nombre de la carpeta).

## 3. Presentar el informe

Entrega el informe redactado como respuesta directa en el chat. No lo guardes en ningún fichero en este paso.

## 4. Guardar en fichero (solo si el usuario lo pide)

Si el usuario, en este mismo turno o en uno posterior, pide explícitamente que el informe se guarde (p.ej. "guárdalo", "déjalo en un fichero"), y no ha indicado ninguna ruta concreta, pregúntale dónde quiere guardarlo (p.ej. `{changesDir}/STATUS.md` u otra ruta de su elección) antes de escribir nada — no asumas una ruta por defecto.
