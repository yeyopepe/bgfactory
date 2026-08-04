## (a) Anotaciones funcionales

- Fuera de alcance: no se introduce ningún campo "Nombre" nuevo (ni específico de mazo ni general de componente) — la etiqueta reutiliza el `id` ya existente y editable del componente, tal como se acordó con el usuario en `description.md`.
- Fuera de alcance: no se toca el mecanismo de redimensionado (`ui/resizeHandle.js`) — el mazo ya redimensiona libre en ambos ejes (sin ratio forzado) tanto rectangular como circular, y el forzado a 1:1 con Shift ya es un comportamiento genérico de `attachResizeHandle` para `axis: 'both'`, sin necesitar ningún cambio.
- Duda resuelta con el usuario (ya reflejada en `description.md`): la zona de revelado debía adoptar la misma forma que el mazo (no quedarse siempre rectangular).

## (b) Solución técnica

1. **`core/cardProportions.js`** — sin cambios. Se reutiliza `getCartaShapeCss(value, esquinasRedondeadas)`: para forma circular basta pasar `'circular'` como `value` (devuelve `{ borderRadius: '50%', clipPath: 'none' }`), sin usar el argumento `esquinasRedondeadas` (el mazo no tiene ese concepto).

2. **`ui/componentModal.js`**:
   - Añadir catálogo `MAZO_FORMAS = [{ value: 'rectangular', label: 'Rectangular' }, { value: 'circular', label: 'Circular' }]`, junto a `MAZO_ORIENTACIONES` ya existente.
   - Añadir `forma: 'rectangular'` a `DEFAULT_MAZO_PROPERTIES`.
   - En `renderMazoSpecificFields` (línea ~1124): añadir un nuevo campo `<select>` "Forma" (mismo patrón que el de "Orientación" ya existente justo debajo), colocado antes de "Orientación". Al cambiarlo:
     - Actualiza `props.forma`.
     - Si el nuevo valor es `'circular'`: iguala `workingComponent.width` y `workingComponent.height` al mayor de los dos valores actuales (`Math.max(workingComponent.width, workingComponent.height)`), mismo criterio ya documentado para el cambio de forma.
     - Si el nuevo valor es `'rectangular'`: no se fuerza ningún tamaño (se deja el que tuviera).
     - Alterna la visibilidad de `orientacionField` (`style.display = forma === 'circular' ? 'none' : ''`), mismo patrón que usa `ui/cardEditorModal.js` (línea 227) para mostrar/ocultar el checkbox "Esquinas redondeadas" con `isRectShape`.
   - Aplicar también la visibilidad inicial de `orientacionField` al construir el formulario, según `props.forma || DEFAULT_MAZO_PROPERTIES.forma`.

3. **`ui/componentRenderer.js`** (bloque `component.type === 'mazo'`, línea ~1310):
   - Leer `props.forma` (con fallback a `'rectangular'` si no existe, para mazos guardados antes de este cambio).
   - Calcular `const mazoBorderRadius = props.forma === 'circular' ? '50%' : 'var(--radius-lg)';` y aplicarlo tanto a `mazo.style.borderRadius` (hoy no se fija inline, la caja hereda el `var(--radius-lg)` de la clase `.carta`; con forma circular hay que fijarlo inline para poder sobrescribirlo — mismo patrón que usa `'carta'` en la línea 1121 con `cartaBorderRadius`) como a `mazoContent.style.borderRadius` (línea ~1331, hoy fijo a `'var(--radius-lg)'`).
   - Etiqueta `countLabel` (línea ~1348-1350): cambiar `textContent` de `` `${cartaIds.length} cartas` `` a `` `${component.id} — ${cartaIds.length} cartas` ``.
   - `renderMazoRevealZone(worldEl, component)` (línea ~375): dentro de la función, leer `component.properties?.forma` y fijar `zone.style.borderRadius = forma === 'circular' ? '50%' : ''` (cadena vacía para dejar el `border-radius: var(--radius-sm)` ya definido en CSS sin sobrescribir cuando es rectangular).
   - `renderMazoEmptyPlaceholder(container, width, height)` — sin cambios: el icono ya se centra y escala a partir del mínimo de `width`/`height`, funciona igual de bien recortado en un contenedor circular.

4. **`core/deck.js`** — sin cambios: `getMazoRevealZoneRect` sigue devolviendo el mismo rectángulo (posición/ancho/alto) sea cual sea la forma; solo cambia el `border-radius` con el que se pinta ese rectángulo en `ui/componentRenderer.js`.

5. **Migración de mazos existentes**: ningún mazo guardado antes de este cambio tiene `properties.forma` — se comportan como `'rectangular'` en todos los puntos anteriores (mismo criterio de "campo opcional sin migración" que el resto de propiedades del proyecto, p. ej. `oculto`/`mostrarTooltip`), sin necesitar tocar `core/state.js` (`loadComponents`).

## (c) Cambios de arquitectura

En `ARCHITECTURE.md`, dentro de la sección 4 ("Modelo de datos de componente"), entrada `'mazo'`:

- Documentar la nueva propiedad `forma` (`'rectangular' | 'circular'`, `'rectangular'` por defecto): qué controla (border-radius de la caja del mazo, de su `mazoContent`, y de la zona de revelado), que es independiente de `orientacion` (que deja de mostrarse en la modal cuando la forma es circular, al no tener sentido un círculo con orientación), y que al cambiar a `'circular'` se iguala `width`/`height` al mayor de los dos — mismo criterio que ya se documenta para la proporción `'circular'` de `'carta'`.
- Aclarar en el párrafo de "Renderizado" ya existente que la etiqueta de número de cartas (`.mazo-count-label`) ahora antepone el `id` del mazo (`"<id> — <N> cartas"`), reutilizando el identificador ya editable del componente en vez de un campo "Nombre" nuevo (que hoy no existe en ningún tipo de componente).
- Mazos guardados sin `forma` se comportan como `'rectangular'`, mismo criterio de migración silenciosa que el resto de propiedades opcionales.

## (d) Cambios en estilo

En `STYLE_BIBLE.md`, sección 13 ("Qué NO hacer"), párrafo `"Mazo" reutiliza la clase .carta (cambio 00106)`:

- Añadir que, desde este cambio, la caja del mazo puede fijar `border-radius: 50%` inline (mismo mecanismo que ya usa `'carta'` con su proporción circular, sección 13, párrafo de esquinas redondeadas) cuando su forma es circular, sobrescribiendo el `var(--radius-lg)` que la clase `.carta` aplica por defecto — no es una excepción nueva, es el mismo patrón ya documentado para "Carta" aplicado ahora también a "Mazo".
- Anotar que la "zona de revelado" (`.mazo-reveal-zone`, mismo párrafo) también adopta `border-radius: 50%` cuando el mazo es circular, en vez de su `var(--radius-sm)` por defecto.
