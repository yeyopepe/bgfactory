- **Fecha creación**: 2026-08-05

## (a) Anotaciones funcionales

**Fuera de alcance** (confirmado con el usuario en `description.md`):
- No se implementa "Tablero personalizado" ni ninguna funcionalidad nueva.
- No se renombran identificadores/ficheros/clases CSS en inglés que contienen "board" (`boardImageModal.js`, `boardPatternModal.js`, clase `.board`, `.board-image-modal`) — no son visibles para el usuario y no aportan nada renombrarlos ahora.
- No se tocan los ficheros de prueba `src/test/*.json` que ya tienen `"type": "tablero"` — sirven de caso real para validar la migración.

**Dudas resueltas con el usuario:**
- ¿Solo etiqueta visible o también identificador interno? → También el identificador interno (`'tablero'` → `'tableroSimple'`), para evitar que quede ambiguo el día que exista "Tablero personalizado".
- ¿Forma del nuevo identificador? → `tableroSimple` (camelCase, consistente con nombres de propiedades ya usados en el proyecto).

## (b) Solución técnica

1. **Migración de compatibilidad** (`core/state.js`): añadir una función `migrateTableroSimple(components)` que recorra los componentes y convierta in-place `type: 'tablero'` a `type: 'tableroSimple'`, siguiendo exactamente el mismo patrón que `migrateFichas`/`migrateDeckIdToGrupo` (best-effort, nunca debe bloquear el arranque). Invocarla desde `loadComponents(components)`, junto a las otras migraciones, antes de `compactOrders`.
2. **Etiqueta visible — selector de tipo** (`ui/componentTypeModal.js`): en el array `COMPONENT_TYPES`, cambiar la entrada `{ value: 'tablero', label: 'Tablero' }` a `{ value: 'tableroSimple', label: 'Tablero simple' }`. Esto actualiza automáticamente `getComponentTypeLabel()` y, con ello, `bulkDeleteConfirmModal.js`, `groupDeleteConfirmModal.js` y `groupModal.js`, que ya la reutilizan — no hace falta tocarlos.
3. **Etiqueta visible — tooltip de identificación en mesa** (`ui/componentRenderer.js`): en `COMPONENT_TYPE_LABELS`, cambiar la clave `tablero: 'Tablero'` a `tableroSimple: 'Tablero simple'`.
4. **Comprobaciones de tipo a actualizar** de `'tablero'` a `'tableroSimple'`:
   - `ui/componentModal.js`: `createDefaultComponent(type)` (`if (type === 'tablero')`, línea ~125) y el condicional que renderiza los campos específicos del tablero (`workingComponent.type === 'tablero'`, línea ~592).
   - `ui/componentRenderer.js`: condicional de renderizado específico del tablero (`component.type === 'tablero'`, línea ~653).
   - `modes/play/playMode.js`: clave `'tablero'` del mapa `interactionsByType` (línea ~40) → `'tableroSimple'`; condicional del texto extra del menú contextual (`component.type === 'tablero'`, línea ~176) → `'tableroSimple'`.
5. **Comentarios a actualizar** para que sigan siendo coherentes con el nuevo identificador (sin cambiar lógica): `ui/cardShapeModal.js` línea ~95, y los comentarios de `ui/componentRenderer.js` que mencionan "tablero" como referencia del bisel (líneas ~38 y ~129) — usar "tablero simple" en el texto en prosa de los comentarios, sin que afecte a ningún identificador de código.
6. **Verificación**: tras el cambio, comprobar manualmente que un fichero de `src/test/*.json` con `"type": "tablero"` se carga correctamente y el componente aparece como "Tablero simple" en la UI (confirma que la migración funciona) y que crear un tablero nuevo desde "+ Añadir componente" también funciona con el nuevo identificador.

## (c) Cambios de arquitectura

En `design/docs/ARCHITECTURE.md`:
- Sección 4 "Modelo de datos de componente", línea ~59: actualizar el ejemplo de valores posibles de `type` (sustituir `"tablero"` por `"tableroSimple"` en el comentario ilustrativo).
- Línea ~85: la mención "el tablero, único tipo con fondo de imagen" → ajustar a "el tablero simple, único tipo...".
- Entrada específica del tipo (línea ~117 en adelante, hoy bajo `**'tablero'**`): renombrar el encabezado a `**'tableroSimple'**`, actualizar las referencias a `'tablero'` dentro de su descripción y de las entradas de `'dado'`/`'documento'`/otros tipos que lo mencionan por comparación (líneas ~123, ~125, ~131–132, ~162) a `'tableroSimple'` cuando se refieran al identificador, o "tablero simple" cuando sea prosa.
- Línea ~122: la mención de `ui/componentTypeModal.js` listando `'texto'`, `'tablero'` o `'dado'` → `'tableroSimple'`.
- Línea ~249: descripción de `ui/boardPatternModal.js` ("para configurar el fondo... de un tablero") → "de un tablero simple".
- Línea ~321 (checklist de estilo para tipos nuevos): "bisel de `'tablero'`/`'dado'`" → "bisel de `'tableroSimple'`/`'dado'`".
- Añadir una nota breve junto a la entrada del tipo (o en la sección de migraciones si existe una) documentando la migración silenciosa `migrateTableroSimple` en `core/state.js`, análoga a las ya documentadas para `migrateFichas`/`migrateDeckIdToGrupo`, para que quede rastreable igual que las anteriores.

En `design/docs/FEATURES.md`:
- Línea ~58: "Cuadro de texto/Tablero/Dado/..." → "Cuadro de texto/Tablero simple/Dado/...".
- Línea ~145: "'Tablero' y 'Visor de documentos' no tienen ninguna interacción..." → "'Tablero simple' y...".
- Línea ~173: "cada componente (cuadro de texto, tablero, dado...)" → "...tablero simple, dado...".
- Sección "### Componente 'tablero'" (línea ~187): renombrar encabezado a "### Componente 'tablero simple'" y las referencias internas al nombre visible.
- Línea ~196: "alta eligiendo 'Tablero' en la modal previa..." → "'Tablero simple'".
- Línea ~247: "igual que en 'tablero'" → "igual que en 'tablero simple'".
- Línea ~324: "(cuadro de texto, tablero, dado...)" → "...tablero simple, dado...".

## (d) Cambios en estilo

En `design/docs/stylebible/STYLE_BIBLE.md`:
- Línea ~85: listado de bloques BEM, `.board` — mantener el nombre de la clase CSS tal cual (fuera de alcance), pero si el texto la describe como "del tablero" ajustar la prosa a "del tablero simple" sin tocar el selector.
- Línea ~236: "tipo `'tablero'`" en la descripción del patrón de secciones "Borde"/"Fondo" → actualizar a "tipo `'tableroSimple'`" (etiqueta visible "Tablero simple").
- No hay más cambios de estilo visual: el aspecto del componente (bordes, bisel, fondo) no cambia, solo su nombre.
