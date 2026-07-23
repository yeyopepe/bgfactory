- **Nombre**: Efecto visual de feedback al voltear una carta
- **Código**: 00075
- **Tipo**: change

## Prompt original del usuario

al darle la vuelta a la carta, aplica un pequeño efecto (levantar y bajar rápidamente) para dar feedback al usuario de que se ha dado la vuelta

## Descripción completa

Al voltear una carta (click sobre la carta en Modo Juego, interacción ya existente), debe percibirse un pequeño efecto visual justo en el momento del volteo — la carta se "levanta y baja rápidamente" — que confirme claramente al jugador que la acción de voltear ha surtido efecto.

Este efecto se dispara en cada volteo, en ambos sentidos (tanto al pasar de cara trasera a frontal como de frontal a trasera), cada vez que el jugador hace click sobre la carta y esta cambia de cara. Aplica únicamente donde el volteo ya está disponible hoy: en Modo Juego, con independencia de si la carta está "Bloqueada" o no (el bloqueo nunca ha afectado a esta interacción). No aplica en Modo Edición, donde el volteo no existe.

**Definición visual de alto nivel**: un feedback breve y sutil (del orden de una fracción de segundo) sobre la propia carta en el momento del volteo — perceptible pero discreto, coherente con el lenguaje visual del resto de piezas de juego de la mesa.

**Preguntas de alcance resueltas con el usuario**:
- ¿Debe reutilizar el efecto de "levantar" ya existente para el arrastre de piezas, o ser un efecto visual distinto? → Se pidió explícitamente un efecto visual **distinto y nuevo**, no una reutilización del sistema ya usado para el arrastre.
- ¿Se dispara en cada volteo o solo la primera vez? → En **cada volteo**, en ambos sentidos.

## Apuntes técnicos

- El volteo de carta ya está implementado en `src/ui/componentRenderer.js` (bloque `carta`, listener `click` que invoca `onCartaFlip`, conectado únicamente desde `src/modes/play/playMode.js`).
- El proyecto ya tiene un sistema de elevación reutilizable (`.lifted`, `beginDragLift`/`endDragLift` en `componentRenderer.js`, documentado en `STYLE_BIBLE.md` sección 6) para el efecto de "levantar" durante el arrastre en Modo Juego — pero el usuario ha pedido explícitamente **no** reutilizarlo para este feedback, sino un efecto visual nuevo y diferenciado.
- `STYLE_BIBLE.md` documenta ese sistema de elevación como "acotado únicamente a este estado transitorio y a este gesto (arrastre en Modo Juego)", y prohíbe animaciones complejas (`@keyframes`, animaciones narrativas) salvo las excepciones ya documentadas (temblor del dado, pan/zoom de mesa, ambas basadas en `transform` recalculado por JS, no CSS). Al ser un efecto nuevo y distinto, `ms-implement` deberá valorar cómo encaja (o si amplía) esa convención documentada, y reflejarlo en `STYLE_BIBLE.md` como parte del plan.
