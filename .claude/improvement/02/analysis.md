# Punto 2 — Carga de SKILL.md al inicio de tarea

Parte de la auditoría de consumo de tokens del framework `ms-*`. Punto 2 del informe original (`# | Aspecto a revisar | Tareas específicas | Soluciones potenciales`).

## 0. Objetivo del punto

- Medir tokens de cada una de las SKILL.md del framework.
- Contar cuántas se leen de media por petición típica vs. cuántas acaban usándose realmente.

## 1. Corrección de partida: cómo carga Claude Code las skills en realidad

Antes de medir, hace falta corregir la premisa implícita del informe original ("SKILL.md completo cargado al inicio de tarea"). Verificado contra la documentación oficial (`https://code.claude.com/docs/en/skills`):

| Frontmatter | Usuario puede invocar | Claude puede invocar | Cuándo se carga en contexto |
|---|---|---|---|
| (default) | Sí | Sí | `description` siempre en contexto; cuerpo completo solo al invocar |
| `disable-model-invocation: true` | Sí | **No** | `description` NO en contexto; cuerpo solo si el usuario invoca |
| `user-invocable: false` | No | Sí | `description` siempre en contexto; cuerpo completo solo al invocar |

Consecuencias directas para este framework:

- Lo que se paga **siempre, en cada tarea**, sea cual sea la petición, es solo el campo `description` de las 11 skills — no el cuerpo completo.
- El cuerpo completo (y los ficheros auxiliares que el `SKILL.md` instruye a leer) solo entra en contexto cuando la skill se invoca de verdad.
- Los scripts en `scripts/*.py` que las skills ejecutan vía `Bash` **no** entran en contexto como texto — solo su stdout. Ya es una buena práctica presente en el repo (`ms-status`, `ms-init`, `ms-internal-graph`, `ms-internal-workflow`, `ms-fast`, `ms-todo`, `ms-how` delegan su parte mecánica en scripts "deterministas y gratis en tokens", literal del propio `SKILL.md`).
- **Ciclo de vida del contenido de una skill ya invocada** (misma documentación): *"When Claude re-invokes a skill whose rendered content is identical to the copy already in context, Claude Code adds a short note that the skill is already loaded rather than a second copy of the content."* Es decir: si una skill sin `$ARGUMENTS` en el cuerpo (como `ms-internal-workflow` o `ms-internal-tech-analysis`) se invoca dos veces en la misma sesión, la segunda vez **no** se reinyecta el cuerpo entero.

## 2. Plan de pruebas — procedimiento y script

### 2.1 Qué mide

`scripts/measure_skills.py` (en esta misma carpeta) recorre `.claude/skills/*/SKILL.md`, separa frontmatter/cuerpo y calcula, por skill:

- `description_tokens_est` — impuesto fijo pagado en cada tarea.
- `body_tokens_est` — coste adicional solo si la skill se invoca.
- `aux_files_tokens_est` — tamaño de scripts/templates/schemas de la carpeta de la skill (clasificados `script` vs `data/template` para poder filtrar luego cuáles son coste de contexto real y cuáles no, ver §1).

### 2.2 Naturaleza del dato — ESTIMACIÓN, no medición real

No hay acceso de red en este entorno al tokenizer real (el proxy de salida bloquea la descarga del encoding BPE de OpenAI/Anthropic — `tiktoken` no puede inicializarse). Todos los `tokens_est` de este punto usan el proxy estándar **`caracteres / 4`**, documentado como tal en el propio script. Es válido para comparar tamaños relativos entre skills y entre versiones de la misma skill (antes/después de un cambio), pero **no son tokens reales de la API de Anthropic** — no usar los valores absolutos como coste real facturado.

### 2.3 Procedimiento para comparar antes/después de un cambio

1. Ejecutar el script contra el estado "antes" (working tree limpio, o una copia con el fichero en su versión de un commit concreto vía `git show <ref>:<path>` volcado a una copia temporal de `.claude/skills`):
   ```
   python .claude/improvement/02/scripts/measure_skills.py --skills-dir <copia_antes> --json before.json
   ```
2. Aplicar el cambio propuesto.
3. Ejecutar el script contra el estado "después":
   ```
   python .claude/improvement/02/scripts/measure_skills.py --skills-dir .claude/skills --json after.json
   ```
4. Diferenciar `before.json`/`after.json` (totales y por skill) y volcar la comparación en `results.md`.

Este procedimiento es reutilizable para cualquier cambio futuro sobre `SKILL.md` de este framework, no solo para el de este punto.

### 2.4 Limitación reconocida

El script mide tamaño de fichero, no comportamiento de enrutamiento real (qué skill acaba invocando el modelo ante una petición ambigua). Esa parte pertenece al punto 3 del informe ("Solapamiento y ambigüedad de triggers") y no se ha abordado aquí.

## 3. Resultados

Ver `results.md` para la tabla completa. Resumen:

- Impuesto fijo por tarea (suma `description` de las 11 skills): **1.478 → 1.363 tokens_est (‑115, ‑7,8 %)**.
- Cambio aplicado: recorte de la `description` de `ms-status` (la más larga de las 11, 1.085 caracteres) que duplicaba palabra por palabra la mecánica de los modos `todo`/`<estado>` ya explicada en el cuerpo (`## 1.b`, `## 1.c`). El cuerpo y el comportamiento no se han tocado.

## 4. Propuestas evaluadas

| # | Propuesta original | Veredicto | Motivo |
|---|---|---|---|
| 1 | Excluir las 3 skills internas (`ms-internal-workflow`, `ms-internal-tech-analysis`, `ms-internal-graph`) del listado que se carga en cada tarea | **Descartada (no implementable hoy)** | La única forma de que una `description` no cargue siempre es `disable-model-invocation: true`, pero ese flag también le quita a **Claude** la capacidad de invocarla (tabla §1) — y estas 3 skills las invoca Claude desde otras skills, no el usuario. `user-invocable: false` (que ya tienen puesto, correctamente, para ocultarse del menú `/`) no reduce el impuesto de contexto. No existe hoy una palanca de frontmatter para "invocable por Claude pero sin `description` siempre en contexto". |
| 2 | Evitar que `ms-how` reinvoque `ms-internal-tech-analysis` si `ms-new` ya reunió ese contexto | **Descartada (ya resuelta por el harness)** | `ms-internal-tech-analysis` no usa `$ARGUMENTS` en el cuerpo → su contenido renderizado es idéntico en cada invocación. Documentación oficial: reinvocaciones con contenido idéntico en la misma sesión no reinyectan el cuerpo, solo una nota corta. Sin coste real dentro de una sesión continua. |
| 3 | Evitar que `ms-do` reinvoque `ms-internal-workflow` si `ms-new`/`ms-how` ya la invocó antes | **Descartada (ya resuelta por el harness)** | Mismo motivo que la propuesta 2. |
| 4 | Recortar la `description` más larga (`ms-status`) sin perder inequivocidad | **Implementada** | Ver §3. Commit `7a85dd6`. |
| 5 | Dar a `ms-new` apoyo de script para sus partes deterministas (como ya tienen `ms-status`/`ms-init`/`ms-internal-graph`) | **Pendiente de decisión** | `ms-new` es el `SKILL.md` más pesado (3.884 tokens_est de cuerpo, el único de los 11 sin ningún script de apoyo). Refactor más grande y con más riesgo de tocar comportamiento (los pasos 0/0.1/0.2 tienen ramas condicionales de negocio, no solo mecánica de fichero) — no se ha implementado sin decisión explícita. |

### Nota derivada (relevante para el punto 8, no accionada aquí)

Al reconstruir la cadena de invocación real vía `metadata.uses` de cada `SKILL.md`, el ciclo completo `ms-new → ms-how → ms-do` invoca dos veces tanto a `ms-internal-workflow` como a `ms-internal-tech-analysis`. Gracias al comportamiento descrito en §1 (dedup de contenido idéntico), esto **no es un problema real** mientras el ciclo completo ocurra en una sola sesión continua. Sí sería un problema si se adoptara la propuesta del punto 1 del informe original de dividir el ciclo en sub-conversaciones independientes — cada sub-conversación nueva forzaría recargar esas skills internas desde cero. Apunte para cuando se aborde el punto 1 y el punto 8.

## 5. Pendiente / próximos pasos

- Decidir si se implementa la propuesta 5 (script de apoyo para `ms-new`).
- Valorar si merece la pena reportar como feedback a Anthropic/Claude Code la ausencia de un flag "invocable por Claude, sin `description` en el listado de enrutamiento por defecto" — cubriría el caso de skills internas como las de este framework.
- Continuar con el punto 3 del informe ("Solapamiento y ambigüedad de triggers").
