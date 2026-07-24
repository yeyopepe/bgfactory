---
name: ms-close
description: Cierra un change/fix ya implementado, moviéndolo de {changesDir}/implemented a {changesDir}/closed. Solo actúa sobre entradas que ya estén en implemented (es decir, ya implementadas en código); pide siempre confirmación explícita al usuario antes de mover. Parte del framework ms-*. Trigger: /ms-close <xxxx>, o cuando el usuario pide cerrar/archivar un change/fix ya implementado.
argument-hint: <xxxx o descripción del cambio/fix a cerrar>
model: claude-haiku-4-5-20251001
effort: medium
metadata:
  version: 1.0.2
  uses: [ms-internal-workflow]
---

# ms-close

Cierra un change/fix que ya ha sido implementado, moviendo su carpeta de `{changesDir}/implemented/{xxxx}/` a `{changesDir}/closed/{xxxx}/`. Parte del framework `ms-*`.

Esta skill no analiza ni toca código: solo archiva entradas que `ms-implement` ya ha marcado como implementadas.

## 0. Cargar el contexto del proyecto

Lee `.claude/ms-context.json` en la raíz del repo. Si no existe, o le falta `framework.changesDir`, no continúes: dile al usuario que primero debe ejecutar la skill `ms-init` para inicializar/completar el framework en este proyecto, y detente ahí.

```
Este proyecto todavía no tiene el framework `ms-*` inicializado (o le falta configuración). Ejecuta primero `/ms-init` antes de volver a invocarme.
```

## 1. Identificar el change/fix

Si el usuario, al invocar esta skill, indica un `xxxx`, un nombre de carpeta o una descripción del change/fix, resuélvelo buscando **únicamente** dentro de `{changesDir}/implemented/` — nunca en `{changesDir}/inProgress/` ni en `{changesDir}/closed/`.

**Si no indica nada** (p.ej. invoca `/ms-close` sin argumentos): no asumas que se refiere al último change/fix mencionado en la conversación ni a ningún otro dato del contexto de chat — la única fuente de verdad es `{changesDir}/implemented/`. Lista las carpetas que haya ahí (su `xxxx` y, si lo tiene, el nombre/resumen de su `description.md`) y pregunta explícitamente al usuario cuál quiere cerrar. Si no hay ninguna, dile que no hay ningún change/fix implementado pendiente de cerrar y detente ahí.

- Si la carpeta con ese `xxxx` está en `{changesDir}/inProgress/`: todavía no se ha implementado en código, así que no se puede cerrar. Dile al usuario que primero debe implementarlo con `ms-implement` y detente ahí — no lo muevas.
- Si la carpeta ya está en `{changesDir}/closed/`: dile al usuario que ese change/fix ya estaba cerrado y detente ahí.
- Si no encuentras ninguna carpeta que corresponda en ningún sitio: dile al usuario que no la encuentras y pregunta el `xxxx` o la carpeta correctos.
- Si la encuentras en `{changesDir}/implemented/`, esa es `{xxxx}` y su carpeta `{changesDir}/implemented/{xxxx}/` para el resto del proceso.

## 2. Pedir confirmación

Antes de mover nada, usa `AskUserQuestion` para confirmar explícitamente con el usuario que quiere cerrar ese `xxxx` concreto (muéstrale el identificador y, si lo tiene, el título/resumen funcional de su `description.md`). No asumas confirmación implícita por el mero hecho de haber invocado la skill.

```
¿Confirmas que quieres cerrar {xxxx} ("{título/resumen}")? Se moverá de `{changesDir}/implemented/` a `{changesDir}/closed/`.
```

- Si confirma, ve al paso 3.
- Si no confirma, no hagas nada más: la carpeta se queda tal cual en `{changesDir}/implemented/{xxxx}/`.

## 3. Mover la carpeta a `closed`

Invoca la skill `ms-internal-workflow` (herramienta Skill) con `action=move`, `xxxx`, `from=implemented` y `to=closed` — no muevas la carpeta tú mismo.

## 4. Confirmar al usuario

Indica que `{xxxx}` se ha cerrado y que su carpeta ahora está en `{changesDir}/closed/{xxxx}/`.
