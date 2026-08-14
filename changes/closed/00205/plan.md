- **Fecha creación**: 2026-08-14

## (a) Anotaciones funcionales

**Fuera de alcance:** ningún otro comportamiento se toca — no se modifica el volteo por click ya existente en Modo Juego (`onCartaFlip`, `playMode.js`), ni ninguna otra fila del menú contextual de Modo Edición, ni el tratamiento de `bloqueado`/`oculto`/sincronización de copias.

**Dudas resueltas con el usuario:** ya resueltas en el paso de documentación (`ms-new`) — visibilidad de la fila solo si todos los afectados son cartas; con varias cartas seleccionadas cada una alterna su propia cara de forma independiente; texto de la fila "Voltear carta".

## (b) Solución técnica

- [x] **`src/modes/edit/editMode.js` — crear icono de "voltear".** Añadir una función `createFlipIcon()` junto a las demás (`createCloneIcon`, `createCopyIcon`, `createRemoveIcon`, `createHiddenIcon`, `createGroupIcon`, `createUngroupIcon`, líneas 38-96), mismo patrón exacto: `svg` `viewBox="0 0 24 24"`, `fill="none"`, `stroke="currentColor"`, `stroke-width="2"`. Representar el volteo con dos flechas curvas opuestas alrededor de una carta, p.ej.:
  ```js
  function createFlipIcon() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2');
    svg.innerHTML = '<rect x="7" y="3" width="10" height="18" rx="2"/><path d="M3 9a6 6 0 0 1 4-5" stroke-linecap="round"/><path d="M3 9l0-3.5M3 9l3-1" stroke-linecap="round"/><path d="M21 15a6 6 0 0 1-4 5" stroke-linecap="round"/><path d="M21 15l0 3.5M21 15l-3 1" stroke-linecap="round"/>';
    return svg;
  }
  ```
- [x] **`src/modes/edit/editMode.js` — añadir la fila al menú contextual.** En `handleComponentContextMenu` (línea 562), justo antes de construir `specificItems` (línea ~664), calcular si todos los afectados son cartas: `const allCartas = affectedComponents.length > 0 && affectedComponents.every((c) => c.type === 'carta');`. Añadir un nuevo item al array `specificItems` (antes o después de "Añadir a etiqueta", da igual el orden ya que son dos filas independientes), condicionado a `allCartas`:
  ```js
  ...(allCartas ? [{
    icon: createFlipIcon(),
    label: 'Voltear carta',
    onClick: () => {
      for (const c of affectedComponents) {
        const caraActual = c.properties?.caraActual === 'frontal' ? 'frontal' : 'trasera';
        const nuevaCara = caraActual === 'trasera' ? 'frontal' : 'trasera';
        replaceComponent(c.id, updateComponent(c, { properties: { caraActual: nuevaCara } }));
      }
    },
  }] : []),
  ```
  La normalización `c.properties?.caraActual === 'frontal' ? 'frontal' : 'trasera'` replica exactamente el criterio ya usado en `ui/componentRenderer.js:1508` (undefined/cualquier otro valor se trata como `'trasera'`), y el propio `updateComponent` hace merge superficial de `properties` (mismo patrón que el resto de acciones de este menú, p.ej. "Ocultar"), así que no hace falta preservar el resto de `properties` a mano.
  - No se toca `selectedGroup`: aunque la selección sea un grupo completo, `allCartas` ya excluye ese caso salvo que el grupo esté formado íntegramente por cartas (poco habitual, pero el criterio de "todos los afectados son carta" ya lo cubre sin lógica adicional).

## (e) Verificación

- [x] En Modo Edición, click derecho sobre una única carta: aparece la fila "Voltear carta" en la sección específica del menú (junto a "Añadir a etiqueta"), con su icono. Al pulsarla, la carta pasa a mostrar la otra cara y el menú se cierra.
- [x] Click derecho sobre una carta, pulsar "Voltear carta" varias veces (reabriendo el menú cada vez): la carta alterna correctamente entre frontal y trasera en cada pulsación.
- [x] Seleccionar varias cartas con caras distintas entre sí (alguna en frontal, alguna en trasera) y hacer click derecho: al pulsar "Voltear carta", cada una termina en la cara opuesta a la que tenía, no todas en la misma cara final.
- [x] Click derecho sobre un elemento que no sea carta (p.ej. un tablero o un dado), o sobre una selección mixta de carta + otro tipo: la fila "Voltear carta" no aparece en el menú.
- [x] Click derecho sobre una Copia vinculada de tipo carta: la fila aparece igual y el volteo funciona sobre la copia sin afectar al original ni a su estado de sincronización.
- [x] La feature 027 queda actualizada describiendo la nueva fila y su condición de visibilidad.
