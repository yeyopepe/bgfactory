- **Nombre**: Incorporar imágenes de objetos, mochila y eventos como recursos de galería
- **Código**: 00051
- **Tipo**: change

## Prompt original del usuario

incorpora todos los recursos que hay en:
-  /src/resources/img/objects 
-  /src/resources/img/backpack
-  /src/resources/img/events

## Descripción completa

Se incorporan como recursos de imagen de la galería, disponibles para cualquier partida completamente nueva, todas las imágenes que hay hoy en las carpetas de objetos, mochila y eventos del proyecto: 25 imágenes de objetos (23 imágenes de frente de objeto individual, más 2 imágenes de reverso de carta de objeto — básico y crafteado), 3 imágenes de mochila (frente en estado adulto, niño y herido) y 7 imágenes de reverso de carta de evento (una por cada letra/categoría de evento). En total, 35 recursos nuevos.

Esto es una ampliación del mismo mecanismo con el que ya se incorporaron, en un cambio anterior, las 3 imágenes de fondo de localización como recursos de la galería: cada imagen pasa a estar disponible en la lista de recursos con un identificador legible y estable (el propio nombre del fichero de imagen, sin la extensión), en vez de un identificador aleatorio.

Preguntas de alcance resueltas con el usuario:

- **¿Se incorporan absolutamente todas las imágenes de esas 3 carpetas, sin excluir ninguna?** Sí, las 35 imágenes completas.
- **¿Qué identificador reciben?** El nombre del propio fichero de imagen, sin la extensión (por ejemplo, si el fichero es `object_front_alcohol.JPEG`, el recurso resultante se identifica como `object_front_alcohol`), igual que ya ocurre con los recursos de localización.
- **¿Hay algún elemento visual nuevo en la interfaz?** No: es una ampliación de los recursos disponibles en la galería que ya existe hoy, sin ningún panel, control o elemento nuevo en pantalla.
- **¿A qué partidas afecta?** Igual que ocurrió con los recursos de localización, esto solo afecta a partidas completamente nuevas (sin ninguna partida guardada previamente). Las partidas que el usuario ya tenga guardadas no se ven afectadas: no ganan ni pierden recursos por este cambio.
- **¿Quién puede usar estos recursos?** Cualquier persona que use la galería de recursos, sin ninguna restricción de rol o modo distinta de la que ya aplica hoy al resto de recursos.
- **¿Se eliminan o mueven las imágenes de origen tras incorporarlas?** No, se mantienen en su carpeta actual tal cual están, igual que se hizo con las imágenes de localización.

## Apuntes técnicos

- Precedente exacto a replicar: change cerrado `changes/closed/00047/`, parte 3 "Sustituir los recursos de galería que se siembran por defecto", que incorporó las 3 imágenes de `localizations` como recursos por defecto con id = nombre de fichero sin extensión.
- Modelo de datos: `DEFAULT_RESOURCES` en `src/data/defaultResources.js` (array de objetos `{id, name, type, fileName, dataUrl}`), sembrado por `seedDefaultResources()` en `src/main.js` hacia `createResource()` (`src/core/resource.js:25-34`), que ya soporta recibir un `id` fijo en vez de generarlo con `crypto.randomUUID()`.
- `resourceTypeForFileName()` en `src/core/resource.js:20-23` mapea la extensión (normalizada a minúsculas) al tipo `imagen`/`tipografia`; funciona igual aunque el nombre real del fichero tenga la extensión en mayúsculas (p. ej. `.JPEG`, `.PNG`), ya que la normalización es solo interna para la detección de tipo — el campo `fileName` puede conservar la extensión tal cual está en disco.
- Ficheros de origen usados (35 en total), todos bajo `src/resources/img/`:
  - `backpack/`: `backpack_front_adult.png`, `backpack_front_child.png`, `backpack_front_hurt.png`.
  - `objects/`: `object_front_alcohol.JPEG`, `object_front_arrow.JPEG`, `object_front_battery.JPEG`, `object_front_bow.JPEG`, `object_front_crap.JPEG`, `object_front_fishing_line.JPEG`, `object_front_fishing_rod.JPEG`, `object_front_food1.JPEG`, `object_front_food2.JPEG`, `object_front_knife.JPEG`, `object_front_lever.JPEG`, `object_front_lintern.JPEG`, `object_front_medkit.JPEG`, `object_front_needle.JPEG`, `object_front_piolet.JPEG`, `object_front_radio.JPEG`, `object_front_rope.JPEG`, `object_front_sleep_bag.JPEG`, `object_front_spear.JPEG`, `object_front_stick.JPEG`, `object_front_tape.JPEG`, `object_front_vandage.JPEG`, `object_front_water.JPEG`, `objects_back_basic.JPEG`, `objects_back_crafted.JPEG`.
  - `events/`: `events_back_D.PNG`, `events_back_J.JPEG`, `events_back_L.JPEG`, `events_back_M.JPEG`, `events_back_S.PNG`, `events_back_V.JPEG`, `events_back_X.JPEG`.
- Ninguna referencia a estas imágenes existe todavía en el código (comprobado: sin coincidencias de `img/img`, `backpack_front`, `events_back`, `object_front` ni `objects_back` fuera de `src/resources/`), por lo que es una ampliación puramente aditiva sin impacto en funcionalidad existente.
- Implementado: `src/data/defaultResources.js` pasó de ~2.8MB (3 imágenes) a ~39.4MB (38 imágenes en total: las 3 de localización más estas 35), al embeber en base64 las ~26MB en binario de las 35 imágenes de origen. Se verificó la sintaxis del fichero resultante con `node --check` (Node solo se usó para esta comprobación puntual, el proyecto no depende de Node para el build).
