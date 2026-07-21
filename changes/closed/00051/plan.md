## (a) Anotaciones funcionales

- Sin dudas técnicas nuevas: el alcance y los 7 puntos de diseño funcional ya quedaron resueltos con el usuario en `description.md` (qué imágenes, identificador, sin componente visual, alcance de datos, sin restricción de rol, ficheros fuente intactos).
- Fuera de alcance: no se toca `seedDefaultResources()` (`src/main.js`), `createResource()`/`resourceTypeForFileName()` (`src/core/resource.js`) ni `backfillDefaultResourcesIfNeeded()` — ya soportan cualquier número de entradas en `DEFAULT_RESOURCES` sin ningún cambio de código, solo se amplía el array de datos.
- Aviso de tamaño (ya anotado en `description.md`): las 35 imágenes de origen suman ~26MB en binario; en base64 esto añade unos ~36MB adicionales a `src/data/defaultResources.js` y, por tanto, al entregable HTML autocontenido (`src/_output/versions/index-v{NNNN}.html`), que pasa de pesar unos pocos MB a varias decenas de MB. Es una consecuencia directa del alcance ya confirmado (incorporar las 35 imágenes tal cual), no una decisión técnica nueva a resolver aquí.

## (b) Solución técnica

1. Generar, con un script Python auxiliar de un solo uso (no se conserva en el repo), el fragmento de 35 objetos JS a insertar en `DEFAULT_RESOURCES`, recorriendo `src/resources/img/backpack/`, `src/resources/img/objects/` y `src/resources/img/events/`. Por cada fichero:
   - `id` y `name`: nombre de fichero sin extensión (p. ej. `object_front_alcohol`), igual que el precedente de `localization-*`.
   - `type`: `"imagen"` (todas son imágenes).
   - `fileName`: nombre de fichero original tal cual está en disco, extensión incluida con su capitalización real (`.JPEG`, `.PNG`, `.png`).
   - `mimeType`: deducido de la extensión en minúsculas (`jpeg`/`jpg` → `image/jpeg`, `png` → `image/png`), igual criterio que `resourceTypeForFileName()` (`src/core/resource.js:7-18`), aunque aquí se calcula en el script porque `mimeType` no lo deduce esa función (solo el `type` genérico imagen/tipografía).
   - `dataUrl`: `data:` + mimeType + `;base64,` + contenido del fichero codificado en base64.
2. Insertar esos 35 objetos en `src/data/defaultResources.js`, dentro del array `DEFAULT_RESOURCES`, a continuación de los 3 ya existentes (antes del `];` de cierre, línea 34 actual), respetando el mismo formato/indentación de los objetos ya presentes. No se modifica ninguno de los 3 objetos existentes de `localization-*`.
3. Verificar que `defaultResources.js` sigue siendo JS válido con `node --check src/data/defaultResources.js` (comprobación puntual de sintaxis, sin depender de Node para nada más del proyecto) — no se ejecuta `build.py` en este paso, ya que ese script incrementa `CURRENT_VERSION` como efecto secundario y generar versión es un paso separado, exclusivo de la skill `ms-version`.
4. No se toca ningún otro fichero de código: `seedDefaultResources()` (`src/main.js`) itera `DEFAULT_RESOURCES` sin más, `createResource()` (`src/core/resource.js`) ya acepta `id` fijo, y `core/state.js` no depende del número de recursos sembrados.

## (c) Cambios de arquitectura

`design/docs/ARCHITECTURE.md`, sección "4.1 Modelo de datos de recurso (galería)", último párrafo (línea 139, el que describe `data/defaultResources.js`): actualmente dice que `DEFAULT_RESOURCES` son "los 3 recursos" (las 3 imágenes de localización, cambio 00047). Pasa a reflejar que ahora son 37 recursos por defecto en total: los 3 de localización (00047) más 3 imágenes de mochila, 24 de objetos y 7 de eventos (cambio 00051) — mismo mecanismo de id fijo (nombre de fichero sin extensión) para los 37, sin cambio de comportamiento en el backfill ni en el resto de la sección.
