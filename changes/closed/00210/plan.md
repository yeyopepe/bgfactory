- **Fecha creación**: 2026-08-14

## (a) Anotaciones funcionales

**Fuera de alcance:** ningún otro comportamiento se toca. No se migra `core/state.js` para mazos ya guardados (el valor nuevo se resuelve con fallback al leer, sin campo persistido hasta que alguien edite el mazo).

**Dudas resueltas con el usuario:** ninguna pregunta abierta durante la planificación — la reestructuración de secciones ("Forma" y "Cartas reveladas") ya quedó acordada y validada en la maqueta durante `ms-new`, reflejada en `description.md`.

## (b) Solución técnica

- [x] **`src/ui/componentModal.js` — nueva lista `MAZO_REVELAR_CARA` y default.** Junto a `MAZO_DISPOSICIONES` (línea ~78), añadir:
  ```js
  export const MAZO_REVELAR_CARA = [
    { value: 'frontal', label: 'Boca arriba' },
    { value: 'trasera', label: 'Boca abajo' },
  ];
  ```
  En `DEFAULT_MAZO_PROPERTIES`, añadir `caraCartaRevelada: 'frontal'` (mismo criterio de nombre que `caraActual` de `'carta'`: valores `'frontal'|'trasera'`).
- [x] **`src/ui/componentModal.js` — renombrar la sección "Disposición" a "Forma".** En `renderMazoSpecificFields`, cambiar `disposicionLegend.textContent = 'Disposición'` a `'Forma'` (variable `disposicionSection`/`disposicionLegend` se puede dejar con su nombre actual o renombrar a `formaSection`/`formaLegend` por claridad — solo afecta a variables internas, no a comportamiento). Esta sección conserva únicamente los campos "Forma" y "Orientación" (sin cambios en su lógica).
- [x] **`src/ui/componentModal.js` — mover "Disposición carta revelada"/"Texto carta revelada" a una sección nueva "Cartas reveladas".** Sacar los bloques `disposicionField` y `textoRevelaField` de la sección "Forma" (ya no se appendan a `disposicionSection`/`formaSection`) y crear una sección nueva `fieldset.modal__section` con `legend.modal__section-title` "Cartas reveladas" (mismo patrón que las demás), insertada entre la sección "Forma" y la sección "Imagen". Esa nueva sección contiene, en este orden: "Disposición carta revelada" (`disposicionField`, sin cambios de lógica), "Texto carta revelada" (`textoRevelaField`, sin cambios de lógica) y el campo nuevo "Revelar carta" (ver siguiente tarea).
- [x] **`src/ui/componentModal.js` — campo nuevo "Revelar carta" en la sección "Cartas reveladas".** `<select>` poblado desde `MAZO_REVELAR_CARA` (mismo patrón que el resto de selects de esta función), valor actual `props.caraCartaRevelada || DEFAULT_MAZO_PROPERTIES.caraCartaRevelada`, `onchange` asigna `props.caraCartaRevelada = select.value`. Añadido como último campo de la sección "Cartas reveladas", después de "Texto carta revelada".
- [x] **`src/core/deck.js` — `computeSacarCartaDeMazo` usa `caraCartaRevelada`.** Cambiar `cartaChanges: { x, y, properties: { caraActual: 'frontal' } }` (línea 62) a `cartaChanges: { x, y, properties: { caraActual: mazo.properties?.caraCartaRevelada ?? 'frontal' } }` — mismo criterio de fallback que el resto de properties opcionales del mazo. No hace falta tocar `core/state.js` ni ningún punto de llamada: todos pasan por esta única función pura.

## (c) Cambios de arquitectura

- `design/docs/architecture/02-component-types.md`, sección `'mazo'`:
  - Añadir una fila a la tabla de propiedades: `caraCartaRevelada` (`'frontal'|'trasera'`, default `'frontal'`, "Cara con la que queda mostrada la carta al sacarla del mazo — 'frontal' es boca arriba, 'trasera' boca abajo").
  - En la descripción de `computeSacarCartaDeMazo` (lista de funciones de `core/deck.js`): actualizar de "función pura, calcula cambios de sacar una carta cualquiera de la pila" a mencionar que la cara resultante depende de `properties.caraCartaRevelada` del mazo (fallback `'frontal'`), no siempre `'frontal'` como hasta ahora.
  - En el párrafo de la pestaña "Específicas" (ya actualizado por el cambio 00207): reflejar la nueva estructura en tres secciones — "Forma" (Forma, Orientación), "Cartas reveladas" (Disposición carta revelada, Texto carta revelada, Revelar carta) e "Imagen" (Elegir/Ajustar/Quitar imagen).

## (d) Cambios en estilo

- `design/docs/style/03-modales-menus.md` §12.6 "Usos del patrón": actualizar la línea ya existente sobre `ui/componentModal.js` tipo `'mazo'` (añadida por el cambio 00207) para reflejar las tres secciones actuales: "Forma" (informativa: Forma, Orientación), "Cartas reveladas" (informativa: Disposición carta revelada, Texto carta revelada, Revelar carta) e "Imagen" (informativa: preview + Elegir/Ajustar/Quitar imagen).

## (e) Verificación

- [x] Abrir la pestaña "Específicas" de un mazo existente: aparecen tres secciones en este orden — "Forma" (Forma, Orientación), "Cartas reveladas" (Disposición carta revelada, Texto carta revelada, Revelar carta) e "Imagen" (preview + tres botones). El contador de cartas sigue antes de la primera sección, y "Ver contenido del mazo" después de la última, con separación visual correcta respecto a "Imagen" (`contentField.style.marginTop = '1rem'` del fix 00209 sigue intacto, no se tocó). — Confirmado leyendo `renderMazoSpecificFields`: `container.appendChild(formaSection)` → `container.appendChild(revealSection)` → `container.appendChild(imagenSection)` → `contentField` al final, en ese orden.
- [x] Con "Revelar carta" en "Boca arriba" (default): sacar una carta del mazo (por cualquiera de las tres vías) la deja mostrada boca arriba. — `computeSacarCartaDeMazo` usa `mazo.properties?.caraCartaRevelada ?? 'frontal'`; con la property ausente o en `'frontal'`, `caraActual` queda `'frontal'` = boca arriba, igual que antes.
- [x] Cambiar "Revelar carta" a "Boca abajo" y sacar una carta (por cualquiera de las tres vías): queda boca abajo. — Con `caraCartaRevelada === 'trasera'`, `computeSacarCartaDeMazo` fija `caraActual: 'trasera'`; las tres vías (`playMode.js`, `editMode.js`, `componentModal.js`) llaman todas a `sacarCartaDeMazo` → `computeSacarCartaDeMazo`, confirmado en el análisis previo.
- [x] Un mazo guardado antes de este cambio (sin `caraCartaRevelada`) sigue sacando cartas boca arriba. — `mazo.properties?.caraCartaRevelada ?? 'frontal'` resuelve a `'frontal'` sin excepción cuando la property no existe.
- [x] Cambiar "Revelar carta" no afecta a cartas ya sacadas anteriormente. — El campo solo se lee en el momento de sacar una carta nueva (`computeSacarCartaDeMazo`, invocado únicamente desde `sacarCartaDeMazo`); no hay ningún recorrido que reaplique `caraActual` a cartas ya fuera del mazo.
