## (a) Anotaciones funcionales

- Sin puntos fuera de alcance nuevos: las dudas de alcance ya se resolvieron durante `ms-new` y quedan recogidas en `description.md` (comportamiento de la coma final, y regla de mínimos con al menos un valor no vacío). No han surgido dudas técnicas adicionales durante este análisis.

## (b) Solución técnica

1. **`src/core/dice.js` — `parseListaValores`**: quitar el `.filter((v) => v.length > 0)` (línea 10) que descarta las entradas vacías tras el `trim()`. La función pasa a devolver todos los elementos del `split(',')` ya recortados, incluidos los que queden como cadena vacía.
2. **`src/core/dice.js` — `isListaValoresValida`**: cambiar la condición de `parseListaValores(listaValores).length >= 2` a exigir además que al menos una entrada no esté vacía. Concretamente:
   ```js
   export function isListaValoresValida(listaValores) {
     const valores = parseListaValores(listaValores);
     return valores.length >= 2 && valores.some((v) => v.length > 0);
   }
   ```
   El resto de funciones de `dice.js` (`getPosibleValores`, `getResultadoInicial`, `esResultadoValido`, `tirarDado`) no necesitan cambios: ya consumen `parseListaValores`/`getPosibleValores` tal cual, así que heredan el nuevo comportamiento (caras vacías incluidas) sin tocarlas.
3. **`src/ui/componentModal.js` — mensaje de error del campo "Lista de valores"** (línea ~826): cambiar el texto `'La lista necesita al menos 2 valores no vacíos'` por uno que refleje la nueva regla, p.ej. `'La lista necesita al menos 2 valores, y al menos uno no puede estar vacío'`. No hace falta tocar la lógica de mostrado/ocultado del error (líneas 821-827): sigue funcionando igual, solo cambia lo que evalúa `isListaValoresValida` por dentro.
4. **`design/docs/FEATURES.md` línea 200** (documentación funcional sincronizada): actualizar el texto de la viñeta "Lista de valores" para reflejar la nueva regla de mínimos y que el valor vacío es una cara más. Texto actual: `**Lista de valores**: texto libre separado por comas (mínimo 2 valores no vacíos); cada tirada da uno de esos valores literales al azar, no necesariamente numéricos.` Sustituir por algo como: `**Lista de valores**: texto libre separado por comas, donde un valor vacío o formado solo por espacios en blanco cuenta como una cara más (mínimo 2 valores en total, de los cuales al menos uno no puede estar vacío); cada tirada da uno de esos valores literales al azar (incluida una cara vacía, que se muestra sin ningún carácter), no necesariamente numéricos.`

No hay tests automatizados existentes sobre `dice.js` que actualizar (el proyecto no tiene una carpeta de tests unitarios sobre este módulo; `src/test/*.json` son ficheros de estado de ejemplo, no tests de código).

Sin cambios de arquitectura ni de estilo visual: el cambio es puramente de regla de parseo/validación sobre una interacción ya existente, sin alterar capas ni introducir ningún elemento visual nuevo.
