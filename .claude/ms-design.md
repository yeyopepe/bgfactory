# Diseño — Framework `ms-*`

Mapa de las skills que componen el framework `ms-*` y cómo se invocan entre sí.

## Diagrama de relaciones

Diagrama simplificado con solo el flujo principal visible al usuario. Las skills internas (`ms-workflow`, `ms-tech-analysis`) y de soporte (`ms-graph`, `ms-version`, `ms-close`, `ms-status`) no aparecen aquí — su relación con el resto está descrita en la sección de responsabilidades más abajo.

```mermaid
graph TD
    subgraph Configuracion
        ms_init["ms-init<br/>(config del framework)"]
        ms_context[("ms-context.json")]
    end

    subgraph Entrada
        ms_new["ms-new<br/>(documentar change)"]
        ms_fix["ms-fix<br/>(documentar + implementar fix)"]
        ms_fast["ms-fast<br/>(aplicar+documentar cambio trivial)"]
        ms_todo["ms-todo<br/>(anotar ideas sueltas)"]
    end

    subgraph Nucleo
        ms_implement["ms-implement<br/>(planificar + implementar)"]
    end

    ms_init -.->|crea/completa| ms_context

    ms_new -.->|"si el usuario quiere implementar ya"| ms_implement
    ms_fix ==>|encadena siempre| ms_implement
    ms_fast ==>|"si no califica como trivial"| ms_new

    classDef entry fill:#2b6cb0,color:#fff
    classDef core fill:#805ad5,color:#fff
    classDef config fill:#e67700,color:#fff
    class ms_new,ms_fix,ms_fast,ms_todo entry
    class ms_implement core
    class ms_init,ms_context config
```

Leyenda:
- Flechas sólidas (`-->`, `==>`): invocación directa de skill a skill dentro del mismo proceso.
- Flechas punteadas (`-.->`): dependencia de configuración o invocación condicional.
- `ms-todo` no tiene ninguna flecha hacia el resto del flujo: vive aislado en `{changesDir}/todo/`, ajeno al resto de skills.
- `ms-fast` es la única skill de "Entrada" que puede terminar sin pasar por `inProgress`: si el cambio de verdad califica como trivial, escribe ella misma la carpeta en `{changesDir}/implemented/fast-*` (numeración/nombre propios, ajenos al `xxxx` secuencial). Solo cae en `ms-new` cuando el análisis revela que no era tan trivial (afecta a arquitectura/estilo, falta información, o toca más de 2 ficheros).
- Todas las skills leen `.claude/ms-context.json` para funcionar, no solo las que aparecen aquí conectadas a él — se omite esa flecha hacia cada una para no saturar el diagrama; `ms-init` es la única que lo escribe.

## Diagrama de cierre

Continuación del diagrama anterior a partir de `ms-implement`: qué pasa con una entrada una vez implementada, hasta archivarse.

```mermaid
graph TD
    ms_implement["ms-implement"]
    implemented[("changes/implemented/")]
    closed[("changes/closed/")]
    ms_version["ms-version<br/>(build + versión)"]
    ms_close["ms-close<br/>(archivar)"]

    ms_implement --> implemented

    implemented -.->|"opcional, si framework.versioning"| ms_version
    implemented --> ms_close
    ms_close --> closed

    classDef core fill:#805ad5,color:#fff
    classDef support fill:#38a169,color:#fff
    classDef estado fill:#e67700,color:#fff
    class ms_implement core
    class ms_version,ms_close support
    class implemented,closed estado
```

Leyenda:
- `ms-version` es independiente del `xxxx` de cualquier change/fix concreto: toma el entregable tal cual está en ese momento, nunca una entrada específica de `implemented`. Por eso su flecha desde `implemented` es punteada y opcional (solo si `framework.versioning` es `true`), no un requisito para poder cerrar.
- `ms-close` sí actúa sobre una entrada concreta: la mueve de `implemented/{xxxx}/` a `closed/{xxxx}/` tras confirmación explícita del usuario. Funciona igual sobre entradas `fast` de `ms-fast` que sobre `change`/`fix` normales.
- Cortar versión y cerrar una entrada son pasos independientes entre sí — ninguno depende del otro ni se dispara automáticamente.

## Responsabilidades de cada skill

### Invocables por el usuario

- **ms-init** — Inicializa el framework: crea/completa `.claude/ms-context.json` (rutas de `changesDir`, docs a sincronizar, config de versionado) y comprueba que las herramientas de línea de comandos necesarias estén instaladas. Único punto de configuración del que dependen todas las demás skills. Si ya hay código al inicializar, invoca `ms-graph` para generar el grafo inicial. *Usa:* `ms-graph`.
- **ms-new** — Documenta un cambio intencionado (funcionalidad nueva o modificación de comportamiento a propósito, no un bug). Invoca `ms-tech-analysis` para reunir contexto técnico antes de anticipar dudas funcionales típicas, genera `description.md` vía `ms-workflow` y, si aplica, maquetas visuales `design_*.html`. No implementa nada por sí misma, pero si el usuario quiere implementar de inmediato puede invocar directamente `ms-implement` sobre la entrada recién creada. *Usa:* `ms-workflow`, `ms-tech-analysis`, `ms-implement`.
- **ms-fix** — Documenta un bug (genera `description.md` vía `ms-workflow`) y encadena automáticamente `ms-implement` para corregirlo de punta a punta, con el análisis acotado estrictamente a la causa raíz (sin ampliar alcance). Invoca `ms-tech-analysis` para distinguir qué hace hoy el proyecto de lo que el usuario cree que hace. *Usa:* `ms-workflow`, `ms-tech-analysis`, `ms-implement`.
- **ms-fast** — Vía rápida para cambios tan pequeños que casi no requieren análisis (typo, texto, un valor/constante, un ajuste de estilo aislado). No pasa por `inProgress`/`plan.md`/`ms-workflow`: invoca `ms-tech-analysis` para valorar si de verdad califica (sin ambigüedad, ≤2 ficheros, sin afectar a `docs.tech.architectureDocPath`/`docs.tech.styleBibleDocPath` ni incongruencias detectadas con ellos, sin comportamiento nuevo); si califica, aplica el cambio y lo documenta directamente en `{changesDir}/implemented/fast-{título}_{yyyyMMdd}/` en la misma invocación. Si no califica, no toca código: avisa al usuario e invoca `ms-new` con su petición para iniciar la definición de un change normal. *Usa:* `ms-tech-analysis`, `ms-new`.
- **ms-implement** — Toma una entrada ya documentada en `inProgress`, invoca `ms-tech-analysis` para reunir el contexto técnico, analiza la solución técnica y escribe `plan.md`; si el usuario confirma, implementa el código, actualiza la documentación sincronizada (`docs.tech.architectureDocPath`/`docs.functional.featuresDocPath`/`docs.tech.styleBibleDocPath` — incluyendo cualquier incongruencia que `ms-tech-analysis` haya reportado), mueve la carpeta a `implemented` vía `ms-workflow` y regenera el grafo con `ms-graph` si hubo cambios de código. *Usa:* `ms-tech-analysis`, `ms-workflow`, `ms-graph`.
- **ms-version** — Genera una nueva versión del entregable: fija la versión en `versionFilePath`, ejecuta `buildCommand` y verifica el resultado en `buildOutputPath`. Paso explícito y separado, nunca automático tras `ms-implement`. *Usa:* ninguna otra skill.
- **ms-close** — Archiva una entrada ya implementada, moviéndola de `implemented` a `closed` vía `ms-workflow`, con confirmación explícita previa. Puramente archivo, no toca código ni documentación. Funciona igual sobre entradas `change`/`fix` que sobre entradas `fast` de `ms-fast`. *Usa:* `ms-workflow`.
- **ms-status** — Da una vista general de solo lectura del estado del proyecto (totales por tipo —incluido `fast`— y por estado, detalle de qué está solo descrito vs. listo para implementar, y listado aparte de los cambios `fast` ya aplicados). No crea, mueve ni modifica nada; el informe se entrega en el chat salvo que el usuario pida guardarlo. *Usa:* ninguna otra skill.
- **ms-todo** — Cuaderno de ideas sueltas, deliberadamente fuera del flujo de trabajo del framework: vive en `{changesDir}/todo/`, con numeración e identificadores propios que ninguna otra skill `ms-*` lee ni cuenta. Sirve para anotar ideas incompletas sin forzar el análisis de alcance de `ms-new`/`ms-fix`. *Usa:* ninguna otra skill.

### Internas y de soporte

`ms-workflow` y `ms-tech-analysis` solo se ejecutan cuando otra skill del framework las invoca como parte de su propio proceso; si el usuario las invoca directamente (o pide "ejecuta X" en texto plano sin venir de ese contexto), se detienen sin hacer nada y redirigen a la skill correspondiente. `ms-graph`, en cambio, sí admite invocación directa del usuario (`/ms-graph`) — se agrupa aquí porque no forma parte del flujo principal `ms-new`/`ms-fix`/`ms-fast` → `ms-implement`, sino que da soporte de contexto a otras skills.

- **ms-workflow** — Centraliza la mecánica de fichero del framework: numerar y crear entradas nuevas en `inProgress` (`action=create`), y mover carpetas entre estados (`action=move`). No analiza ni decide nada, solo ejecuta lo que la skill llamante ya resolvió. `ms-fast` no la usa: gestiona su propio espacio de nombres (`fast-{título}_{yyyyMMdd}`), fuera del `xxxx` secuencial que numera esta skill. *Usa:* ninguna otra skill.
- **ms-tech-analysis** — Centraliza cómo reunir contexto técnico fiable: lee primero la documentación de `framework.docs.tech` configurada, y solo explora código si hace falta completar información. Si detecta incongruencias entre documentación y código, el código manda y la incongruencia se devuelve como hallazgo a quien invoca (nunca edita nada ella misma). La usan `ms-new`, `ms-fix`, `ms-fast` e `ms-implement`. *Usa:* ninguna otra skill.
- **ms-graph** — Genera/regenera `graph.json`: un mapa determinista (script Python) de ficheros, símbolos exportados y relaciones, usado como contexto reducido de arquitectura por `ms-implement`/`ms-tech-analysis`. Se invoca automáticamente al final de `ms-implement` (si hubo cambios de código) y de `ms-init` (si ya hay código al inicializar), o manualmente en cualquier momento. `ms-fast` nunca la invoca, aunque haya tocado código. *Usa:* ninguna otra skill.
