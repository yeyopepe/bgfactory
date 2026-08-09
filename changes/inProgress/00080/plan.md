- **Fecha creación**: 2026-08-09

## (a) Anotaciones funcionales

**Fuera de alcance:** el script `build_obf.py` (variante completa ofuscada) no se implementa en este plan — es la otra mitad, independiente, del mismo cambio 00080. Este `plan.md` cubre únicamente el botón "Publicar" (variante de solo mesa ofuscada). Cuando se aborde `build_obf.py` conviene un `plan.md` propio, reutilizando el mecanismo de marcado `EDIT-ONLY-START`/`EDIT-ONLY-END` y el fichero `obfuscate_bundle.js` ya existentes (ver Apuntes técnicos de `description.md`).

**Dudas resueltas con el usuario:** ninguna pregunta abierta — el análisis técnico (`ms-internal-tech-analysis`) confirmó que el código real coincide con lo que ya anotaba `description.md` en "Apuntes técnicos", sin incongruencias.

**Precisión técnica sobre el alcance de `EDIT-ONLY` en `main.js`/`ui/editModeToggle.js`** (afinando el apunte de `description.md`, sin contradecirlo): `description.md` lista "imports y llamadas a `renderModeSwitcher`/`renderEditToolbar`/`renderEditMode`" como exclusivas de edición en `main.js`. Al revisar el código real, `renderModeSwitcher` no puede marcarse entera como `EDIT-ONLY`: dentro de ella, `createFitButton('mode-switcher__fit-btn')` (botón "Ajustar zoom") es funcionalidad de **modo juego**, compartida, y debe sobrevivir en el entregable publicado — el propio `description.md` ya lo deja claro para `index.html` ("`#mode-switcher` sigue siendo necesario en modo juego para el botón 'Ajustar zoom'"). La solución: en `main.js` solo se marca como `EDIT-ONLY` la llamada a `renderEditToolbar`, no la de `renderModeSwitcher`; dentro de `ui/editModeToggle.js`, se marca como `EDIT-ONLY` únicamente el bloque del botón "Entrar en modo edición" de `renderModeSwitcher`, dejando `createFitButton` fuera del marcador. Ver tarea 2.

## (b) Solución técnica

1. **`src/ui/editModeToggle.js` — marcar como `EDIT-ONLY` solo el botón "Entrar en modo edición" dentro de `renderModeSwitcher`.** Envolver únicamente la creación/inserción de ese botón (no la llamada a `createFitButton`) entre comentarios `/* EDIT-ONLY-START */` y `/* EDIT-ONLY-END */`:
   ```js
   export function renderModeSwitcher(container) {
     container.innerHTML = '';
     if (getState().mode !== MODES.PLAY) return;

     /* EDIT-ONLY-START */
     const button = document.createElement('button');
     button.textContent = 'Entrar en modo edición';
     button.addEventListener('click', () => setMode(MODES.EDIT));
     container.appendChild(button);
     /* EDIT-ONLY-END */

     container.appendChild(createFitButton('mode-switcher__fit-btn'));
   }
   ```
   Marcar entera la función `renderEditToolbar` como `EDIT-ONLY` (cabecera y cuerpo completos), ya que solo se invoca en modo edición y su recorte no deja huecos de funcionalidad de juego.

2. **`src/main.js` — marcar como `EDIT-ONLY` solo lo exclusivo de edición.**
   - En la lista de imports desde `./ui/editModeToggle.js`, separar `renderEditToolbar` de `renderModeSwitcher` (esta última no se marca):
     ```js
     import { renderModeSwitcher, renderEditToolbar } from './ui/editModeToggle.js';
     ```
     pasa a:
     ```js
     import { renderModeSwitcher } from './ui/editModeToggle.js';
     /* EDIT-ONLY-START */
     import { renderEditToolbar } from './ui/editModeToggle.js';
     /* EDIT-ONLY-END */
     ```
   - El import completo de `renderEditMode`/`deleteSelectedComponent`/`moveSelectedComponent` desde `./modes/edit/editMode.js` se envuelve entero en `EDIT-ONLY` (usado únicamente por la rama de edición y por los atajos globales, ver siguiente punto).
   - En `renderActiveMode()`, usar patrón de retorno anticipado para poder recortar solo el bloque de edición sin romper la sintaxis restante:
     ```js
     function renderActiveMode() {
       /* EDIT-ONLY-START */
       if (getState().mode === MODES.EDIT) {
         renderEditMode(contentEl);
         return;
       }
       /* EDIT-ONLY-END */
       renderPlayMode(contentEl);
     }
     ```
   - En `renderAll()`, envolver solo la línea `renderEditToolbar(toolbarEl);` en `EDIT-ONLY` (`renderModeSwitcher(switcherEl);` queda fuera).
   - Los atajos globales (`initGlobalShortcuts`) referencian `deleteSelectedComponent`/`moveSelectedComponent` de `editMode.js`, exclusivas de edición: envolver en `EDIT-ONLY` las líneas `onDeleteSelected: () => deleteSelectedComponent(),` y `onMoveSelected: (dx, dy) => moveSelectedComponent(dx, dy),`, sustituyendo cada callback por uno vacío (`() => {}`) fuera del bloque marcado, para que `initGlobalShortcuts` siga recibiendo las claves que su firma espera.

3. **`src/core/persistence.js` — marcar `buildComponentsExport`/`parseImportedComponents` como `EDIT-ONLY`.** Son exclusivas del flujo Exportar/Importar de la barra de edición (`ui/editModeToggle.js`); `saveState`/`loadState`/`readSeedState` quedan fuera del marcador (autoguardado, compartido).

4. **`src/index.html` — marcar el contenedor `#edit-toolbar` como exclusivo de edición.** Envolver `<div id="edit-toolbar"></div>` (no `<div id="mode-switcher"></div>`, que se conserva) en un comentario HTML equivalente, p.ej.:
   ```html
   <!-- EDIT-ONLY-START -->
   <div id="edit-toolbar"></div>
   <!-- EDIT-ONLY-END -->
   ```
   Añadir además, en el mismo fichero, el `<script>` con el vendor `javascript-obfuscator.browser.js` embebido íntegro (ver tarea 6), también envuelto en marcadores `EDIT-ONLY` — así el propio entregable de "Guardar"/`build.py` lo trae (necesario para que "Publicar" pueda usarlo en runtime), pero desaparece del entregable ya publicado por "Publicar" (que no lo necesita: ya generó el bundle ofuscado, no vuelve a ofuscar sobre sí mismo).

5. **Nuevo `src/core/publish.js` — motor de recorte y reconstrucción del bundle.** Funciones:
   - `stripEditOnlyBlocks(text)`: recorta con regex no codiciosa todo lo que quede entre pares `/* EDIT-ONLY-START */` ... `/* EDIT-ONLY-END */` (variante HTML `<!-- EDIT-ONLY-START --> ... <!-- EDIT-ONLY-END -->` para el HTML, mismo mecanismo aplicado también a la cadena del documento clonado). Lanza un error explícito con el índice del marcador implicado si detecta apertura sin cierre o cierre sin apertura (recorrido secuencial contando aperturas/cierres, no solo contar globalmente — para poder señalar cuál está descolocado).
   - `pruneUnreachableModules(bundleText)`: localiza cada bloque de módulo por el patrón literal que genera `build.py` (`__modules['{ruta}'] = function(module, exports, require) {` ... hasta el siguiente `__modules[...]` o el final del bundle), extrae de cada bloque superviviente las llamadas `require('ruta')` restantes tras el recorte de la tarea anterior, calcula el conjunto alcanzable por recorrido en anchura/profundidad desde `'main.js'`, y devuelve el bundle reconstruido concatenando solo los bloques alcanzables (mismo orden relativo, más el runtime `__modules`/`__cache`/`require` y la línea final `require('main.js');`, sin tocar esas tres partes).
   - `buildPublishedDocument({ resources, components, ...restoDelEstado })`: función principal que orquesta clonar `document.documentElement`, localizar el `<script>` del bundle (heurística: el único `<script>` sin `type="application/json"` ni `src`, con contenido no vacío — si no se encuentra o está vacío, lanza el error de "entorno sin bundle embebido"), aplicarle `stripEditOnlyBlocks` + `pruneUnreachableModules`, aplicar `stripEditOnlyBlocks` también al HTML clonado completo (recorta `#edit-toolbar` y el `<script>` del vendor obfuscador), filtrar `resources` con `isResourceInUse` (`core/resource.js`) contra `components`, y devolver `{ html: clone, trimmedBundleText }` — deja el paso de ofuscado y el de rellenar `#initial-state`/servir el HTML final a quien la invoque (tarea 7), para no acoplar este módulo a la comunicación con el Worker.

6. **`src/scripts/build.py` — embeber el vendor del ofuscador en el entregable.** Añadir un paso análogo al de `bundle_js`: leer `src/scripts/vendor/javascript-obfuscator.browser.js` tal cual (sin transformar, no es un módulo ES) e insertarlo en el HTML final como `<script>` propio, envuelto en los marcadores `EDIT-ONLY` de la tarea 4, situado junto al resto de scripts antes de `</body>`. Sin cambios en el mecanismo de módulos existente (`visit_module`/`IMPORT_PATTERN`): el vendor no entra en ese grafo.

7. **Nuevo Web Worker inline en `src/core/publish.js` — ofuscado sin bloquear el hilo principal.** Función `obfuscateInWorker(code)` que:
   - Construye el código del Worker como cadena de texto: contenido íntegro del vendor (leído del propio documento, del `<script>` embebido por la tarea 6 — `document.querySelector('script[data-vendor-obfuscator]').textContent`, atributo `data-vendor-obfuscator` añadido en la tarea 6 para localizarlo sin ambigüedad) + un listener `self.onmessage` que ejecuta `JavaScriptObfuscator.obfuscate(e.data.code, e.data.options)` y responde con `postMessage({ code: result.getObfuscatedCode() })` o `postMessage({ error: err.message })` si lanza excepción.
   - Crea el Worker con `new Worker(URL.createObjectURL(new Blob([workerSource], { type: 'application/javascript' })))`, envía el bundle recortado + opciones de ofuscado (mismas opciones que ya usa `obfuscate_bundle.js`: `compact`, `controlFlowFlattening`, `deadCodeInjection`, `stringArray`, `stringArrayEncoding: ['base64']`, `renameGlobals: false`, `selfDefending`), y devuelve una `Promise` que resuelve con el código ofuscado o rechaza con el error recibido — el Worker se termina (`worker.terminate()`) tras recibir la respuesta, sin reutilizarse entre publicaciones (uso puntual, no justifica una caché).

8. **`src/ui/editModeToggle.js` — botón "Publicar" en `renderEditToolbar`.** Añadir tras el botón "Importar" (mismo estilo que sus hermanos, sin modificador de clase, ver `design_boton-publicar.html`):
   - Click → `prompt('Publicar', `${getFullAppTitle(getAppTitle())}-game.html`)`; si se cancela/vacío, no hace nada.
   - Con nombre confirmado: deshabilita el botón, cambia su texto a "Publicando…", y llama a la función orquestadora `publish()` de `core/publish.js` (ver tarea 9) pasándole el nombre confirmado (con `.html` si falta, mismo criterio que "Guardar").
   - Al terminar (éxito o error), siempre restaura el botón a texto "Publicar" y lo rehabilita.

9. **`src/core/publish.js` — función orquestadora `publish(filename)`.** Encadena: `buildPublishedDocument(...)` (tarea 5, con captura de errores de bundle-no-encontrado y marcadores desbalanceados → cada uno relanza con un mensaje ya listo para `showErrorModal`) → `obfuscateInWorker(trimmedBundleText)` (tarea 7) → sustituir en el `<script>` del bundle del HTML clonado el texto recortado por el ofuscado → rellenar `#initial-state` del clon con `JSON.stringify({ version: CURRENT_VERSION, components, resources: recursosFiltrados, panelState, resourcePanelState, resourcesSeeded, tags, tagPanelState, appTitle })` (mismos campos que `buildExportHtml`, mismo criterio de "resourcesSeeded no se recalcula, se preserva") → `downloadHtml(filename, `<!doctype html>\n${clone.outerHTML}`)` (reutiliza `core/fileExport.js` tal cual, sin cambios). Cualquier error en cualquier paso (bundle no encontrado, marcadores desbalanceados, fallo del Worker) se traduce en una llamada a `showErrorModal` con el mensaje correspondiente del caso límite de `description.md`, sin descargar nada.

Orden de implementación: 6 → 4 (dependen entre sí, el marcador del vendor necesita que `build.py` ya lo embeba) → 1, 2, 3 (marcado `EDIT-ONLY` del resto del código fuente) → 5 → 7 → 9 → 8 (UI al final, cuando ya existe todo lo que invoca).

```mermaid
flowchart TD
    A(["Click en 'Publicar'"]) --> B["prompt() nombre de fichero, precargado {título}-game.html"]
    B --> C{"¿Nombre confirmado?"}
    C -->|Cancela / vacío| Z1(["Fin, sin cambios"])
    C -->|Confirma| D{"¿Hay bundle embebido en el documento?"}
    D -->|No, es src/index.html de desarrollo| E["showErrorModal: abre un entregable generado por build.py"]
    E --> Z1
    D -->|Sí| F["Botón → estado 'Publicando…' deshabilitado"]
    F --> G["Recortar bloques EDIT-ONLY-START/END del texto del bundle"]
    G --> H{"¿Marcadores balanceados?"}
    H -->|No, falta apertura o cierre| I["showErrorModal: indica dónde falla el marcador"]
    I --> J["Botón vuelve a 'Publicar'"]
    J --> Z1
    H -->|Sí| K["Recalcular alcanzabilidad de require(...) desde main.js sobre el bundle recortado"]
    K --> L["Descartar del texto los módulos __modules[...] no alcanzables"]
    L --> M["Filtrar recursos de la partida: descartar los no usados (isResourceInUse)"]
    M --> N["Ofuscar el bundle recortado (Web Worker, ver diagrama de secuencia)"]
    N --> O{"¿Ofuscado OK?"}
    O -->|Falla| P["showErrorModal: fallo de ofuscado"]
    P --> J
    O -->|OK| Q["Construir HTML final: clonar documento, quitar del DOM lo exclusivo de edición, sustituir bundle por el ofuscado, rellenar #initial-state con el estado actual (recursos ya filtrados)"]
    Q --> R["downloadHtml() con el nombre confirmado en B"]
    R --> S["Botón vuelve a 'Publicar'"]
    S --> Z2(["Fin"])
```

```mermaid
sequenceDiagram
    actor Usuario
    participant Toolbar as ui/editModeToggle.js
    participant Publish as core/publish.js
    participant Worker as Web Worker (Blob URL + vendor obfuscator)

    Usuario->>Toolbar: Click "Publicar" (nombre ya confirmado)
    Toolbar->>Toolbar: Deshabilita botón, texto "Publicando…"
    Toolbar->>Publish: Solicita bundle publicado (bundle recortado)
    Publish->>Worker: new Worker(Blob URL con vendor + listener)
    Publish-)Worker: postMessage(bundle recortado, opciones de ofuscado)
    Worker->>Worker: JavaScriptObfuscator.obfuscate(bundle, opciones)
    alt Ofuscado correcto
        Worker--)Publish: postMessage(código ofuscado)
        Publish->>Publish: Construye HTML final y descarga
        Publish-->>Toolbar: Publicación completada
        Toolbar-->>Usuario: Descarga disparada, botón vuelve a "Publicar"
    else Falla el ofuscado
        Worker--)Publish: postMessage(error)
        Publish->>Toolbar: showErrorModal("Fallo de ofuscado")
        Toolbar-->>Usuario: Botón vuelve a "Publicar"
    end
```

## (c) Cambios de arquitectura

- **`design/docs/architecture/06-persistence-build.md`**: añadir una sección nueva "Publicar (variante de solo mesa ofuscada)" junto a "Guardar a fichero", documentando el flujo de `core/publish.js` (recorte `EDIT-ONLY`, poda de módulos no alcanzables, filtrado de recursos no usados, ofuscado en Web Worker, descarga) y su relación con `build.py`/`buildExportHtml`.
- **`design/docs/architecture/INDEX.md`** (§7 "Convenciones de código"): documentar la convención `EDIT-ONLY-START`/`EDIT-ONLY-END` (comentario JS `/* ... */` o HTML `<!-- ... -->`, siempre en pareja, delimitando código exclusivo de modo edición dentro de un fichero compartido con modo juego) como convención transversal nueva, con la nota ya prevista en `description.md`: funcionalidad nueva de modo edición se añade preferentemente en fichero propio para caer en el caso "se detecta por grafo de imports/`require`", reservando el marcador manual a los ficheros mixtos ya existentes.

## (d) Cambios en estilo

No aplica: el botón "Publicar" reutiliza el estilo ya existente de la barra de herramientas de modo edición sin ninguna variante visual propia (ver `design_boton-publicar.html`), y el estado "Publicando…" reutiliza el tratamiento genérico de botón `disabled` ya documentado.

## (e) Verificación

1. En un entregable generado por `build.py` (no en `src/index.html` de desarrollo), entrar en modo edición y comprobar que el botón "Publicar" aparece en la barra de herramientas, junto a "Guardar"/"Exportar"/"Importar", con el mismo estilo visual.
2. Pulsar "Publicar", cancelar el `prompt()` de nombre: no ocurre nada (ni descarga, ni cambio de estado del botón).
3. Pulsar "Publicar" con una partida cargada que tenga componentes y recursos (algunos en uso, alguno sin usar), confirmar un nombre: el botón muestra "Publicando…" deshabilitado durante el proceso y, al terminar, se dispara la descarga de un `.html` con el nombre confirmado (con `.html` añadido si no se indicó), y el botón vuelve a "Publicar" habilitado.
4. Abrir el HTML descargado en el navegador: se ve directamente en modo juego (mesa con los componentes de la partida original), sin botón "Entrar en modo edición" visible, sin acceso a modo edición de ninguna forma, pero con el botón "Ajustar zoom" del selector de modo funcionando igual que en el entregable original.
5. Comprobar que el HTML descargado no contiene el `<script>` del vendor `javascript-obfuscator.browser.js` (ni el contenedor `#edit-toolbar`), y que su bundle JS está ofuscado (ilegible, sin nombres de función/variable originales).
6. Con la Consola/Network del navegador abiertas durante el paso 3, comprobar que la interfaz sigue respondiendo (se puede seguir interactuando con la mesa) mientras el botón dice "Publicando…" — confirma que el ofuscado corre en el Worker y no bloquea el hilo principal.
7. Repetir el paso 3 con una partida sin ningún componente: el HTML descargado no incluye ningún recurso en `#initial-state` (todos se consideran no usados), sin error.
8. Simular un `<script>` de bundle vacío o ausente (abrir `src/index.html` de desarrollo, si el botón llegara a mostrarse ahí, o forzando el caso en consola): el botón "Publicar" muestra el error "abre un entregable ya generado por build.py" sin descargar nada.
9. Ejecutar `build.py` tras el cambio y comprobar que el entregable resultante sigue funcionando en modo edición con todas sus funciones (Guardar/Exportar/Importar/Publicar), y que en modo juego nada ha cambiado (autoguardado, mesa infinita, interacción con componentes).
