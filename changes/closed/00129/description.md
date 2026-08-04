- **Nombre**: Valores vacíos como cara válida en la lista de valores del dado
- **Código**: 00129
- **Tipo**: change

## Prompt original del usuario

en los dados que tienen una lista de valores separados por comas, el vacío o espacios en blanco también es un valor. Ejemplos:
Dado de 6 caras con un valor vacío: 1,2,,4,5,6
Dado de 4 caras con tres valores vacíos: 1,,,,

## Descripción completa

En el componente "Dado", cuando "Configuración de caras" está en modo "Lista de valores" (texto libre separado por comas), un valor vacío entre dos comas —o un valor formado solo por espacios en blanco— pasa a contar como una cara más de la lista, en vez de descartarse como ocurre hoy.

Hoy, si se escribe una lista como "1,2,,4,5,6", el dado la interpreta como si tuviera 5 caras (el valor vacío entre "2" y "4" se pierde). Con este cambio, esa misma lista da un dado de 6 caras, una de ellas vacía: al tirar el dado y caer en esa cara, no se muestra ningún número ni texto — la cara aparece en blanco, sin ningún icono ni aviso especial, igual que otros elementos de la app que se muestran vacíos sin más (por ejemplo, una cara de carta sin diseño).

Cada valor separado por comas cuenta como una cara, sin ningún tratamiento especial para las comas al principio o al final de la lista: una coma al final sí genera una cara vacía adicional. Así, "1,,,," (un "1" seguido de cuatro comas) da un dado de 5 caras: la cara "1" y cuatro caras vacías.

Se sigue recortando los espacios en blanco al principio/final de cada valor (como ya ocurre hoy); si tras ese recorte el valor queda sin ningún carácter, se considera una cara vacía — por eso una entrada formada solo por espacios (p.ej. "1, ,3") también cuenta como vacía, igual que una entrada realmente vacía ("1,,3").

La silueta del dado (triángulo, cuadrado, rombo o esfera facetada, según el número de caras posibles) sigue calculándose igual, a partir del número total de caras — que ahora incluye también las vacías.

**Validación mínima de la lista**: hoy se exige un mínimo de 2 valores no vacíos. Pasa a exigirse un mínimo de 2 entradas en total (contando también las vacías), con la condición adicional de que al menos una de esas entradas no esté vacía — no se permite una lista formada únicamente por valores vacíos (p.ej. ",", que tendría 2 caras pero ninguna con contenido, no seria válida). El mensaje de aviso junto al campo se actualiza para reflejar esta nueva regla.

**Preguntas de alcance resueltas con el usuario**:
- *¿Cómo tratar una coma al final de la lista (¿genera una cara vacía extra, o se ignora como fin de lista)?* → Se trata igual que cualquier otra coma: separa un valor más, incluida al final. No hay tratamiento especial de bordes.
- *¿Basta con que exista al menos un valor no vacío en la lista (sin mínimo de cantidad), o se mantiene el mínimo de 2 entradas y además se exige que al menos una no esté vacía?* → Se mantiene el mínimo de 2 entradas en total, y se añade la condición de que al menos una de ellas no esté vacía.

## Apuntes técnicos

- La función a modificar es `parseListaValores` en `src/core/dice.js` (líneas 6-11): actualmente hace `split(',')`, recorta espacios de cada valor con `.map(v => v.trim())` y descarta las entradas vacías con `.filter(v => v.length > 0)`. Hay que quitar ese `.filter` para que las entradas vacías (tras el trim) se conserven en el array resultante.
- `isListaValoresValida` (mismo fichero, líneas 13-15) hoy exige `parseListaValores(...).length >= 2` sobre el resultado ya filtrado (es decir, hoy exige 2 no vacíos). Con la nueva regla debe operar sobre el array sin filtrar: `length >= 2` y al menos una entrada con `length > 0`.
- El resto de `dice.js` (`getPosibleValores`, `getResultadoInicial`, `esResultadoValido`, `tirarDado`) no necesita cambios: ya usan `parseListaValores`/`getPosibleValores` tal cual, así que heredan el nuevo comportamiento automáticamente.
- El mensaje de error se define en `src/ui/componentModal.js` línea ~826 (`listError.textContent = 'La lista necesita al menos 2 valores no vacíos'`), ligado a `isListaValoresValida` en las líneas 823 y 827 del mismo fichero. Hay que actualizar el texto para reflejar la nueva regla (p.ej. algo como "La lista necesita al menos 2 valores, y al menos uno no puede estar vacío").
- El renderizado de la cara en `src/ui/componentRenderer.js` ya asigna directamente `resultEl.textContent = props.resultadoActual ?? ''` (línea 830) y, durante la animación de tirada, `resultEl.textContent = posiblesActuales[...]` (línea 944) — no necesita ningún cambio, una cadena vacía ya se renderiza como texto en blanco sin más.
- La silueta (`renderDiceSilhouette`, llamada en la línea 810 con `posibles.length`) tampoco necesita cambios: ya cuenta el total de `getPosibleValores(props)`, que empezará a incluir las vacías en cuanto se quite el filtro de `parseListaValores`.
- `design/docs/FEATURES.md` línea 200 documenta explícitamente el comportamiento actual ("Lista de valores: texto libre separado por comas (mínimo 2 valores no vacíos)") — hay que actualizarla para reflejar la nueva regla de mínimos y que el valor vacío es una cara válida más.
