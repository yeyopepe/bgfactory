- **Name**: Eliminación de la migración de datos guardados de versiones anteriores
- **Code**: 00250
- **Type**: change
- **Creation date**: 2026-09-07

## Full description

### Motivación

La aplicación arrastra varias funcionalidades cuyo único cometido es convertir datos
guardados con un formato de una versión anterior de la app al formato de la versión
actual. Como todavía no se ha publicado la primera versión (1.0), no puede existir en
circulación ningún guardado con un formato antiguo: ni en el almacenamiento del
navegador, ni en un fichero HTML descargado con estado embebido, ni en un fichero JSON
exportado. Todo ese código de migración es, por tanto, peso muerto y superficie de
mantenimiento innecesaria, y se quiere retirar antes de la 1.0.

Este cambio **no** modifica el comportamiento de un componente o una partida creados
con la versión actual: solo deja de dar garantías sobre datos guardados con esquemas
antiguos que ya no pueden darse.

### Alcance funcional — qué comportamiento desaparece

**1. Migración de "fichas antiguas" a "Carta/Ficha" (funcionalidad 024, se elimina entera)**

- El tipo de componente independiente "Ficha" ya estaba retirado (no se puede dar de
  alta ninguno nuevo). Ahora desaparece además su conversión automática y silenciosa
  a "Carta/Ficha" al abrir la aplicación (tanto si el guardado viene del navegador
  como del estado embebido en un HTML descargado).
- En el flujo de **importar un fichero JSON de componentes** desaparece el paso de
  "conversión de fichas" y su aviso asociado: hoy, si el fichero trae alguna "Ficha"
  del tipo extinto que no se puede convertir, se muestra una ventana con la lista de
  fichas afectadas y su motivo, con las opciones "Continuar sin esas fichas" o
  "Abortar importación". Ese aviso deja de existir.
- Se retira la ficha de funcionalidad 024 completa. Se ajustan las menciones a esa
  migración en las funcionalidades 022 ("Componente carta") y 032 ("Exportar/importar
  componentes en JSON"), incluido el texto de la ventana de espera de la importación,
  que hoy menciona la "migración de fichas".

**2. Migraciones silenciosas de "Etiquetas" al abrir la app (funcionalidad 008)**

- Desaparecen dos conversiones que hoy ocurren de forma automática y silenciosa al
  abrir la aplicación:
  - La de "pertenencia a un único grupo" al modelo actual de "lista de etiquetas".
  - La de la antigua asignación de "mazo"/"grupo" (bajo su nombre anterior) al campo
    actual de "etiqueta".
- Se elimina de la ficha de funcionalidad 008 el párrafo que narra la historia de esos
  renombrados y sus migraciones automáticas. La ficha queda describiendo solo el
  estado actual del concepto "Etiqueta".

**3. Trato de un guardado "de otra versión" al arrancar (funcionalidad 029)**

- Hoy, al abrir la aplicación, un guardado del navegador puede acabar en uno de estos
  desenlaces: se restaura correctamente; está corrupto o ilegible; o es legible pero
  de otra versión de la app. Los dos últimos hacen exactamente el mismo arranque de
  respaldo (semilla embebida o contenido por defecto) y solo se diferencian en el
  texto del aviso breve no bloqueante que se muestra.
- Se **unifican en un único caso de error**: cualquier guardado que no se pueda
  restaurar —esté corrupto, ilegible o sea de una versión distinta— produce el mismo
  arranque de respaldo y el mismo aviso breve no bloqueante. Desaparece el mensaje
  específico "No se ha podido recuperar el estado de una versión anterior; se ha
  empezado con el contenido por defecto." y la rama que lo distinguía.
- La ficha de funcionalidad 029 pasa de describir cuatro situaciones a describir tres:
  no hay nada guardado; hay un guardado que no se puede restaurar (respaldo + aviso
  único); hay un guardado válido que se restaura sin aviso. Su diagrama se actualiza
  en consecuencia (ver duda D6).

  Diagrama del arranque tras el cambio (sujeto a confirmación en D6):

  ```mermaid
  flowchart TD
      Start((Se abre la aplicación en el navegador)) --> Q1{¿Hay estado guardado en el navegador?}

      Q1 -->|No, es un perfil nuevo| SeedNew[Arranca con la semilla incluida en el fichero, o con el contenido y los recursos por defecto si no hay semilla]
      SeedNew --> SilentNew[No se muestra ningún aviso]
      SilentNew --> Ready((Aplicación lista para trabajar))

      Q1 -->|Sí, hay estado guardado| Q2{¿El estado guardado se puede restaurar?}

      Q2 -->|"No: está corrupto, es ilegible o es de otra versión"| SeedFallback[Arranca con la semilla incluida en el fichero, o con el contenido y los recursos por defecto]
      SeedFallback --> Toast["Aviso breve no bloqueante, único: «No se ha podido recuperar el estado guardado.» (desaparece solo a los pocos segundos)"]
      Toast --> Ready

      Q2 -->|Sí| Restore[Se restaura el estado guardado: componentes, paneles, recursos, etiquetas, título...]
      Restore --> SilentRestore[No se muestra ningún aviso]
      SilentRestore --> Ready
  ```

  Nota: tras este cambio ya no se distingue "guardado corrupto" de "guardado de otra
  versión" — ambos caen en la misma rama, con el mismo arranque de respaldo y el mismo
  aviso. Antes eran dos ramas separadas con textos de aviso distintos.

**4. Contenido de ejemplo para guardados previos a esa funcionalidad (funcionalidad 036)**

- Se elimina la regla por la que "una partida guardada con una versión anterior que
  todavía no tuviera el contenido de ejemplo lo recibe una única vez la primera vez
  que se abre". Queda solo: una sesión totalmente nueva arranca con los 2 recursos de
  ejemplo; cualquier otro caso, no.
- Se mantiene el comportamiento de que, si el usuario borra los recursos de ejemplo,
  no reaparezcan al recargar (ver duda D3).

**5. Otras compatibilidades de esquema antiguo en el arranque**

Al abrir la aplicación se aplican hoy, además de las anteriores, varias conversiones
silenciosas de componentes guardados con un esquema viejo al actual:

  - Contenido de "Carta" guardado en el sistema de coordenadas antiguo, reescalado al
    sistema de píxeles reales.
  - Campo "Bloqueado" guardado como sí/no, convertido al de tres opciones actual
    ("Ninguno" / "Solo modo juego" / "Todos los modos").
  - Componentes guardados sin la opción de "Click derecho", a los que se les asigna
    "Abrir menú contextual" para conservar su comportamiento anterior.
  - Componentes de tipo "tablero" (nombre antiguo) pasados a "tablero simple".
  - Relleno del orden de apilado cuando el guardado no lo traía.

Todas son migraciones de guardados anteriores a la 1.0 y entran en el alcance de este
cambio. Se retiran, y se elimina de las fichas de funcionalidad afectadas (013, 014,
015, 016, 018, 022, 023) la frase del tipo "un componente/carta/tablero guardado antes
de este cambio se comporta como…". El valor por defecto de un componente **nuevo** no
cambia en ninguno de estos casos (ver duda D5 sobre el alcance en documentación, y D4
sobre el orden de apilado).

### Qué NO cambia

- Importar un fichero JSON exportado desde **otra versión** de la aplicación sigue
  siendo un caso de uso soportado y principal: el importador no comprueba la versión
  del fichero. Este cambio no convierte la importación en algo que exija "misma
  versión" (ver duda D1: qué tolerancias de formato se conservan en la importación).
- El comportamiento de una partida o un componente creados con la versión actual.
- Los mensajes de error de importación por fichero inválido (vacío, JSON corrupto, sin
  lista de componentes reconocible).

### Dudas para revisar

**D1 — Importación de JSON.** ¿La eliminación afecta solo al arranque (guardado del
navegador + semilla embebida en HTML) y **no** al flujo de importar un fichero JSON?
Importar un JSON de otra versión es, por diseño, el caso de uso principal.
*Propuesta:* en la importación se conservan la lectura tolerante del nombre antiguo de
la colección de etiquetas, la normalización de la pertenencia a etiquetas de los
componentes importados, y el relleno de registros de grupo ausentes en el fichero; y
solo se elimina el paso específico de conversión de "Fichas" y su aviso, porque el
tipo "Ficha" nunca llegó a existir en una versión publicada. ¿Correcto, o se quiere
eliminar también toda tolerancia de formato antiguo en la importación?

**D2 — Comprobación de versión del guardado del navegador.** Al unificar el caso de
error, ¿se mantiene la comprobación de "el guardado es de otra versión" como una causa
más de "guardado no restaurable" (sin rama ni texto propios), o se elimina del todo y
solo se valida que la estructura sea correcta?
*Propuesta:* mantenerla como invalidación simple: es barata y sigue evitando que un
guardado de un build de desarrollo anterior se intente restaurar sobre un build nuevo
incompatible, tanto ahora como después de la 1.0.

**D3 — Recuerdo de "recursos de ejemplo ya sembrados".** ¿Se conserva el mecanismo que
recuerda que los recursos de ejemplo ya se sembraron una vez (para que no reaparezcan
si el usuario los borra), eliminando solo el relleno para "guardados anteriores a esa
funcionalidad"?
*Propuesta:* sí, conservarlo; eliminar únicamente el relleno retroactivo y la frase
correspondiente de la ficha 036.

**D4 — Orden de apilado.** ¿Se mantiene la tolerancia actual a un guardado sin orden
de apilado (ordenando por la posición en la lista), o se simplifica asumiendo que
siempre viene?
*Propuesta:* simplificar y asumir que siempre viene, ya que solo un guardado anterior
a la 1.0 podría no traerlo.

**D5 — Alcance en la documentación de las cláusulas "guardado antes de este cambio".**
¿Se editan también las fichas de funcionalidad 013, 014, 015, 016, 018, 022 y 023 para
quitar esas frases, o se deja esa documentación como está y el cambio se limita al
código de migración más las fichas 024, 008, 029, 036 y 032?
*Propuesta:* alcance amplio: editar también esas frases, para que la documentación
funcional no siga describiendo comportamientos de compatibilidad que ya no existen.

**D6 — Diagrama de la funcionalidad 029.** Confirmar el nuevo diagrama de tres ramas:
"no hay guardado" → arranque limpio sin aviso; "hay guardado pero no se puede
restaurar" → arranque de respaldo + aviso breve único no bloqueante; "hay guardado
válido" → se restaura sin aviso.

## Technical notes

- **Punto único de migración en arranque:** `core/state.js` → `loadComponents(components)`,
  que llama en orden a `migrateFichas`, `migrateCartaMedidasReales`,
  `migrateGrupoIdToEtiquetaIds`, `migrateDeckIdToEtiqueta`, `migrateBloqueado`,
  `migrateAccionClickDerecho`, `migrateTableroSimple` y `compactOrders`.
  `loadComponents` se invoca tanto en el arranque desde `localStorage` como desde
  `bootFromSeedOrDefaults` (semilla embebida en HTML) — cubre los dos puntos de
  entrada del arranque.
- **`core/fichaMigration.js`:** módulo puro (`migrateFichaProperties`,
  `migrateFichaComponent`). Otro único punto de uso: `ui/editModeToggle.js`
  (`importComponentsFromFile`), que pasa cada componente seleccionado de tipo `'ficha'`
  por `migrateFichaComponent` antes de `mergeImportedGame`; si hay errores abre
  `ui/importConversionErrorModal.js`. Documentado en
  `design/docs/architecture/004-groups-resources.md` (sección "'ficha' component
  migration") y `007-persistence-build.md` (flujo de importación, paso 4).
- **No hay número de versión de esquema del guardado.** `parseState`
  (`core/persistence.js`) solo compara `parsed.version !== CURRENT_VERSION`
  (`data/version.js`, número de build). Devuelve resultado discriminado:
  `{ error: 'corrupt' }`, `{ error: 'version-mismatch' }` o éxito. `readSeedState`
  descarta la semilla si `parseState` devuelve cualquier `error`.
  `parseImportedComponents` es la variante **sin** comprobación de versión y **no
  cambia** (D1).
- **Cadenas de compatibilidad en `core/persistence.js`:** `parseState` y
  `parseImportedComponents` leen `tags` con la cadena `tags → groups → decks`, y
  `tagPanelState` con `tagPanelState → groupPanelState → deckPanelState`.
  `componentGroups` no tiene alias (colección nueva). Documentado en architecture 004
  y 007 ("Backward compatibility"). Decidir en D1 cuáles se conservan para la
  importación.
- **`normalizeComponentEtiquetaIds`** vive en `core/component.js` (acepta `grupoIds`
  array, `grupoId` escalar, o ausencia). Lo usan `migrateGrupoIdToEtiquetaIds`
  (`core/state.js`) e `importMerge.js` (normaliza componentes importados antes de
  remapear referencias).
- **`deriveMissingGroups`** (`core/group.js`): backfill de registros de grupo para
  cada `groupId` con 2+ miembros sin registro. Cubre a la vez guardados antiguos
  (sin la colección) **y** ficheros de importación que no incluyan `componentGroups`.
  Si se quita la vertiente "guardado antiguo", sigue haciendo falta para la
  importación (D1).
- **`backfillDefaultResourcesIfNeeded` + flag `resourcesSeeded`** (`main.js`):
  `seedDefaultResources()` para sesión nueva; `backfillDefaultResourcesIfNeeded()`
  para guardado/semilla con `resourcesSeeded` distinto de `true`. D3 propone conservar
  el flag y `seedDefaultResources`, eliminar solo el backfill.
- **i18n:** claves `fichaMigration.error.*` en `data/i18n.es.js` y `data/i18n.en.js`
  (`missingDesign`, `missingShape`, `unknownShape`, `incompleteImageAdjust`) — a
  retirar junto con `ui/importConversionErrorModal.js`.
- **Tests / fixtures que dependen de formatos antiguos** (a actualizar en `pv-how` /
  `pv-do`): `test/fixtures/errantes-componentes.json` tiene `"version":"v00102"` y
  componentes `"type":"tablero"`; `test/functional/autosave.test.js` comprueba
  `loadState().error === 'version-mismatch'`. Al retirar migraciones y unificar el
  error, estos tests/fixtures dejarán de reflejar el comportamiento y hay que
  ajustarlos.
- **Documentación técnica a actualizar** (lo hará `pv-do` tras `pv-how`):
  `design/docs/architecture/004-groups-resources.md` (secciones "Backward
  compatibility", "'ficha' component migration") y `007-persistence-build.md` (tabla
  de retornos de `parseState`, bloque de arranque, "Default resources and backfill",
  "Backward compatibility").
- **Seguridad (menor):** al unificar los casos de error de `parseState`, mantener que
  ningún camino de error vuelque el contenido del guardado a consola/logs (hoy ninguno
  lo hace).
- App sin backend: todo ocurre en el navegador (`localStorage` + ficheros). Sin
  autenticación, autorización ni servidor.
