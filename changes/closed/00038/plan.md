## (a) Anotaciones funcionales

Fuera de alcance:
- La sintaxis de listas de tareas (`- [ ] texto` / `- [x] texto`) reportada en el mismo mensaje del usuario no se toca en este fix — es una sintaxis GFM extendida, ya excluida a propósito del alcance del cambio 00037 (solo cubre "basic syntax", no extensiones GFM). Se gestionará aparte si el usuario confirma que quiere ampliarlo.

Dudas resueltas con el usuario: el indentado mínimo para que un ítem de lista se considere anidado dentro del ítem anterior debe ser 2 espacios, o 1 tabulador — no 4 espacios como exige la implementación actual. Confirmado explícitamente.

## (b) Solución técnica — causa raíz y fix

**Causa raíz adicional detectada al verificar con contenido real** (fichero con saltos de línea `\r\n`, como los que genera Windows — el mismo `design/docs/rules.md` usado para reproducir el bug): `markdownToHtml` divide el texto por `\n`, dejando un `\r` sobrante al final de cada línea. Como el punto (`.`) de una expresión regular en JavaScript no incluye los saltos de línea (y `\r` cuenta como uno), ese `\r` sobrante hace que el ancla final `$` de `HEADING_RE`/`QUOTE_RE`/`UNORDERED_RE`/`ORDERED_RE` nunca llegue a coincidir — ninguna de esas líneas se reconoce como encabezado/cita/lista, y todo el documento se trata como un único párrafo largo. Esto no es exclusivo del bug de indentado, pero impedía comprobar el fix anterior con contenido real y es, en la práctica, un bloqueante mayor (rompe el reconocimiento de bloques en general con este tipo de fichero, habitual en este proyecto). Fix: normalizar los saltos de línea (`\r\n` y `\r` sueltos → `\n`) al principio de `markdownToHtml`, antes de cualquier otro procesado.

**Causa raíz (indentado)**: en `src/core/markdown.js`, la función `parseList` (cambio 00037) solo considera que una línea pertenece al contenido del ítem de lista anterior si está indentada 4 o más espacios (`leadingSpaces(raw) >= 4`), y en ese caso le quita siempre 4 espacios (`raw.slice(4)`) antes de volver a analizarla recursivamente. Con una indentación de 2 espacios (la habitual al escribir una lista a mano), la línea no supera ese umbral: `isBlockStart` la reconoce igualmente como un nuevo ítem de lista válido (el marcador de lista admite 0-3 espacios de margen) y `parseList` la trata como un ítem nuevo al mismo nivel, en vez de como contenido anidado del ítem anterior.

**Fix** (cambio mínimo, en `markdownToHtml` y `parseList`):
0. Al principio de `markdownToHtml`, normalizar el texto de entrada sustituyendo `\r\n` y `\r` sueltos por `\n`, antes de `protectEscapes`/`extractReferences`/`parseBlocks`.
1. Bajar el umbral mínimo de indentación para que una línea se considere parte del ítem anterior de 4 a 2 espacios (una tabulación ya se expande a 4 espacios por `expandTabs`, así que con el nuevo umbral de 2 sigue reconociéndose sin cambios adicionales).
2. En vez de descontar siempre una cantidad fija (4) al des-indentar las líneas de contenido de un ítem, calcular esa cantidad una sola vez por ítem, tomando la indentación real de la primera línea de contenido indentada que se encuentre para ese ítem (2, 4, o cualquier otro valor ≥ 2), y usar ese mismo valor para des-indentar el resto de líneas de contenido de ese ítem. Así, tanto "2 espacios" como "1 tabulador" (4 espacios ya expandidos) funcionan como unidad de indentación válida y consistente para anidar, sin mezclar restos de indentación al analizar recursivamente el contenido del ítem.
3. Sin cambios en ningún otro fichero ni en el resto de `markdown.js` (bloques de código indentados, citas, párrafos, parseInline no se tocan): el umbral de 4 espacios para reconocer un bloque de código indentado (`parseBlocks`/`parseCodeBlock`/`isBlockStart`) se mantiene igual, ya que es una regla distinta (nivel de documento, no de contenido de un ítem de lista) y no forma parte del bug reportado.

## (c) Cambios de arquitectura

En `ARCHITECTURE.md`, dentro del bullet `**'documento'**`, la frase añadida en el cambio 00037 sobre `core/markdown.js` menciona "indentación de 4 espacios/1 tab" para el contenido anidado dentro de un ítem de lista — corregirla a "2 espacios/1 tab" para reflejar el umbral ya corregido por este fix (00038).
