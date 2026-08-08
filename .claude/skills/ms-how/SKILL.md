---
name: ms-how
description: Analiza y planifica la solución técnica de un change/fix ya documentado en {changesDir}/inProgress — genera un plan.md con la solución técnica (o lo re-analiza si ya existe), y si el usuario confirma, encadena la skill ms-do para implementarlo. Parte del framework ms-*. Trigger: /ms-how <xxxx>, o cuando el usuario pide planificar/analizar la solución técnica de un cambio o fix ya documentado por ms-new/ms-fix.
argument-hint: <xxxx o descripción del cambio/fix a planificar>
model: claude-sonnet-5
effort: medium
metadata:
  version: 1.2.3
  uses: [ms-internal-tech-analysis, ms-do]
---

# ms-how

Toma una entrada ya documentada por `ms-new`/`ms-fix` en `{changesDir}/inProgress/{xxxx}/` y analiza su solución técnica, dejándola escrita en `plan.md`. Si el usuario confirma que quiere implementarla ya, encadena directamente la skill `ms-do`, que es quien edita el código y mueve la carpeta a `{changesDir}/implemented/{xxxx}/`.

**Fuente de la verdad.** La documentación técnica (`docs.tech.*`) y el código real son la única fuente de verdad sobre cómo funciona hoy el proyecto — no lo que `description.md` asuma implícitamente sobre la implementación, ni memoria de conversaciones anteriores. Reúne ese contexto siempre invocando la skill `ms-internal-tech-analysis` (nunca leyendo tú mismo `framework.docs.tech` a pelo o explorando código a ciegas) al analizar la causa raíz y diseñar la solución (paso 3), incluso si ya tienes una idea de cómo funciona algo por contexto previo. Tampoco cuenta como fuente de verdad el `description.md` o `plan.md` de **otros** cambios/fixes bajo `{changesDir}/**` (en `inProgress`, `implemented` o `closed`): son intención o análisis de otra entrada, no el estado real del proyecto — el único documento de otra entrada que sí es relevante aquí es el que consulta explícitamente el paso 0.1 (los `xxxx` máximos, para la verificación de orden).

## Formato de la documentación: diagramas antes que prosa

Al escribir o actualizar `plan.md`, si lo que hay que describir es un flujo, un proceso con pasos/decisiones, una secuencia de interacciones o una relación entre estados o componentes, prioriza representarlo con un diagrama Mermaid (`flowchart`, `sequenceDiagram`, `stateDiagram-v2`, etc.) acompañado de las notas imprescindibles, en lugar de un párrafo largo explicando lo mismo en prosa. Reserva la prosa para lo que el diagrama no pueda expresar (matices, motivos, excepciones puntuales) o para contenido sin estructura de flujo/relación clara que representar.

## 0. Cargar el contexto del proyecto

Lee `.claude/ms-context.json` (puntero fijo) en la raíz del repo para obtener `workFolder`, y a partir de ahí `{workFolder}/framework/context.json`. Si el puntero no existe, o ese fichero no existe o le falta la sección `framework`, no continúes: dile al usuario que primero debe ejecutar la skill `ms-init` para inicializar/completar el framework en este proyecto, y detente ahí. El esquema completo está en [`../ms-init/context.schema.json`](../ms-init/context.schema.json) (léelo primero si no lo has hecho ya en esta sesión).

```
Este proyecto todavía no tiene el framework `ms-*` inicializado (o le falta configuración). Ejecuta primero `/ms-init` antes de volver a invocarme.
```

`docs.tech.architectureDocDir`, `docs.functional.featuresDocPathDir`, `docs.tech.styleBibleDocDir` y `sourcecodeDir` son opcionales y se usan como contexto en el paso 3; si no están configurados, sigue adelante sin ellos (usa el repo en general como contexto de respaldo).

## 0.1 Verificación previa de orden

Antes de identificar el cambio/fix, comprueba **siempre** que no se haya colado por delante de otro más reciente:

1. Ejecuta [`scripts/get-max-change-codes.py`](scripts/get-max-change-codes.py) desde la raíz del repo:

   ```
   python .claude/skills/ms-how/scripts/get-max-change-codes.py
   ```

   Devuelve un JSON con el `xxxx` más alto existente en cada uno de `inProgress`, `implemented` y `closed` (o `null` si ese estado no tiene ninguna carpeta numerada todavía).

2. Compara esos tres códigos con el `xxxx` que se va a planificar en esta invocación. Si el `xxxx` actual es **menor** que cualquiera de los otros tres (ignorando los `null`), significa que este cambio/fix se creó antes que otro que ya avanzó más en el flujo (implementado o cerrado) — avisa de ello al usuario.
   - Reanaliza inmediatamente la entrada según el resto de esta skill (pasos 1 en adelante), sin dar por válido sin más lo que ya hubiera en `plan.md` si existía.
3. Si el `xxxx` actual no es menor que ninguno de los tres, continúa con la planificación normalmente desde el paso 1.

## 1. Identificar el cambio/fix

Si el usuario, al invocar esta skill, indica un `xxxx`, un nombre de carpeta o una descripción del cambio/fix, resuélvelo buscando **únicamente** dentro de `{changesDir}/inProgress/`.

**Si no indica nada** (p.ej. invoca `/ms-how` sin argumentos): no asumas que se refiere al último cambio/fix mencionado en la conversación ni a ningún otro dato del contexto de chat — la única fuente de verdad es `{changesDir}/inProgress/`. Lista las carpetas que haya ahí (su `xxxx` y, si lo tiene, el nombre/resumen de su `description.md`) y pregunta explícitamente al usuario cuál quiere planificar. Si no hay ninguna, dile que no hay ningún cambio/fix pendiente y detente ahí.

```
Estos son los cambios/fixes pendientes en `{changesDir}/inProgress/`:
- {xxxx} — {nombre/resumen}
- ...

¿Cuál quieres que planifique?
```

```
No hay ningún cambio/fix pendiente en `{changesDir}/inProgress/`.
```

- Si no encuentras ninguna carpeta que corresponda dentro de `{changesDir}/inProgress/`, **no hagas nada más**: si existe con ese `xxxx` en `{changesDir}/implemented/`, dile al usuario que ese cambio/fix ya está implementado; si no existe en ningún sitio, dile que no lo encuentras y pregunta el `xxxx` o la carpeta correctos. No busques ni operes sobre carpetas fuera de `{changesDir}/inProgress/`.
- Si la encuentras, esa es `{xxxx}` y su carpeta `{changesDir}/inProgress/{xxxx}/` para el resto del proceso.

## 2. Comprobar si ya existe `plan.md`

- **Si `{changesDir}/inProgress/{xxxx}/plan.md` ya existe**: usa `AskUserQuestion` para preguntar al usuario si quiere volver a analizar la solución (regenerar `plan.md` desde cero, sobrescribiéndolo — ve al paso 3) o implementar directamente lo que ya dice el `plan.md` actual (ve al paso 3.1 sin regenerarlo).
- **Si no existe**: ve al paso 3.

## 3. Analizar y escribir `plan.md`

1. Lee el documento funcional de la entrada (`{changesDir}/inProgress/{xxxx}/description.md`, generado por `ms-internal-workflow`) para entender qué se pide. El campo **Tipo** de ese documento indica si es un `fix` o un `change`.
   - **Si es un `fix`**: el análisis y la solución deben limitarse estrictamente a corregir el bug documentado — identifica la causa raíz mínima y el cambio más pequeño que la corrige. No amplíes alcance, no refactorices ni toques código no relacionado con la causa raíz, aunque lo veas mejorable de paso. Si al analizar detectas que hace falta o convendría algo más amplio, anótalo como fuera de alcance en la sección (a) del plan en vez de incluirlo en la solución.
   - **Si es un `change`**: no aplica esta restricción; la solución puede tener el alcance que el cambio requiera.
2. Si hay ficheros `{changesDir}/inProgress/{xxxx}/design_*.html` (propuesta visual generada por `ms-new`), ábrelos, pero trátalos **solo como referencia visual** — de ellos toma únicamente el aspecto que ilustran (maquetación, estilos, iconografía) para los elementos que cubren. La solución técnica **no debe basarse en ellos** en ningún otro sentido: no reutilices ni traduzcas literalmente su HTML/CSS/SVG, sus clases o su estructura de marcado, ni los tomes como referencia de arquitectura, componentes a crear/reutilizar o cualquier otra decisión de implementación — todo eso lo decides tú a partir del código real del proyecto (paso 4 de este apartado), igual que si esos ficheros no existieran.
3. Si hay dudas técnicas sobre cómo abordarlo, resuélvelas con el usuario antes de escribir el plan.
4. Reúne contexto adicional invocando la skill `ms-internal-tech-analysis` (herramienta Skill), pasándole un resumen de la causa raíz o del cambio a diseñar: ella lee primero la documentación técnica configurada en `framework.docs.tech` y solo explora código (`sourcecodeDir`) si hace falta completar información, devolviéndote el contexto reunido y cualquier incongruencia detectada entre documentación y código (recuerda: en ese caso el código manda). Si reporta alguna incongruencia, tenla en cuenta al diseñar la solución y al escribir las secciones (c)/(d) del plan (paso 5) para que quede reflejada en la actualización de documentación que hará `ms-do` tras implementar.
5. Escribe `{changesDir}/inProgress/{xxxx}/plan.md` siguiendo la plantilla [`PLAN.template.md`](PLAN.template.md) de esta skill, empezando con el campo **Fecha creación** (formato `YYYY-MM-DD`, la fecha actual en el momento de crear este `plan.md` — si ya existe porque se está regenerando, actualízala a la fecha de esta regeneración), seguido de estas secciones:
   - **(a) Anotaciones funcionales** — qué queda explícitamente fuera de alcance, y las dudas que se han resuelto con el usuario (pregunta y respuesta, en breve).
   - **(b) Solución técnica** — listado de tareas concretas y explicadas (qué hay que tocar, dónde, y por qué), en el orden en que se deberían implementar. No mezcles aquí pasos de comprobación manual — esos van en (e).
   - **(c) Cambios de arquitectura** — *solo si aplica*: si `docs.tech.architectureDocDir` está configurado y esta solución modifica la arquitectura básica del proyecto, indica **qué fichero(s) concretos** de esa carpeta hay que actualizar (puede haber varios candidatos) y qué hay que cambiar en cada uno. Si no aplica (no hay `docs.tech.architectureDocDir`, o la solución no toca arquitectura), omite esta sección por completo — no la dejes vacía ni con "N/A".
   - **(d) Cambios en estilo** — *solo si aplica*: si `docs.tech.styleBibleDocDir` está configurado y esta solución modifica o amplia el estilo visual del proyecto, indica **qué fichero(s) concretos** de esa carpeta hay que actualizar y qué hay que cambiar en cada uno. Si no aplica, omite esta sección — no la dejes vacía ni con "N/A".
   - **(e) Verificación** — checklist de resultados observables del sistema ya cambiado, a comprobar *después* de completar toda la sección (b). Cada ítem se redacta de forma autocontenida (qué hacer y qué se debería ver), sin remitir a un número de tarea de (b) — una comprobación puede depender de varias tareas a la vez, o compartirse entre varias. Inclúyela siempre salvo que la solución no tenga ningún comportamiento observable que comprobar.

## 3.1 Preguntar si se quiere implementar

Con el `plan.md` ya escrito, pregunta al usuario si quiere implementarlo ahora.

```
El plan queda escrito en `{changesDir}/inProgress/{xxxx}/plan.md`. ¿Quieres que lo implemente ahora?
```

- Si dice que sí, invoca directamente la skill `ms-do` (herramienta Skill) sobre ese mismo `xxxx` — no le pidas al usuario que la invoque por separado: continúa tú mismo encadenando ese flujo (implementación → actualización de documentación → mover a `implemented`), tal como lo define `ms-do`.
- Si dice que no, termina aquí: el cambio/fix queda documentado y planificado en `{changesDir}/inProgress/{xxxx}/`, pendiente de implementar más adelante (se puede retomar invocando `ms-do` directamente sobre ese `xxxx`, o volviendo a invocar esta misma skill si antes conviene revisar el plan).

No implementes nada tú mismo ni toques código directamente — eso lo hace siempre `ms-do`, para mantener un único sitio con esa lógica.
