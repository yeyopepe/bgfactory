---
name: ms-new
description: Analiza y documenta un cambio intencionado (nueva funcionalidad o modificación de comportamiento existente, no un bug) pedido por el usuario, dejándolo listo en {changesDir}/inProgress para planificar e implementar después con ms-implement. Si se indica un código ya en inProgress, amplía esa entrada en vez de crear una nueva. Trigger: /ms-new [xxxx], o cuando el usuario pide explícitamente "un change"/"documentar este cambio" como parte del flujo de trabajo del proyecto.
argument-hint: "[xxxx] <descripción del cambio>"
metadata:
  version: 1.3.0
---

# ms-new

Analiza y documenta un cambio intencionado sobre el proyecto (funcionalidad nueva o modificación de comportamiento existente a propósito — para bugs usa la skill `ms-fix`, no esta). Parte del framework `ms-*`.

**No implementa nada.** Esta skill solo entiende y documenta el alcance funcional de lo que se pide; la solución técnica y la implementación las hace después la skill `ms-implement`, cuando se decida planificar/implementar esta entrada.

**Fuente de la verdad.** Al anticipar dudas y proponer respuestas (paso 1), la única fuente de verdad sobre cómo funciona hoy el proyecto es el código, el grafo de contexto (`projectGraphPath`, si está configurado) y la documentación técnica (`architectureDocPath`, si está configurada) — nunca asunciones, ni lo que se recuerde de conversaciones anteriores, ni lo que el usuario crea que hace el código. Tampoco cuenta como fuente de verdad el contenido de otros cambios/fixes que existan bajo `{changesDir}/**` (su `description.md` o `plan.md`, estén en `inProgress`, `implemented` o `closed`): son intención o análisis de otra entrada, no el estado real del proyecto. Consúltalos antes de dar por buena una propuesta sobre convivencia con lo existente.

## 0. Comprobar que el framework está inicializado

Si `.claude/ms-context.json` no existe en la raíz del repo, o le falta la
sección `framework` (o campos suyos necesarios), no continúes: dile al
usuario que primero debe ejecutar la skill `ms-init` para
inicializar/completar el framework en este proyecto, y detente ahí.

## 0.1 Comprobar si el código indicado ya está en curso

Si el usuario, al invocar esta skill, indica un código de cambio/fix (`xxxx`) — p.ej. `/ms-new 0001 ...` o "añade esto al cambio 0001" — comprueba si existe esa carpeta **exactamente** en `{changesDir}/inProgress/{xxxx}/`.

- **Si existe**: no es un cambio nuevo, sino una ampliación de esa entrada ya en curso. Ve directamente a la sección [Ampliar una entrada ya en `inProgress`](#ampliar-una-entrada-ya-en-inprogress) y no sigas con los pasos de más abajo.
- **Si no existe** (esté o no ese `xxxx` en `implemented`/`closed`, o no exista en ningún sitio): es un cambio nuevo con un código nuevo. Continúa con el proceso habitual desde el paso 1, ignorando el código indicado — el `xxxx` real lo calculará `ms-workflow`, no lo asumas tú.
- Si no se ha indicado ningún código, continúa igualmente con el proceso habitual desde el paso 1.

## Pasos

1. **Entender el alcance y anticipar las dudas funcionales habituales.** No esperes a que surja una ambigüedad evidente: antes de documentar, revisa la petición y el código relevante del proyecto para construir tú mismo una lista de los puntos que habitualmente quedan indefinidos en este tipo de cambios. Repasa al menos:
   - **Casos límite y estados**: qué pasa en vacío, en error, durante la carga, si se cancela a medias.
   - **Convivencia con lo existente**: si esto sustituye, complementa o entra en conflicto con funcionalidad ya presente en el proyecto.
   - **Alcance de los datos**: si algo se guarda, dónde y para quién (si el proyecto distingue usuarios/partidas/sesiones); qué pasa al recargar o en otra sesión.
   - **Quién puede usarlo**: si el proyecto tiene roles o modos que restringen la acción.
   - **Definición visual de alto nivel**: qué elementos nuevos aparecen, en qué zona aproximada de la pantalla se ubican, cómo se activan/desactivan, qué feedback visual percibe el usuario al interactuar. Queda fuera de este análisis el detalle de bajo nivel (colores exactos, medidas, componentes concretos a reutilizar o crear) — eso lo resuelve `ms-implement` al planificar la solución técnica.

   Para cada punto relevante para este cambio concreto, no se lo devuelvas en bruto al usuario: propón tú una respuesta razonable a partir del contexto del proyecto y preséntale la lista completa (punto + tu propuesta) de una sola vez para que la confirme o corrija donde no esté de acuerdo, en vez de preguntar uno a uno. Si hay algún punto sobre el que no puedas ni siquiera proponer una asunción razonable, márcalo explícitamente como pregunta abierta dentro de esa misma lista.
2. **Documentar la intención.** Invoca la skill `ms-workflow` (herramienta Skill) con `action=create`, `type=change` y el resumen funcional de lo que se pide — incluyendo la lista de dudas del paso 1 ya resuelta (propuestas confirmadas, correcciones del usuario y, en su caso, definición visual de alto nivel acordada) — para que se encargue de numerar el cambio y crear el documento en `{changesDir}/inProgress/{xxxx}/`. Anota el `xxxx` que te devuelva: lo necesitas en el paso siguiente.
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
3. **Actualizar `description.md` directamente** (sin invocar `ms-workflow`, que solo sabe crear entradas nuevas): añade la ampliación a la **Descripción completa** dejando claro qué es lo nuevo respecto a lo ya escrito, y añade el nuevo prompt del usuario a continuación del original en **Prompt original del usuario** (sin borrar el existente). No cambies el **Código** ni el **Tipo** ya fijados.
4. **Actualizar la propuesta visual si procede.** Si la ampliación introduce, modifica o elimina elementos visuales: crea nuevos ficheros `design_<descripción>.html` para los elementos nuevos, y edita (no borres sin más) los `design_*.html` existentes que la ampliación cambie, siguiendo las mismas reglas del paso 3 de "Pasos" (maqueta autocontenida en HTML+CSS+SVG, sin funcionalidad real). Si la ampliación no toca nada visual, deja los ficheros existentes tal cual.
5. **Avisar si hay `plan.md`.** Si `{changesDir}/inProgress/{xxxx}/plan.md` ya existe (es decir, ya se había planificado con `ms-implement`), dile al usuario que esta ampliación puede dejar ese plan desactualizado y que conviene volver a invocar `ms-implement` sobre `{xxxx}` para regenerarlo.
6. **Indicar el siguiente paso.** Confirma que `{changesDir}/inProgress/{xxxx}/description.md` (y, si procede, sus `design_*.html`) quedan actualizados con la ampliación, y recuerda que para planificar/implementar debe invocarse `ms-implement` sobre ese mismo `xxxx`.
