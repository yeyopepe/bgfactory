## (a) Anotaciones funcionales

Fuera de alcance:
- No se toca el flujo de "Guardar" (`buildExportHtml`/HTML completo autocontenido) — ya incluye recursos completos y mazos desde el cambio 00053, el problema descrito solo afecta al JSON ligero de "Exportar"/"Importar".
- No se añade gestión de mazos (crear/renombrar/borrar mazos desde un panel) — sigue fuera de alcance, igual que en el cambio 00053.
- No se valida ni resuelve semánticamente ninguna otra referencia además de recursos (`image`/`imagenResourceId`/`fuenteResourceId`) y mazos (`deckId`) — es el único tipo de referencia cruzada que existe hoy entre colecciones del modelo de datos.

Dudas resueltas con el usuario (ya recogidas en `description.md`, resumen aquí para referencia rápida del plan):
- Exportar toda la galería de recursos, no solo los usados.
- Incluir mazos en export/import.
- Import en modo reemplazo total (componentes + recursos + mazos), no fusión.
- Ficheros de versiones anteriores (sin `decks`, o con menos recursos) se aceptan igual, importando lo que traigan.
- Referencias rotas tras importar (recurso o `deckId` inexistente) no bloquean: se importa igual y se avisa con la modal de error común.

## (b) Solución técnica

1. **`src/core/persistence.js` — `buildComponentsExport`**: quitar el filtro `isResourceInUse` (dejar de importar `isResourceInUse` en este fichero si no se usa para nada más) y añadir un tercer parámetro `decks`. Pasa a ser:
   ```js
   export function buildComponentsExport(components, resources, decks) {
     return { version: CURRENT_VERSION, components, resources, decks };
   }
   ```

2. **`src/core/persistence.js` — `parseImportedComponents`**: añadir `decks` al resultado, con el mismo criterio de tolerancia que ya usa `resources` (si no es array, `[]`):
   ```js
   const decks = Array.isArray(parsed.decks) ? parsed.decks : [];
   return { components: parsed.components, resources, decks };
   ```

3. **Detección de referencias rotas** — añadir dos funciones nuevas, cada una junto al modelo al que pertenecen (mismo criterio que `isResourceInUse`/`getComponentsUsingResource`, que ya viven en `core/resource.js` en vez de en `persistence.js`):
   - `src/core/resource.js`: nueva función `getComponentsWithMissingResources(components, resourceIds)`. A diferencia de `collectDeepValues` (que recoge cualquier valor primitivo hoja, usada para "¿se usa este id en algún sitio?"), aquí hace falta identificar específicamente los campos que son referencias a recursos (`component.image`, y en profundidad las claves `imagenResourceId`/`fuenteResourceId`, que son los únicos campos de `properties` que referencian un recurso de la galería en todos los tipos actuales — ver `ARCHITECTURE.md` secciones 4 y 4.2), para no dar falsos positivos con cualquier otro string que coincida por casualidad con un id. Devuelve los ids de componentes cuya referencia a un recurso no está en `resourceIds`.
   - `src/core/deck.js`: nueva función `getComponentsWithMissingDeck(components, deckIds)`, análoga pero mirando únicamente `component.properties?.deckId` (único campo de mazo, solo en `'carta'`). Devuelve los ids de componentes con `deckId` fijado que no está en `deckIds`.

4. **`src/ui/editModeToggle.js` — `exportComponentsAs`**: pasar también `getDecks()`:
   ```js
   function exportComponentsAs(filename) {
     const data = buildComponentsExport(getComponents(), getResources(), getDecks());
     downloadJson(filename, data);
   }
   ```

5. **`src/ui/editModeToggle.js` — `importComponentsFromFile`**: cambiar el criterio de recursos de "fusión por id" a "reemplazo total", igual que ya se hace con componentes. `core/state.js` ya expone `loadResources(resources)` y `loadDecks(decks)` — ambas ya sustituyen la colección entera (se usan hoy para restaurar desde `localStorage`/semilla embebida) — así que no hace falta añadir nada nuevo en `core/state.js`, solo usarlas aquí en vez del bucle actual de `addResource`:
   ```js
   function importComponentsFromFile(file) {
     const reader = new FileReader();
     reader.onload = () => {
       const result = parseImportedComponents(reader.result);
       if (result.error) {
         showErrorModal('No se ha podido importar el fichero', 'El fichero seleccionado no contiene un listado de componentes válido.', result.detail);
         return;
       }
       if (!confirm('Se reemplazarán todos los componentes, recursos y mazos actuales por los del fichero importado. ¿Continuar?')) return;

       loadComponents(result.components);
       loadResources(result.resources);
       loadDecks(result.decks);

       const missingResourceIds = getComponentsWithMissingResources(result.components, result.resources.map((r) => r.id));
       const missingDeckIds = getComponentsWithMissingDeck(result.components, result.decks.map((d) => d.id));
       if (missingResourceIds.length > 0 || missingDeckIds.length > 0) {
         const parts = [];
         if (missingResourceIds.length > 0) parts.push(`recursos no incluidos en el fichero (componentes: ${missingResourceIds.join(', ')})`);
         if (missingDeckIds.length > 0) parts.push(`mazos no incluidos en el fichero (componentes: ${missingDeckIds.join(', ')})`);
         showErrorModal('Importación con referencias incompletas', `La importación se ha completado, pero algunos componentes referencian ${parts.join(' y ')}.`, null);
       }
     };
     reader.readAsText(file);
   }
   ```
   Añadir `loadResources`, `loadDecks` a los imports de `../core/state.js`, `getComponentsWithMissingResources` de `../core/resource.js` y `getComponentsWithMissingDeck` de `../core/deck.js` (nuevo import en este fichero); ya no hace falta `addResource` aquí si no se usa en ningún otro sitio de este fichero (comprobar antes de quitar el import).

## (c) Cambios de arquitectura

No aplica: `buildComponentsExport`/`parseImportedComponents` y las nuevas funciones de detección de referencias rotas son extensiones del mismo patrón ya descrito en `ARCHITECTURE.md` (sección 4.2, `core/resource.js`) para `isResourceInUse`/`getComponentsUsingResource` — no cambian capas, dependencias entre capas ni el modelo de datos. No requiere actualización de esa sección.

## (d) Cambios en estilo

No aplica: no hay ningún elemento visual nuevo, solo se reutiliza `ui/errorModal.js` ya existente con un mensaje distinto.
