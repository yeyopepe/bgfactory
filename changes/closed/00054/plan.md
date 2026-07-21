## (a) Anotaciones funcionales

Fuera de alcance: no se migran datos de partidas guardadas con proporciones antiguas (`'2:1-h'`, `'1:2-v'`, `'2:3'`, `'3:2'`) — el tipo `'carta'` es funcionalidad recién implementada (cambio 00053) sin usuarios reales todavía. `getProporcionRatio` conserva un fallback (ahora al primer valor del nuevo catálogo) para no romper si apareciera igualmente un valor no reconocido.

Duda resuelta sin necesidad de preguntar al usuario: qué valor usar como nuevo `DEFAULT_PROPORTION`/valor por defecto de una carta nueva. Se elige `'5:7'` ("Poker estándar horizontal"), el primer formato de la nueva lista y el más habitual para una carta de juego, en vez de dejarlo indeterminado.

## (b) Solución técnica

1. **`src/core/cardProportions.js`** — sustituir por completo el array `CARD_PROPORTIONS` por los 5 formatos pedidos:
   - `{ value: '5:7', label: 'Poker estándar horizontal (5:7)', ratio: 5 / 7 }`
   - `{ value: '7:5', label: 'Poker estándar vertical (7:5)', ratio: 7 / 5 }`
   - `{ value: 'tarot-h', label: 'Tarot estándar horizontal (70 × 120 mm)', ratio: 70 / 120 }`
   - `{ value: 'tarot-v', label: 'Tarot estándar vertical (120 × 70 mm)', ratio: 120 / 70 }`
   - `{ value: '1:1', label: 'Cuadrada (1:1)', ratio: 1 }`
   
   Cambiar `DEFAULT_PROPORTION` de `'2:3'` a `'5:7'`. El resto del módulo (`getProporcionRatio`, `CARD_DESIGN_WIDTH`, `getDesignSize`) no cambia de forma, solo se beneficia del nuevo catálogo/default.
2. **`src/ui/componentModal.js`** — actualizar `DEFAULT_CARTA_PROPERTIES.proporcion` de `'2:3'` a `'5:7'` (línea 63). El desplegable de proporción (bucle sobre `CARD_PROPORTIONS`, líneas 979-984) no necesita cambios: ya itera el catálogo genéricamente.
3. **`src/ui/cardEditorModal.js`** — actualizar el fallback `props.proporcion || '2:3'` (línea 46) a `props.proporcion || '5:7'`. El bucle que rellena el desplegable (línea 59) tampoco necesita cambios, es genérico sobre `CARD_PROPORTIONS`.
4. Verificar que no queden más referencias a los valores eliminados (`'2:1-h'`, `'1:2-v'`, `'2:3'`, `'3:2'`) fuera de los ficheros de build generados (`src/_output/versions/*.html`, que no se tocan a mano — se regeneran con `ms-version`).

No hace falta tocar `ui/componentRenderer.js` ni `ui/resizeHandle.js`: ya consumen `getProporcionRatio(props.proporcion)` de forma genérica, sin conocer los valores concretos del catálogo.

## (d) Cambios en estilo

No aplica: no se introduce ni modifica ninguna convención visual (color, espaciado, componente reutilizable) — solo cambian los valores de un catálogo de datos ya existente.
