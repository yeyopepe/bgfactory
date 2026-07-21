- **Nombre**: Exportación/importación JSON completa (todos los elementos y recursos)
- **Código**: 00059
- **Tipo**: change

## Prompt original del usuario

la importación/exportación debe incluir todos los elementos del juego y todos los recursos

## Descripción completa

La funcionalidad de "Exportar"/"Importar" (JSON de componentes, modo edición) se amplía para incluir todos los elementos del juego y todos los recursos, no solo un subconjunto de ellos.

1. **Exportar recursos completos**: hoy solo se exportan los recursos (imágenes/tipografías) que estén en uso por algún componente en ese momento. Pasa a exportarse toda la galería de recursos, estén o no referenciados por algún componente.

2. **Incluir mazos**: hoy los mazos no se exportan ni se importan en absoluto — una carta importada con mazo asignado queda con una referencia rota. Los mazos existentes pasan a exportarse e importarse igual que el resto de elementos del juego.

3. **Importar en modo "reemplazo total"**: hoy los componentes se reemplazan por completo al importar, pero los recursos se fusionan por id (se añaden los que faltan a la galería existente, sin borrar ni sustituir nada). Esto cambia: la importación pasa a reemplazar por completo componentes, recursos y mazos por el contenido del fichero importado — lo que ya existía en la app y no está en el fichero desaparece tras importar. Deja de aplicarse el criterio de fusión por id que hoy tienen los recursos.

4. **Aviso de confirmación actualizado**: el texto de confirmación que se muestra antes de importar (hoy solo menciona que se reemplazan "todos los componentes actuales") pasa a dejar explícito que se reemplazan componentes, recursos y mazos por los del fichero importado.

5. **Compatibilidad con ficheros de versiones anteriores**: un fichero exportado antes de este cambio (sin mazos, o con solo el subconjunto de recursos que estaban en uso en su momento) se sigue aceptando igual que hoy se aceptan ficheros de otra versión de la app — no se rechaza por eso. La importación se realiza igualmente con lo disponible en el fichero.

6. **Referencias rotas no bloquean la importación**: si, tras importar, algún componente queda con una referencia que no se pudo resolver dentro del propio fichero importado (por ejemplo una carta cuyo mazo asignado no viene incluido, o un componente que referencia un recurso ausente del fichero), la importación se completa igualmente con lo disponible, y al terminar se muestra la misma modal de error común que ya usa el resto de la app, listando qué referencias no se pudieron resolver. No es un aviso bloqueante: no impide que el resto de lo importado quede aplicado.

No hay componente visual nuevo: se reutilizan los mismos botones "Exportar"/"Importar" y la misma modal de confirmación/error ya existentes en modo edición; solo cambia el alcance de los datos que se mueven y el texto del aviso de confirmación.

### Preguntas de alcance resueltas

- **¿Se exportan también los recursos no usados por ningún componente?** Sí, toda la galería.
- **¿Se incluyen los mazos?** Sí, igual que el resto de elementos del juego.
- **¿Cómo se importan recursos y mazos: fusionados por id (como hoy los recursos) o reemplazados por completo (como hoy los componentes)?** Reemplazo total para todo: componentes, recursos y mazos se sustituyen íntegramente por el contenido del fichero importado.
- **¿Qué pasa con un fichero de una versión anterior sin mazos (o con menos recursos)?** Se acepta igual, importando lo que traiga; lo que falte simplemente no llega.
- **¿Qué pasa si queda una referencia rota tras importar (p. ej. deckId de una carta que no vino en el fichero)?** La importación se completa igualmente con lo disponible y se avisa al usuario, mediante la modal de error común, de qué referencias no se pudieron resolver — es un aviso informativo, no bloquea ni deshace la importación.

## Apuntes técnicos

- `src/core/persistence.js`: `buildComponentsExport(components, resources)` filtra hoy con `isResourceInUse` — dejar de filtrar y exportar `resources` completo; añadir un parámetro `decks` a la exportación (mismo patrón que `buildExportHtml` de `src/core/fileExport.js`, que ya recibe `decks`).
- `src/core/persistence.js`: `parseImportedComponents(raw)` hoy solo devuelve `{ components, resources }` — añadir `decks` (array, `[]` si el fichero no lo trae, mismo patrón ya usado para `resources` en `parseState`).
- `src/ui/editModeToggle.js`:
  - `exportComponentsAs` debe pasar también `getDecks()` a `buildComponentsExport`.
  - `importComponentsFromFile` debe reemplazar recursos y mazos por completo en vez de fusionar por id como hoy. Revisar qué expone `core/state.js` para reemplazo completo de colecciones: existen `replaceResource`/`removeResource` (por id, no una sustitución completa de la colección) y `loadComponents` (sí sustituye toda la colección); `decks` no tiene ni siquiera `removeDeck`. Probablemente haga falta añadir en `core/state.js` una función de reemplazo completo para `resources` y para `decks`, análoga a `loadComponents`.
  - Detectar tras el reemplazo qué componentes quedan con una referencia rota (recurso referenciado que no exista en el nuevo `resources`, o `deckId` que no exista en el nuevo `decks`) y mostrarlo con `ui/errorModal.js` (mismo patrón que "Modal de error común a toda la app", ver `FEATURES.md`) sin deshacer ni bloquear la importación ya aplicada.
  - Actualizar el texto de `confirm(...)` en `importComponentsFromFile` para mencionar recursos y mazos, no solo componentes.
- Actualizar la sección "Exportar/importar componentes en JSON" de `design/docs/FEATURES.md` reflejando el nuevo alcance (todos los recursos, mazos incluidos, reemplazo total en vez de fusión de recursos, aviso de referencias rotas no bloqueante).
