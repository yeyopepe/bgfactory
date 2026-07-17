---
name: ms-implement
description: Planifica e implementa un change/fix ya documentado en {changesDir}/inProgress — genera un plan.md con la solución técnica (o lo re-analiza si ya existe), y si el usuario lo confirma, lo implementa y mueve la entrada a {changesDir}/implemented. Parte del framework ms-*. Trigger: /ms-implement <xxxx>, o cuando el usuario pide planificar/implementar un cambio o fix ya documentado por ms-change/ms-fix.
argument-hint: <xxxx o descripción del cambio/fix a implementar>
metadata:
  version: 1.0.0
---

# ms-implement

Toma una entrada ya documentada por `ms-change`/`ms-fix` en `{changesDir}/inProgress/{xxxx}/` y la lleva hasta implementada: analiza la solución técnica, la deja escrita en `plan.md`, y si el usuario lo confirma, la implementa y mueve la carpeta a `{changesDir}/implemented/{xxxx}/`.

## 0. Cargar el contexto del proyecto

Lee `.claude/ms-context.json` en la raíz del repo. Si no existe, o le falta `framework.changesDir`, no continúes: dile al usuario que primero debe ejecutar la skill `ms-init` para inicializar/completar el framework en este proyecto, y detente ahí. El esquema completo está en [`../ms-init/schema.json`](../ms-init/schema.json) (léelo primero si no lo has hecho ya en esta sesión).

`designDocPath`, `projectGraphPath` y `sourcecodeDir` son opcionales y se usan como contexto en el paso 3; si no están configurados, sigue adelante sin ellos (usa el repo en general como contexto de respaldo).

## 0.1 Verificación previa de orden

Antes de identificar el cambio/fix, comprueba **siempre** que no se haya colado por delante de otro más reciente:

1. Ejecuta [`scripts/get-max-change-codes.py`](scripts/get-max-change-codes.py) desde la raíz del repo:

   ```
   python .claude/skills/ms-implement/scripts/get-max-change-codes.py
   ```

   Devuelve un JSON con el `xxxx` más alto existente en cada uno de `inProgress`, `implemented` y `closed` (o `null` si ese estado no tiene ninguna carpeta numerada todavía).

2. Compara esos tres códigos con el `xxxx` que se va a implementar en esta invocación. Si el `xxxx` actual es **menor** que cualquiera de los otros tres (ignorando los `null`), significa que este cambio/fix se creó antes que otro que ya avanzó más en el flujo (implementado o cerrado) — avisa de ello al usuario.
   - Reanaliza inmediatamente la entrada según el resto de esta skill (pasos 1 en adelante), sin dar por válido sin más lo que ya hubiera en `plan.md` si existía.
3. Si el `xxxx` actual no es menor que ninguno de los tres, continúa con la implementación normalmente desde el paso 1.

## 1. Identificar el cambio/fix

Si el usuario, al invocar esta skill, indica un `xxxx`, un nombre de carpeta o una descripción del cambio/fix, resuélvelo buscando **únicamente** dentro de `{changesDir}/inProgress/`.

**Si no indica nada** (p.ej. invoca `/ms-implement` sin argumentos): no asumas que se refiere al último cambio/fix mencionado en la conversación ni a ningún otro dato del contexto de chat — la única fuente de verdad es `{changesDir}/inProgress/`. Lista las carpetas que haya ahí (su `xxxx` y, si lo tiene, el nombre/resumen de su `description.md`) y pregunta explícitamente al usuario cuál quiere implementar. Si no hay ninguna, dile que no hay ningún cambio/fix pendiente y detente ahí.

- Si no encuentras ninguna carpeta que corresponda dentro de `{changesDir}/inProgress/`, **no hagas nada más**: si existe con ese `xxxx` en `{changesDir}/implemented/`, dile al usuario que ese cambio/fix ya está implementado; si no existe en ningún sitio, dile que no lo encuentras y pregunta el `xxxx` o la carpeta correctos. No busques ni operes sobre carpetas fuera de `{changesDir}/inProgress/`.
- Si la encuentras, esa es `{xxxx}` y su carpeta `{changesDir}/inProgress/{xxxx}/` para el resto del proceso.

## 2. Comprobar si ya existe `plan.md`

- **Si `{changesDir}/inProgress/{xxxx}/plan.md` ya existe**: usa `AskUserQuestion` para preguntar al usuario si quiere volver a analizar la solución (regenerar `plan.md` desde cero, sobrescribiéndolo — ve al paso 3) o implementar directamente lo que ya dice el `plan.md` actual (ve al paso 4 sin regenerarlo).
- **Si no existe**: ve al paso 3.

## 3. Analizar y escribir `plan.md`

1. Lee el documento funcional de la entrada (`{changesDir}/inProgress/{xxxx}/description.md`, generado por `ms-workflow`) para entender qué se pide. El campo **Tipo** de ese documento indica si es un `fix` o un `change`.
   - **Si es un `fix`**: el análisis y la solución deben limitarse estrictamente a corregir el bug documentado — identifica la causa raíz mínima y el cambio más pequeño que la corrige. No amplíes alcance, no refactorices ni toques código no relacionado con la causa raíz, aunque lo veas mejorable de paso. Si al analizar detectas que hace falta o convendría algo más amplio, anótalo como fuera de alcance en la sección (a) del plan en vez de incluirlo en la solución.
   - **Si es un `change`**: no aplica esta restricción; la solución puede tener el alcance que el cambio requiera.
2. Si hay dudas técnicas sobre cómo abordarlo, resuélvelas con el usuario antes de escribir el plan.
3. Reúne contexto adicional:
   - Si `designDocPath` y/o `projectGraphPath` existen como ficheros reales en el repo, léelos y úsalos como contexto de arquitectura/dominio.
   - Si **ninguno de los dos** existe, usa como contexto el código fuente existente bajo `sourcecodeDir` (o el repo en general si tampoco está configurado) — explóralo lo necesario para entender los patrones y capas ya existentes antes de proponer la solución.
4. Escribe `{changesDir}/inProgress/{xxxx}/plan.md` con exactamente estas tres secciones:
   - **(a) Anotaciones funcionales** — qué queda explícitamente fuera de alcance, y las dudas que se han resuelto con el usuario (pregunta y respuesta, en breve).
   - **(b) Solución técnica** — listado de tareas concretas y explicadas (qué hay que tocar, dónde, y por qué), en el orden en que se deberían implementar.
   - **(c) Cambios de arquitectura** — *solo si aplica*: si `designDocPath` está configurado y esta solución modifica la arquitectura básica del proyecto, describe aquí exactamente qué hay que actualizar en ese documento. Si no aplica (no hay `designDocPath`, o la solución no toca arquitectura), omite esta sección por completo — no la dejes vacía ni con "N/A".

### 3.1 Preguntar si se quiere implementar

Con el `plan.md` ya escrito, pregunta al usuario si quiere implementarlo ahora.

- Si dice que sí, ve al paso 4.
- Si dice que no, termina aquí: el cambio/fix queda documentado y planificado en `{changesDir}/inProgress/{xxxx}/`, pendiente de implementar más adelante (se puede retomar invocando esta misma skill otra vez sobre el mismo `xxxx`).

## 4. Implementar

Implementa todo lo que dice `plan.md`:

- Ejecuta cada tarea de la sección **(b) Solución técnica** con tu proceso normal de ingeniería (editar código, verificar que compila / pasan los tests si los hay).
- Si `plan.md` tiene sección **(c) Cambios de arquitectura**, aplica esos cambios a `designDocPath` como parte de esta implementación.

Si durante la implementación descubres que el plan no es viable tal cual está escrito, para y coméntaselo al usuario en vez de improvisar una solución distinta sin decírselo.

## 5. Mover la carpeta a `implemented`

Mueve `{changesDir}/inProgress/{xxxx}/` (con el documento funcional y `plan.md` incluidos) a `{changesDir}/implemented/{xxxx}/`, creando `{changesDir}/implemented/` si no existe — pero **solo** cuando el change/fix se haya implementado realmente en el código en el paso 4. Si el usuario decidió no implementar en 3.1, o el proceso se detuvo antes de llegar a tocar código, no muevas la carpeta.

Después, si `framework.versioning` es `true` en `ms-context.json`, pregunta al usuario si este `xxxx` requiere generar una nueva versión del entregable; si confirma, invoca la skill `ms-version` pasándole este `xxxx`. Si `versioning` es `false`, no ofrezcas esta opción.

## 6. Actualizar el grafo de contexto

Paso final: si en el paso 4 se han aplicado cambios relevantes en el código (no solo en documentación), además de haber actualizado ya el documento técnico (`designDocPath`, si aplicaba la sección (c) del plan), invoca la skill `ms-graph` para regenerar/actualizar el grafo de contexto del proyecto y mantenerlo sincronizado con el código recién implementado. Si no ha habido cambios relevantes en código, omite este paso.

## 7. Confirmar al usuario

Indica qué se ha implementado, que la carpeta se movió a `{changesDir}/implemented/{xxxx}/`, el resultado del paso de versión si se ejecutó, y si se ha actualizado el grafo de contexto.
