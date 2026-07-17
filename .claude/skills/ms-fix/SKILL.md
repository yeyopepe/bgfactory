---
name: ms-fix
description: Analiza un bug o comportamiento roto reportado por el usuario, lo documenta en {changesDir}/inProgress y lo implementa directamente encadenando ms-implement, con el análisis acotado estrictamente al fix (cambio mínimo, sin ampliar alcance). Trigger: /ms-fix, o cuando el usuario pide explícitamente "un fix"/corregir un bug como parte del flujo de trabajo del proyecto.
metadata:
  version: 1.0.0
---

# ms-fix

Analiza, documenta e implementa un fix (comportamiento roto) sobre el proyecto — para funcionalidad nueva o cambios intencionados usa la skill `ms-change`, no esta. Parte del framework `ms-*`.

Un fix es, por naturaleza, un cambio acotado: el análisis y la solución deben centrarse **única y exclusivamente en corregir el bug reportado**, con el menor cambio posible. Nada de aprovechar para refactorizar, renombrar o tocar código no relacionado con la causa raíz — eso, si hace falta, es un `ms-change` aparte.

Esta skill no implementa nada por sí misma: documenta la intención y encadena directamente la skill `ms-implement`, que es quien analiza la causa raíz técnica, escribe el `plan.md` y (si se confirma) implementa.

**Fuente de la verdad.** Para distinguir qué hace hoy el proyecto de lo que el usuario cree que hace, la única fuente de verdad es el código, el grafo de contexto (`projectGraphPath`, si está configurado), la documentación técnica (`architectureDocPath`, si está configurada) y la guía de estilo (`styleBibleDocPath`, si está configurada) — no asunciones ni memoria de la conversación. Tampoco cuenta como fuente de verdad el contenido de otros cambios/fixes que existan bajo `{changesDir}/**` (su `description.md` o `plan.md`, estén en `inProgress`, `implemented` o `closed`): son intención o análisis de otra entrada, no el estado real del proyecto.

## 0. Comprobar que el framework está inicializado

Si `.claude/ms-context.json` no existe en la raíz del repo, o le falta la sección `framework` (o campos suyos necesarios), no continúes: dile al usuario que primero debe ejecutar la skill `ms-init` para inicializar/completar el framework en este proyecto, y detente ahí.

## Pasos

1. **Entender el bug a nivel funcional.** Si hay ambigüedad sobre qué comportamiento es el correcto o cómo reproducirlo, pregunta. No hace falta localizar la causa raíz en código todavía — eso lo hace `ms-implement` al analizar el fix en detalle.
2. **Documentar la intención.** Invoca la skill `ms-workflow` (herramienta Skill) con `action=create`, `type=fix` y el resumen funcional de qué está mal y qué se espera en su lugar, para que se encargue de numerar el fix y crear el documento en `{changesDir}/inProgress/{xxxx}/`.
3. **Encadenar la implementación.** Invoca directamente la skill `ms-implement` (herramienta Skill) sobre ese mismo `xxxx`, indicando explícitamente que es un fix y que su análisis y solución deben limitarse estrictamente a corregir el bug documentado — cambio mínimo, sin ampliar alcance ni tocar nada no relacionado con la causa raíz. No le pidas al usuario que invoque `ms-implement` por separado: continúa tú mismo con ese flujo (análisis → `plan.md` → confirmación → implementación → mover a `implemented`), tal como lo define `ms-implement`.

No escribas tú mismo el documento de fix ni calcules el número `xxxx` — eso lo hace `ms-workflow` para mantener un único sitio con esa lógica. No escribas tú mismo el `plan.md` ni toques código directamente — eso lo hace `ms-implement` para mantener un único sitio con esa lógica.
