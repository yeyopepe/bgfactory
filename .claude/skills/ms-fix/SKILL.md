---
name: ms-fix
description: Analiza un bug o comportamiento roto reportado por el usuario, lo documenta en {changesDir}/inProgress y lo implementa directamente encadenando ms-implement, con el análisis acotado estrictamente al fix (cambio mínimo, sin ampliar alcance). Trigger: /ms-fix, o cuando el usuario pide explícitamente "un fix"/corregir un bug como parte del flujo de trabajo del proyecto.
metadata:
  version: 1.0.0
  uses: [ms-workflow, ms-tech-analysis, ms-implement]
---

# ms-fix

Analiza, documenta e implementa un fix (comportamiento roto) sobre el proyecto — para funcionalidad nueva o cambios intencionados usa la skill `ms-change`, no esta. Parte del framework `ms-*`.

Un fix es, por naturaleza, un cambio acotado: el análisis y la solución deben centrarse **única y exclusivamente en corregir el bug reportado**, con el menor cambio posible. Nada de aprovechar para refactorizar, renombrar o tocar código no relacionado con la causa raíz — eso, si hace falta, es un `ms-change` aparte.

Esta skill no implementa nada por sí misma: documenta la intención y encadena directamente la skill `ms-implement`, que es quien analiza la causa raíz técnica, escribe el `plan.md` y (si se confirma) implementa.

**Fuente de la verdad.** Para distinguir qué hace hoy el proyecto de lo que el usuario cree que hace, la única fuente de verdad es la documentación técnica y el código real — no asunciones ni memoria de la conversación. Para reunir ese contexto, invoca la skill `ms-tech-analysis` (herramienta Skill) pasándole un resumen del bug que se está analizando, en vez de leer tú mismo `framework.docs.tech` o explorar el código a ciegas: ella lee primero la documentación técnica configurada y explora código solo si hace falta, devolviendo el contexto reunido y cualquier incongruencia entre documentación y código (en ese caso el código manda). Si detecta alguna incongruencia, anótala en **Apuntes técnicos** al documentar (paso 2) para que `ms-implement` la tenga en cuenta más adelante. Tampoco cuenta como fuente de verdad el contenido de otros cambios/fixes que existan bajo `{changesDir}/**` (su `description.md` o `plan.md`, estén en `inProgress`, `implemented` o `closed`): son intención o análisis de otra entrada, no el estado real del proyecto.

## 0. Comprobar que el framework está inicializado

Si `.claude/ms-context.json` no existe en la raíz del repo, o le falta la sección `framework` (o campos suyos necesarios), no continúes: dile al usuario que primero debe ejecutar la skill `ms-init` para inicializar/completar el framework en este proyecto, y detente ahí.

```
Este proyecto todavía no tiene el framework `ms-*` inicializado (o le falta configuración). Ejecuta primero `/ms-init` antes de volver a invocarme.
```

## Pasos

1. **Entender el bug a nivel funcional.** Si hay ambigüedad sobre qué comportamiento es el correcto o cómo reproducirlo, pregunta. No hace falta localizar la causa raíz en código todavía — eso lo hace `ms-implement` al analizar el fix en detalle.
2. **Documentar la intención.** Invoca la skill `ms-workflow` (herramienta Skill) con `action=create`, `type=fix` y el resumen funcional de qué está mal y qué se espera en su lugar, para que se encargue de numerar el fix y crear el documento en `{changesDir}/inProgress/{xxxx}/`.

Si la funcionalidad que se describe incorpora un flujo, una secuencia de pasos/decisiones o una interacción entre estados o componentes (p.ej. cómo transiciona una pantalla, el orden de una operación, casos límite encadenados), incluye ese análisis como diagrama Mermaid (`flowchart`, `sequenceDiagram`, `stateDiagram-v2`, etc.) con las notas imprescindibles al pasárselo a `ms-workflow`, en vez de describirlo solo en prosa — así queda ya así en `description.md`. Usa prosa cuando no haya un flujo/relación clara que representar.

3. **Generar la propuesta visual.** Si el cambio tiene componente visual (hay algo que decir en el punto "Definición visual de alto nivel" del paso 1), crea tú mismo, directamente en `{changesDir}/inProgress/{xxxx}/`, uno o varios ficheros `design_<descripción-del-elemento>.html` — uno por cada elemento visual diferenciado de la propuesta (p.ej. `design_modal-seleccion-mazo.html`, `design_barra-progreso.html`). Si el cambio no tiene componente visual (lógica interna, datos, backend), omite este paso por completo — no crees ficheros `design_*.html` vacíos ni de relleno.

   Cada fichero `design_*.html` es solo una maqueta visual, no un prototipo funcional:
   - Debe mostrar únicamente el aspecto (maquetación, estilos, iconografía) que tendría ese elemento aplicado al cambio — no necesita datos reales ni lógica, basta contenido de ejemplo estático que ilustre el resultado.
   - No debe tener funcionalidad real: nada de JavaScript que reaccione a eventos, ni llamadas a red, ni estado — como mucho, JS puramente decorativo si hiciera falta para el aspecto visual.
   - Ha de ser autocontenido: solo HTML, CSS y SVG, todo incrustado en el propio fichero (sin ficheros externos, sin CDNs, sin imports).

4. **Encadenar la implementación.** Invoca directamente la skill `ms-implement` (herramienta Skill) sobre ese mismo `xxxx`, indicando explícitamente que es un fix y que su análisis y solución deben limitarse estrictamente a corregir el bug documentado — cambio mínimo, sin ampliar alcance ni tocar nada no relacionado con la causa raíz. No le pidas al usuario que invoque `ms-implement` por separado: continúa tú mismo con ese flujo (análisis → `plan.md` → confirmación → implementación → mover a `implemented`), tal como lo define `ms-implement`.

No escribas tú mismo el documento de fix ni calcules el número `xxxx` — eso lo hace `ms-workflow` para mantener un único sitio con esa lógica. No escribas tú mismo el `plan.md` ni toques código directamente — eso lo hace `ms-implement` para mantener un único sitio con esa lógica.
