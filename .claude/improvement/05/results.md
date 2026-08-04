# Punto 5 — Resultados de las pruebas

Sin cambio de código implementado en este punto: la comprobación concluyó que los dos comportamientos que preocupaban al informe original ya están cubiertos por defecto a nivel de plataforma (ver `analysis.md` §4). Esta tabla registra la evidencia recogida, no un antes/después.

Columna **Origen del dato**: en este punto todo es **medición directa** (recuento exacto de herramientas usadas en esta sesión, o cita literal de instrucciones de sistema/`SKILL.md`) — no hay proxy de tamaño ni estimación de tokens implicados.

## Recuento de herramientas de edición usadas en esta sesión (puntos 1, 2 y 4)

| Fichero | `Read` | `Edit` (puntual) | `Write` (reescritura de existente) | Origen del dato |
|---|---:|---:|---:|---|
| `ms-status/SKILL.md` | 2 | 5 | 0 | Medición directa (recuento de la transcripción de esta sesión) |
| `ms-new/SKILL.md` | 1 | 3 | 0 | Medición directa |
| `ms-internal-tech-analysis/SKILL.md` | 1 | 1 | 0 | Medición directa |
| **Total ficheros existentes editados** | 4 | 9 | **0** | Medición directa |

## Verificación de las causas (por qué es así)

| Comprobación | Resultado | Origen del dato |
|---|---|---|
| ¿`ms-do/SKILL.md` instruye agrupar ediciones o evitar relecturas? | No — su paso 2 solo dice "con tu proceso normal de ingeniería", sin detalle sobre patrón de edición | Inspección directa del `SKILL.md`, no estimación |
| ¿Las instrucciones de sistema del propio Claude Code ya cubren esto? | Sí — cita literal: *"Prefer editing existing files to creating new ones"*, *"Prefer the Edit tool for modifying existing files — it only sends the diff"*, *"Do NOT re-read a file you just edited to verify"* | Instrucciones de sistema de este agente, no estimación |

## Propuestas del informe original — verificación

| Propuesta | Resultado | Origen del dato |
|---|---|---|
| Agrupar ediciones de un mismo fichero antes de re-verificar | Ya es el comportamiento por defecto — 0 casos de "editar → releer → editar" repetido dentro del mismo punto de la auditoría | Medición directa (tabla de arriba) |
| Preferir `str_replace` sobre reescritura completa | Ya es el comportamiento por defecto — 0 de 9 ediciones sobre ficheros existentes usó reescritura completa | Medición directa (tabla de arriba) |

## Recomendaciones de uso

- **No añadir instrucciones de patrón de edición a `ms-do` (ni a ninguna otra skill de aplicación).** Sería redundante con el comportamiento por defecto ya verificado, y añadiría tokens al cuerpo de la skill sin cambiar el comportamiento real — el tipo de coste que esta auditoría busca eliminar, no introducir.
- **Si en algún momento se detecta el patrón contrario en la práctica** (relecturas repetidas o reescrituras completas innecesarias durante un `ms-do` real), es más probable que se deba a un hueco largo entre turnos dentro de la misma tarea (como el único caso encontrado en `ms-status/SKILL.md`, §2 de `analysis.md`) que a falta de instrucción — en ese caso el ajuste iría en cómo se trocea la tarea, no en el texto de la skill.
- Queda pendiente, si se quiere más rigor, repetir esta comprobación sobre un `ms-do` real ejecutado sobre código de `src/` (ver `analysis.md` §6) — no hecho aquí por alcance.
