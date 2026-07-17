---
name: ms-revert
description: Revierte en código un change/fix ya implementado o cerrado, generando y ejecutando un plan de reversión (revert.md) a partir de lo documentado en plan.md, y deja la entrada de vuelta en {changesDir}/inProgress para poder replanificarla o reintentarla. Solo actúa sobre entradas en {changesDir}/implemented o {changesDir}/closed. Parte del framework ms-*. Trigger: /ms-revert <xxxx>, o cuando el usuario pide deshacer/revertir un change/fix ya implementado.
argument-hint: <xxxx o descripción del change/fix a revertir>
metadata:
  version: 1.0.0
---

# ms-revert

Deshace en código un change/fix que ya se implementó (`{changesDir}/implemented/{xxxx}/`) o que incluso ya se cerró (`{changesDir}/closed/{xxxx}/`), y deja la entrada de vuelta en `{changesDir}/inProgress/{xxxx}/` para poder replanificarla o reintentarla más adelante. Parte del framework `ms-*`.

Esta skill no reinterpreta el cambio ni decide una solución nueva: solo deshace, lo más fielmente posible, lo que `plan.md` dice que se hizo.

## 0. Cargar el contexto del proyecto

Lee `.claude/ms-context.json` en la raíz del repo. Si no existe, o le falta `framework.changesDir`, no continúes: dile al usuario que primero debe ejecutar la skill `ms-init` para inicializar/completar el framework en este proyecto, y detente ahí.

## 1. Identificar el change/fix

Si el usuario, al invocar esta skill, indica un `xxxx`, un nombre de carpeta o una descripción del change/fix, resuélvelo buscando **únicamente** dentro de `{changesDir}/implemented/` y `{changesDir}/closed/`.

**Si no indica nada** (p.ej. invoca `/ms-revert` sin argumentos): no asumas que se refiere al último change/fix mencionado en la conversación ni a ningún otro dato del contexto de chat — la única fuente de verdad es `{changesDir}/implemented/` y `{changesDir}/closed/`. Lista las carpetas que haya en ambas (su `xxxx`, en qué carpeta está, y si lo tiene, el nombre/resumen de su `description.md`) y pregunta explícitamente al usuario cuál quiere revertir. Si no hay ninguna, dile que no hay ningún change/fix implementado o cerrado que revertir y detente ahí.

- Si la carpeta con ese `xxxx` está en `{changesDir}/inProgress/`: todavía no se ha implementado en código, así que no hay nada que revertir. Dile al usuario y detente ahí — no toques esa carpeta.
- Si no encuentras ninguna carpeta que corresponda en ningún sitio: dile al usuario que no la encuentras y pregunta el `xxxx` o la carpeta correctos.
- Si la encuentras en `{changesDir}/implemented/{xxxx}/` o en `{changesDir}/closed/{xxxx}/`, esa es su carpeta de origen para el resto del proceso (recuerda de cuál de las dos era, la necesitas en el paso 7).

## 2. Leer el contexto de la carpeta

Lee **todos** los ficheros de esa carpeta (`description.md`, `plan.md`, y cualquier otro que exista) para entender qué se pidió y qué se implementó realmente. `plan.md` es la fuente principal: su sección **(b) Solución técnica** enumera las tareas concretas que se ejecutaron, y su sección **(c) Cambios de arquitectura** (si existe) indica qué se tocó en `designDocPath`.

Si la carpeta no tiene `plan.md`, no puedes saber con fiabilidad qué se implementó: dile al usuario que falta ese fichero y pregúntale cómo quiere proceder en vez de improvisar qué revertir.

## 3. Comprobar si ya existe `revert.md`

- **Si `revert.md` ya existe** en esa carpeta: usa `AskUserQuestion` para preguntar al usuario si quiere volver a analizar el revert (regenerarlo desde cero, sobrescribiéndolo — ve al paso 4) o ejecutar directamente lo que ya dice el `revert.md` actual (ve al paso 5 sin regenerarlo).
- **Si no existe**: ve al paso 4.

## 4. Escribir `revert.md`

A partir de lo leído en el paso 2, escribe `revert.md` en esa misma carpeta con el plan para deshacer, en **orden inverso** al que se aplicaron, todas las tareas de la sección (b) de `plan.md` — y, si existe, también lo necesario para deshacer los cambios de la sección (c) sobre `designDocPath`.

Para cada tarea a deshacer, indica qué hay que tocar, dónde, y por qué (el mismo nivel de detalle que `plan.md`), de forma que sea ejecutable directamente en el paso 5.

Si al analizar detectas que alguna parte de `plan.md` no se puede revertir limpiamente (p. ej. porque código posterior ya depende de ese cambio), anótalo explícitamente en `revert.md` como advertencia en vez de omitirlo en silencio.

### 4.1 Pedir confirmación

Con `revert.md` ya escrito, usa `AskUserQuestion` para confirmar explícitamente con el usuario que quiere ejecutar esta reversión ahora.

- Si confirma, ve al paso 5.
- Si no confirma, termina aquí: `revert.md` queda escrito en la carpeta (que permanece en `implemented`/`closed`, sin mover), pendiente de ejecutar más adelante invocando esta misma skill otra vez.

## 5. Ejecutar el revert

Ejecuta todo lo que dice `revert.md` con tu proceso normal de ingeniería (editar/eliminar código, verificar que compila / pasan los tests si los hay).

Si durante la ejecución descubres que el plan de reversión no es viable tal cual está escrito, para y coméntaselo al usuario en vez de improvisar una solución distinta sin decírselo.

## 6. Actualizar el grafo de contexto

Si `projectGraphPath` está configurado y en el paso 5 se han aplicado cambios relevantes en el código, invoca la skill `ms-graph` para regenerar/actualizar el grafo de contexto del proyecto. Si no ha habido cambios relevantes en código, u omite este paso si `projectGraphPath` no está configurado.

## 7. Mover la carpeta a `inProgress`

Mueve la carpeta de origen identificada en el paso 1 (`{changesDir}/implemented/{xxxx}/` o `{changesDir}/closed/{xxxx}/`, con todo su contenido incluido `revert.md`) a `{changesDir}/inProgress/{xxxx}/`, creando `{changesDir}/inProgress/` si no existe — pero **solo** cuando el revert se haya ejecutado realmente en el paso 5. Si el usuario decidió no ejecutar en 4.1, no muevas la carpeta.

## 8. Confirmar al usuario

Indica qué se ha revertido, que `revert.md` queda como registro en la carpeta, el resultado del paso de grafo si se ejecutó, y que la carpeta está ahora en `{changesDir}/inProgress/{xxxx}/`, lista para replanificarse o reintentarse con `ms-implement`.
