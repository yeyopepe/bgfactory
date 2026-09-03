# 00 — Namespace

Single canonical name tree for this project. Every concept and every assertion (architecture and style alike) has exactly one path here. Style concepts live on the `ui.*` branch -- there is no separate namespace file for the style bible.

## Notation

Compact notation for structured data:

```
field: type                  required field
field?: type                 optional field
field: type = value          default value
field: type in {a, b, c}     enum / allowed set
field: type [min..max]       range
```

Invariants -- executable vs declarative:

- `assert <expr>` when there is a program point where the condition can be checked with the values at hand.
- declarative `inv: ...` / `pre:` / `post:` (propositional logic, `and or not -> forall`) when it quantifies over an abstract set, talks about an FSM state, or a non-observable global property.
- If both forms fit, the `assert` governs and the declarative one is a restatement.

Boundary between a leaf's two forms:

- `path = <scalar>` -- a simple value (number, enum, boolean).
- `path:` then a notation block -- an assertion with logical structure (a contract, a logic expression).

## Tree

Segment order: aggregate to part, module to detail. `<area>.<aggregate>.<entity>.<field-or-assertion>`.

- `auth.token.session.exp` -- OK (area auth -> aggregate token -> entity session -> field exp)
- `auth.session.token.exp` -- wrong (inverts aggregate and entity)

Domain terms with no standard English translation: if the concept has a code symbol, the path uses the symbol name; if it has none, the slug may stay in the project's language for that one node (e.g. `billing.recargo-equivalencia`), noted here as an explicit exception with a one-line approximate-English gloss.

```
component                                concepto.  anchor: src/core/component.js#createComponent
component.decision.generic-extensible-model   decisión.  sin ancla
    [motivación] modelo genérico y extensible: ningún tipo concreto (carta, ficha, tablero, tracks...) requiere cambio estructural en el modelo — ver 002-component-model.md y 003-component-types.md
component.order = 1 .. n                  afirmación (1 = arriba, n = abajo)
component.order.rule:                     anchor: src/core/state.js
    addComponent asigna order = 1, desplaza el resto +1
    removeComponent recompacta 1..n (compactOrders)
    reorderComponent(id, raw) clampa raw a [1, n]
component.copyOf?: string = null          concepto.  anchor: src/core/component.js#createCopy
component.sincronizado: bool = true       afirmación (solo aplica si copyOf != null)
component.copy.decision.non-synced-keys   decisión.  anchor: src/core/component.js (NON_SYNCED_PROPERTY_KEYS)
    [motivación] x, y, order, groupId, properties.resultadoActual (dado), properties.caraActual (carta) nunca se propagan de un original a sus copias vinculadas
component.groupId?: string = null         concepto.
component.bloqueado: enum ∈ {ninguno, juego, todos} = ninguno   concepto.
component.oculto: bool = false            concepto.
component.subirAlMoverInteractuar: bool = false   concepto.
component.profundidad: number [0..40] = 0         concepto.  anchor: src/ui/componentRenderer.js#buildExtrusionLayers
component.colorExtrusion?: string = null          concepto.  anchor: src/ui/componentRenderer.js#resolveExtrusionColor
component.accionClickDerecho: enum ∈ {ninguno, menuContextual} = ninguno   concepto.
component.image?: string = null           concepto.
component.image.decision.unused           decisión.  sin ancla
    [gotcha] component.image no lo usa ningún tipo actual (verificado: solo se lee en core/resource.js para detección de uso, ningún tipo lo escribe); los fondos de imagen van por properties.imagenResourceId

group                                     concepto.  anchor: src/core/group.js#createGroup
group.id: string                          afirmación (mismo valor que el groupId de sus miembros; grupo-N o libre si se renombra)
group.id.rule:                            anchor: src/core/component.js#nextGroupId
    formato grupo-N, N = primer entero libre
group.effectiveProps.rule:                anchor: src/core/group.js#getEffectiveGeneralProps
    pre:  component.groupId != null ∧ ∃ g ∈ groups : g.id = component.groupId
    post: bloqueado, oculto, mostrarTooltip, mostrarTitulo, subirAlMoverInteractuar, etiquetaIds efectivos = los del registro g
    fallback: si no hay registro g, se usan los propios del componente
group.persist.decision.key-componentGroups   decisión.  sin ancla
    [motivación] la colección se persiste bajo la clave componentGroups, no groups, porque groups ya es alias de compatibilidad de tags

tag                                       concepto.  anchor: src/core/tag.js#createTag
tag.name.uniqueness.rule:                 anchor: src/core/tag.js#isTagNameTaken
    normalizado (trim, case-insensitive); true si otro tag con id != excludeId tiene el mismo nombre
tag.persist.decision.compat-chain        decisión.  sin ancla
    [motivación] parseState lee tags/tagPanelState, con fallback a groups/groupPanelState y luego a decks/deckPanelState

resource                                  concepto.  anchor: src/core/resource.js#createResource
resource.type: enum ∈ {imagen, tipografia}   concepto.
resource.usage.rule:                      anchor: src/core/resource.js#isResourceInUse
    recorre component.properties en profundidad (collectDeepValues) buscando el resourceId; getComponentsUsingResource añade component.image
resource.typeForFileName.rule:            anchor: src/core/resource.js#resourceTypeForFileName
    png/jpg/jpeg/gif/svg/webp -> imagen; ttf/otf/woff/woff2 -> tipografia; else null

persistence.serializedFields = [components, panelState, resources, resourcePanelState, resourcesSeeded, tags, tagPanelState, componentGroups, appTitle]
                                          afirmación.  anchor: src/core/persistence.js
persistence.serializedFields.rule:        anchor: src/core/persistence.js (saveState/parseState)
    autosave serializa exactamente esa lista a localStorage; una colección/campo nuevo debe añadirse ahí y en la suscripción de autosave (007-persistence-build.md)
    [gotcha] core/fileExport.js NO participa en esta lista (solo expone downloadJson, un helper genérico) — corrección S2, el borrador original citaba fileExport.js como coautor de la serialización
persistence.parseState.result: enum ∈ {success-object, {error: 'corrupt'}, {error: 'version-mismatch'}}   afirmación.  anchor: src/core/persistence.js#parseState
persistence.parseState.result.rule:       anchor: src/core/persistence.js (parseState)
    JSON.parse lanza -> {error: 'corrupt'}
    parsed objeto ∧ parsed.version != CURRENT_VERSION -> {error: 'version-mismatch'} (antes del chequeo de components)
    parsed falsy ∨ !Array.isArray(parsed.components), con version correcta -> {error: 'corrupt'}
    resto -> objeto de éxito sin campo error
persistence.startup.rule:                  anchor: src/main.js (bootFromSeedOrDefaults + bloque de arranque)
    loadState() null -> bootFromSeedOrDefaults(), sin aviso
    {error: 'version-mismatch'} -> bootFromSeedOrDefaults() + showToast('...estado de una versión anterior...')
    {error: 'corrupt'} -> bootFromSeedOrDefaults() + showToast('No se ha podido recuperar el estado guardado.')
    objeto de éxito -> restaurar estado, sin aviso
    [gotcha] el arranque ya no usa showErrorModal; version-mismatch es toast no bloqueante, no modal

ui.token.accent-blue = #2c7dd8            afirmación de estilo.  anchor: src/styles/main.css
ui.token.accent-blue-dark = #123a66       afirmación de estilo.
ui.token.accent-blue-light = #eaf3fc      afirmación de estilo.
ui.token.section-accent = #5b5f97         afirmación de estilo.
ui.token.error = #d32f2f                  afirmación de estilo.
ui.token.radius-sm = 4px                  afirmación de estilo.
ui.token.radius-lg = 8px                  afirmación de estilo.
ui.token.shadow-1                         concepto de estilo.  anchor: src/styles/main.css
ui.token.shadow-2                         concepto de estilo.
ui.token.transition-fast = 150ms ease     afirmación de estilo.
ui.elevation.level0                       concepto de estilo (plano, sin sombra)
ui.elevation.level1                       concepto de estilo (flotación sutil, box-shadow shadow-1)
ui.elevation.level2                       concepto de estilo (overlay, box-shadow shadow-2)
ui.class.is-copy                          concepto de estilo.  anchor: src/ui/componentRenderer.js
ui.class.is-group-passenger              concepto de estilo.  anchor: src/ui/componentRenderer.js
ui.class.decision.is-group-passenger-wins-over-is-copy   decisión.  sin ancla
    [motivación] .is-group-passenger se declara después en la cascada CSS, gana a .is-copy sobre el mismo elemento
ui.class.lifted                           concepto de estilo (estado transitorio, drag en modo juego)
ui.class.drop-target                      concepto de estilo (mazo resaltado durante drag de carta)
ui.class.carta--flip-feedback            concepto de estilo (feedback de cambio de cara)
ui.feedback.error.decision.modal-except-startup   decisión.  sin ancla
    [motivación] todo error de la app usa showErrorModal (ui/errorModal.js); única excepción (cambio 00230): el arranque comunica un estado guardado irrecuperable (otra versión, o corrupto) con showToast no bloqueante — condición esperada y autorrecuperable, un modal sería desproporcionado
ui.link                                   concepto de estilo (enlace de texto).  anchor: src/styles/main.css (#app-version a)
    color: inherit ∧ text-decoration: underline ∧ sin :visited/:hover/:active
    [gotcha] un enlace de texto NO es --accent-blue; se distingue solo por el subrayado, en el color de su contexto
ui.link.external                          concepto de estilo (enlace a destino fuera de la app)
    target="_blank" ∧ rel="noopener" ∧ texto = etiqueta legible, nunca la URL cruda
ui.class.app-version                      concepto de estilo (footer de versión de dos líneas).  anchor: src/main.js
    #app-version contiene .app-version__name + .app-version__repo (00243)
```
