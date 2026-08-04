- **Nombre**: De "Mazo" a "Grupo": pertenencia a grupo como propiedad general de cualquier elemento
- **Código**: 00105
- **Tipo**: change

## Prompt original del usuario

El concepto actual de Mazo debe cambiarse a Grupo:
- ANTES solo las cartas podían incluirse en un mazo (ahora grupo) de manera opcional.
- AHORA Cualquier elemento puede pertenecer o no a un grupo: el grupo al que pertenece un elemento es una propiedad general de todos los elementos.

## Descripción completa

El concepto actual de "Mazo" se generaliza y renombra a "Grupo". Antes, solo las cartas ("Carta/Ficha") podían pertenecer opcionalmente a un mazo, como una propiedad específica de ese tipo de elemento. Ahora, cualquier tipo de elemento del juego (Cuadro de texto, Tablero, Dado, Visor de documentos, Carta/Ficha) puede pertenecer opcionalmente a un grupo, siendo esa pertenencia una propiedad general de todos los elementos, no exclusiva de las cartas.

### Dónde se gestiona la pertenencia a un grupo

El selector "Grupo" pasa de estar en la configuración específica de "Carta/Ficha" a la pestaña "Generales" de la modal de configuración de cualquier elemento, junto a los checkboxes "Bloqueado", "Oculto", "Mostrar tooltip" y "Subir al mover/interactuar" — disponible ahora para los cinco tipos de elemento existentes. Se mantiene la posibilidad de crear un grupo nuevo al vuelo desde esa misma modal sin salir de ella, con la misma validación de nombre no vacío y no duplicado (comparación recortada, sin distinguir mayúsculas/minúsculas) que ya existía para mazos.

### Renombrado general en la interfaz

El panel flotante "Mazos" pasa a llamarse "Grupos"; su ventana de alta/edición y cualquier texto relacionado ("Sin mazo" → "Sin grupo", "+ Añadir mazo" → "+ Añadir grupo", mensajes de confirmación, etc.) se actualizan de "mazo" a "grupo" en toda la aplicación. El panel "Grupos" mantiene la misma estructura mínima que tenía "Mazos": columnas Nombre/Acciones, sin columna "Tipo", sin filtro de texto, sin acción de clonar y sin fila seleccionable/resaltada sobre la mesa — un grupo sigue sin tener representación visual propia ni tipo asociado, igual que antes un mazo. Si no hay ningún grupo creado todavía, se muestra "No hay grupos todavía."

### Borrado de un grupo en uso

Al intentar eliminar un grupo que esté siendo usado por al menos un elemento, se muestra una ventana de confirmación con la lista de elementos afectados, indicando ahora para cada uno tanto su identificador como su tipo (Carta/Ficha, Tablero, Dado, Cuadro de texto o Visor de documentos) — a diferencia de antes, que solo podía haber cartas y no hacía falta indicar el tipo. Si se acepta, se borra el grupo y esos elementos quedan sin grupo asignado ("Sin grupo"); si se cancela, no se hace ningún cambio. Si el grupo no está en uso, se pide la confirmación estándar ya usada en el resto de la app y se borra directamente.

### Copiar/Pegar estilo de carta

Dentro de "Copiar/Pegar estilo" de Carta/Ficha, "Grupo" deja de ser un elemento independiente del checklist de "Copiar estilo" (que hoy incluye Generales, Proporción, Mazo, Cara frontal, Cara trasera) y se integra dentro del bloque indivisible "Generales", junto a bloqueado/oculto/mostrar tooltip/subir al mover/interactuar: se copia y pega siempre como parte de ese mismo bloque, no como opción marcable aparte. El checklist de "Copiar estilo" pasa a tener cuatro elementos: Generales (incluyendo ahora el grupo), Proporción, Cara frontal, Cara trasera.

### Sin mecánica de juego propia

Se elimina la idea de que los grupos estén "pensados para incorporar en el futuro una mecánica de juego propia (barajar, robar carta)". A partir de este cambio, un grupo tiene como único objetivo agrupar/organizar elementos por nombre, sin ninguna funcionalidad de juego asociada, ni ahora ni como intención declarada de cara al futuro.

### Migración de datos existentes

Las cartas que ya tuvieran un mazo asignado migran automáticamente esa asignación al nuevo campo general de grupo, sin pérdida de la asignación existente, de forma silenciosa al abrir la app — mismo criterio ya seguido en otras migraciones silenciosas del proyecto (p. ej. la migración de "Ficha" a "Carta/Ficha"). Los grupos ya creados (antes mazos) se conservan tal cual, con el mismo nombre e identificador.

### Casos límite

Un elemento sin campo de grupo (guardados de partidas anteriores a este cambio, para cualquier tipo que nunca tuvo mazo) se comporta como "Sin grupo" — igual que ya ocurre con otros checkboxes generales opcionales (oculto, mostrar tooltip). No hay filtro por grupo en ningún panel de la app, igual que no lo había por mazo.

### Preguntas de alcance resueltas con el usuario

- **Ubicación del campo**: se confirmó que "Grupo" pasa a ser un campo general de cualquier elemento, editable desde "Generales" para todos los tipos, en vez de mantenerse como una propiedad específica por tipo.
- **Borrado de grupo en uso**: se confirmó que la lista de elementos afectados debe indicar id y tipo de cada uno, ya que ahora puede haber elementos de distintos tipos en un mismo grupo.
- **Copiar/Pegar estilo**: se confirmó (tras aclarar que los otros checkboxes generales de carta ya se copian/pegan como bloque "Generales") que "Grupo" se integra en ese mismo bloque en vez de mantenerse como opción aparte del checklist.
- **Mecánica futura**: se confirmó que los grupos pasan a ser puramente organizativos, sin ninguna funcionalidad de juego asociada ni intención futura declarada al respecto.

## Apuntes técnicos

- Modelo actual: `core/deck.js` (`createDeck`, `updateDeck`, `isDeckNameTaken`, `getComponentsUsingDeck`) modela mazos como entidades mínimas `{id, name}`. La pertenencia hoy vive en `component.properties.deckId`, leída/escrita únicamente por `ui/componentModal.js` en la sección específica de `'carta'`, y filtrada en `getComponentsUsingDeck` por `component.type === 'carta'`.
- UI relacionada a renombrar/generalizar: `ui/deckList.js` (panel "Mazos"), `ui/deckModal.js` (alta/edición de mazo), `modes/edit/editMode.js` (monta el panel, `deckPanelState`, `attemptDeleteDeck`, `panelStackOrder` con clave `'deck'`), `ui/componentModal.js` (selector de mazo, hoy solo en la sección de carta; y el checklist de Copiar/Pegar estilo con el elemento "Mazo" en `core/styleClipboard.js`/`ui/styleClipboardSelectionModal.js`).
- Modelo genérico de componente (`core/component.js`, documentado en `ARCHITECTURE.md` sección 4) ya tiene precedentes de campos generales opcionales con valor por defecto para compatibilidad hacia atrás (`oculto`, `mostrarTooltip`, `subirAlMoverInteractuar`): el nuevo campo general de grupo debería seguir el mismo patrón (campo con default `null`, migración silenciosa de `properties.deckId` en cartas existentes, ver `core/fichaMigration.js` como precedente de migración silenciosa de datos).
- `getComponentsUsingDeck` deja de filtrar por `type === 'carta'`: debe recorrer todos los componentes sin restricción de tipo una vez el campo pasa a ser general.
- `ARCHITECTURE.md` sección 3 describe hoy el panel "Mazos" (`ui/deckList.js`) como tercera ventana flotante de `editMode.js`, con `getComponentsUsingDeck` mirando "componentes `'carta'`" — pasa a quedar desactualizado con este cambio (debe hablar de "elementos" en general, no solo cartas).
