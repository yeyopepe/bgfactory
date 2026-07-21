- **Nombre**: Reducir catálogo de formatos de carta a los 5 estándares
- **Código**: 00054
- **Tipo**: fix

## Prompt original del usuario

Quiero que solo se usen estos formatos de cartas:
- "Poker estándar horizontal": 5:7
- "Poker estándar vertical": 7:5
- "Tarot estándar horizontal": (70 × 120 mm)
- "Tarot estándar vertical": (120 x 70 mm)
- "Cuadrada": 1:1

## Descripción completa

Al crear o editar una carta, el desplegable de "Proporción" ofrece hoy más opciones de las que deberían existir (incluye formatos como "Horizontal ancha", "Vertical alargada", "Vertical estándar" y "Horizontal estándar" que no corresponden a ningún formato real de carta usado en el juego).

Se espera que ese desplegable — tanto en la modal de configuración de una carta como en el editor de diseño de cartas — ofrezca únicamente estos 5 formatos, con estos nombres exactos:

1. **Poker estándar horizontal** — proporción 5:7
2. **Poker estándar vertical** — proporción 7:5
3. **Tarot estándar horizontal** — 70 × 120 mm
4. **Tarot estándar vertical** — 120 × 70 mm
5. **Cuadrada** — proporción 1:1

Cualquier otro formato que exista hoy debe desaparecer de la lista. Las cartas ya creadas en esta misma partida de prueba con alguno de los formatos eliminados no tienen datos reales que preservar (funcionalidad recién construida, sin usuarios todavía), así que no hace falta ningún tratamiento especial para ellas más allá de que la app siga funcionando con normalidad si se encuentra un valor antiguo.

## Apuntes técnicos

- El catálogo vive en `src/core/cardProportions.js` (`CARD_PROPORTIONS`), consumido por el desplegable "Proporción" de `ui/componentModal.js`, por `ui/cardEditorModal.js` (recalcula el tamaño de lienzo al cambiar de proporción) y por `ui/componentRenderer.js`/`ui/resizeHandle.js` (ratio usado al redimensionar la carta en la mesa).
- `DEFAULT_PROPORTION` (hoy `'2:3'`, usado como valor por defecto de una carta nueva y como fallback de `getProporcionRatio` para valores no reconocidos) debe pasar a ser uno de los 5 valores nuevos — a decidir en el análisis técnico de `ms-implement`.
- Los ratios de "Tarot" se derivan de las medidas en mm indicadas (70×120 y 120×70), a diferencia del resto del catálogo que usa fracciones simples directamente.
- No se conoce ningún dato guardado real (localStorage/export) con los formatos que se eliminan, al ser el tipo `'carta'` una funcionalidad recién implementada (cambio 00053, aún no cerrado) — no se espera necesidad de migración, pero `getProporcionRatio` seguirá teniendo un fallback por si apareciera un valor no reconocido.
