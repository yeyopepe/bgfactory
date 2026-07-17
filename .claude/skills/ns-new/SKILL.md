---
name: ns-new
description: Analiza y documenta un cambio intencionado (nueva funcionalidad o modificación de comportamiento existente, no un bug) pedido por el usuario, dejándolo listo en {changesDir}/inProgress para planificar e implementar después con ms-implement. Trigger: /ns-new, o cuando el usuario pide explícitamente "un change"/"documentar este cambio" como parte del flujo de trabajo del proyecto.
metadata:
  version: 1.0.0
---

# ns-new

Analiza y documenta un cambio intencionado sobre el proyecto (funcionalidad nueva o modificación de comportamiento existente a propósito — para bugs usa la skill `ms-fix`, no esta). Parte del framework `ms-*`.

**No implementa nada.** Esta skill solo entiende y documenta el alcance funcional de lo que se pide; la solución técnica y la implementación las hace después la skill `ms-implement`, cuando se decida planificar/implementar esta entrada.

## 0. Comprobar que el framework está inicializado

Si `.claude/ms-context.json` no existe en la raíz del repo, o le falta la
sección `framework` (o campos suyos necesarios), no continúes: dile al
usuario que primero debe ejecutar la skill `ms-init` para
inicializar/completar el framework en este proyecto, y detente ahí.

## Pasos

1. **Entender el alcance.** Si la petición del usuario es ambigua sobre qué debe cambiar o cómo debe comportarse el resultado, pregunta — no hace falta resolver el "cómo" técnico todavía, solo el "qué" funcional.
2. **Documentar la intención.** Invoca la skill `ms-workflow` (herramienta Skill) con `type=change` y el resumen funcional de lo que se pide, para que se encargue de numerar el cambio y crear el documento en `{changesDir}/inProgress/{xxxx}/`.
3. **Indicar el siguiente paso.** Informa al usuario de que el cambio queda documentado y pendiente; para planificarlo e implementarlo debe invocar la skill `ms-implement` sobre ese `xxxx`. Si el usuario quiere implementarlo ya mismo, puedes invocar `ms-implement` directamente tú.

No escribas tú mismo el documento de cambio ni calcules el número `xxxx` — eso lo hace `ms-workflow` para mantener un único sitio con esa lógica.
