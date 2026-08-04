---
name: ms-internal-tech-analysis
description: Procedimiento compartido, agnóstico al proyecto, para reunir contexto técnico antes de analizar un change/fix o valorar si un cambio es trivial. Primero lee la documentación técnica configurada en framework.docs.tech (arquitectura, biblia de estilo, grafo), y solo si hace falta más información explora el código real. Si detecta que el código y la documentación no coinciden, señala el código como fuente de la verdad y devuelve la incongruencia como parte del análisis, sin editar nada. Uso interno de las skills ms-new, ms-fix, ms-fast e ms-how.
user-invocable: false
model: claude-sonnet-5
effort: medium
metadata:
  version: 1.2.0
  uses: []
---

# ms-internal-tech-analysis

Procedimiento único y compartido para obtener contexto técnico fiable antes de tomar cualquier decisión sobre un change/fix (diseñar una solución, valorar causa raíz, o juzgar si un cambio es lo bastante trivial para `ms-fast`). Solo lo invocan otras skills del framework `ms-*` — no está pensado para invocación directa por el usuario.

**Esta skill no escribe ni edita nada.** Es puramente de análisis/lectura: reúne contexto y, si lo hay, reporta incongruencias entre documentación y código a quien la invoca. Qué hacer con esas incongruencias (actualizar el documento ya mismo, dejarlo anotado para más adelante, o usarlo como motivo para descartar una vía rápida) lo decide siempre la skill llamante, según sus propias reglas.

## Entrada esperada de quien invoca

Quien invoca debe pasar un resumen breve de **qué se está analizando** (el change/fix/duda concreta, no la conversación entera) — se usa para acotar la exploración de código del paso 2, en vez de explorar el repo entero sin rumbo.

## 0. Cargar el contexto del proyecto

Lee `.claude/ms-context.json` en la raíz del repo (si no lo has hecho ya en esta sesión). No valides aquí que el framework está inicializado — eso ya lo ha comprobado la skill llamante antes de invocar esta; si `framework` faltara por completo, limítate a tratar todo `docs.tech` como no configurado y sigue directamente al paso 2 con `sourcecodeDir` (o el repo en general) como única fuente.

## 1. Leer primero la documentación técnica existente

Antes de tocar código, mira `framework.docs.tech` en `.claude/ms-context.json`:

- **Si ya leíste estos mismos documentos antes en esta sesión** (p.ej. porque esta skill ya se invocó una vez en este ciclo) y no han cambiado desde entonces, no vuelvas a leerlos — reutiliza lo que ya tienes en contexto. Estos documentos suelen ser los más grandes de todo el proceso (arquitectura, biblia de estilo, grafo pueden ser bastante extensos): releerlos completos en cada invocación de esta skill dentro del mismo ciclo (típicamente 2 veces: una vez desde `ms-new`/`ms-fix`, otra desde `ms-how`) es el mayor coste evitable de todo el ciclo `análisis → aplicación`.
- Para cada uno de `architectureDocPath`, `styleBibleDocPath` y `projectGraphPath` que esté configurado **y** exista de verdad como fichero en el repo, y que no tengas ya leído de esta sesión, léelo completo (o, si es muy extenso y el tema a analizar es acotado, la parte relevante al tema indicado por quien invoca).
- Los que no estén configurados, o estén configurados pero el fichero no exista todavía, sáltalos sin más — no es un error, simplemente esa fuente no está disponible.
- Si `framework.docs.tech` no existe en absoluto, o ninguno de los tres campos está configurado, no hay nada que leer en este paso: pasa directamente al paso 2.

Devuelve al usuario la lista de documentos que tienes en `.claude/ms-context.json` y cuáles has encontrado y cuáles no.

Con esto construye un contexto preliminar (arquitectura/capas, convenciones de estilo, mapa de ficheros y símbolos) antes de leer una sola línea de código fuente.

## 2. Completar con código real solo si hace falta

Si el contexto del paso 1 ya resuelve lo que quien invoca necesita saber, no exploraciones código de más. Si falta información (no hay documentación configurada, la que hay no cubre el tema, o quien invoca necesita confirmar un detalle concreto de implementación), explora **solo la parte del código relevante al tema indicado** — usando `framework.sourcecodeDir` como punto de partida si está configurado, o el repo en general si no.

## 3. Detectar incongruencias: el código manda

Al leer código durante el paso 2, compara lo que encuentras con lo que decía la documentación leída en el paso 1 (si la había). Si algo no coincide (una capa que ya no funciona como describe `architectureDocPath`, una convención de `styleBibleDocPath` que el código ya no sigue, un símbolo o relación de `projectGraphPath` que ya no existe o cambió):

- El código real es siempre la fuente de la verdad, nunca lo que diga el documento.
- No corrijas tú el documento aquí. Añade la incongruencia al resultado que devuelves a quien invoca (ver más abajo) como un cambio de documentación pendiente, para que sea esa skill quien decida cómo y cuándo aplicarlo (p.ej. `ms-how` lo integra en las secciones (c)/(d) de su `plan.md`, que `ms-do` aplicará en su paso de actualización de documentación; `ms-new`/`ms-fix` pueden anotarlo en **Apuntes técnicos**; `ms-fast` puede tomarlo como motivo para no calificar como trivial).

## 4. Devolver el resultado a quien invoca

No redactes ningún fichero. Devuelve a la skill llamante, en el mismo turno:

- **Contexto reunido** — el resumen relevante para el tema indicado, ya sintetizado (no pegues los documentos enteros ni el código tal cual).
- **Incongruencias detectadas** — lista (vacía si no hay ninguna) con, por cada una: qué documento la contiene, qué decía, qué muestra el código realmente, y el cambio de documentación sugerido.

Quien invoca decide qué hacer con cada incongruencia; esta skill no vuelve a intervenir sobre eso.
