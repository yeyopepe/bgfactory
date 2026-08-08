- **Nombre**: Botón "Publicar" (variante de solo mesa ofuscada) y script `build_obf.py` (variante completa ofuscada)
- **Código**: 00080
- **Tipo**: change

## Descripción completa

Se quieren dos vías nuevas, independientes entre sí, para obtener entregables ofuscados del proyecto (hoy solo existe `build.py`, que genera la build completa sin ofuscar):

- Un botón **"Publicar"** dentro de la propia app (modo edición) que genera la variante de **solo mesa** (sin modo edición) ya ofuscada.
- Un script Python nuevo, **`build_obf.py`**, que genera la variante **completa** (mesa + edición) ya ofuscada.

`build.py` no cambia: sigue generando el entregable base sin ofuscar (mesa + edición), y es ese entregable el que, abierto en el navegador, ya contiene el botón "Publicar" dentro de su modo edición.

### Botón "Publicar" (variante de solo mesa ofuscada)

Vive en la barra de herramientas de modo edición, junto a "Guardar"/"Exportar"/"Importar" — mismo criterio de visibilidad: solo en modo edición, nunca para un jugador en modo juego. Genera y descarga, sin salir de la app ni depender de terminal/Python, el HTML ofuscado de la variante de solo mesa (sufijo "game"), a partir de la partida que esté cargada en ese momento en el navegador.

Qué contiene el entregable generado:

- Todo lo que hoy es exclusivo del modo edición desaparece: sin botón para entrar en modo edición, sin la barra de herramientas de edición, sin paneles de gestión de componentes/recursos, sin ventanas de configuración/edición ni las de exportar/importar partida — incluidos los huecos vacíos en pantalla que hoy reservan esos controles. Lo compartido con el modo juego (modelo de datos de componentes, autoguardado, mesa infinita, interacción con fichas/dados/cartas, etc.) se mantiene igual que hoy.
- El CSS no se recorta (se mantiene íntegro, sin separar por marcadores): el único efecto es que el fichero final pesa algo más de lo estrictamente necesario, sin ningún efecto visible ni funcional, ya que el HTML/JS de edición ya no está presente para que ese CSS se llegue a aplicar.
- Los recursos (imágenes y tipografías) que ningún componente de la partida esté usando se eliminan de la galería empaquetada — "en uso" = referenciado en cualquier profundidad de las `properties` de algún componente, sin trato especial para los 38 recursos por defecto (fondos de localización, mochila, objetos, reversos de evento): si no están en uso, se eliminan igual que cualquier otro. Si la partida no tiene ningún componente, todos sus recursos se consideran no usados y se eliminan igualmente — mismo criterio sin excepción.

Comportamiento del botón:

- Al pulsarlo, pide nombre de fichero igual que "Guardar" (`prompt()` nativo del navegador), precargado con `{título completo de la app}-game.html`.
- Mientras dura la operación (recortar el código exclusivo de edición, filtrar recursos no usados y ofuscar el bundle, todo en el propio navegador), el botón muestra el estado "Publicando…" deshabilitado. Al terminar, dispara la descarga del fichero con el nombre confirmado.
- Opera siempre sobre la partida actualmente cargada en la app (mismo estado que vería "Guardar") — nunca sobre una partida vacía ni un fichero aparte.
- El código exclusivo de modo edición se identifica mediante marcadores introducidos en el código fuente que señalan explícitamente qué partes son exclusivas de ese modo, para que el recorte sea fiable y no dependa solo de ocultar el botón de acceso (ocultarlo no basta: el código de edición seguiría presente e incluido en el fichero final, solo que inaccesible desde la interfaz). No hace falta eliminar el 100% del código de modo edición del proyecto fuente — sigue existiendo en `/src` para poder seguir generando también la build completa.
- No toca el número de versión del proyecto: usa la versión vigente tal cual para nombrar/identificar el entregable, sin registrarla como una versión oficial nueva.

Casos límite:

- **Se pulsa "Publicar" en un entorno sin bundle embebido** (p. ej. `src/index.html` de desarrollo, servido con Live Server, sin JS/CSS ya incrustados): muestra un error claro explicando que hace falta abrir un entregable ya generado por `build.py`, en vez de generar un fichero corrupto o a medias.
- **Marcadores de bloque de "exclusivo de edición" desbalanceados** (falta el de cierre, o aparece uno de cierre sin su apertura): se aborta con una notificación/modal de error dentro de la propia app indicando dónde ha fallado, sin generar un entregable a medias ni con marcadores visibles.
- **Falla el paso de ofuscado**: se aborta sin descargar nada, con el mismo modal de error.

Quién puede usarlo: quien desarrolla el proyecto, desde dentro de la propia app en modo edición — no es funcionalidad para el jugador final, y no depende de tener Python ni la terminal a mano.

Componente visual: sí — nuevo botón "Publicar" en la barra de herramientas de modo edición, con su estado deshabilitado/"Publicando…" durante la operación. Ver `design_boton-publicar.html` y `design_navigation_publicar.md`.

### `build_obf.py` (variante completa ofuscada)

Script Python, ejecutado a mano desde terminal — mismo criterio de uso que `build.py` hoy. Ejecuta `build.py`, toma el HTML que genera y escribe una copia ofuscada del mismo con el sufijo `_obf`.

- Se guarda en la misma carpeta que ya usa `build.py` (`src/_output/versions/`), junto al fichero sin ofuscar del que parte.
- Nombre: mismo nombre base que genera `build.py` (`index-v{NNNN}.html`) con el sufijo `_obf` añadido antes de la extensión → `index-v{NNNN}_obf.html`.
- Ofusca con el mecanismo ya existente en el repositorio (`src/scripts/obfuscate_bundle.js`, apoyado en el vendor `src/scripts/vendor/javascript-obfuscator.browser.js`), sin cambios en sus ajustes.
- Si `build.py` o el ofuscador fallan, se detiene con un error claro, sin generar un entregable a medias.

Quién puede usarlo: quien desarrolla el proyecto, desde terminal — no es funcionalidad para el jugador final, sin relación con el botón "Publicar" (variantes distintas: completa vs. solo mesa).

Sin componente visual: es una herramienta de generación de fichero desde terminal, no añade ni cambia ninguna pantalla ni elemento de interfaz de la app.

## Apuntes técnicos

- El script `build.py` empaqueta el entregable recorriendo el grafo de imports ES estático a partir de `src/main.js` (funciones `visit_module`/`IMPORT_PATTERN`); no hay ningún tipo de eliminación de código muerto más allá de esa alcanzabilidad.
- **Mecanismo de detección del código exclusivo de edición (prioridad acordada: que el modo juego quede completo y correcto; que se cuele algún resto exclusivo de edición no es crítico):** la mayoría de ficheros exclusivos de edición se detectan por alcanzabilidad de grafo de imports (recorriendo el grafo desde los puntos de entrada de cada modo, igual que ya hace `build.py`), sin depender de que alguien los marque a mano. El marcado manual (marcador de bloque `EDIT-ONLY-START`/`EDIT-ONLY-END`) queda reservado a los pocos ficheros donde código de ambos modos convive en las mismas líneas:
  - `src/main.js`: imports y llamadas a `renderModeSwitcher`/`renderEditToolbar`/`renderEditMode` (`ui/editModeToggle.js`, `modes/edit/editMode.js`), y la rama `mode === MODES.EDIT` de `renderActiveMode()`.
  - `src/ui/editModeToggle.js`: mixto — `renderModeSwitcher`/`createFitButton` (usado también en modo juego) se conservan; solo `renderEditToolbar` (Guardar/Exportar/Importar/Publicar) es exclusiva de edición.
  - `src/core/persistence.js`: `buildComponentsExport`/`parseImportedComponents` son exclusivos de la barra de edición; `saveState`/`loadState`/`readSeedState` son compartidos (autoguardado, también en modo juego).
  - `src/index.html`: contenedor `#edit-toolbar` (no `#mode-switcher`, que sigue siendo necesario en modo juego para el botón "Ajustar zoom").
  - Convención para el futuro (a documentar en `ARCHITECTURE.md`/`STYLE_BIBLE.md` durante la implementación): cualquier funcionalidad nueva de modo edición debe añadirse preferentemente en un fichero propio en vez de inline dentro de estos ficheros mixtos, para que caiga en el caso "se detecta solo por grafo" y no en el de "hay que acordarse del marcador".
- No hace falta una comprobación exhaustiva de que no haya quedado ningún resto de edición en el bundle final — basta con que el fallo por marcador de bloque mal formado impida generar un entregable corrupto o a medias (ver "Casos límite" del botón "Publicar"). Un resto de edición que se cuele por un marcador olvidado en el futuro es un defecto menor a corregir cuando se detecte, no algo que deba bloquear la operación.
- `src/core/state.js` mantiene el campo `mode`/`MODES.EDIT`/`setMode()` sin cambios: es infraestructura compartida mínima, no se considera código exclusivo de edición a recortar.
- **Recursos "en uso" — reutilizable, no hace falta reimplementarlo:** `core/resource.js` ya expone `isResourceInUse(resourceId, components)` y `getComponentsUsingResource(resourceId, components)`, apoyadas en el helper `collectDeepValues(value)` que recorre `component.properties` en profundidad — es exactamente la comprobación que necesita el botón "Publicar", aplicada a cada recurso de `getResources()` contra la lista de componentes de la partida cargada.
- **`core/fileExport.js` (`buildExportHtml`, usado hoy por "Guardar") ya resuelve la base técnica que necesita "Publicar":** clona `document.documentElement` (que en un entregable ya generado por `build.py` trae el JS/CSS ya embebidos), sustituye `#initial-state` por el estado actual y descarga el resultado como `Blob` vía `downloadHtml()`. "Publicar" es conceptualmente una variante de ese mismo mecanismo, con dos pasos añadidos antes de descargar: (a) recortar del bundle clonado el código exclusivo de modo edición, y (b) ofuscar el bundle JS resultante.
- **Ofuscación ya vendorizada para navegador:** `src/scripts/vendor/javascript-obfuscator.browser.js` es la build "browser" (UMD) de `javascript-obfuscator` — hoy se invoca desde Node (`src/scripts/obfuscate_bundle.js`, con el shim `global.self = global`, necesario solo porque Node no tiene ese global de forma nativa). Ejecutándose ya dentro de un navegador real, ese shim no hace falta: el bundle vendorizado puede cargarse/ejecutarse directamente en el contexto de la app. Punto a resolver por `ms-how`: cómo se embebe ese vendor (¿módulo más del bundle de `build.py`, cargado bajo demanda al pulsar "Publicar", u otra vía?) y si conviene moverlo a un Web Worker para no bloquear el hilo principal mientras dura la ofuscación (ajustes como `controlFlowFlattening`, `deadCodeInjection`, `selfDefending` son costosos).
- **Punto abierto para `ms-how`:** en el navegador solo existe el bundle ya concatenado en un único `<script>` (sistema `require`/`module.exports` en runtime que ya genera `build.py`), no ficheros fuente separados — el mecanismo de marcadores `EDIT-ONLY` sigue aplicándose igual (búsqueda de cadenas literales sobre el texto del bundle), pero la exclusión completa de ficheros exclusivos de edición detectados hoy por grafo de imports en Python necesita un equivalente en JS sobre el bundle ya concatenado: una vía plausible es que, tras recortar los bloques `EDIT-ONLY`, se recorran en JS las llamadas `require(...)` que quedan en cada módulo superviviente (mismo principio de alcanzabilidad, aplicado al texto ya bundleado en vez de a ficheros) para excluir los módulos que dejen de ser alcanzables desde `main.js` recortado — sin cerrarlo aquí como decisión.
- `build_obf.py` puede reutilizar literalmente `obfuscate_bundle.js` (ejecutar `build.py` como subproceso, extraer el bloque `<script>` del HTML resultante con una regex, pasarlo por `obfuscate_bundle.js`, reinsertar el bundle ofuscado y escribir `index-v{NNNN}_obf.html`).
- `.claude/ms-context.json` no necesita ningún campo para `build_obf.py`: no forma parte del proceso de versión del framework (`framework.versioning`/`buildCommand`/`buildOutputPath` siguen apuntando solo a `build.py`).
- Nota de contexto para el futuro (no bloquea esta implementación): el usuario prevé que la skill `ms-version` desaparecerá más adelante, y que cualquier lógica que hoy dependa de esa skill debería vivir directamente en los scripts de build. Ya es así hoy: `ms-version` es un wrapper fino que solo ejecuta `buildCommand` (`python ./src/scripts/build.py`) y verifica el resultado — toda la lógica real vive en `build.py`. `build_obf.py` debe seguir el mismo principio: autocontenido en Python, sin depender de ninguna skill para su lógica.
