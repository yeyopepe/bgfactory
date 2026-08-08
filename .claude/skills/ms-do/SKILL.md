---
name: ms-do
description: Implementa un change/fix cuyo plan.md ya está escrito en {changesDir}/inProgress/{xxxx}/ — edita el código según la solución técnica, actualiza la documentación sincronizada, y mueve la entrada a {changesDir}/implemented. Parte del framework ms-*. Trigger: /ms-do <xxxx>, o cuando el usuario pide implementar un cambio/fix ya planificado por ms-how (normalmente encadenado automáticamente desde ella).
argument-hint: <xxxx del cambio/fix ya planificado>
model: claude-haiku-4-5
effort: medium
metadata:
  version: 1.3.1
  uses: [ms-internal-workflow, ms-internal-doc-features]
---

# ms-do

Toma una entrada de `{changesDir}/inProgress/{xxxx}/` cuya solución técnica ya está escrita en `plan.md` (por la skill `ms-how`) y la lleva hasta implementada: edita el código, actualiza la documentación sincronizada, y mueve la carpeta a `{changesDir}/implemented/{xxxx}/`.

**Fuente de la verdad.** El `plan.md` de esta entrada es la guía de lo que hay que implementar. Si durante la implementación algo no cuadra con el código real, el código manda — para y coméntaselo al usuario en vez de improvisar una solución distinta sin decírselo (ver paso 2).

**Nunca uses git de forma destructiva ni hagas commit sin permiso.** Esta skill edita ficheros de código/documentación y mueve la carpeta del cambio (paso 3), pero nunca va más allá por su cuenta:

- No ejecutes `git commit` (ni `git add` seguido de commit) salvo que el usuario lo haya pedido explícitamente en este turno. Terminar la implementación no es una autorización implícita para commitear.
- No ejecutes `git restore`, `git checkout -- <fichero>`, `git reset`, `git clean`, ni ningún otro comando que descarte cambios en el árbol de trabajo, aunque el fichero afectado parezca no tener relación con esta entrada. Si al hacer `git status`/`git add` ves cambios de otro trabajo en curso (tuyo o del usuario) que no quieres incluir, dilo y pregunta cómo proceder — no los deseches tú mismo.
- Si necesitas comprobar el estado del repo (`git status`, `git diff`) hazlo solo para verificar tu propio trabajo, nunca como paso previo a limpiar o descartar ficheros que no has tocado en esta implementación.

## 0. Cargar el contexto del proyecto

Lee `.claude/ms-context.json` (puntero fijo) en la raíz del repo para obtener `workFolder`, y a partir de ahí `{workFolder}/framework/context.json`. Si el puntero no existe, o ese fichero no existe o le falta la sección `framework`, no continúes: dile al usuario que primero debe ejecutar la skill `ms-init` para inicializar/completar el framework en este proyecto, y detente ahí.

```
Este proyecto todavía no tiene el framework `ms-*` inicializado (o le falta configuración). Ejecuta primero `/ms-init` antes de volver a invocarme.
```

`docs.tech.architectureDocDir`, `docs.functional.featuresDocPathDir` y `docs.tech.styleBibleDocDir` son opcionales y se usan en el paso 2.1; si no están configurados, omite las actualizaciones correspondientes sin preguntar nada.

## 1. Identificar la entrada a implementar

Si el usuario, al invocar esta skill, indica un `xxxx`, un nombre de carpeta o una descripción del cambio/fix, resuélvelo buscando **únicamente** dentro de `{changesDir}/inProgress/`, y comprueba que tiene `plan.md`:

- Si la carpeta existe pero **no** tiene `plan.md` todavía: no continúes. Dile al usuario que esa entrada aún no tiene solución técnica planificada y que primero debe invocar `ms-how` sobre ese `xxxx`.
- Si no encuentras ninguna carpeta que corresponda dentro de `{changesDir}/inProgress/`: si existe con ese `xxxx` en `{changesDir}/implemented/`, dile al usuario que ese cambio/fix ya está implementado; si no existe en ningún sitio, dile que no lo encuentras y pregunta el `xxxx` o la carpeta correctos.

**Si no indica nada** (p.ej. invoca `/ms-do` sin argumentos): no asumas que se refiere al último cambio/fix mencionado en la conversación ni a ningún otro dato del contexto de chat. Lista únicamente las carpetas de `{changesDir}/inProgress/` que ya tengan `plan.md` (listas para implementar) — su `xxxx` y, si lo tiene, el nombre/resumen de su `description.md` — y pregunta explícitamente al usuario cuál quiere implementar. Si no hay ninguna con `plan.md` todavía (aunque haya entradas en `inProgress` sin planificar), dile que no hay ningún cambio/fix listo para implementar y que primero hace falta planificarlo con `ms-how`.

```
Estos cambios/fixes ya tienen `plan.md` y están listos para implementar:
- {xxxx} — {nombre/resumen}
- ...

¿Cuál quieres que implemente?
```

```
No hay ningún cambio/fix con `plan.md` listo para implementar. Usa `ms-how` primero para planificar alguno de los pendientes en `{changesDir}/inProgress/`.
```

Una vez identificada, esa es `{xxxx}` y su carpeta `{changesDir}/inProgress/{xxxx}/` para el resto del proceso.

## 2. Implementar

Implementa todo lo que dice `plan.md`:

- Ejecuta cada tarea de la sección **(b) Solución técnica** con tu proceso normal de ingeniería (editar código, verificar que compila / pasan los tests si los hay).
- Si `plan.md` tiene sección **(c) Cambios de arquitectura**, aplica esos cambios al fichero (o ficheros) de `docs.tech.architectureDocDir` que indique esa sección, como parte de esta implementación.
- Si `plan.md` tiene sección **(e) Verificación**, una vez completada toda la sección (b), recorre cada uno de sus ítems y comprueba que el resultado observable descrito se cumple de verdad (leyendo el código/DOM/estilos resultantes, no dando por hecho que la tarea de (b) que lo produce quedó bien). Si algún ítem no se cumple, corrígelo antes de continuar — no lo des por terminado ni lo menciones como pendiente al usuario.

Si durante la implementación descubres que el plan no es viable tal cual está escrito, para y coméntaselo al usuario en vez de improvisar una solución distinta sin decírselo.

## 2.1 Actualizar documentación tras implementar

Una vez implementado en código lo anterior, actualiza siempre lo siguiente antes de mover la carpeta:

- **`docs.tech.architectureDocDir`** — si está configurado, revisa el fichero (o ficheros) de esa carpeta que correspondan al área tocada y déjalos reflejando fielmente el estado técnico resultante. Aplica lo que diga la sección (c) del plan si la tenía; si no la tenía pero al implementar resulta que sí se ha tocado algo que esa carpeta describe, actualízala igualmente — no depende únicamente de que el plan lo anticipara. Si la solución introduce un tema nuevo que no encaja en ningún fichero existente de esa carpeta, crea uno nuevo con el siguiente número libre (`NN-slug.md`, sin reutilizar ni renumerar los existentes) y añádelo a la tabla-índice de `INDEX.md`. Si no está configurado, omite este punto sin preguntar nada.
- **`docs.functional.featuresDocPathDir`** — si está configurado, es documentación **funcional**, no un changelog: describe qué puede hacer la app hoy, organizado por área/módulo funcional, no una lista cronológica de changes/fixes. En cualquiera de los dos casos de abajo, si lo implementado amplía o modifica una funcionalidad que ya tiene entrada propia, **edítala in place** para que siga describiendo fielmente el comportamiento actual (nunca añadas una entrada nueva para lo mismo), añadiendo el `xxxx` de esta entrada a su campo **Código**; si es una funcionalidad nueva, crea una entrada en el área funcional que le corresponda (crea el área si no existe todavía) con el `xxxx` de esta entrada en **Código**.
  - **Si `featuresDocPathDir` es una carpeta** (la convención recomendada — compruébalo mirando si existe como directorio, o si aún no existe pero el valor no termina en `.md`): invoca la skill `ms-internal-doc-features` (herramienta Skill) con `action=find` y una descripción breve de la funcionalidad implementada, para saber si ya tiene fichero propio. Redacta el contenido final (cuerpo, `Disponible en`, lista completa de `Código`) tú mismo con el criterio de arriba, y guárdalo invocando `ms-internal-doc-features` con `action=upsert` — pasando `fichero_existente` si `find` devolvió una coincidencia, u omitiéndolo si es una entrada nueva.
  - **Si `featuresDocPathDir` es un único fichero** (proyectos que todavía no han migrado a carpeta): edítalo tú mismo con el mismo criterio, usando como plantilla de una entrada nueva la de [`FEATURES.template.md`](FEATURES.template.md) de esta skill; créalo a partir de esa plantilla si todavía no existe.
  - Si `docs.functional.featuresDocPathDir` no está configurado, omite este punto sin preguntar nada.
- **`docs.tech.styleBibleDocDir`** — si está configurado, revisa el fichero (o ficheros) de esa carpeta que correspondan y actualízalos si lo implementado introduce o modifica convenciones de estilo (visual, de interacción, de redacción, etc.) relevantes para el proyecto. Igual que con `architectureDocDir`, si el tema no encaja en ningún fichero existente crea uno nuevo con el siguiente número libre y añádelo a la tabla-índice de `INDEX.md`. Si no está configurado, o lo implementado no afecta a ninguna convención de estilo, omite este punto sin preguntar nada.

## 3. Mover la carpeta a `implemented`

Invoca la skill `ms-internal-workflow` (herramienta Skill) con `action=move`, `xxxx`, `from=inProgress` y `to=implemented` — no muevas la carpeta tú mismo.

## 4. Confirmar al usuario

Indica qué se ha implementado, qué documentación se ha actualizado (`docs.tech.architectureDocDir`/`docs.functional.featuresDocPathDir`/`docs.tech.styleBibleDocDir`, según aplicara), y que la carpeta se movió a `{changesDir}/implemented/{xxxx}/`.
