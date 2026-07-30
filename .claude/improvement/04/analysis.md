# Punto 4 — Verbosidad de salida de scripts

Parte de la auditoría de consumo de tokens del framework `ms-*`. Punto 4 del informe original (`.claude/improvement/auditoria-original.md`).

## 0. Objetivo del punto

- Ejecutar cada script asociado y medir tamaño de su salida estándar.
- Detectar logs de instalación, listados de directorio o dumps de datos que se cuelan en el contexto.

## 1. Plan de pruebas — procedimiento

A diferencia del punto 2 (tamaño de fichero, estático), aquí hace falta **ejecutar de verdad** cada script y medir su stdout real. Inventario completo: 11 scripts bajo `.claude/skills/*/scripts/*.py`.

Criterio de seguridad para decidir cómo ejecutar cada uno (no todos son de solo lectura):

| Script | Efecto | Cómo se probó |
|---|---|---|
| `ms-status/scripts/collect_status.py` | Solo lectura | Ejecutado tal cual contra `changes/` real del repo |
| `ms-status/scripts/render_status.py` (con y sin `--show-fast`) | Solo lectura | Ejecutado tal cual |
| `ms-status/scripts/filter_status.py <estado>` | Solo lectura | Ejecutado tal cual (`closed`) |
| `ms-init/scripts/check-context.py` | Solo lectura | Ejecutado tal cual |
| `ms-how/scripts/get-max-change-codes.py` | Solo lectura | Ejecutado tal cual |
| `ms-internal-workflow/scripts/next-change-number.py` | Solo lectura | Ejecutado tal cual |
| `ms-todo/scripts/new-todo-code.py` | Solo lectura | Ejecutado tal cual |
| `ms-fast/scripts/resolve-fast-folder.py` | Solo lectura (no crea carpeta, solo calcula el nombre) | Ejecutado tal cual |
| `ms-init/scripts/sync-skill-models.py` | Escribe en los `SKILL.md` reales | Ejecutado con `--dry-run` (soportado por el propio script) |
| `ms-internal-workflow/scripts/move-change.py` | Mueve carpetas reales de `changes/` | Ejecutado contra una carpeta `changes/` de mentira en `/tmp`, no contra el repo |
| `ms-internal-graph/scripts/ms_graph.py extract` | Escribe un fichero de salida (no toca `changes/` ni código) | Ejecutado tal cual contra `src/` real, con `--out` apuntando a `/tmp` |

Procedimiento por script: ejecutar con argumentos representativos de un uso real, capturar stdout a fichero, medir con `wc -c`/`wc -l`. Para los que dependen del volumen de datos del repo (`collect_status.py`, `filter_status.py`, `ms_graph.py`), se usó el estado real de este repo (116 `closed`, `src/` con 60 ficheros) en vez de datos sintéticos, para que la medida sea representativa del caso real y no de un caso de juguete.

### Naturaleza del dato

Los tamaños en caracteres (`wc -c`) son **medición directa** de la salida real del script — no hay proxy aquí, es la salida tal cual entraría en el contexto. La conversión a tokens_est (`chars/4`) sí es una **estimación** (mismo proxy y misma limitación que en el punto 2: sin acceso de red al tokenizer real en este entorno).

## 2. Resultados

Ver `results.md` para la tabla completa. Resumen por script:

| Script | Salida típica | Veredicto |
|---|---:|---|
| `check-context.py` | 80 caracteres | OK — mínimo, un JSON de una línea |
| `get-max-change-codes.py` | 64 caracteres | OK |
| `next-change-number.py` | 6 caracteres | OK |
| `new-todo-code.py` | 6 caracteres | OK |
| `resolve-fast-folder.py` | 42 caracteres | OK |
| `sync-skill-models.py --dry-run` | 64 caracteres | OK |
| `move-change.py` | 138 caracteres | OK |
| `ms_graph.py extract` (60 ficheros reales) | 6.514 caracteres | OK, ver §3 — verboso pero justificado |
| `render_status.py` | 1.313 caracteres | OK — es el informe final, no sobra nada |
| `render_status.py --show-fast` | 3.479 caracteres | OK |
| `filter_status.py closed` (116 entradas reales) | 34.310 caracteres | OK — es el listado que se pide, no sobra nada |
| **`collect_status.py`** | **34.343 caracteres** | **Problema real, ver §4** |

## 3. `ms_graph.py extract` — verificado, no es un problema

Su salida incluye, además del resumen de nodos/edges, un listado plano de los IDs que necesitan `purpose` (uno por línea; 186 líneas en este repo). A primera vista parece justo el patrón que este punto busca detectar ("dump de datos que se cuela en el contexto"), pero el propio script lo explica en su docstring: esa lista es la "lista de tareas" del paso 2 de la skill (qué ficheros/símbolos hay que describir), pensada explícitamente para que Claude no tenga que releer el fichero *skeleton* completo (66.299 caracteres en este repo, ~10× más grande) solo para extraer esos IDs. Es una decisión de diseño que ya ahorra tokens, no un descuido. No se propone ningún cambio aquí.

## 4. `collect_status.py` — hallazgo principal del punto

`ms-status/SKILL.md` (antes de este cambio) ejecutaba `collect_status.py` **siempre**, como primer paso, incondicionalmente — y solo después decidía en qué modo estaba (`todo`, `<estado>`, o informe general). Comprobando qué modos usan de verdad esa salida:

- **Modo `todo`**: sí la usa (lee `states.todo.entries` del JSON).
- **Modo `<estado>`** (p.ej. `/ms-status closed`): **no la usa en absoluto** — ese modo ejecuta `filter_status.py <estado>`, un script totalmente independiente que vuelve a recorrer `{changesDir}` por su cuenta.
- **Informe general** (`/ms-status` sin argumentos): **no la usa en absoluto** — ejecuta `render_status.py`, que también recopila los datos internamente por su cuenta (reimporta y reutiliza la función `collect()`, pero como llamada Python interna del script, no reaprovechando nada de lo que Claude ya hubiera leído).

Es decir: en 2 de los 3 modos de la skill, `collect_status.py` se ejecutaba y su salida completa (34.343 caracteres en este repo, con el detalle de las 116 entradas de `closed` incluido) entraba en el contexto sin que nada del resto del proceso la usara.

**Cambio aplicado:** se reordenó `ms-status/SKILL.md` (commit ver historial) para detectar el modo de invocación **antes** de ejecutar ningún script (nuevo paso "1. Detectar el modo de invocación"), y mover la ejecución de `collect_status.py` dentro de la rama `1.b` (modo `todo`), la única que la necesita. Los modos `<estado>` (1.c) y el informe general (2) ahora ejecutan directamente su script correspondiente (`filter_status.py`/`render_status.py`) sin pasar por `collect_status.py`. Comportamiento y salida final sin cambios en ningún modo — solo se deja de ejecutar y leer un script cuya salida no se usaba.

## 5. Propuestas del informe original — veredicto

| Solución propuesta | Veredicto |
|---|---|
| Añadir flags de salida silenciosa/mínima (`-q`, `--silent`) a los scripts | No aplica tal cual: los 10 scripts pequeños ya son mínimos por diseño (JSON/string de una línea), y los 2 grandes (`filter_status.py`, `render_status.py`) son el propio resultado que se pide, no ruido que silenciar. El problema real no era verbosidad de un script mal ajustado, sino **ejecutar un script cuya salida entera no hacía falta** — implementado en §4. |
| Redirigir salidas verbosas a fichero y solo mostrar resumen o exit code | Aplicado parcialmente y ya presente en el propio diseño: `ms_graph.py extract` ya escribe el grueso de los datos (skeleton) a fichero y solo imprime un resumen + la lista mínima necesaria para el siguiente paso (§3). No se ha encontrado ningún otro script grande que debiera aplicar este patrón y no lo haga. |

## 6. Pendiente / próximos pasos

- Ninguna acción pendiente de decisión en este punto — el único hallazgo real quedó implementado.
- Seguir con el siguiente punto del informe.
