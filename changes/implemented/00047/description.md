- **Nombre**: Ajustes menores de propiedades de ficha (borde, fondo, recursos por defecto)
- **Código**: 00047
- **Tipo**: change

## Prompt original del usuario

Ajustes menores sobre las propiedades de las fichas:
- El grosor del borde debe estar al lado del selector de color del borde, en la misma fila
- añade la posibilidad de seleccionar el color del fondo de la ficha (blanco por defecto)
- También elimina los 3 recursos demo que hay en el aplicación y añade las 3 imagenes que hay en src/img/localizations como recursos. El id de cada una debe ser el mismo que el nombre del fichero sin extensión.

Te explico mejor lo del fondo:
- Su valor por defecto es vacío (transparente)
- Se aplica siempre

El orden de las propiedades en la ventana deber ser el siguiente:
- Fondo
- Color de fondo
- color/grosor del borde

## Descripción completa

Tres ajustes independientes sobre las propiedades de una ficha y sobre los recursos de la galería.

**1. Grosor del borde en la misma fila que el color del borde, y nuevo orden de los campos**

En el panel de propiedades de una ficha, el campo "Grosor del borde" pasa a colocarse junto al selector "Color del borde", en la misma fila, en vez de en la fila de debajo como ahora. Es un cambio puramente de disposición visual, sin cambiar el comportamiento de ninguno de los dos campos.

Además, el orden de los campos de este bloque pasa a ser: primero el tipo de "Fondo" (Color sólido / Texto / Imagen), después "Color de fondo", y por último la fila de "Color del borde" y "Grosor del borde" juntos. El campo "Forma" no se ha mencionado como parte de este reordenamiento, así que se asume que sigue estando el primero de todos, antes de "Fondo".

**2. Color de fondo de la ficha, independiente del tipo de fondo, transparente por defecto**

Hoy el selector de "Color de fondo" de una ficha solo aparece y solo se aplica cuando el tipo de fondo elegido es "Color sólido"; para "Texto" e "Imagen" no hay ningún color de fondo configurable.

Pasa a comportarse así:
- El selector de color de fondo está siempre visible y se aplica siempre, sea cual sea el tipo de fondo elegido ("Color sólido", "Texto" o "Imagen"): en "Texto" queda detrás del texto, y en "Imagen" queda detrás de la imagen (se aprecia si esta tiene zonas transparentes).
- Su valor por defecto es vacío, es decir, transparente (no se pinta ningún color detrás si el usuario no elige uno explícitamente), en vez del gris que se usaba hasta ahora como color de fondo por defecto.

Preguntas de alcance resueltas con el usuario:
- ¿Se aplica también cuando el fondo es "Imagen"? Sí, siempre, en los tres tipos de fondo.
- ¿Color por defecto? Vacío/transparente, no un color fijo.

**3. Sustituir los recursos de galería que se siembran por defecto**

Al empezar una partida completamente nueva (sin ninguna partida guardada previamente) se siembran automáticamente 3 recursos de ejemplo en la galería: una imagen y dos tipografías, todas marcadas como "(demo)". Estos 3 recursos de ejemplo se eliminan y se sustituyen por 3 recursos de tipo imagen, uno por cada imagen de localización ya presente en el proyecto (fondo de localización principal, fondo de localización secundaria y fondo de localización secundaria prohibida).

Estos 3 nuevos recursos deben poder identificarse de forma legible y estable: su identificador debe ser el nombre del propio fichero de imagen, sin la extensión (por ejemplo, si el fichero es `localization-main-back.jpeg`, el recurso resultante se identifica como `localization-main-back`), a diferencia del resto de recursos de la galería (los que suba cualquier usuario), que siguen identificándose con un identificador generado aleatoriamente como hasta ahora.

Este cambio de recursos por defecto solo afecta a partidas nuevas: las partidas ya existentes (que ya tienen sus propios recursos guardados) no se ven afectadas, ni pierden ni ganan recursos por este cambio.

Preguntas de alcance resueltas con el usuario:
- ¿Es aceptable que estos 3 recursos concretos tengan un identificador fijo y legible en vez de uno aleatorio como el resto? Sí, es la excepción deseada, limitada a estos 3 recursos por defecto.

## Apuntes técnicos

- El id de cualquier recurso se genera hoy siempre vía `crypto.randomUUID()` en `createResource()` (`src/core/resource.js:27`), sin relación con el nombre de fichero. Para los 3 recursos por defecto de este cambio, el id debe ser el nombre de fichero sin extensión en vez de un UUID generado; el resto de recursos (subidos por cualquier usuario desde la UI) deben seguir generando su id como hasta ahora.
- Los recursos demo actuales a eliminar y su siembra están en `src/data/defaultResources.js` (array `DEFAULT_RESOURCES`, entradas `icono_errante (demo)` tipo `imagen`, `Permanent Marker (demo)` y `Roboto (demo)` tipo `tipografia`) y se siembran desde `seedDefaultResources()` en `src/main.js` (solo cuando no hay estado guardado ni semilla previa, o cuando el flag `resourcesSeeded` es falso).
- Las 3 imágenes de origen a usar como nuevos recursos por defecto están en `src/img/localizations/`: `localization-main-back.jpeg`, `localization-secundary-back.jpeg`, `localization-secondary-forbidden-back.jpeg`.
- Los campos "Color del borde" y "Grosor del borde" de ficha están en `renderFichaSpecificFields()` en `src/ui/componentModal.js`, alrededor de las líneas 732-762 (cada uno en su propio `div.modal__field`, en filas separadas).
- El selector de tipo de fondo, el bloque "Color sólido" (`colorBlock`), el bloque "Texto" (`textBlock`) y el bloque "Imagen" (`imageBlock`) de ficha están en la misma función, alrededor de las líneas 764-901 (`bgTypeSelect`, `updateBgFieldsVisibility()`). Actualmente `updateBgFieldsVisibility()` solo muestra `colorBlock` cuando `fondoTipo === 'color'`; el campo de color de fondo pasa a quedar fuera de esa lógica de visibilidad condicional (siempre visible, independiente de `fondoTipo`).
- Ya existe en este mismo fichero (alrededor de las líneas 293-334, propiedades del componente de texto) un patrón directamente reutilizable para "color de fondo transparente por defecto": un `input[type=color]` junto a un checkbox "Transparente", donde `colorFondo = ''` significa transparente y desactiva/oculta el selector de color mientras esté marcado. Este patrón (campo color + checkbox "Transparente", valor `''` = transparente) es el más consistente con el resto de la app para replicar en ficha, en vez de introducir un mecanismo nuevo de "sin color".
- El renderizado del color de fondo aplicado está en `src/ui/componentRenderer.js`, alrededor de las líneas 814-846 (rama según `fondoTipo`): ninguna rama debe forzar ya un color de fondo por defecto (`'#cccccc'`) cuando `colorFondo` esté vacío — pasa a no pintar nada (transparente) en ese caso, en las tres ramas (`color`, `texto`, `imagen`).
- `DEFAULT_FICHA_PROPERTIES.colorFondo` (por defecto `'#cccccc'`) está definido en `src/ui/componentModal.js` alrededor de la línea 52; pasa a `''` (vacío/transparente).
