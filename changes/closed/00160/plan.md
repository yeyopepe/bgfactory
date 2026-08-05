- **Fecha creación**: 2026-08-05

## (a) Anotaciones funcionales

Sin dudas técnicas que resolver con el usuario — el `description.md` ya deja el comportamiento cerrado (posición, criterio de conteo, sin orden/filtro/click, sin entrar en el filtro de texto).

Fuera de alcance: no se toca `isResourceInUse`/el flujo de bloqueo de borrado de un recurso en uso (`editMode.js`), ni el filtro de texto del panel (`matchesFilter`) — la columna nueva no participa en él, según lo confirmado en `description.md`.

## (b) Solución técnica

1. **`src/ui/resourceList.js`** — añadir la columna "Usos":
   - Importar `getComponentsUsingResource` desde `../core/resource.js` (ya existe, no hay que crear nada nuevo).
   - `RESOURCE_LIST_COLUMNS`: pasar de `['nombre', 'tipo', 'acciones']` a `['nombre', 'usos', 'tipo', 'acciones']` (posición 2).
   - `headLabels` (dentro de `renderBody`): añadir `usos: 'Usos'`.
   - Al construir cada `<th>` en el `thead`, si `key === 'usos'` añadir `th.className = 'resource-list__usos-cell'` — mismo patrón que ya usa `group-list__count-cell` en `ui/groupList.js` (columna "Elementos") para centrar la cabecera igual que la celda.
   - `renderBody(body, resources, { onEdit, onRemove, columnWidths, onColumnResize, components } = {})`: añadir `components` a la firma. Entre `nameCell` y `typeCell`, insertar la celda nueva:
     ```js
     const usosCell = document.createElement('td');
     usosCell.className = 'resource-list__usos-cell';
     usosCell.textContent = String(getComponentsUsingResource(resource.id, components).length);
     row.appendChild(usosCell);
     ```
   - `renderResourceList(container, resources, { ...opciones existentes..., components = [] } = {})`: añadir `components` a la firma (con valor por defecto `[]` para no romper si algún llamante no lo pasa) y propagarlo en **las dos** llamadas a `renderBody` que ya existen dentro de esta función — la del render inicial y la del listener `input` del cuadro de filtro (ambas deben recibir `components` igual que ya reciben `columnWidths`/`onColumnResize`).

2. **`src/modes/edit/editMode.js`** — propagar los componentes actuales al panel de Recursos:
   - En `renderResourcePanel()` (la función que hoy llama a `renderResourceList(resourceListContainer, getResources(), {...})` sin pasar componentes), añadir `components: getComponents()` al objeto de opciones — `getComponents()` ya está disponible en ese ámbito (se usa igual en `renderGroupPanel()`, unas líneas más abajo, y en el propio `renderResourcePanel` de forma indirecta a través de `attemptDeleteResource`/`usedByIds`).
   - No hace falta ningún cableado de eventos adicional: `components:changed` ya provoca el remontado completo de `renderEditMode()` (y por tanto de `renderResourcePanel()`), igual que ya mantiene actualizada la columna "Elementos" de Grupos.

3. **`src/styles/main.css`** — añadir la regla de centrado de la celda nueva, junto a las reglas ya existentes de `.resource-list` (sección "Resource list", cerca de `.resource-list__actions-cell`):
   ```css
   .resource-list__usos-cell {
     text-align: center;
   }
   ```
   Mismo patrón exacto que `.group-list__count-cell` (sección "Group list" del mismo fichero) — sin introducir ningún token/valor nuevo.

No hace falta tocar `core/resource.js` (la función de conteo ya existe y ya está pensada para reutilizarse en varios sitios, ver su comentario "usada para identificar en el mensaje de error qué componente(s) bloquean el borrado de un recurso" — este cambio es un segundo consumidor, no requiere modificarla), ni `ui/tableColumnResize.js` (genérico, ya funciona con cualquier array de columnas que se le pase).
