---
name: ms-workflow
description: Proceso compartido, agnóstico al proyecto, para documentar la intención de un fix o change (numeración secuencial, resumen funcional) antes de implementarlo. Parte del framework ms-*. Uso interno de las skills ms-change y ms-fix.
user-invocable: false
disable-model-invocation: true
metadata:
  version: 1.0.0
---

# ms-workflow

Proceso genérico de documentación de la intención de un cambio, parte del
framework `ms-*`. Solo lo invocan otras skills del framework (`ms-change` y
`ms-fix`, con un parámetro `type` de `change` o `fix` y la descripción de lo
que se pide) — no está pensado para invocación directa por el usuario.

Este paso **no implementa ni analiza técnicamente nada**: solo dimensiona el
alcance funcional y crea la entrada en `{changesDir}/inProgress/`. El
análisis técnico detallado (y la implementación en sí) los hace después la
skill `ms-implement`, a partir del documento que aquí se genera.

## Guardarraíl de invocación — leer antes que nada

Esta skill **no se ejecuta si se ha invocado directamente** (p.ej. el
usuario ha escrito `/ms-workflow`, o ha pedido "ejecuta/invoca ms-workflow"
en texto plano). Solo debe ejecutarse cuando el propio contenido de la
skill `ms-change` o `ms-fix` te ha instruido a invocarla como parte de su
proceso, con un `type` (`change`/`fix`) y una descripción concreta de lo
que se pide.

Si te han invocado sin ese contexto (el usuario ha tecleado el comando
directamente, o no venías de `ms-change`/`ms-fix`), **detente aquí** y dile
al usuario que `ms-workflow` es de uso interno del framework: para
documentar un cambio o fix debe usar `ms-change` o `ms-fix`. No generes
ningún documento ni preguntes nada más en ese caso.

## 0. Cargar el contexto del proyecto

Lee `.claude/ms-context.json` en la raíz del repo. Si no existe, o le falta
la sección `framework` (o campos suyos que este proceso necesita), no
continúes: dile al usuario que primero debe ejecutar la skill
`ms-initialize` para inicializar/completar el framework en este proyecto,
y detente ahí — no reimplementes el bootstrap aquí. El esquema completo
está en [`../ms-initialize/schema.json`](../ms-initialize/schema.json)
(léelo primero si no lo has hecho ya en esta sesión, para saber qué campos
comprobar).

A partir de aquí, `changesDir` y `numberWidth` se refieren a los valores de
`framework` en ese fichero. La sección `project` úsala como contexto
adicional al redactar (vocabulario del dominio, convenciones) pero ningún
paso de este proceso depende de ella.

## 1. Calcular el código de cambio `xxxx`

Cada cambio/fix vive en una subcarpeta numerada bajo `{changesDir}/inProgress/`
(mientras no se ha implementado) o `{changesDir}/implemented/` (una vez
`ms-implement` lo ha implementado y movido). Un mismo `xxxx` no puede
repetirse entre los dos subárboles, así que para calcular el siguiente hay
que mirar **ambos**: lista las subcarpetas puramente numéricas de
`{changesDir}/inProgress` y de `{changesDir}/implemented` (los que existan;
si ninguno existe todavía, no hay ningún `xxxx` previo). `xxxx` es el número
más alto de los dos conjuntos + 1, formateado con `numberWidth` dígitos y
ceros a la izquierda. Si no hay ninguna carpeta numerada en absoluto, `xxxx`
es `1` formateado igual (p.ej. `0001`).

## 2. Generar el documento de intención del cambio/fix

Si hay dudas relevantes sobre el alcance de lo que se pide que no se puedan
resolver con lo que ya sabes, pregúntalas antes de escribir el documento —
no hace falta que sean dudas técnicas de implementación (eso lo resuelve
`ms-implement` más adelante), solo las de alcance funcional. Guarda esas
preguntas junto con las respuestas del usuario: van incluidas en el
documento (ver más abajo).

Crea (creando `{changesDir}/inProgress/` si no existe):

```
{changesDir}/inProgress/{xxxx}/description.md
```

Contenido del documento, con exactamente estos campos:

- **Nombre** — nombre corto y descriptivo del cambio/fix.
- **Código** — el `xxxx` calculado en el paso 1.
- **Tipo** — `fix` o `change`, según corresponda.
- **Prompt original del usuario** — la petición tal cual la ha escrito el
  usuario, sin reformular.
- **Descripción completa** — resumen funcional de lo que se ha analizado
  que pide, sin entrar en solución técnica:
  - Para un `fix`: qué comportamiento está roto, cómo reproducirlo o
    identificarlo, y qué se espera que pase en su lugar.
  - Para un `change`: qué se pide añadir o modificar, por qué, y cómo
    debería comportarse el resultado.
  - Incluye aquí también, si las ha habido, las preguntas de alcance que
    se le han hecho al usuario junto con sus respuestas.

No incluyas aquí notas técnicas ni de arquitectura — de eso se encarga el
`plan.md` que genera `ms-implement` al analizar esta entrada.

## 3. Confirmar al usuario

Indica el fichero creado (`{changesDir}/inProgress/{xxxx}/description.md`) y
recuerda que el siguiente paso, cuando se quiera implementar, es invocar la
skill `ms-implement` sobre este `xxxx`.
