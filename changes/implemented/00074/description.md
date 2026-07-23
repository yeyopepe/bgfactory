- **Nombre**: El clic sobre una carta no la voltea, solo la levanta
- **Código**: 00074
- **Tipo**: fix

## Prompt original del usuario

la interacción de las cartas (darle la vuelta) no funciona al hacer clic, ahora solo "levanta la carta". Levantar la carta solo debería hacerlo si la arrastra.

## Descripción completa

Al hacer clic simple sobre una carta del tablero, la carta debería darse la vuelta (mostrar su otra cara). Actualmente eso no ocurre: el clic solo produce un efecto de "levantar" la carta (un realce visual, como si se elevara sobre el tablero), pero la carta no se voltea.

Ese efecto de "levantar" la carta debería producirse únicamente mientras el usuario la está arrastrando (drag), no al hacer un simple clic sin arrastre.

Comportamiento esperado:
- Clic simple sobre una carta (sin arrastrar): la carta se voltea, mostrando su otra cara.
- Arrastrar una carta: mientras dura el arrastre, la carta se levanta (efecto visual de elevación); al soltarla, deja de estar levantada. No debe voltearse por el simple hecho de arrastrarla.

## Apuntes técnicos

Sin incongruencias ni información técnica adicional detectada en esta fase; el análisis de causa raíz (probablemente en la gestión de eventos de clic/drag sobre la carta) lo hará `ms-implement`.
