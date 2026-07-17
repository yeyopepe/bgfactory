---
name: ms-new
description: Analiza y documenta un cambio intencionado (nueva funcionalidad o modificación de comportamiento existente, no un bug) pedido por el usuario, dejándolo listo en {changesDir}/inProgress para planificar e implementar después con ms-implement. Trigger: /ms-new, o cuando el usuario pide explícitamente "un change"/"documentar este cambio" como parte del flujo de trabajo del proyecto.
metadata:
  version: 1.1.0
---

# ms-new

Analiza y documenta un cambio intencionado sobre el proyecto (funcionalidad nueva o modificación de comportamiento existente a propósito — para bugs usa la skill `ms-fix`, no esta). Parte del framework `ms-*`.

**No implementa nada.** Esta skill solo entiende y documenta el alcance funcional de lo que se pide; la solución técnica y la implementación las hace después la skill `ms-implement`, cuando se decida planificar/implementar esta entrada.

## 0. Comprobar que el framework está inicializado

Si `.claude/ms-context.json` no existe en la raíz del repo, o le falta la
sección `framework` (o campos suyos necesarios), no continúes: dile al
usuario que primero debe ejecutar la skill `ms-init` para
inicializar/completar el framework en este proyecto, y detente ahí.

## Pasos

1. **Entender el alcance y anticipar las dudas funcionales habituales.** No esperes a que surja una ambigüedad evidente: antes de documentar, revisa la petición y el código relevante del proyecto para construir tú mismo una lista de los puntos que habitualmente quedan indefinidos en este tipo de cambios. Repasa al menos:
   - **Casos límite y estados**: qué pasa en vacío, en error, durante la carga, si se cancela a medias.
   - **Convivencia con lo existente**: si esto sustituye, complementa o entra en conflicto con funcionalidad ya presente en el proyecto.
   - **Alcance de los datos**: si algo se guarda, dónde y para quién (si el proyecto distingue usuarios/partidas/sesiones); qué pasa al recargar o en otra sesión.
   - **Quién puede usarlo**: si el proyecto tiene roles o modos que restringen la acción.
   - **Definición visual de alto nivel**: qué elementos nuevos aparecen, en qué zona aproximada de la pantalla se ubican, cómo se activan/desactivan, qué feedback visual percibe el usuario al interactuar. Queda fuera de este análisis el detalle de bajo nivel (colores exactos, medidas, componentes concretos a reutilizar o crear) — eso lo resuelve `ms-implement` al planificar la solución técnica.

   Para cada punto relevante para este cambio concreto, no se lo devuelvas en bruto al usuario: propón tú una respuesta razonable a partir del contexto del proyecto y preséntale la lista completa (punto + tu propuesta) de una sola vez para que la confirme o corrija donde no esté de acuerdo, en vez de preguntar uno a uno. Si hay algún punto sobre el que no puedas ni siquiera proponer una asunción razonable, márcalo explícitamente como pregunta abierta dentro de esa misma lista.
2. **Documentar la intención.** Invoca la skill `ms-workflow` (herramienta Skill) con `type=change` y el resumen funcional de lo que se pide — incluyendo la lista de dudas del paso 1 ya resuelta (propuestas confirmadas, correcciones del usuario y, en su caso, definición visual de alto nivel acordada) — para que se encargue de numerar el cambio y crear el documento en `{changesDir}/inProgress/{xxxx}/`.
3. **Indicar el siguiente paso.** Informa al usuario de que el cambio queda documentado y pendiente; para planificarlo e implementarlo debe invocar la skill `ms-implement` sobre ese `xxxx`. Si el usuario quiere implementarlo ya mismo, puedes invocar `ms-implement` directamente tú.

No escribas tú mismo el documento de cambio ni calcules el número `xxxx` — eso lo hace `ms-workflow` para mantener un único sitio con esa lógica.
