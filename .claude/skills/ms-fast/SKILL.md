---
name: ms-fast
description: Aplica directamente un cambio muy pequeño y de análisis casi nulo (typo, ajuste de un valor/constante, texto, un estilo puntual...), sin pasar por el flujo inProgress→plan→implementado del resto del framework. Nunca toca arquitectura ni biblia de estilo. Si al analizarlo resulta que afecta a arquitectura/estilo, falta información, o toca más de 2 ficheros, no implementa nada: avisa al usuario e invoca ms-new con su petición para iniciar la definición de un change. Si procede, aplica el cambio y documenta directamente en {changesDir}/implemented/fast-<título>_<yyyyMMdd>/description.md. Parte del framework ms-*. Trigger: /ms-fast <descripción>, o cuando el usuario pide explícitamente "algo rápido"/"un fast" para un cambio trivial.
argument-hint: <descripción del cambio a aplicar>
metadata:
  version: 1.1.0
  uses: [ms-tech-analysis, ms-new]
---

# ms-fast

Vía rápida del framework `ms-*` para cambios **muy pequeños y de análisis casi nulo**: un typo, un texto, un valor/constante puntual, un ajuste de estilo aislado, etc. A diferencia de `ms-new`/`ms-fix` + `ms-implement`, no pasa por `{changesDir}/inProgress/` ni genera `plan.md`: si el cambio de verdad es trivial, se analiza, se aplica y se documenta ya implementado, todo en la misma invocación.

**Esta skill no es un atajo para saltarse el análisis de un cambio que sí lo necesita.** Es solo para lo que verdaderamente no requiere ninguno. Si el usuario pide `/ms-fast` para algo que no lo es, esta skill no debe forzar la implementación: debe decirlo y redirigir a `ms-new` o `ms-fix`.

**Fuente de la verdad.** La documentación técnica y el código son la fuente de verdad sobre cómo funciona hoy el proyecto — nunca asunciones ni memoria de conversaciones anteriores. Tampoco cuenta como fuente de verdad el contenido de otras entradas bajo `{changesDir}/**`.

## 0. Comprobar que el framework está inicializado

Si `.claude/ms-context.json` no existe en la raíz del repo, o le falta la sección `framework` (o campos suyos necesarios), no continúes: dile al usuario que primero debe ejecutar la skill `ms-init` para inicializar/completar el framework en este proyecto, y detente ahí.

```
Este proyecto todavía no tiene el framework `ms-*` inicializado (o le falta configuración). Ejecuta primero `/ms-init` antes de volver a invocarme.
```

A partir de aquí, `changesDir` se refiere al valor de `framework.changesDir` en ese fichero.

## 1. Valorar si de verdad es un cambio "fast"

Antes de tocar nada, invoca la skill `ms-tech-analysis` (herramienta Skill) pasándole un resumen de la petición, para reunir el contexto técnico necesario (lee primero la documentación de `framework.docs.tech` configurada, y solo explora código si hace falta). Con ese contexto ya reunido, valora la petición contra estos criterios — para calificar como `fast` debe cumplirlos **todos**:

- Se entiende sin ambigüedad qué hay que cambiar con una sola lectura de la petición — no falta información relevante ni hace falta tomar ninguna decisión de diseño o de alcance. Si para poder aplicarlo necesitarías preguntar bastante al usuario, no es `fast`.
- Toca pocos ficheros, de forma muy localizada (una constante, un texto, un valor, una regla de estilo, una condición puntual, un typo). Si afecta a más de 3 ficheros, no es `fast`, por poco que sea el cambio en cada uno.
- No introduce comportamiento nuevo ni cambia un flujo o interacción existente — como mucho ajusta un valor, texto o aspecto de algo que ya existe.
- No tiene casos límite relevantes que analizar, ni afecta a cómo conviven distintas partes del proyecto entre sí.
- No es, ni de lejos, un bug cuya causa raíz haya que investigar — si hace falta indagar para encontrar por qué falla algo, no es `fast`.
- Puede afectar a valores o **conceptos pequeños de los documentos `docs.tech.*`** (si están configurados en `.claude/ms-context.json`).
- Si el cambio que afecta a **`docs.tech.architectureDocPath` ni a `docs.tech.styleBibleDocPath`** (si están configurados en `.claude/ms-context.json`) es mayor (una decisión de arquitectura, una convención de estilo visual/interacción/redacción), no es `fast`, aunque el cambio en el código en sí sea pequeño. Si `ms-tech-analysis` reporta alguna incongruencia entre esos documentos y el código, tampoco califica como `fast`: una incongruencia con la documentación técnica es, por definición, algo que afecta a esos documentos.
- Si el cambio a afecta a **`docs.functional.*`** no es `fast`.

Ejemplos orientativos que sí calificarían: corregir un texto o typo, cambiar un color/tamaño/margen puntual, ajustar el valor de una constante o configuración, corregir un enlace o ruta mal escrita, renombrar una etiqueta visible.

Ejemplos que **no** calificarían (aunque el usuario los pida como "rápidos"): cualquier funcionalidad nueva, cualquier cambio que module cómo se comporta algo (no solo su aspecto/valor), cualquier fix cuya causa no sea obvia a simple vista, cualquier cambio que toque más de 2 ficheros o varios flujos/componentes relacionados entre sí, cualquier cambio que afecte a arquitectura o a la biblia de estilo.

Si tienes dudas razonables sobre si califica, no lo fuerces: trátalo como que no califica.

## 2. Si no califica: avisar y crear un change con ms-new

Si el análisis del paso 1 concluye que no es un cambio trivial, **no toques código todavía**:
1. Avisa al usuario, indicando explícitamente qué punto de los criterios no cumple (falta información, afecta a más de 2 ficheros, toca arquitectura/biblia de estilo, no es realmente menor, etc.), de que en su lugar vas a crear un change para documentarlo y analizarlo como corresponde.

   ```
   Esto no califica como cambio "fast": {motivo concreto incumplido}. Voy a documentarlo como un change con `ms-new` para analizarlo y planificarlo como corresponde.
   ```
2. A continuación, sin esperar confirmación adicional, invoca directamente la skill `ms-new` (herramienta Skill) pasándole tal cual la petición/información que te ha dado el usuario, para que arranque su propio proceso de definición del cambio en `{changesDir}/inProgress/`. No sigas con el resto de pasos de `ms-fast`: a partir de aquí el proceso lo continúa `ms-new`.

## 3. Si califica: aplicar el cambio

Implementa el cambio directamente en el código con tu proceso normal de ingeniería (editar, verificar que compila/pasan los tests si los hay). Sigue siendo un cambio real sobre el proyecto: aplícalo con el mismo cuidado que cualquier otra edición, aunque no pase por `plan.md`.

Un cambio `fast` **nunca** debe tocar `docs.tech.architectureDocPath` ni `docs.tech.styleBibleDocPath` (ver paso 1) — no los actualices, ni actualices tampoco `docs.functional.featuresDocPath`, ni invoques `ms-graph` ni `ms-version`, como parte de esta skill. Si durante la implementación descubres que sí hace falta tocar arquitectura, biblia de estilo, o que el cambio se extiende a más ficheros de los previstos, es señal de que el cambio no era tan trivial: para inmediatamente, no lo apliques a medias (deshaz lo ya tocado si llegaste a tocar algo), y sigue el paso 2 (avisar e invocar `ms-new`) en su lugar.

## 4. Documentar el cambio ya aplicado

No invoques `ms-workflow` (esta skill no usa numeración `xxxx`: gestiona su propio espacio de nombres, independiente del de `ms-new`/`ms-fix`). Crea directamente (creando `{changesDir}/implemented/` si no existe):

```
{changesDir}/implemented/fast-{título}_{yyyyMMdd}/description.md
```

- **`{título}`** — versión corta en kebab-case del nombre del cambio (minúsculas, sin acentos ni caracteres especiales, palabras separadas por guiones, unas pocas palabras), p.ej. `fast-corrige-texto-boton-guardar_20260717`.
- **`{yyyyMMdd}`** — fecha de hoy.
- Si ya existe una carpeta con ese mismo nombre exacto (dos cambios `fast` con título parecido el mismo día), añade un sufijo numérico (`-2`, `-3`...) hasta que no colisione.

Redacta `description.md` siguiendo la plantilla [`description.template.md`](description.template.md) de esta misma carpeta:

- **Nombre** — nombre corto y descriptivo del cambio.
- **Código** — el nombre de carpeta `fast-{título}_{yyyyMMdd}` resuelto arriba.
- **Tipo** — siempre `fast`.
- **Fecha** — fecha de hoy (`yyyy-MM-dd`).
- **Prompt original del usuario** — la petición tal cual la ha escrito el usuario, sin reformular.
- **Descripción completa** — qué se pedía y qué se ha aplicado, en términos funcionales.
- **Cambios aplicados** — detalle técnico breve de lo tocado (ficheros y qué se cambió en cada uno).

## 5. Confirmar al usuario

Indica qué se ha implementado y la ruta del fichero de documentación creado (`{changesDir}/implemented/fast-{título}_{yyyyMMdd}/description.md`). Recuerda que, como cualquier otra entrada de `implemented`, puede cerrarse más adelante con `ms-close` cuando el usuario lo revise.
