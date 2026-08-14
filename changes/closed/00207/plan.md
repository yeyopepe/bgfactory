- **Fecha creación**: 2026-08-14

## (a) Anotaciones funcionales

**Fuera de alcance:** ningún otro comportamiento se toca. No se migra `core/state.js` para mazos ya guardados (los valores nuevos se resuelven con fallback al leer, sin campo persistido hasta que alguien edite el mazo). No se actualiza `src/test/errantes-componentes.json`: sus mazos de ejemplo ya conviven hoy sin `imagenResourceId` (otra property opcional con fallback), así que no hace falta tocarlos para que el ejemplo siga siendo válido.

**Dudas resueltas con el usuario:** ninguna pregunta abierta durante la planificación — el usuario ya corrigió durante `ms-new` el nombre del campo nuevo a "Disposición carta revelada" (distinto del título de la sección "Disposición"), reflejado en `description.md`.

## (b) Solución técnica

- [x] **`src/core/deck.js` — generalizar `getMazoRevealZoneRect(mazo)` a los 4 lados.** Hoy calcula siempre `x: (mazo.x ?? 100) + width + MAZO_REVEAL_GAP` (lado derecho fijo). Leer `mazo.properties?.disposicion ?? 'derecha'` y calcular el rectángulo según ese valor, manteniendo `width`/`height` iguales a los del mazo y `MAZO_REVEAL_GAP` como separación en todos los casos:
  - `'derecha'`: `x = (mazo.x ?? 100) + width + MAZO_REVEAL_GAP`, `y = mazo.y ?? 100` (caso actual, sin cambios de resultado).
  - `'izquierda'`: `x = (mazo.x ?? 100) - width - MAZO_REVEAL_GAP`, `y = mazo.y ?? 100`.
  - `'abajo'`: `x = mazo.x ?? 100`, `y = (mazo.y ?? 100) + height + MAZO_REVEAL_GAP`.
  - `'arriba'`: `x = mazo.x ?? 100`, `y = (mazo.y ?? 100) - height - MAZO_REVEAL_GAP`.
  Implementarlo con un mapa/objeto de funciones u `switch` sobre los 4 valores (fallback a `'derecha'` si el valor no es ninguno de los 4, mismo criterio defensivo que otras properties de tipo enumerado del proyecto). No cambiar la firma de la función: sigue recibiendo `mazo` completo.
- [x] **`src/ui/componentModal.js` — nueva lista `MAZO_DISPOSICIONES` y defaults.** Junto a `MAZO_ORIENTACIONES`/`MAZO_FORMAS` (línea ~73), añadir:
  ```js
  export const MAZO_DISPOSICIONES = [
    { value: 'arriba', label: 'Arriba' },
    { value: 'abajo', label: 'Abajo' },
    { value: 'derecha', label: 'Derecha' },
    { value: 'izquierda', label: 'Izquierda' },
  ];
  ```
  En `DEFAULT_MAZO_PROPERTIES` (línea ~141), añadir `disposicion: 'derecha'` y `textoCartaRevelada: 'Carta revelada'`.
- [x] **`src/ui/componentModal.js` — reestructurar `renderMazoSpecificFields` en dos secciones.** Envolver los campos ya existentes "Forma"/"Orientación" (líneas ~1622-1679) más los dos nuevos, dentro de un `fieldset.modal__section` con `legend.modal__section-title` "Disposición" (mismo patrón que `visualSection`/`borderSection` del propio fichero, §12.6 de la Style Bible: `border: 1px solid var(--border-neutral)`, `border-radius: var(--radius-sm)`, `margin-top: 1rem`, `padding: 1rem` — ya cubierto por la clase, no hace falta repetirlo inline). Tras el campo "Orientación", añadir dentro de la misma sección:
  - Campo "Disposición carta revelada": `<select>` poblado desde `MAZO_DISPOSICIONES` (mismo patrón que el `<select>` de Forma/Orientación), valor actual `props.disposicion || DEFAULT_MAZO_PROPERTIES.disposicion`, `onchange` asigna `props.disposicion = select.value`. A diferencia del campo "Orientación", **no** se oculta cuando `forma === 'circular'` — se muestra siempre. Añadir debajo un `<p class="modal__hint">Lado del mazo donde aparecen las cartas al sacarlas</p>` (mismo patrón que `countHint`/`styleHint` del propio fichero).
  - Campo "Texto carta revelada": `<input type="text">`, valor actual `props.textoCartaRevelada ?? DEFAULT_MAZO_PROPERTIES.textoCartaRevelada`, `oninput`/`onchange` asigna `props.textoCartaRevelada = input.value` (sin validar no-vacío: cadena vacía es un valor válido, ver `description.md`).
  Envolver el bloque de imagen ya existente (líneas ~1681-1782: preview + tres botones) en un segundo `fieldset.modal__section` con `legend.modal__section-title` "Imagen" — mover el `<label>Imagen</label>` suelto actual dentro del `<legend>` de la sección (ya no hace falta como label de campo separado). El contador de cartas (`countHint`) y el botón "Ver contenido del mazo" (`contentField`, líneas ~1784-1805) quedan igual que hoy, fuera de cualquier `fieldset` — antes de la primera sección y después de la segunda, respectivamente.
- [x] **`src/ui/componentRenderer.js` — `renderMazoRevealZone` usa el texto configurable.** Sustituir `zone.textContent = 'Carta revelada'` (línea 454) por `zone.textContent = mazo.properties?.textoCartaRevelada ?? 'Carta revelada'` (`??` conserva cadena vacía como valor válido, solo cae al literal si la property no existe todavía en mazos guardados antes de este cambio).
- [x] **`src/ui/componentRenderer.js` — recálculo en vivo durante el arrastre respeta la disposición.** En `handleMouseMove` (línea ~1847), la llamada `getMazoRevealZoneRect({ x: currentX, y: currentY, width, height })` no pasa `properties`, así que con `disposicion !== 'derecha'` el recuadro saltaría al lado derecho solo durante el arrastre y volvería a su lado correcto al soltar. Cambiar a `getMazoRevealZoneRect({ x: currentX, y: currentY, width, height, properties: component.properties })`.

## (c) Cambios de arquitectura

- `design/docs/architecture/02-component-types.md`, sección `'mazo'`:
  - Añadir dos filas a la tabla de propiedades: `disposicion` (`'arriba'|'abajo'|'derecha'|'izquierda'`, default `'derecha'`, "Lado del mazo donde se pinta la zona de revelado y aparece la carta al sacarla") y `textoCartaRevelada` (string, default `'Carta revelada'`, "Texto mostrado dentro de la zona de revelado; cadena vacía es válida").
  - En la frase `getMazoRevealZoneRect(mazo)`: rectángulo de la "zona de revelado"., actualizar para reflejar que ya no es siempre el lado derecho, sino el lado que indique `properties.disposicion` (fallback `'derecha'`).
  - En el párrafo final de la sección ("Pestaña 'Específicas' (modo edición) añade, junto a 'Forma'/'Orientación', el campo 'Imagen'..."): actualizar para reflejar la nueva estructura en dos secciones ("Disposición": Forma, Orientación, Disposición carta revelada, Texto carta revelada; "Imagen": Elegir/Ajustar/Quitar imagen) y que el texto fijo "Carta revelada" pintado junto al recuadro pasa a ser configurable por mazo.

## (d) Cambios en estilo

- `design/docs/style/03-modales-menus.md` §12.6 "Usos del patrón": añadir una línea documentando este nuevo uso — `ui/componentModal.js`, tipo `'mazo'`: "Disposición" (informativa: Forma, Orientación, Disposición carta revelada, Texto carta revelada) e "Imagen" (informativa: preview + Elegir/Ajustar/Quitar imagen) — mismo patrón que el resto de usos ya listados, sin variante nueva.

## (e) Verificación

- [x] Abrir la pestaña "Específicas" de un mazo existente: los campos aparecen agrupados en dos secciones tituladas "Disposición" (Forma, Orientación, Disposición carta revelada, Texto carta revelada) e "Imagen" (preview + tres botones), con el mismo aspecto (borde, título) que otras secciones de la misma modal (p. ej. "Estilo de Carta"). El contador de cartas y "Ver contenido del mazo" siguen fuera de cualquier sección. — Confirmado leyendo `renderMazoSpecificFields`: `disposicionSection`/`imagenSection` usan `fieldset.modal__section` + `legend.modal__section-title` (mismo patrón que `visualSection`), `countHint` y `contentField` se añaden a `container` fuera de ambos fieldsets.
- [x] Con "Disposición carta revelada" en "Derecha" (default): el mazo se comporta exactamente igual que antes del cambio — zona de revelado y cartas sacadas aparecen a la derecha. — `REVEAL_ZONE_OFFSET_BY_DISPOSICION.derecha` reproduce la fórmula original (`x + width + MAZO_REVEAL_GAP`, mismo `y`), y es el fallback cuando `disposicion` no está definida.
- [x] Cambiar "Disposición carta revelada" a "Arriba"/"Abajo"/"Izquierda": la zona decorativa se repinta en el lado elegido, con el mismo tamaño que el mazo y separación visual equivalente a la de hoy (`MAZO_REVEAL_GAP` en los 4 casos). Sacar una carta del mazo usa el mismo `getMazoRevealZoneRect(mazo)` vía `computeSacarCartaDeMazo`, así que queda colocada en ese mismo lado.
- [x] Arrastrar el mazo por la mesa con una disposición distinta de "Derecha": `handleMouseMove` ahora pasa `properties: component.properties` a `getMazoRevealZoneRect`, así que la zona de revelado sigue al mazo en vivo, en el lado correcto, durante todo el arrastre.
- [x] "Disposición carta revelada" se muestra también con "Forma" = "Circular": `disposicionField` no tiene ninguna asignación de `display: none` condicionada a `forma`, a diferencia de `orientacionField`.
- [x] Cambiar "Texto carta revelada" a un texto distinto (incluida cadena vacía) y aceptar: `zone.textContent = mazo.properties?.textoCartaRevelada ?? 'Carta revelada'` usa `??`, que preserva `''` como valor válido y solo cae al literal si la property es `null`/`undefined`.
- [x] Un mazo guardado antes de este cambio (sin `disposicion`/`textoCartaRevelada` en sus properties) sigue mostrando la zona a la derecha con el texto "Carta revelada" al cargarlo: todos los accesos nuevos (`props.disposicion || DEFAULT_MAZO_PROPERTIES.disposicion` en el modal, `mazo.properties?.disposicion` con fallback `derecha` en `deck.js`, `?? 'Carta revelada'` en el renderer) resuelven con el mismo valor por defecto sin lanzar excepción.
