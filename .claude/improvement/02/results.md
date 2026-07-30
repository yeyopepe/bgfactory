# Punto 2 — Resultados de las pruebas

Dos cambios evaluados:
1. Recorte de la `description` de `ms-status` (commit `7a85dd6`), sin tocar cuerpo ni comportamiento.
2. Extracción de las dos ramas alternativas del cuerpo de `ms-new` (`todo-mode.md`, `extend-entry.md`), cargadas solo cuando aplican en vez de siempre.

Procedimiento: ver `analysis.md` §2. Snapshots crudos en `data/before.json` (estado del commit anterior a `7a85dd6`), `data/after.json` (tras el cambio 1) y `data/after2-ms-new-split.json` (tras el cambio 2), generados con `scripts/measure_skills.py`.

Columna **Origen del dato**: indica si el valor es una **estimación** (proxy `chars/4`, sin tokenizer real disponible en este entorno — ver limitación en `analysis.md` §2.2) o una **medición directa** (conteo exacto, sin proxy).

## Métricas — cambio 1: recorte de `description` de `ms-status`

| Métrica | Antes | Después | Δ | Origen del dato | Método |
|---|---:|---:|---:|---|---|
| `description` de `ms-status` — caracteres | 1.085 | 626 | ‑459 (‑42,3 %) | Medición directa | `len(description)` sobre el frontmatter parseado |
| `description` de `ms-status` — tokens | 271 | 156 | ‑115 (‑42,4 %) | **Estimación** (proxy chars/4) | `scripts/measure_skills.py` |
| Impuesto fijo por tarea — suma `description` de las 11 skills `ms-*` | 1.478 | 1.363 | ‑115 (‑7,8 %) | **Estimación** (proxy chars/4) | `scripts/measure_skills.py`, campo `totals.description_tokens_est` |
| Cuerpo de `ms-status` (coste solo si se invoca) | 1.668 | 1.668 | 0 | **Estimación** (proxy chars/4) | Sin cambios — control de que el recorte no tocó el cuerpo |

## Métricas — cambio 2: extracción de ramas alternativas de `ms-new`

| Métrica | Antes | Después | Δ | Origen del dato | Método |
|---|---:|---:|---:|---|---|
| Cuerpo de `ms-new` (coste de invocarla en el caso común: cambio nuevo desde cero) | 3.884 tokens_est | 2.676 tokens_est | ‑1.208 (‑31,1 %) | **Estimación** (proxy chars/4) | `scripts/measure_skills.py` |
| `todo-mode.md` + `extend-entry.md` (coste solo si esa rama aplica a la invocación) | 0 (antes incluido siempre en el cuerpo) | 1.411 tokens_est | — | **Estimación** (proxy chars/4) | `scripts/measure_skills.py`, campo `aux_files_tokens_est` |

## Gran total teórico (contexto, no usar como métrica principal de ningún cambio)

| Momento | Gran total teórico (11 `SKILL.md` + todos sus auxiliares si se leyeran todos) | Origen del dato |
|---|---:|---|
| Antes de ambos cambios | 48.743 | **Estimación** (proxy chars/4) |
| Tras cambio 1 (`ms-status`) | 48.629 | **Estimación** (proxy chars/4) |
| Tras cambio 2 (`ms-new`) | 48.832 | **Estimación** (proxy chars/4) |

Esta cifra sube ligeramente tras el cambio 2 porque asume que **todo** se lee siempre, incluidos los dos ficheros nuevos de `ms-new` — no refleja el ahorro real, que está en el coste de invocar `ms-new` en el caso mayoritario (tabla anterior, ‑31,1 %). No usar esta fila para valorar si un cambio de este tipo (mover contenido condicional a fichero aparte) mejora o empeora las cosas.

## Propuestas descartadas — verificación de que no requieren cambio

| Propuesta | Comprobación realizada | Resultado | Origen del dato |
|---|---|---|---|
| #1 — excluir skills internas del listado de enrutamiento | Tabla de comportamiento de `disable-model-invocation`/`user-invocable` contrastada contra la documentación oficial de Claude Code | No implementable con el frontmatter actual (ver `analysis.md` §4, fila 1) | Documentación oficial (`code.claude.com/docs/en/skills`), no estimación |
| #2 y #3 — evitar reinvocación de `ms-internal-workflow`/`ms-internal-tech-analysis` en un mismo ciclo | Comprobado que ninguna de las dos usa `$ARGUMENTS` en el cuerpo (contenido renderizado idéntico en cada invocación) + comportamiento de dedup documentado por Anthropic | Ya resuelto automáticamente por el harness dentro de una sesión continua; no requiere cambio | Documentación oficial + inspección directa del cuerpo de ambos `SKILL.md` (no estimación) |

## Dato de contexto — coste de un ciclo completo (no accionado en este punto)

Cálculo estático a partir de `metadata.uses` de cada `SKILL.md` (cadena `ms-new → ms-how → ms-do`, caso "implementar ya"). Relevante para el punto 8 del informe, incluido aquí porque surgió al medir "cuántas skills se usan realmente" (§0 del objetivo de este punto).

| Escenario | Tokens de cuerpo del ciclo completo | Origen del dato |
|---|---:|---|
| Sin deduplicación (p.ej. cada fase en una sesión distinta) | ~16.306 | **Estimación** (suma manual de `body_tokens_est` por skill según la cadena `metadata.uses`, proxy chars/4) |
| Con deduplicación del harness (ciclo completo en una sola sesión, comportamiento por defecto hoy) | ~13.097 | **Estimación** (mismo cálculo, descontando la 2ª invocación de `ms-internal-workflow` y `ms-internal-tech-analysis` según el comportamiento documentado) |

Ninguna de las dos cifras de esta última tabla ha sido medida en una ejecución real del ciclo (no se ha invocado `ms-new`/`ms-how`/`ms-do` en vivo para este punto) — quedan como estimación derivada del grafo estático, pendientes de contraste si se aborda el punto 8.

## Recomendaciones de uso

Guía práctica para quien use el framework `ms-*` en este repo, derivada de lo encontrado al medir este punto (no son cambios de código, son hábitos de uso):

- **Mantén el ciclo `ms-new → ms-how → ms-do` en una sola sesión continua siempre que puedas.** El ahorro por deduplicación de skills internas (`ms-internal-workflow`, `ms-internal-tech-analysis` — ver `analysis.md` §1 y la fila "Con deduplicación" de la tabla de arriba) solo aplica dentro de la misma sesión. Cortar la conversación entre fases (p.ej. documentar el change hoy y planificarlo/implementarlo en otra sesión mañana) es legítimo y a veces necesario, pero fuerza recargar esas skills internas desde cero en la sesión nueva — un coste que de otro modo no existiría.
- **En sesiones muy largas con muchas skills invocadas, si `ms-new`/`ms-how`/`ms-do` dejan de comportarse como se espera, reinvócalas explícitamente antes de seguir.** Claude Code solo conserva un presupuesto combinado de 25.000 tokens para las skills ya cargadas tras una auto-compactación del contexto; en un ciclo largo con varias skills de por medio, las invocadas más pronto pueden quedar fuera de ese presupuesto y perder su contenido completo.
- **No copies ni compartas `ms-new/SKILL.md` suelto, sin `todo-mode.md` y `extend-entry.md`.** Desde el cambio de §6, esos dos ficheros son parte necesaria de la skill (los flujos de conversión desde `todo/` y de ampliación de una entrada existente dependen de ellos) — moverla a otro repo o plantilla sin la carpeta completa deja esas dos rutas rotas.
- No hay recomendación de uso para la propuesta 5 (script de apoyo para `ms-new`): sigue pendiente de decisión y no se ha implementado nada que afecte a cómo se usa la skill hoy.
