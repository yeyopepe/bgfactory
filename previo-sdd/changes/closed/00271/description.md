- **Name**: Baraja francesa estándar — Las cartas no se agrupan al crearse
- **Code**: 00271
- **Type**: change
- **Creation date**: 2026-09-15

## Full description

El conjunto pre-definido "Baraja francesa estándar (54 cartas)" (cambio 00236) agrupa actualmente las 54 cartas creadas en un grupo automático. Se revierte esa decisión de alcance: al crear la baraja francesa desde el picker de componentes, las 54 cartas deben quedar sueltas, sin agruparse automáticamente entre sí.

### Comportamiento esperado

- Al seleccionar "Baraja francesa estándar (54 cartas)" en el picker, las 54 cartas se crean igual que hasta ahora (recursos, cara/reverso, posición en la cuadrícula de 5 filas), pero **sin pertenecer a ningún grupo**.
- No se crea ningún grupo asociado a la baraja.
- El resto del comportamiento del conjunto pre-definido no cambia: los 55 recursos SVG, los 54 componentes carta, el componente mazo (con sus 54 identificadores de carta) y el posicionamiento en la mesa se generan exactamente igual que antes.

### Alcance

Esto revierte específicamente el punto "1 grupo automático que agrupa los 54 componentes carta (no el mazo)" documentado como decisión de alcance acordada en el cambio 00236. El resto de decisiones de ese cambio (nombres de recursos, Jokers idénticos, diseño de las cartas, disposición en la mesa, etc.) permanece sin modificar.

## Technical notes

- El agrupado se genera en `src/core/presets/frenchDeck.js`, función `createFrenchDeckPreset()`:
  - Línea 50: `const groupId = nextGroupId(getComponents());`
  - Línea 84: `carta.groupId = groupId;` (dentro del `forEach` que crea las 54 cartas)
  - Línea 94: `const group = createGroup({ id: groupId });`
  - Línea 98: `loadGroups([...getGroups(), group]);`
- El cambio consiste en eliminar esas cuatro líneas (y la asignación de `groupId` a cada carta), sin tocar el resto de la función: creación de recursos (`createResource`), creación de componentes `carta`/`mazo` (`createDefaultComponent`), `computeGridPosition` y las llamadas `loadResources`/`loadComponents`.
- Relacionado con el cambio 00236 (`previo-sdd/changes/implemented/00236/`), ya implementado.
