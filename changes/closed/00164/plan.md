- **Fecha creación**: 2026-08-06

## (a) Anotaciones funcionales

- Fuera de alcance: no se restaura ninguna proporción anterior al volver a marcar la casilla "Mantener proporción" — solo se sincroniza al desmarcarla, tal como describe `description.md`.
- Fuera de alcance: no se toca el comportamiento de `resizeHandle.js` en sí (el `clamp` que fuerza la ratio cuando `proporcion !== 'libre'`) — el efecto sobre el redimensionado por arrastre es una consecuencia natural de que `proporcion` pase a `'libre'`, no un cambio a ese fichero.
- Sin dudas técnicas pendientes con el usuario: el comportamiento ya quedó confirmado en `description.md`.

## (b) Solución técnica

1. En `src/ui/componentModal.js`, dentro de `openComponentModal` (línea 224), declarar una variable de closure `let cartaProporcionSelect = null;` cerca de donde se crea `sizeSection` (antes de la línea 359, junto a `keepRatioCheckbox`). Esta variable es el punto de comunicación entre la sección "Tamaño" (genérica) y `renderCartaSpecificFields` (específica de cartas), siguiendo el mismo patrón de closures ya usado en el fichero (p.ej. `proporcionSelect.value` ya se reasigna desde los `onAccept` anidados de `renderCartaSpecificFields`, líneas ~1416 y ~1504).
2. En `renderCartaSpecificFields` (línea 1366), justo tras crear `proporcionSelect` (línea 1374) y antes de que la función devuelva/continúe, asignar `cartaProporcionSelect = proporcionSelect;` para que quede disponible en el scope exterior. Esta función solo se invoca cuando `workingComponent.type === 'carta'` (línea 830), así que `cartaProporcionSelect` permanece `null` para cualquier otro tipo de componente — no hace falta ninguna comprobación adicional de tipo.
3. Añadir un listener `change` a `keepRatioCheckbox` (tras su creación, ~línea 363, junto al resto de la sección "Tamaño"):
   ```js
   keepRatioCheckbox.addEventListener('change', () => {
     if (keepRatioCheckbox.checked || !cartaProporcionSelect) return;
     workingComponent.properties.proporcion = 'libre';
     cartaProporcionSelect.value = 'libre';
   });
   ```
   - `!cartaProporcionSelect` cubre tanto "no es una carta" como "la sección de carta aún no se ha renderizado" (por orden de creación de las secciones del modal) — en ambos casos no hay nada que sincronizar.
   - Solo actúa cuando se desmarca (`checked === false`), tal como pide `description.md`; marcarla de nuevo no dispara ningún efecto.

No hace falta tocar `resizeHandle.js` ni `cardProportions.js`: al quedar `workingComponent.properties.proporcion === 'libre'`, el `clamp` que ya usa `getProporcionRatio` en el redimensionado por arrastre (ver Apuntes técnicos de `description.md`) deja de forzar una ratio fija de forma automática, sin cambios adicionales.
