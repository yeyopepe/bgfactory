- **Name**: Borde de las cartas de la baraja francesa vía propiedad, no pintado en el recurso; id descriptivo de cada carta
- **Code**: 00274
- **Type**: fast
- **Creation date**: 2026-09-15

## Full description

En las cartas generadas por el conjunto pre-definido "Baraja francesa estándar (54 cartas)", el borde visible alrededor de cada cara (frontal y trasera) está pintado directamente dentro del recurso SVG, en vez de usar la propiedad de borde (color y grosor) que ya existe para cada cara del componente carta y que se ve reflejada en el modal de edición ("BORDER — Color / Thickness (px)"). Con el recurso pintando su propio borde, esa propiedad queda inconsistente: el modal muestra "Thickness: 0" pero visualmente sí hay un borde, porque viene del SVG.

Se corrige para que el borde de las cartas del preset se controle únicamente mediante la propiedad de borde de cada cara (color y grosor), igual que en cualquier otro componente carta de la aplicación, y no mediante un trazo dibujado en el propio recurso SVG. El aspecto visual final no cambia: se mantiene el mismo borde gris muy fino que tenían hasta ahora, solo que ahora sale de la propiedad en vez de estar fijado en la imagen.

Adicionalmente, cada una de las 54 cartas generadas por este conjunto pasa a tener un identificador descriptivo (en vez de uno técnico sin significado), siguiendo el mismo patrón de nombrado ya usado para sus recursos, con el prefijo `card-` (por ejemplo `card-picas-as`, en vez de `baraja-francesa-picas-as` que es el nombre del recurso).

### Dudas funcionales resueltas

- **¿Qué valores de color/grosor de borde se asignan por defecto a las cartas del preset?** Los mismos que tenía el trazo pintado en el SVG hasta ahora: color `#d8d8d8` (gris muy claro) y grosor `1px`, aplicados igual a la cara frontal y a la trasera — sin cambio visual perceptible respecto a como se veían antes.

## Technical notes

- El trazo de borde se pinta hoy en `src/core/svgTemplates.js`: `renderCardFaceSvg` (línea 86, `<rect ... stroke="#d8d8d8" stroke-width="0.8"/>`) y `renderCardBackSvg` (líneas 20-22, doble `<rect>` con `stroke` blanco semitransparente sobre fondo azul). Hay que quitar esos atributos `stroke`/`stroke-width` (dejando solo el `fill` del rect exterior) en ambas funciones.
- El borde real de la carta ya se renderiza en `src/ui/componentRenderer.js:1719` a partir de `cara.bordeGrosor`/`cara.bordeColor` (aplicado como `border` CSS sobre `cartaContent`), controlado por la propiedad definida en `DEFAULT_CARTA_PROPERTIES` (`src/ui/componentModal.js:134-156`, con `bordeGrosor: 0` por defecto para cualquier carta nueva).
- En `src/core/presets/frenchDeck.js`, tras crear cada `carta` (línea ~75), hay que asignar `carta.properties.caraFrontal.bordeColor = '#d8d8d8'`, `carta.properties.caraFrontal.bordeGrosor = 1`, y lo mismo para `caraTrasera`.
- Para el id descriptivo: `src/data/cardTemplates.js` ya tiene `resourceName({ suitId, rank })` (línea 30) que construye `baraja-francesa-{suitId}-{rank}.svg` (o `baraja-francesa-joker.svg`). Se necesita una función análoga para el id de componente con prefijo `card-` en vez de `baraja-francesa-`, y sin extensión `.svg` (p. ej. `card-picas-as`, `card-joker`). Como hay 2 jokers idénticos, sus ids no pueden coincidir: el segundo necesita un sufijo (p. ej. `card-joker-2`).
- En `src/core/presets/frenchDeck.js`, al crear cada `carta` (línea ~75), asignar `carta.id` con ese nuevo esquema en vez de dejar el UUID por defecto de `createDefaultComponent`.

## Applied changes

- `src/core/svgTemplates.js`: quitado el `stroke`/`stroke-width` del `<rect>` exterior en `renderCardFaceSvg` y los dos `<rect>` con `stroke` (marco exterior e interior decorativo) en `renderCardBackSvg`. Los SVG ya no pintan ningún borde propio.
- `src/data/cardTemplates.js`: nueva función `cardId({ suitId, rank, jokerIndex })` (id `card-<suitId>-<rank>`, o `card-joker`/`card-joker-<n>` para los jokers), y `buildFrenchDeckCatalog()` añade el campo `cardId` a cada entrada del catálogo.
- `src/core/presets/frenchDeck.js`:
  - Nueva función local `freeId(candidateId, components)`: si el id candidato ya está en uso, lo desambigua reutilizando `core/component.js#nextCloneId` (misma regla que el botón "Clonar" — sufijo `(n)` con el siguiente entero libre), decisión tomada junto con el usuario para cubrir el caso de generar la baraja dos veces en la misma partida.
  - Cada `carta` creada recibe `carta.id = freeId(entry.cardId, [...componentes existentes, ...ya generados en este lote])`, y `bordeColor: '#d8d8d8'` / `bordeGrosor: 1` en `caraFrontal` y `caraTrasera` (mismo aspecto visual que tenía el trazo del SVG, ahora vía propiedad).
- `src/test/functional/french-deck-preset.test.js`: añadidos `FT-002-20` (id descriptivo de una carta normal y de ambos jokers, y valores de borde por propiedad) y `FT-002-21` (generar el preset dos veces desambigua los ids repetidos con sufijo `(1)`).
- Verificado con `npm test`: 393/393 OK (391 previos + 2 nuevos).
