# Plan técnico — 00100: Propiedad general "Oculto" en componentes

## (a) Anotaciones funcionales

**Fuera de alcance:**
- No aplica a recursos ni a mazos (ya acotado en `description.md`).
- No se añade ninguna migración explícita de datos: un componente guardado sin `oculto` se comporta como `false` por el simple hecho de que el código comprueba `component.oculto === true` / lo trata como falsy — mismo criterio ya usado por `mostrarTooltip`/`subirAlMoverInteractuar`, sin necesidad de tocar `core/persistence.js`.

**Dudas resueltas con el usuario:**
- P: ¿"Oculto" debe sincronizarse entre una Copia vinculada y su original, o quedar independiente por copia?
  R: Independiente por copia — mismo tratamiento que `bloqueado`/`x`/`y`/`order` (no se sincroniza).

## (b) Solución técnica

1. **`core/component.js`** — añadir el campo `oculto` al modelo, al mismo nivel que `bloqueado`/`mostrarTooltip`/`subirAlMoverInteractuar`:
   - `createComponent({ ..., oculto = false, ... })`, incluido en el objeto devuelto.
   - **No** se añade a `syncCopyWithOriginal` (que solo propaga `type`/`name`/`image`/`width`/`height`/`mostrarTooltip`/`subirAlMoverInteractuar`/`properties` sincronizadas): al no tocarlo, `oculto` queda con el mismo tratamiento que `bloqueado` — independiente por copia, igual que la respuesta del usuario pide. No hace falta tocar `NON_SYNCED_PROPERTY_KEYS` (esa tabla es solo para claves dentro de `properties` por tipo, `oculto` es un campo general de primer nivel).

2. **`ui/componentModal.js`** — pestaña "Generales": nuevo checkbox "Oculto", insertado en el DOM justo después del bloque `moveField` (Bloqueado) y antes del bloque `tooltipField` (Mostrar tooltip), mismo patrón exacto que los checkboxes existentes (`hiddenCheckbox.checked = workingComponent.oculto ?? false`, listener `change` que fija `workingComponent.oculto`, `createHelpIcon` con el texto explicando el efecto: no aparece en modo juego, se sigue viendo/editando con normalidad en modo edición).
   - Extender también el bloque "Copiar estilo"/"Pegar estilo" (grupo "Generales", líneas ~957-961 y ~995-1000): incluir `oculto` junto a `bloqueado`/`mostrarTooltip`/`subirAlMoverInteractuar` en el objeto `data.generales`/`clip.generales` y en la sincronización del checkbox tras pegar (`hiddenCheckbox.checked = workingComponent.oculto`) — mismo criterio que los otros tres campos de ese mismo grupo, para no dejar una inconsistencia donde "Generales" no cubra el checkbox nuevo.

3. **`ui/componentRenderer.js`** — insignia visual en modo edición, replicando el patrón de `showLockIndicator`/`createLockBadge`:
   - Nuevo parámetro `showHiddenIndicator = false` en `renderComponentsOnTable`.
   - Nuevo helper local `createHiddenBadge()` (análogo a `createLockBadge()`), con un icono de "ojo tachado" (ver `changes/inProgress/00100/design_insignia-oculto-mesa.html`, solo como referencia de iconografía).
   - En los cinco puntos donde hoy se hace `if (showLockIndicator && component.bloqueado) X.appendChild(createLockBadge());` (tipos `'texto'`, `'tablero'`, `'dado'`, `'documento'`, `'carta'`), añadir justo al lado `if (showHiddenIndicator && component.oculto) X.appendChild(createHiddenBadge());`.
   - Un componente puede estar `bloqueado` y `oculto` a la vez, así que ambas insignias deben poder convivir sin superponerse: la de candado sigue en la esquina superior derecha (`.component-lock-badge`, sin cambios); la nueva se coloca en la esquina inferior derecha (`.component-hidden-badge`), tomando la disposición del fichero de referencia visual citado arriba.
   - Nueva clase CSS `.component-hidden-badge` en `src/styles/main.css`, análoga a `.component-lock-badge` (mismo tamaño/forma/`background`/`box-shadow`/`pointer-events: none`) pero con `bottom: 2px; right: 2px;` en vez de `top`/`right`.

4. **`modes/edit/editMode.js`** — en la llamada a `renderComponentsOnTable` (línea ~290), añadir `showHiddenIndicator: true` junto a `showLockIndicator: true`, para que la insignia se vea en modo edición.

5. **`modes/play/playMode.js`** — filtrado en modo juego: en `renderTable()` (línea ~72), sustituir `getComponents()` por `getComponents().filter((c) => !c.oculto)` en la llamada a `renderComponentsOnTable`. Este es el único listado de componentes de este módulo (no hay panel/listado aparte en modo juego, ver `ARCHITECTURE.md` sección 3), así que basta este único punto para que el componente oculto no se vea, no ocupe espacio, no sea seleccionable/interactuable y no aparezca en el menú contextual ni en ningún otro lado de modo juego.

## (c) Cambios de arquitectura

Actualizar `design/docs/ARCHITECTURE.md`:

- **Sección 4 (Modelo de datos de componente)**: añadir `oculto: boolean, // si el componente NO se renderiza en modo juego (false por defecto)` al bloque de código del modelo, junto a `bloqueado`/`mostrarTooltip`/`subirAlMoverInteractuar`, con una frase análoga a la ya existente para `mostrarTooltip` explicando dónde se inicializa/edita y que un componente sin este campo se comporta como desmarcado.
- **Sección "Copias vinculadas (`copyOf`)`**: añadir `oculto` a la lista de campos que "quedan siempre independientes por copia" (junto a `x`/`y`, `order`, `bloqueado`).
- **Sección 3 (bullet "Indicador de candado", cambio 00088)**: añadir una frase análoga documentando el nuevo `showHiddenIndicator`/insignia de "oculto" en modo edición (referenciando el cambio 00100), y que en modo juego el componente oculto directamente no se renderiza (no hace falta indicador ahí).
- **Sección 5 (`ui/componentRenderer.js`)**: documentar el nuevo parámetro `showHiddenIndicator` de `renderComponentsOnTable` junto a `showLockIndicator`, mismo criterio de redacción.
- **Sección 8 (funcionalidades transversales)**: el bullet "Menú contextual y candado de bloqueo" ya cubre automáticamente cualquier tipo nuevo vía `renderComponentsOnTable` — añadir `showHiddenIndicator` a esa misma frase para que quede reflejado que un tipo nuevo también obtiene la insignia de "oculto" sin nada específico por tipo.

## (d) Cambios en estilo

Actualizar `design/docs/stylebible/STYLE_BIBLE.md`, sección 12.3 (o inmediatamente junto a la documentación existente de `.component-lock-badge`, si está en esa sección): documentar `.component-hidden-badge` como variante del mismo patrón de insignia superpuesta, señalando que se ancla en la esquina inferior derecha (en vez de la superior derecha del candado) precisamente para poder convivir con ella cuando un componente está bloqueado y oculto a la vez.
