---
name: ms-new
description: Analiza y documenta un cambio intencionado (nueva funcionalidad o modificación de comportamiento existente, no un bug) pedido por el usuario, dejándolo listo en {changesDir}/inProgress para planificar e implementar después con ms-how. Si se indica un código ya en inProgress, amplía esa entrada en vez de crear una nueva. Con `/ms-new todo <código>` parte de una idea ya apuntada en {changesDir}/todo/ en vez de una petición nueva, y borra esa idea automáticamente al terminar (sin pedir confirmación). Trigger: /ms-new [xxxx], o cuando el usuario pide explícitamente "un change"/"documentar este cambio" como parte del flujo de trabajo del proyecto.
argument-hint: "[xxxx | todo <código>] <descripción del cambio>"
model: claude-sonnet-5
effort: medium
metadata:
  version: 1.9.0
  uses: [ms-internal-workflow, ms-internal-tech-analysis, ms-how]
---

# ms-new

Analiza y documenta un cambio intencionado sobre el proyecto (funcionalidad nueva o modificación de comportamiento existente a propósito — para bugs usa la skill `ms-fix`, no esta). Parte del framework `ms-*`.

**No implementa nada.** Esta skill solo entiende y documenta el alcance funcional de lo que se pide; la solución técnica la hace después la skill `ms-how`, y la implementación la skill `ms-do`, cuando se decida planificar/implementar esta entrada.

**Los mockups y diagramas son el eje central de la definición de un cambio, no un añadido opcional.** Siempre que el cambio lo permita, su intención debe quedar fijada mediante una representación visual — no solo prosa — antes de darla por documentada, y esa representación debe quedar **validada por el usuario**, no solo generada. Hay dos casos válidos, y no son excluyentes entre sí dentro de un mismo cambio:
- **Cambios visuales o de estilo** (aparece o se modifica algo que el usuario ve/toca en pantalla): maqueta(s) HTML (`design_*.html`, paso 3).
- **Flujos o funcionamiento nuevos/modificados** (una secuencia de pasos, una transición entre estados, una interacción entre componentes): diagrama Mermaid dentro de `description.md` (paso 2).

Solo prescinde de ambos cuando el cambio no tenga de verdad ninguna dimensión visual ni de flujo representable (p.ej. un cambio puramente de datos/backend sin interacción ni secuencia relevante) — no por defecto ni por ahorrar el paso.

**Fuente de la verdad.** Al anticipar dudas y proponer respuestas (paso 1), la única fuente de verdad sobre cómo funciona hoy el proyecto es la documentación técnica y el código real — nunca asunciones, ni lo que se recuerde de conversaciones anteriores, ni lo que el usuario crea que hace el código. Para reunir ese contexto, invoca la skill `ms-internal-tech-analysis` (herramienta Skill) pasándole un resumen de lo que se está analizando, en vez de leer tú mismo `framework.docs.tech` o explorar el código a ciegas: ella se encarga de leer primero la documentación técnica configurada y de explorar código solo si hace falta, y te devuelve el contexto reunido y cualquier incongruencia entre documentación y código que detecte (recuerda: en ese caso el código manda, no la documentación). Si detecta alguna incongruencia, anótala en **Apuntes técnicos** al documentar (paso 2) para que `ms-how` la tenga en cuenta más adelante. Tampoco cuenta como fuente de verdad el contenido de otros cambios/fixes que existan bajo `{changesDir}/**` (su `description.md` o `plan.md`, estén en `inProgress`, `implemented` o `closed`): son intención o análisis de otra entrada, no el estado real del proyecto. Consúltalos antes de dar por buena una propuesta sobre convivencia con lo existente.

## 0. Comprobar que el framework está inicializado

Si `.claude/ms-context.json` no existe en la raíz del repo, o le falta la
sección `framework` (o campos suyos necesarios), no continúes: dile al
usuario que primero debe ejecutar la skill `ms-init` para
inicializar/completar el framework en este proyecto, y detente ahí.

```
Este proyecto todavía no tiene el framework `ms-*` inicializado (o le falta configuración). Ejecuta primero `/ms-init` antes de volver a invocarme.
```

## 0.1 Comprobar si el código indicado ya está en curso

Si el usuario, al invocar esta skill, indica un código de cambio/fix (`xxxx`) — p.ej. `/ms-new 0001 ...` o "añade esto al cambio 0001" — comprueba si existe esa carpeta **exactamente** en `{changesDir}/inProgress/{xxxx}/`.

- **Si existe y el usuario te da información nueva**: no es un cambio nuevo, sino una ampliación de esa entrada ya en curso. Lee y sigue completo [`extend-entry.md`](extend-entry.md) de esta misma carpeta — no sigas con los pasos de más abajo.
- **Si existe, pero el usuario no te está añadiendo información nueva**: significa que debes revisar y reanalizar el cambio. Posibles causas:
   - Hace mucho tiempo que se escribió el fichero `description.md` y pueden haber funcionalidades nuevas ya implementadas.
   - El usuario puede haber editado `description.md` a mano e introducido cambios.
- **Si no existe** (esté o no ese `xxxx` en `implemented`/`closed`, o no exista en ningún sitio): es un cambio nuevo con un código nuevo. Continúa con el proceso habitual desde el paso 1, ignorando el código indicado — el `xxxx` real lo calculará `ms-internal-workflow`, no lo asumas tú.
- Si no se ha indicado ningún código, continúa igualmente con el proceso habitual desde el paso 1.

## 0.2 Comprobar si se invoca a partir de una idea de `todo/`

Si el usuario invoca esta skill como `/ms-new todo <código>` (o pide explícitamente "convierte la idea `<código>` de todo en un change"), esta entrada no nace de una petición nueva del usuario en el chat, sino del contenido ya apuntado por `ms-todo`: lee y sigue completo [`todo-mode.md`](todo-mode.md) de esta misma carpeta antes de continuar.

Si no se invocó así, sigue con el proceso habitual desde el paso 1 de "Pasos".

## Pasos

1. **Entender el alcance y anticipar las dudas funcionales habituales.** No esperes a que surja una ambigüedad evidente: antes de documentar, revisa la petición y el código relevante del proyecto para construir tú mismo una lista de los puntos que habitualmente quedan indefinidos en este tipo de cambios. Repasa al menos:
   - **Casos límite y estados**: qué pasa en vacío, en error, durante la carga, si se cancela a medias.
   - **Convivencia con lo existente**: si esto sustituye, complementa o entra en conflicto con funcionalidad ya presente en el proyecto.
   - **Alcance de los datos**: si algo se guarda, dónde y para quién (si el proyecto distingue usuarios/partidas/sesiones); qué pasa al recargar o en otra sesión.
   - **Quién puede usarlo**: si el proyecto tiene roles o modos que restringen la acción.
   - **Definición visual de alto nivel**: qué elementos nuevos aparecen, en qué zona aproximada de la pantalla se ubican, cómo se activan/desactivan, qué feedback visual percibe el usuario al interactuar. Queda fuera de este análisis el detalle de bajo nivel (colores exactos, medidas, componentes concretos a reutilizar o crear) — eso lo resuelve `ms-how` al planificar la solución técnica.

   Para cada punto relevante para este cambio concreto, no se lo devuelvas en bruto al usuario: propón tú una respuesta razonable a partir del contexto del proyecto y preséntale la lista completa (punto + tu propuesta) de una sola vez para que la confirme o corrija donde no esté de acuerdo, en vez de preguntar uno a uno. Si hay algún punto sobre el que no puedas ni siquiera proponer una asunción razonable, márcalo explícitamente como pregunta abierta dentro de esa misma lista.
2. **Documentar la intención.** Invoca la skill `ms-internal-workflow` (herramienta Skill) con `action=create`, `type=change` y el resumen funcional de lo que se pide — incluyendo la lista de dudas del paso 1 ya resuelta (propuestas confirmadas, correcciones del usuario y, en su caso, definición visual de alto nivel acordada) — para que se encargue de numerar el cambio y crear el documento en `{changesDir}/inProgress/{xxxx}/`. Anota el `xxxx` que te devuelva: lo necesitas en el paso siguiente.

   Si la funcionalidad que se describe incorpora un flujo, una secuencia de pasos/decisiones o una interacción entre estados o componentes (p.ej. cómo transiciona una pantalla, el orden de una operación, casos límite encadenados), incluye ese análisis como diagrama Mermaid (`flowchart`, `sequenceDiagram`, `stateDiagram-v2`, etc.) con las notas imprescindibles al pasárselo a `ms-internal-workflow`, en vez de describirlo solo en prosa — así queda ya así en `description.md`. Usa prosa cuando no haya un flujo/relación clara que representar.
3. **Generar la propuesta visual.** Si el cambio tiene componente visual (hay algo que decir en el punto "Definición visual de alto nivel" del paso 1), crea tú mismo, directamente en `{changesDir}/inProgress/{xxxx}/`, uno o varios ficheros `design_<descripción-del-elemento>.html` — uno por cada elemento visual diferenciado de la propuesta (p.ej. `design_modal-seleccion-mazo.html`, `design_barra-progreso.html`). Si el cambio no tiene componente visual (lógica interna, datos, backend), omite este paso por completo — no crees ficheros `design_*.html` vacíos ni de relleno.

   Cada fichero `design_*.html` es solo una maqueta visual, no un prototipo funcional:
   - Debe mostrar únicamente el aspecto (maquetación, estilos, iconografía) que tendría ese elemento aplicado al cambio — no necesita datos reales ni lógica, basta contenido de ejemplo estático que ilustre el resultado.
   - No debe tener funcionalidad real: nada de JavaScript que reaccione a eventos, ni llamadas a red, ni estado — como mucho, JS puramente decorativo si hiciera falta para el aspecto visual.
   - Ha de ser autocontenido: solo HTML, CSS y SVG, todo incrustado en el propio fichero (sin ficheros externos, sin CDNs, sin imports).
4. **Validar la representación visual con el usuario.** Si el paso 2 incluyó algún diagrama Mermaid o el paso 3 generó algún `design_*.html`, no los des por buenos solo porque se hayan escrito: preséntaselos al usuario (indícale la ruta de cada `design_*.html` para que lo abra, y muestra el diagrama Mermaid) y pídele que confirme si reflejan lo que tenía en mente o qué cambiaría.

   ```
   La propuesta visual queda en {rutas de los design_*.html} y el flujo como diagrama en description.md. ¿Reflejan lo que tenías en mente, o hay algo que cambiar antes de seguir?
   ```

   Si pide cambios, ajusta el/los fichero(s) o el diagrama y vuelve a presentarlo hasta que lo confirme. Si el cambio no generó ningún diagrama ni `design_*.html` (paso 1 no encontró dimensión visual ni de flujo), omite este paso.
5. **Indicar el siguiente paso.** Informa al usuario de que el cambio queda documentado (`description.md`) y, si procede, con su propuesta visual ya validada (`design_*.html`); para planificarlo e implementarlo debe invocar la skill `ms-how` sobre ese `xxxx`. Si el usuario quiere implementarlo ya mismo, puedes invocar `ms-how` directamente tú.

No escribas tú mismo el documento de cambio ni calcules el número `xxxx` — eso lo hace `ms-internal-workflow` para mantener un único sitio con esa lógica. Los ficheros `design_*.html`, en cambio, los escribes tú directamente: no son responsabilidad de `ms-internal-workflow`, que es agnóstico al proyecto y no analiza ni diseña nada.

## Ampliar una entrada ya en `inProgress`

Cuando el paso 0.1 detecta que el `xxxx` indicado ya existe en `{changesDir}/inProgress/{xxxx}/`, no se crea una entrada nueva: se amplía la que ya hay. Procedimiento completo en [`extend-entry.md`](extend-entry.md) de esta misma carpeta.
