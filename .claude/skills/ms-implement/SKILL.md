---
name: ms-implement
description: Planifica e implementa un change/fix ya documentado en {changesDir}/inProgress — genera un plan.md con la solución técnica (o lo re-analiza si ya existe), y si el usuario lo confirma, lo implementa y mueve la entrada a {changesDir}/implemented. Parte del framework ms-*. Trigger: /ms-implement <xxxx>, o cuando el usuario pide planificar/implementar un cambio o fix ya documentado por ms-change/ms-fix.
argument-hint: <xxxx o descripción del cambio/fix a implementar>
model: claude-sonnet-5
effort: medium
metadata:
  version: 1.4.1
  uses: [ms-internal-tech-analysis, ms-internal-workflow, ms-internal-graph]
---

# ms-implement

Toma una entrada ya documentada por `ms-change`/`ms-fix` en `{changesDir}/inProgress/{xxxx}/` y la lleva hasta implementada: analiza la solución técnica, la deja escrita en `plan.md`, y si el usuario lo confirma, la implementa y mueve la carpeta a `{changesDir}/implemented/{xxxx}/`.

**Fuente de la verdad.** La documentación técnica (`docs.tech.*`) y el código real son la única fuente de verdad sobre cómo funciona hoy el proyecto — no lo que `description.md` asuma implícitamente sobre la implementación, ni memoria de conversaciones anteriores. Reúne ese contexto siempre invocando la skill `ms-internal-tech-analysis` (nunca leyendo tú mismo `framework.docs.tech` a pelo o explorando código a ciegas) al analizar la causa raíz y diseñar la solución (paso 3), incluso si ya tienes una idea de cómo funciona algo por contexto previo. Tampoco cuenta como fuente de verdad el `description.md` o `plan.md` de **otros** cambios/fixes bajo `{changesDir}/**` (en `inProgress`, `implemented` o `closed`): son intención o análisis de otra entrada, no el estado real del proyecto — el único documento de otra entrada que sí es relevante aquí es el que consulta explícitamente el paso 0.1 (los `xxxx` máximos, para la verificación de orden).

## Formato de la documentación: diagramas antes que prosa

Al escribir o actualizar cualquier documento de esta skill (`plan.md`, `docs.tech.architectureDocPath`, `docs.functional.featuresDocPath`, `docs.tech.styleBibleDocPath`), si lo que hay que describir es un flujo, un proceso con pasos/decisiones, una secuencia de interacciones o una relación entre estados o componentes, prioriza representarlo con un diagrama Mermaid (`flowchart`, `sequenceDiagram`, `stateDiagram-v2`, etc.) acompañado de las notas imprescindibles, en lugar de un párrafo largo explicando lo mismo en prosa. Reserva la prosa para lo que el diagrama no pueda expresar (matices, motivos, excepciones puntuales) o para contenido sin estructura de flujo/relación clara que representar.

## 0. Cargar el contexto del proyecto

Lee `.claude/ms-context.json` en la raíz del repo. Si no existe, o le falta `framework.changesDir`, no continúes: dile al usuario que primero debe ejecutar la skill `ms-init` para inicializar/completar el framework en este proyecto, y detente ahí. El esquema completo está en [`../ms-init/schema.json`](../ms-init/schema.json) (léelo primero si no lo has hecho ya en esta sesión).

```
Este proyecto todavía no tiene el framework `ms-*` inicializado (o le falta configuración). Ejecuta primero `/ms-init` antes de volver a invocarme.
```

`docs.tech.architectureDocPath`, `docs.functional.featuresDocPath`, `docs.tech.styleBibleDocPath`, `docs.tech.projectGraphPath` y `sourcecodeDir` son opcionales y se usan como contexto en el paso 3; si no están configurados, sigue adelante sin ellos (usa el repo en general como contexto de respaldo).

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

```
Estos son los cambios/fixes pendientes en `{changesDir}/inProgress/`:
- {xxxx} — {nombre/resumen}
- ...

¿Cuál quieres que implemente?
```

```
No hay ningún cambio/fix pendiente en `{changesDir}/inProgress/`.
```

- Si no encuentras ninguna carpeta que corresponda dentro de `{changesDir}/inProgress/`, **no hagas nada más**: si existe con ese `xxxx` en `{changesDir}/implemented/`, dile al usuario que ese cambio/fix ya está implementado; si no existe en ningún sitio, dile que no lo encuentras y pregunta el `xxxx` o la carpeta correctos. No busques ni operes sobre carpetas fuera de `{changesDir}/inProgress/`.
- Si la encuentras, esa es `{xxxx}` y su carpeta `{changesDir}/inProgress/{xxxx}/` para el resto del proceso.

## 2. Comprobar si ya existe `plan.md`

- **Si `{changesDir}/inProgress/{xxxx}/plan.md` ya existe**: usa `AskUserQuestion` para preguntar al usuario si quiere volver a analizar la solución (regenerar `plan.md` desde cero, sobrescribiéndolo — ve al paso 3) o implementar directamente lo que ya dice el `plan.md` actual (ve al paso 4 sin regenerarlo).
- **Si no existe**: ve al paso 3.

## 3. Analizar y escribir `plan.md`

1. Lee el documento funcional de la entrada (`{changesDir}/inProgress/{xxxx}/description.md`, generado por `ms-internal-workflow`) para entender qué se pide. El campo **Tipo** de ese documento indica si es un `fix` o un `change`.
   - **Si es un `fix`**: el análisis y la solución deben limitarse estrictamente a corregir el bug documentado — identifica la causa raíz mínima y el cambio más pequeño que la corrige. No amplíes alcance, no refactorices ni toques código no relacionado con la causa raíz, aunque lo veas mejorable de paso. Si al analizar detectas que hace falta o convendría algo más amplio, anótalo como fuera de alcance en la sección (a) del plan en vez de incluirlo en la solución.
   - **Si es un `change`**: no aplica esta restricción; la solución puede tener el alcance que el cambio requiera.
2. Si hay ficheros `{changesDir}/inProgress/{xxxx}/design_*.html` (propuesta visual generada por `ms-new`), ábrelos, pero trátalos **solo como referencia visual** — de ellos toma únicamente el aspecto que ilustran (maquetación, estilos, iconografía) para los elementos que cubren. La solución técnica **no debe basarse en ellos** en ningún otro sentido: no reutilices ni traduzcas literalmente su HTML/CSS/SVG, sus clases o su estructura de marcado, ni los tomes como referencia de arquitectura, componentes a crear/reutilizar o cualquier otra decisión de implementación — todo eso lo decides tú a partir del código real del proyecto (paso 4 de este apartado), igual que si esos ficheros no existieran.
3. Si hay dudas técnicas sobre cómo abordarlo, resuélvelas con el usuario antes de escribir el plan.
4. Reúne contexto adicional invocando la skill `ms-internal-tech-analysis` (herramienta Skill), pasándole un resumen de la causa raíz o del cambio a diseñar: ella lee primero la documentación técnica configurada en `framework.docs.tech` y solo explora código (`sourcecodeDir`) si hace falta completar información, devolviéndote el contexto reunido y cualquier incongruencia detectada entre documentación y código (recuerda: en ese caso el código manda). Si reporta alguna incongruencia, tenla en cuenta al diseñar la solución y al escribir las secciones (c)/(d) del plan (paso 5) para que quede reflejada en la actualización de documentación del paso 4.1.
5. Escribe `{changesDir}/inProgress/{xxxx}/plan.md` con exactamente estas tres secciones:
   - **(a) Anotaciones funcionales** — qué queda explícitamente fuera de alcance, y las dudas que se han resuelto con el usuario (pregunta y respuesta, en breve).
   - **(b) Solución técnica** — listado de tareas concretas y explicadas (qué hay que tocar, dónde, y por qué), en el orden en que se deberían implementar.
   - **(c) Cambios de arquitectura** — *solo si aplica*: si `docs.tech.architectureDocPath` está configurado y esta solución modifica la arquitectura básica del proyecto, describe aquí exactamente qué hay que actualizar en ese documento. Si no aplica (no hay `docs.tech.architectureDocPath`, o la solución no toca arquitectura), omite esta sección por completo — no la dejes vacía ni con "N/A".
   - **(d) Cambios en estilo** — *solo si aplica*: si `docs.tech.styleBibleDocPath` está configurado y esta solución modifica o amplia el estilo visual del proyecto, describre aquí exactamente qué hay que actaulizar en ese documento. Si no aplica, omite esta sección — no la dejes vacía ni con "N/A".

### 3.1 Preguntar si se quiere implementar

Con el `plan.md` ya escrito, pregunta al usuario si quiere implementarlo ahora.

```
El plan queda escrito en `{changesDir}/inProgress/{xxxx}/plan.md`. ¿Quieres que lo implemente ahora?
```

- Si dice que sí, ve al paso 4.
- Si dice que no, termina aquí: el cambio/fix queda documentado y planificado en `{changesDir}/inProgress/{xxxx}/`, pendiente de implementar más adelante (se puede retomar invocando esta misma skill otra vez sobre el mismo `xxxx`).

## 4. Implementar

Implementa todo lo que dice `plan.md`:

- Ejecuta cada tarea de la sección **(b) Solución técnica** con tu proceso normal de ingeniería (editar código, verificar que compila / pasan los tests si los hay).
- Si `plan.md` tiene sección **(c) Cambios de arquitectura**, aplica esos cambios a `docs.tech.architectureDocPath` como parte de esta implementación.

Si durante la implementación descubres que el plan no es viable tal cual está escrito, para y coméntaselo al usuario en vez de improvisar una solución distinta sin decírselo.

## 4.1 Actualizar documentación tras implementar

Una vez implementado en código lo anterior (y solo entonces — no si el usuario decidió no implementar en 3.1), actualiza siempre lo siguiente antes de mover la carpeta:

- **`docs.tech.architectureDocPath`** — si está configurado, revísalo y déjalo reflejando fielmente el estado técnico resultante. Aplica lo que diga la sección (c) del plan si la tenía; si no la tenía pero al implementar resulta que sí se ha tocado algo que ese documento describe, actualízalo igualmente — no depende únicamente de que el plan lo anticipara. Si no está configurado, omite este punto sin preguntar nada.
- **`docs.functional.featuresDocPath`** — si está configurado, es un documento **funcional**, no un changelog: describe qué puede hacer la app hoy, organizado por área/módulo funcional, no una lista cronológica de changes/fixes. Actualízalo así:
  - Si lo implementado en esta entrada amplía o modifica una funcionalidad que ya tiene su propia entrada en el documento, **edita esa entrada in place** para que siga describiendo fielmente el comportamiento actual (no añadas una entrada nueva para lo mismo), y añade el `xxxx` de esta entrada a su campo **Origen**.
  - Si es una funcionalidad nueva, añade una entrada en el área funcional que le corresponda (crea el área si no existe todavía) con el `xxxx` de esta entrada en **Origen**.
  - Si el fichero todavía no existe, créalo a partir de la plantilla [`FEATURES.template.md`](FEATURES.template.md) de esta skill.
  - Si `docs.functional.featuresDocPath` no está configurado, omite este punto sin preguntar nada.
- **`docs.tech.styleBibleDocPath`** — si está configurado, revísalo y actualízalo si lo implementado introduce o modifica convenciones de estilo (visual, de interacción, de redacción, etc.) relevantes para el proyecto. Si no está configurado, o lo implementado no afecta a ninguna convención de estilo, omite este punto sin preguntar nada.

## 5. Mover la carpeta a `implemented`

Invoca la skill `ms-internal-workflow` (herramienta Skill) con `action=move`, `xxxx`, `from=inProgress` y `to=implemented` — no muevas la carpeta tú mismo. Esto **solo** cuando el change/fix se haya implementado realmente en el código en el paso 4. Si el usuario decidió no implementar en 3.1, o el proceso se detuvo antes de llegar a tocar código, no invoques `ms-internal-workflow` para esto.

No generes nunca una nueva versión del entregable como parte de esta skill, ni preguntes al usuario si quiere hacerlo — ni siquiera si `framework.versioning` es `true`. Generar versión es un paso explícito y separado (skill `ms-version`) que el usuario invoca por su cuenta cuando lo decide.

## 6. Actualizar el grafo de contexto

Paso final: si en el paso 4 se han aplicado cambios relevantes en el código (no solo en documentación), además de haber actualizado ya la documentación en el paso 4.1 (`docs.tech.architectureDocPath` y `docs.functional.featuresDocPath`, según aplicara), invoca la skill `ms-internal-graph` para regenerar/actualizar el grafo de contexto del proyecto y mantenerlo sincronizado con el código recién implementado. Si no ha habido cambios relevantes en código, omite este paso.

## 7. Confirmar al usuario

Indica qué se ha implementado, qué documentación se ha actualizado (`docs.tech.architectureDocPath`/`docs.functional.featuresDocPath`/`docs.tech.styleBibleDocPath`, según aplicara), que la carpeta se movió a `{changesDir}/implemented/{xxxx}/`, y si se ha actualizado el grafo de contexto.
