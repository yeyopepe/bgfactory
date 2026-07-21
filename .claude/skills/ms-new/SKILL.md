---
name: ms-new
description: Analiza y documenta un cambio intencionado (nueva funcionalidad o modificación de comportamiento existente, no un bug) pedido por el usuario, dejándolo listo en {changesDir}/inProgress para planificar e implementar después con ms-implement. Si se indica un código ya en inProgress, amplía esa entrada en vez de crear una nueva. Con `/ms-new todo <código>` parte de una idea ya apuntada en {changesDir}/todo/ en vez de una petición nueva, y borra esa idea automáticamente al terminar (sin pedir confirmación). Trigger: /ms-new [xxxx], o cuando el usuario pide explícitamente "un change"/"documentar este cambio" como parte del flujo de trabajo del proyecto.
argument-hint: "[xxxx | todo <código>] <descripción del cambio>"
metadata:
  version: 1.6.0
  uses: [ms-workflow, ms-tech-analysis, ms-implement]
---

# ms-new

Analiza y documenta un cambio intencionado sobre el proyecto (funcionalidad nueva o modificación de comportamiento existente a propósito — para bugs usa la skill `ms-fix`, no esta). Parte del framework `ms-*`.

**No implementa nada.** Esta skill solo entiende y documenta el alcance funcional de lo que se pide; la solución técnica y la implementación las hace después la skill `ms-implement`, cuando se decida planificar/implementar esta entrada.

**Fuente de la verdad.** Al anticipar dudas y proponer respuestas (paso 1), la única fuente de verdad sobre cómo funciona hoy el proyecto es la documentación técnica y el código real — nunca asunciones, ni lo que se recuerde de conversaciones anteriores, ni lo que el usuario crea que hace el código. Para reunir ese contexto, invoca la skill `ms-tech-analysis` (herramienta Skill) pasándole un resumen de lo que se está analizando, en vez de leer tú mismo `framework.docs.tech` o explorar el código a ciegas: ella se encarga de leer primero la documentación técnica configurada y de explorar código solo si hace falta, y te devuelve el contexto reunido y cualquier incongruencia entre documentación y código que detecte (recuerda: en ese caso el código manda, no la documentación). Si detecta alguna incongruencia, anótala en **Apuntes técnicos** al documentar (paso 2) para que `ms-implement` la tenga en cuenta más adelante. Tampoco cuenta como fuente de verdad el contenido de otros cambios/fixes que existan bajo `{changesDir}/**` (su `description.md` o `plan.md`, estén en `inProgress`, `implemented` o `closed`): son intención o análisis de otra entrada, no el estado real del proyecto. Consúltalos antes de dar por buena una propuesta sobre convivencia con lo existente.

## 0. Comprobar que el framework está inicializado

Si `.claude/ms-context.json` no existe en la raíz del repo, o le falta la
sección `framework` (o campos suyos necesarios), no continúes: dile al
usuario que primero debe ejecutar la skill `ms-init` para
inicializar/completar el framework en este proyecto, y detente ahí.

## 0.1 Comprobar si el código indicado ya está en curso

Si el usuario, al invocar esta skill, indica un código de cambio/fix (`xxxx`) — p.ej. `/ms-new 0001 ...` o "añade esto al cambio 0001" — comprueba si existe esa carpeta **exactamente** en `{changesDir}/inProgress/{xxxx}/`.

- **Si existe y el usuario te da información nueva**: no es un cambio nuevo, sino una ampliación de esa entrada ya en curso. Ve directamente a la sección [Ampliar una entrada ya en `inProgress`](#ampliar-una-entrada-ya-en-inprogress) y no sigas con los pasos de más abajo.
- **Si existe, pero el usuario no te está añadiendo información nueva**: significa que debes revisar y reanalizar el cambio. Posibles causas:
   - Hace mucho tiempo que se escribió el fichero `description.md` y pueden haber funcionalidades nuevas ya implementadas.
   - El usuario puede haber editado `description.md` a mano e introducido cambios.
- **Si no existe** (esté o no ese `xxxx` en `implemented`/`closed`, o no exista en ningún sitio): es un cambio nuevo con un código nuevo. Continúa con el proceso habitual desde el paso 1, ignorando el código indicado — el `xxxx` real lo calculará `ms-workflow`, no lo asumas tú.
- Si no se ha indicado ningún código, continúa igualmente con el proceso habitual desde el paso 1.

## 0.2 Comprobar si se invoca a partir de una idea de `todo/`

Si el usuario invoca esta skill como `/ms-new todo <código>` (o pide explícitamente "convierte la idea `<código>` de todo en un change"), esta entrada no nace de una petición nueva del usuario en el chat, sino del contenido ya apuntado por `ms-todo`:

1. Comprueba que existe **exactamente** `{changesDir}/todo/{código}/description.md`. Si no existe, dile al usuario que no hay ninguna idea con ese código en `todo/` y detente ahí (no inventes ni asumas un código parecido).
2. Lee ese `description.md` completo (secciones `## Idea`, `## Código` y `## Notas`) y, si los hay, sus ficheros `design_*.html` de esa misma carpeta. Este es el contenido a analizar y documentar — úsalo como si fuera la petición del usuario para el resto del proceso, en vez de esperar una descripción nueva en el chat. Si el usuario añadió también contexto adicional al invocar la skill, súmalo al análisis.
3. Pregunta al usuario si quiere desarrollar la idea contigo antes de continuar. Si quiere, propón ideas y charla con él hasta refinar un poco más la idea antes de continuar con el punto 4. Si no quiere, pasa al punto4.
4. Continúa con el proceso habitual desde el paso 1 de "Pasos" (anticipar dudas, documentar con `ms-workflow`, propuesta visual), usando ese contenido como base. Si había `design_*.html` en la idea de `todo/`, tenlos en cuenta al construir la propuesta visual del paso 3 (no los copies tal cual sin más: son solo un boceto de partida, no una maqueta ya validada).
5. **Solo si el paso 2 de "Pasos" termina con éxito** (la entrada ya existe en `{changesDir}/inProgress/{xxxx}/`), borra automáticamente `{changesDir}/todo/{código}/` entera (`description.md` y cualquier `design_*.html` que tuviera), sin pedir confirmación al usuario — a diferencia de `ms-close`, aquí el borrado es una limpieza automática del origen ya migrado, no una acción destructiva que requiera aprobación. Si el paso 2 no llega a completarse, deja la idea tal cual en `todo/`.
6. En el paso 4 de "Pasos" (indicar el siguiente paso), menciona también que la idea `{código}` de `todo/` ha quedado convertida en el cambio `{xxxx}` y borrada de `todo/`.

## Pasos

1. **Entender el alcance y anticipar las dudas funcionales habituales.** No esperes a que surja una ambigüedad evidente: antes de documentar, revisa la petición y el código relevante del proyecto para construir tú mismo una lista de los puntos que habitualmente quedan indefinidos en este tipo de cambios. Repasa al menos:
   - **Casos límite y estados**: qué pasa en vacío, en error, durante la carga, si se cancela a medias.
   - **Convivencia con lo existente**: si esto sustituye, complementa o entra en conflicto con funcionalidad ya presente en el proyecto.
   - **Alcance de los datos**: si algo se guarda, dónde y para quién (si el proyecto distingue usuarios/partidas/sesiones); qué pasa al recargar o en otra sesión.
   - **Quién puede usarlo**: si el proyecto tiene roles o modos que restringen la acción.
   - **Definición visual de alto nivel**: qué elementos nuevos aparecen, en qué zona aproximada de la pantalla se ubican, cómo se activan/desactivan, qué feedback visual percibe el usuario al interactuar. Queda fuera de este análisis el detalle de bajo nivel (colores exactos, medidas, componentes concretos a reutilizar o crear) — eso lo resuelve `ms-implement` al planificar la solución técnica.

   Para cada punto relevante para este cambio concreto, no se lo devuelvas en bruto al usuario: propón tú una respuesta razonable a partir del contexto del proyecto y preséntale la lista completa (punto + tu propuesta) de una sola vez para que la confirme o corrija donde no esté de acuerdo, en vez de preguntar uno a uno. Si hay algún punto sobre el que no puedas ni siquiera proponer una asunción razonable, márcalo explícitamente como pregunta abierta dentro de esa misma lista.
2. **Documentar la intención.** Invoca la skill `ms-workflow` (herramienta Skill) con `action=create`, `type=change` y el resumen funcional de lo que se pide — incluyendo la lista de dudas del paso 1 ya resuelta (propuestas confirmadas, correcciones del usuario y, en su caso, definición visual de alto nivel acordada) — para que se encargue de numerar el cambio y crear el documento en `{changesDir}/inProgress/{xxxx}/`. Anota el `xxxx` que te devuelva: lo necesitas en el paso siguiente.

   Si la funcionalidad que se describe incorpora un flujo, una secuencia de pasos/decisiones o una interacción entre estados o componentes (p.ej. cómo transiciona una pantalla, el orden de una operación, casos límite encadenados), incluye ese análisis como diagrama Mermaid (`flowchart`, `sequenceDiagram`, `stateDiagram-v2`, etc.) con las notas imprescindibles al pasárselo a `ms-workflow`, en vez de describirlo solo en prosa — así queda ya así en `description.md`. Usa prosa cuando no haya un flujo/relación clara que representar.
3. **Generar la propuesta visual.** Si el cambio tiene componente visual (hay algo que decir en el punto "Definición visual de alto nivel" del paso 1), crea tú mismo, directamente en `{changesDir}/inProgress/{xxxx}/`, uno o varios ficheros `design_<descripción-del-elemento>.html` — uno por cada elemento visual diferenciado de la propuesta (p.ej. `design_modal-seleccion-mazo.html`, `design_barra-progreso.html`). Si el cambio no tiene componente visual (lógica interna, datos, backend), omite este paso por completo — no crees ficheros `design_*.html` vacíos ni de relleno.

   Cada fichero `design_*.html` es solo una maqueta visual, no un prototipo funcional:
   - Debe mostrar únicamente el aspecto (maquetación, estilos, iconografía) que tendría ese elemento aplicado al cambio — no necesita datos reales ni lógica, basta contenido de ejemplo estático que ilustre el resultado.
   - No debe tener funcionalidad real: nada de JavaScript que reaccione a eventos, ni llamadas a red, ni estado — como mucho, JS puramente decorativo si hiciera falta para el aspecto visual.
   - Ha de ser autocontenido: solo HTML, CSS y SVG, todo incrustado en el propio fichero (sin ficheros externos, sin CDNs, sin imports).
4. **Indicar el siguiente paso.** Informa al usuario de que el cambio queda documentado (`description.md`) y, si procede, con su propuesta visual (`design_*.html`); para planificarlo e implementarlo debe invocar la skill `ms-implement` sobre ese `xxxx`. Si el usuario quiere implementarlo ya mismo, puedes invocar `ms-implement` directamente tú.

No escribas tú mismo el documento de cambio ni calcules el número `xxxx` — eso lo hace `ms-workflow` para mantener un único sitio con esa lógica. Los ficheros `design_*.html`, en cambio, los escribes tú directamente: no son responsabilidad de `ms-workflow`, que es agnóstico al proyecto y no analiza ni diseña nada.

## Ampliar una entrada ya en `inProgress`

Cuando el paso 0.1 detecta que el `xxxx` indicado ya existe en `{changesDir}/inProgress/{xxxx}/`, no se crea una entrada nueva: se amplía la que ya hay.

1. **Leer lo ya documentado.** Abre `{changesDir}/inProgress/{xxxx}/description.md` para entender qué se pidió originalmente, y comprueba si ya existen ficheros `design_*.html` en esa misma carpeta.
2. **Entender la ampliación.** Aplica el mismo análisis del paso 1 de "Pasos" (casos límite, convivencia con lo existente, alcance de datos, quién puede usarlo, definición visual de alto nivel), pero centrado en lo que se pide añadir o modificar ahora **sobre** lo ya documentado, no desde cero. Propón tú las respuestas razonables y preséntaselas al usuario para confirmar, igual que en el flujo habitual.
3. **Actualizar `description.md` directamente** (sin invocar `ms-workflow`, que solo sabe crear entradas nuevas): añade la ampliación a la **Descripción completa** dejando claro qué es lo nuevo respecto a lo ya escrito, y añade el nuevo prompt del usuario a continuación del original en **Prompt original del usuario** (sin borrar el existente). No cambies el **Código** ni el **Tipo** ya fijados. Si lo que se añade incorpora un flujo, secuencia de pasos/decisiones o interacción entre estados/componentes, represéntalo con un diagrama Mermaid junto con las notas imprescindibles, igual que en el paso 2 de "Pasos". Mantén la misma separación que usa `ms-workflow` al crear la entrada: la **Descripción completa** es solo funcional, entendible por cualquier persona no técnica, sin ficheros, funciones ni clases; si al analizar la ampliación (p.ej. revisando código existente para las dudas de alcance) surge información técnica que convenga anotar, añádela a **Apuntes técnicos** en vez de a la Descripción completa — crea esa sección al final del documento si la entrada todavía no la tenía.
4. **Actualizar la propuesta visual si procede.** Si la ampliación introduce, modifica o elimina elementos visuales: crea nuevos ficheros `design_<descripción>.html` para los elementos nuevos, y edita (no borres sin más) los `design_*.html` existentes que la ampliación cambie, siguiendo las mismas reglas del paso 3 de "Pasos" (maqueta autocontenida en HTML+CSS+SVG, sin funcionalidad real). Si la ampliación no toca nada visual, deja los ficheros existentes tal cual.
5. **Avisar si hay `plan.md`.** Si `{changesDir}/inProgress/{xxxx}/plan.md` ya existe (es decir, ya se había planificado con `ms-implement`), dile al usuario que esta ampliación puede dejar ese plan desactualizado y que conviene volver a invocar `ms-implement` sobre `{xxxx}` para regenerarlo.
6. **Indicar el siguiente paso.** Confirma que `{changesDir}/inProgress/{xxxx}/description.md` (y, si procede, sus `design_*.html`) quedan actualizados con la ampliación, y recuerda que para planificar/implementar debe invocarse `ms-implement` sobre ese mismo `xxxx`.
