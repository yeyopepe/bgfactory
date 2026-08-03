## (a) Anotaciones funcionales

- Fuera de alcance: cualquier cambio al mecanismo de re-render de `renderComponentList` (p. ej. pasar a actualización incremental por fila en vez de reconstrucción completa del panel). El fix se limita a preservar la posición de scroll a través del re-render existente, sin tocar cómo ni cuándo se reconstruye la lista.
- Fuera de alcance: la tabla de la mesa (`renderTable`/`renderComponentsOnTable`, `ui/componentRenderer.js`) — no tiene scroll propio, el bug solo afecta al panel lateral (`ui/componentList.js`).
- No ha habido dudas de alcance que resolver con el usuario; la causa raíz y el comportamiento esperado ya quedaron claros en `description.md`.

## (b) Solución técnica

1. En `src/ui/componentList.js`, dentro de `renderComponentList(container, components, {...})`, antes de `container.innerHTML = ''` (línea ~205), capturar el `scrollTop` del body scrollable existente (si lo hay):
   ```js
   const previousBody = container.querySelector('.component-panel__body');
   const previousScrollTop = previousBody ? previousBody.scrollTop : 0;
   ```
2. Tras crear el nuevo `body` y pintarlo (después de `renderBody(body, displayedComponents, components.length, rowHandlers)` y `panel.appendChild(body)`, líneas ~297-298), reaplicar el scroll capturado:
   ```js
   body.scrollTop = previousScrollTop;
   ```
   Esto cubre tanto la reconstrucción completa del panel (selección desde `toggleSelect` → `renderList()` → `renderComponentList`) como cualquier otro caller que reutilice el mismo `container` (colapsar/expandir, redimensionar, cambios de filtro que ya usan `renderBody` directamente sin pasar por aquí, reorder, etc.), sin necesidad de tocar nada en `editMode.js`.
3. No hace falta guardar el `scrollTop` en ningún estado externo (`panelState` o similar): basta con leerlo del DOM saliente justo antes de sustituirlo, ya que `container` es el mismo nodo reutilizado entre renders (confirmado en `modes/edit/editMode.js`, `renderList()` siempre opera sobre el mismo `listContainer`).
4. Verificar manualmente: con una lista de componentes larga (scroll visible), desplazar el panel hacia abajo y seleccionar un elemento — la posición de scroll debe mantenerse; comprobar también que colapsar/expandir el panel y filtrar siguen funcionando igual que antes (no deben verse afectados, `previousScrollTop` será `0` cuando no había `body` previo, p. ej. panel recién montado o venía colapsado).
