- **Creation date**: 2026-09-03
- **Risk**: 3/10 — Low risk

## (a) Functional notes

**Fuera de alcance:**
- No se añade acción de «plegar todos» / «desplegar todos»: el plegado es individual por grupo (ya recogido en `description.md`).
- Los paneles «Recursos» y «Etiquetas» no se tocan: no tienen filas de grupo.
- El lienzo (mesa de componentes) no se ve afectado.
- El contador del título «Componentes (N)» sigue contando componentes reales; ya se recalcula sobre `displayed.filter((r) => !r.__isGroupRow).length` en `rerenderBody()` y ese cálculo no cambia (los miembros ocultos por plegado no son filas de grupo, así que un grupo plegado deja de aportar sus miembros al conteo del filtro pero **este cambio no altera la fórmula**; nota: hoy sin filtro el conteo ya es el total de componentes reales porque todos los miembros se pintan — al plegar, `computeDisplayedList` dejará de incluir esos miembros y el `filter(!__isGroupRow).length` bajaría). **Decisión tomada con el usuario (ver abajo): el contador debe seguir mostrando el total real de componentes con independencia del plegado.**
- No se persiste el estado desplegado en export/import JSON: `panelState` ya queda excluido de `buildComponentsExport`.

**Dudas resueltas con el usuario:**
- **P:** Al plegar grupos, `computeDisplayedList` deja de emitir las filas de miembro, y el título «Componentes (N)» se calcula hoy como `displayed.filter(r => !r.__isGroupRow).length`. Si no se corrige, el número del título bajaría al plegar un grupo, lo que `description.md` prohíbe explícitamente («El contador del título "Componentes (N)" no cambia al plegar o desplegar»). ¿Cómo se resuelve?
  **R:** El título debe seguir reflejando el número real de componentes. Sin filtro activo se usa `components.length` (total real). Con filtro activo se mantiene el comportamiento actual (número de componentes reales que casan con el filtro), calculado sobre la lista **con todos los grupos considerados desplegados** para el conteo, no sobre la lista realmente pintada. Es decir: el conteo del título nunca depende del estado plegado/desplegado, solo del filtro. (Se implementa en la tarea de `componentList.js` correspondiente.)

## (b) Technical solution

- [x] **`src/core/state.js` — añadir `expandedGroupIds` a `panelState`.** En la línea 21 cambiar el valor inicial a `let panelState = { collapsed: false, position: null, width: null, height: null, expandedGroupIds: [] };`. Semántica: lista de `groupId` (string) que el usuario ha desplegado explícitamente; ausencia de un `groupId` en la lista = grupo plegado (estado por defecto). `getPanelState()` / `setPanelState(partial)` no cambian (el merge parcial ya cubre el campo nuevo y `setPanelState({ expandedGroupIds })` emite `panelState:changed`, que ya dispara el autoguardado). `loadPanelState(newPanelState)` (línea 328) asigna el objeto tal cual: para tolerar guardados antiguos sin el campo, cambiarlo a:
  ```js
  export function loadPanelState(newPanelState) {
    panelState = { expandedGroupIds: [], ...newPanelState };
    if (!Array.isArray(panelState.expandedGroupIds)) panelState.expandedGroupIds = [];
  }
  ```

- [x] **`src/core/persistence.js` — no requiere cambios de forma, verificar.** `parseState` (línea 27) ya acepta `panelState` como objeto opaco (`typeof parsed.panelState === 'object'`) y lo pasa entero; `saveState` (línea 47) serializa `panelState` completo con `JSON.stringify`, así que `expandedGroupIds` viaja sin tocar nada. `buildComponentsExport` (línea 95) y `parseImportedComponents` (línea ~80) **no** incluyen `panelState` → la preferencia queda excluida de export/import automáticamente. No hay migración: un guardado pre-00239 simplemente no trae `expandedGroupIds` y `loadPanelState` lo normaliza a `[]` (grupos plegados, que es el estado por defecto deseado). **No editar este fichero**; esta casilla es solo la comprobación.

- [x] **`src/ui/componentList.js` — recibir `expandedGroupIds` y callbacks de plegado como parámetros de `renderComponentList`.** En el destructuring de opciones de `renderComponentList` (líneas 411-431) añadir: `expandedGroupIds = []`, `onToggleGroupExpand`. `expandedGroupIds` se normaliza a `Set` una vez al principio de la función: `const expandedGroups = new Set(expandedGroupIds);`. Pasar `expandedGroups` y `onToggleGroupExpand` dentro de `rowHandlers` (línea 498-511) para que lleguen a `renderBody`.

- [x] **`src/ui/componentList.js` — filtrar los miembros de grupos plegados en `computeDisplayedList`.** `computeDisplayedList(components)` (líneas 100-126) debe recibir también el set de grupos desplegados y el estado de filtro. Cambiar su firma a `computeDisplayedList(components, expandedGroups)`. Dentro del bucle `for (const row of topLevel)`, en la rama `if (row.__isGroupRow)`:
  - Calcular `const hasActiveFilter = filterText.trim() !== '' || Object.keys(columnFilters).length > 0;` (ya se calcula igual en `renderBody`, línea 147 — se puede subir a una función auxiliar de módulo `isFilterActive()` y reutilizar en ambos sitios).
  - `const forcedOpen = hasActiveFilter && groupOrAnyMemberMatches(row);` (con filtro activo y coincidencia, el grupo se muestra desplegado forzado).
  - `const isExpanded = forcedOpen || expandedGroups.has(row.id);`
  - Empujar siempre la fila de grupo (`list.push(row)`) cuando pase `groupOrAnyMemberMatches(row)` (sin filtro, `groupOrAnyMemberMatches` devuelve `true` porque `matchesFilter(row, '')` es `true`), pero **solo empujar las filas de miembro si `isExpanded`**:
    ```js
    if (row.__isGroupRow) {
      if (!groupOrAnyMemberMatches(row)) continue;
      list.push(row);
      const forcedOpen = isFilterActive() && /* el grupo o algún miembro casa */ true;
      const isExpanded = forcedOpen || expandedGroups.has(row.id);
      if (isExpanded) {
        for (const member of row.__members) {
          if (matchesFilter(member, filterText) && matchesColumnFilters(member)) list.push(member);
        }
      }
      continue;
    }
    ```
    (Nota: cuando `groupOrAnyMemberMatches(row)` ya ha pasado y hay filtro activo, `forcedOpen` es `true`; sin filtro activo, `forcedOpen` es `false` y manda `expandedGroups`.)
  - Añadir a cada fila de grupo sintética un flag para que `renderBody` sepa pintar el triángulo en el estado correcto: en el objeto que se empuja, marcar `row.__expanded = isExpanded;` y `row.__forcedOpen = forcedOpen;` (se calculan aquí, no en `buildGroupRows`, porque dependen de filtro y de `expandedGroups`).

- [x] **`src/ui/componentList.js` — poda de `groupId` huérfanos.** En `renderComponentList`, tras derivar los grupos realmente existentes, comparar contra `expandedGroupIds` y, si sobra alguno, notificarlo para que se persista depurado. Implementación: después de `const expandedGroups = new Set(expandedGroupIds);`, calcular los grupos reales una sola vez —
  ```js
  const groupRows = buildGroupRows(components);
  const realGroupIds = new Set(groupRows.map((g) => g.id));
  const prunedExpanded = expandedGroupIds.filter((id) => realGroupIds.has(id));
  if (prunedExpanded.length !== expandedGroupIds.length && onToggleGroupExpand) {
    onToggleGroupExpand(prunedExpanded); // reemplazo completo de la lista depurada
  }
  ```
  Definir `onToggleGroupExpand` con dos modos según el argumento: si recibe un **array**, es un reemplazo total de la lista (poda); si recibe un **string** (`groupId`), es un toggle de ese grupo. Alternativamente, exponer dos callbacks separados (`onToggleGroupExpand(groupId)` y `onPruneExpandedGroups(idList)`) para no sobrecargar la firma — **elegir esta segunda opción por claridad**: `onToggleGroupExpand(groupId)` y `onPruneExpandedGroups(prunedList)`.
  - `buildGroupRows(components)` ya se llama dentro de `rowHandlers.allComponents` (línea 500) y otra vez en `rerenderBody` vía `computeDisplayedList`; extraer una única llamada al principio y reutilizarla para no recalcular (micro-optimización opcional, no bloqueante).

- [x] **`src/ui/componentList.js` — pasar `expandedGroups` a `computeDisplayedList` en `rerenderBody`.** En `rerenderBody()` (líneas 513-517), cambiar `const displayed = computeDisplayedList(components);` por `const displayed = computeDisplayedList(components, expandedGroups);`.

- [x] **`src/ui/componentList.js` — conteo del título independiente del plegado.** En `rerenderBody()` (línea 515), el título se calcula hoy como `displayed.filter((r) => !r.__isGroupRow).length`. Como `displayed` ahora omite los miembros de grupos plegados, este número bajaría al plegar. Corregir para que el conteo no dependa del estado plegado:
  - Sin filtro activo (`!isFilterActive()`): usar `components.length`.
  - Con filtro activo: calcular el conteo sobre una lista «todos los grupos desplegados» — reutilizar `computeDisplayedList(components, new Set(realGroupIds))` (o un parámetro `countMode` que ignore el plegado) y contar `!__isGroupRow`.
  ```js
  function rerenderBody() {
    const displayed = computeDisplayedList(components, expandedGroups);
    const countBasis = isFilterActive()
      ? computeDisplayedList(components, realGroupIds).filter((r) => !r.__isGroupRow).length
      : components.length;
    title.textContent = t('componentList.title', { count: countBasis });
    renderBody(body, displayed, components.length, rowHandlers);
  }
  ```
  (`realGroupIds` debe estar en el ámbito de `rerenderBody`; se calcula en el paso de poda, moverlo arriba si hace falta.)

- [x] **`src/ui/componentList.js` — pintar el triángulo de plegado en la celda Id de la fila de grupo.** En `renderBody`, rama `if (component.__isGroupRow)` (líneas 190-272), en la construcción de `idCell` (líneas 225-228), reemplazar el `idCell.textContent = component.id;` por un triángulo + nombre en negrita:
  ```js
  const idCell = document.createElement('td');
  idCell.className = 'component-list__id-cell';

  const toggle = document.createElement('span');
  toggle.className = 'component-list__group-toggle';
  toggle.textContent = component.__expanded ? '▾' : '▸';
  toggle.title = component.__expanded ? t('componentList.collapseGroup') : t('componentList.expandGroup');
  // Con filtro activo el grupo se muestra desplegado forzado; el triángulo no
  // debe togglear en ese caso (no cambia el estado recordado). Se deja
  // clicable pero, si `__forcedOpen`, el click no hace nada visible.
  toggle.addEventListener('click', (event) => {
    event.stopPropagation(); // clic en el triángulo NO selecciona el grupo
    if (component.__forcedOpen) return;
    if (onToggleGroupExpand) onToggleGroupExpand(component.id);
  });
  idCell.appendChild(toggle);

  const nameSpan = document.createElement('span');
  nameSpan.className = 'component-list__group-name';
  nameSpan.textContent = component.id;
  idCell.appendChild(nameSpan);

  row.appendChild(idCell);
  ```
  `onToggleGroupExpand` y `component.__expanded` / `component.__forcedOpen` llegan vía `rowHandlers` y el objeto de fila. El `stopPropagation` del `click` del triángulo evita que se dispare el `row.addEventListener('click', ...)` de selección (líneas 264-268), que se mantiene igual.

- [x] **`src/modes/edit/editMode.js` — cablear los callbacks de plegado en `renderList()`.** En la llamada a `renderComponentList` (líneas 791-848) añadir:
  ```js
  expandedGroupIds: getPanelState().expandedGroupIds ?? [],
  onToggleGroupExpand: (groupId) => {
    const current = getPanelState().expandedGroupIds ?? [];
    const next = current.includes(groupId)
      ? current.filter((id) => id !== groupId)
      : [...current, groupId];
    setPanelState({ expandedGroupIds: next });
    renderList();
  },
  onPruneExpandedGroups: (prunedList) => {
    setPanelState({ expandedGroupIds: prunedList });
    // No hace falta renderList() explícito: la poda se detecta durante el
    // render en curso y la lista ya se pinta con `expandedGroups` normalizado;
    // el `setPanelState` solo persiste la versión depurada. Pero para evitar
    // desajustes en el siguiente render, dejar constancia sin re-render aquí.
  },
  ```
  - **Cuidado con el bucle:** `onPruneExpandedGroups` NO debe llamar a `renderList()` (provocaría re-render dentro de un render). `setPanelState` emite `panelState:changed`, que está suscrito solo al autoguardado (`src/main.js` líneas 77 y alrededores: `on('components:changed', renderAll)` — `panelState:changed` **no** dispara `renderAll`), así que no hay re-render reentrante. Verificar en `src/main.js` que `panelState:changed` solo está suscrito a `persistState` y no a `renderAll`.
  - `renderList()` sí se llama explícitamente en `onToggleGroupExpand` (igual que ya se hace en `onToggleCollapse`, línea 833).

- [x] **`src/data/i18n.es.js` y `src/data/i18n.en.js` — nuevas claves de traducción.** Añadir junto a `componentList.groupRowType` (es: línea 529, en: línea 531):
  - es: `'componentList.expandGroup': 'Desplegar grupo',` y `'componentList.collapseGroup': 'Plegar grupo',`
  - en: `'componentList.expandGroup': 'Expand group',` y `'componentList.collapseGroup': 'Collapse group',`

- [x] **`src/styles/main.css` — estilos del triángulo y del nombre de grupo en negrita.** Localizar el bloque de `.component-list__row--group` (junto a `.component-list__row--member`, patrón 00204). Añadir:
  ```css
  /* Nombre del grupo en negrita, para distinguir la fila de grupo de un
     componente suelto o un miembro (00239). */
  .component-list__group-name { font-weight: 700; }

  /* Triángulo de plegado en la celda Id de la fila de grupo. Mismo lenguaje
     visual que el ▾/▸ de la cabecera del panel (carácter de texto, gris, sin
     fondo) pero algo más grande, para leerse y pulsarse mejor como control de
     fila (00239). */
  .component-list__group-toggle {
    display: inline-block;
    width: 16px;
    margin-right: 5px;
    color: var(--text-muted);
    font-size: 15px;   /* la cabecera del panel usa ~13px */
    line-height: 1;
    cursor: pointer;
    user-select: none;
    text-align: center;
  }
  .component-list__group-toggle:hover { color: var(--accent-blue); }
  ```
  Ajustar los valores exactos (`font-size`, `--text-muted`, tono hover) a los tokens reales del proyecto (`src/styles/main.css` / `001-tokens-visual.md`) si difieren de los del mockup.

## (c) Architecture changes

Actualizar **`previo-sdd/design/docs/architecture/007-persistence-build.md`**:
- Sección «Autosave (`core/persistence.js`)» y la línea que enumera la forma de `panelState`: hoy no se detalla la forma de `panelState` en este fichero (sí la de `resourcePanelState`/`tagPanelState` en `004-groups-resources.md`). Añadir que `panelState` incluye ahora `expandedGroupIds: string[]` — lista de `groupId` de grupos desplegados explícitamente en el panel «Componentes»; ausencia = plegado; se poda de `groupId` inexistentes en cada render; **no** se incluye en `buildComponentsExport` ni en `parseImportedComponents` (como el resto de `panelState`).
- Sección «On startup, with a valid save … `panelState` … hydrated with `loadPanelState()`»: mencionar que `loadPanelState` normaliza `expandedGroupIds` a `[]` si falta o no es array (compatibilidad con guardados pre-00239).

Actualizar **`previo-sdd/design/docs/architecture/006-ui-layer.md`**, entrada `ui/componentList.js`:
- La firma documentada de `renderComponentList` no lista todos los parámetros actuales, pero conviene añadir la mención de `expandedGroupIds` + `onToggleGroupExpand` / `onPruneExpandedGroups` y del comportamiento «grupos plegados por defecto, se recuerda en `panelState`, se fuerza desplegado con filtro activo».

Actualizar **`previo-sdd/design/docs/architecture/004-groups-resources.md`**, sección «Group data model» / nota sobre el panel:
- Añadir que el estado plegado/desplegado de cada fila de grupo en el panel «Componentes» es una preferencia de visualización local guardada en `panelState.expandedGroupIds` (no en la colección `componentGroups`, que sigue siendo solo el registro de propiedades del grupo).

## (d) Style changes

Actualizar **`previo-sdd/design/docs/style/002-componentes-layout.md`**, sección «Nested row under a parent block (`.component-list__row--member`, 00204)»:
- Añadir un apartado (o ampliar el existente) para la **fila de grupo (`.component-list__row--group`, 00239)**: el identificador del grupo va en `font-weight: 700` (`.component-list__group-name`) para distinguir la fila de grupo de un componente suelto o de un miembro; delante del nombre, en la celda Id, va el triángulo de plegado `.component-list__group-toggle` — carácter de texto (`▸` plegado / `▾` desplegado), gris (`--text-muted`), sin fondo, `font-size` algo mayor que el `▾`/`▸` de la cabecera del panel flotante, `cursor: pointer`, `user-select: none`; hover a `--accent-blue`. Es el mismo lenguaje visual que el triángulo de plegar el panel entero, deliberadamente más grande por ser un control de fila. El clic en el triángulo lleva `stopPropagation` y no selecciona el grupo; el resto de la celda/fila sigue seleccionando.
- Nota: con un filtro activo el grupo se muestra desplegado de forma forzada (triángulo `▾`) y el clic en el triángulo no altera el estado recordado mientras dure el filtro.

## (e) Verification

- [x] Abrir el modo edición con un proyecto que tenga al menos un grupo de 2+ miembros y ningún estado guardado (o `localStorage` limpio): la fila del grupo aparece con el triángulo `▸`, el nombre del grupo en negrita, y **sin** filas de miembro debajo.
- [x] Hacer clic en el triángulo `▸` de un grupo: aparecen sus filas de miembro indentadas (fondo azul claro, campo Orden deshabilitado, sin cambios respecto al comportamiento anterior) y el triángulo pasa a `▾`. Volver a hacer clic: las filas de miembro desaparecen y el triángulo vuelve a `▸`.
- [x] Hacer clic en el triángulo **no** cambia la selección: si había una selección previa, se mantiene; la fila de grupo no queda resaltada como seleccionada solo por plegar/desplegar.
- [x] Hacer clic en el resto de la fila de grupo (nombre, celda Tipo, zona vacía) selecciona el grupo y sus miembros, exactamente como antes; y **no** cambia el estado plegado/desplegado (un grupo plegado sigue plegado tras seleccionarlo).
- [x] Desplegar un grupo, recargar la página (F5): el grupo sigue desplegado. Plegarlo, recargar: sigue plegado. El resto de grupos que no se tocaron aparecen plegados.
- [x] Escribir en el filtro de texto algo que case con un miembro de un grupo plegado: el grupo se muestra desplegado enseñando solo los miembros que casan. Limpiar el filtro: el grupo vuelve a estar plegado (no se «recordó» como desplegado). Repetir con un grupo que sí se había desplegado antes: al limpiar el filtro vuelve a aparecer desplegado.
- [x] Con un grupo desplegado (recordado), desagruparlo (botón «Desagrupar») o borrar miembros hasta dejarlo con ≤1: al siguiente render la fila de grupo desaparece y, tras recargar, `panelState.expandedGroupIds` (inspeccionable en `localStorage`, clave `bgfactory:state`) ya no contiene ese `groupId`. Crear luego otro grupo (que podría reutilizar el mismo identificador `grupo-N`): aparece plegado, no desplegado por sorpresa.
- [x] El número del título «Componentes (N)» es el mismo con todos los grupos plegados y con todos desplegados (sin filtro). Con un filtro activo, el número refleja los componentes reales que casan, sin depender de qué grupos estén plegados.
- [x] Exportar el juego a JSON e inspeccionar el fichero: no contiene `panelState` ni `expandedGroupIds`. Importar un JSON: el estado plegado/desplegado de los grupos del proyecto actual no se altera.
- [x] Cargar un guardado creado antes de este cambio (sin `expandedGroupIds` en `panelState`): el panel abre sin errores en consola y todos los grupos aparecen plegados.
- [x] Cambiar el idioma de la app (Configuración): el `title` del triángulo (`Desplegar grupo` / `Plegar grupo` ↔ `Expand group` / `Collapse group`) aparece traducido.
