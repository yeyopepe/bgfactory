- **Nombre**: Copiar y pegar estilo entre cartas
- **Código**: 00085
- **Tipo**: change

## Prompt original del usuario

/ms-new todo cq3ce

Idea original de partida (`changes/todo/cq3ce/description.md`):

> Facilidad para copiar el estilo visual de una carta a otra, sin copiar imágenes.
>
> Cuando trabajes con cartas en el editor, a veces quieres reutilizar estilos visuales (colores, tipografía, bordes, sombras, etc.) de una carta en otra. Actualmente no hay un mecanismo rápido para ello.
>
> Posible aproximación:
> - Botón o menú contextual "Copiar estilo" en una carta.
> - Pegar en otra carta con "Pegar estilo", que aplicaría todo excepto imágenes.
> - O quizá un diálogo/modal que permita seleccionar qué atributos copiar (todos por defecto, incluyendo imágenes)

Tras refinar la idea en conversación con el usuario, el resultado final cambia de enfoque respecto al planteamiento inicial: en vez de vivir dentro del editor dedicado de diseño de la carta, es una acción global sobre el componente "carta" completo, disparada desde la modal de configuración general del componente, con una selección de qué partes copiar/pegar (más granular que la idea original, ver más abajo).

Aunque este cambio solo implementa "Copiar/Pegar estilo" para el tipo `'carta'`, su aspecto visual (sección propia, checklist de selección, botones, aviso y modal de error) debe quedar establecido como un convenio general de la app: si en el futuro se añade la misma funcionalidad a otros tipos de componente (tablero, ficha, dado, documento...), debe verse y comportarse igual, solo cambiando qué elementos concretos aparecen en el checklist de cada tipo.

## Descripción completa

Se añaden dos acciones nuevas, **"Copiar estilo"** y **"Pegar estilo"**, disponibles en la modal de configuración de un componente cuando es de tipo carta (la misma modal general desde la que ya se accede a "Editar diseño de la carta", proporción y mazo — no el editor de diseño de dos caras en sí). Ambas viven dentro de una sección propia y diferenciada ("Estilo de la carta") dentro de esa modal, separada visualmente del resto de campos.

Al pulsar "Copiar estilo" se abre una lista de selección con cinco elementos: **Generales**, **Proporción**, **Mazo**, **Cara frontal** y **Cara trasera**, todos marcados por defecto. El usuario puede desmarcar los que no quiera copiar. "Cara frontal"/"Cara trasera" son, cada una, un conjunto indivisible con todo su diseño (imagen de fondo y su ajuste de zoom/posición, borde, transparencia de la imagen, y todos los cuadros de texto con su contenido, posición, tamaño y estilo) — no se puede copiar solo una parte de una cara. "Generales" agrupa, también como conjunto indivisible, los tres interruptores de la pestaña "Generales" de la misma modal (si el componente se puede mover en modo juego, si muestra su identificador al pasar el ratón por encima, y si sube al frente de la mesa al moverse/interactuar) — no se puede copiar solo uno de los tres sueltos.

Al confirmar la selección, únicamente los elementos marcados se guardan en un "portapapeles" que vive solo en memoria durante la sesión del navegador — no se persiste ni se guarda en el fichero exportado del juego. El portapapeles solo puede contener un estilo copiado a la vez (el último) — nunca un historial; cada nueva copia sustituye a la anterior por completo (incluidos los elementos que la copia nueva no marcó, que simplemente deja de estar disponibles para pegar).

"Pegar estilo" solo está habilitado si hay algo copiado en la sesión actual. Al pulsarlo sobre la carta que se esté configurando en ese momento, aplica únicamente los elementos que se copiaron (Generales, Proporción, Mazo, y/o cada cara) sobre esa carta, dejando intactos en el destino los elementos que no se copiaron. El pegado sustituye por completo el elemento correspondiente en el destino (p. ej. pegar "Cara frontal" borra y sustituye todo el diseño anterior de esa cara).

Antes de aplicar cualquier cambio al pegar, se comprueba que todo lo que se va a pegar sigue siendo válido en el estado actual del proyecto: si se copió el mazo, que ese mazo siga existiendo; si se copió alguna cara, que los recursos de imagen o tipografía que referencia (imagen de fondo, tipografía de cada cuadro de texto) sigan existiendo. Si falta cualquiera de ellos —basta uno solo, entre los elementos que se están pegando—, se informa al usuario del error y **no se modifica nada** de la carta destino: el pegado es todo o nada, nunca parcial. El detalle del error se presenta como una tabla con una fila por cada referencia que falta (a qué elemento pertenece y qué falta exactamente), siguiendo el mismo criterio que ya usa el proyecto para detallar otros errores con varias incidencias a la vez, en vez de un único mensaje de texto genérico.

Al confirmar la copia se muestra un aviso breve ("Estilo copiado"). Si el pegado tiene éxito, no pide confirmación previa — es una acción de edición más, reversible manualmente reeditando la carta.

### Diagrama de flujo

```mermaid
flowchart TD
    A[Usuario abre la modal de configuración de una carta] --> B[Click en "Copiar estilo"]
    B --> C[Checklist: Proporción / Mazo / Cara frontal / Cara trasera, todos marcados por defecto]
    C --> D{Usuario confirma selección}
    D -->|Al menos un elemento marcado| E[Se guardan en memoria de sesión solo los elementos marcados]
    E --> F[Aviso: "Estilo copiado"]
    F --> G[Botón "Pegar estilo" queda habilitado]
    G --> H[Usuario abre la modal de configuración de otra carta - o la misma]
    H --> I[Click en "Pegar estilo"]
    I --> J{¿Mazo y recursos referenciados por los elementos copiados siguen existiendo?}
    J -->|Sí| K[Se sustituyen en la carta destino solo los elementos copiados; el resto queda intacto]
    J -->|No, falta al menos uno| L[Se informa del error - la carta destino no se modifica]
```

### Casos límite y alcance ya resueltos

- **Copiar sin marcar ningún elemento**: no aplica — hay que dejar al menos uno marcado para poder confirmar la copia.
- **Portapapeles**: solo en memoria de la sesión del navegador, y solo puede contener un estilo copiado a la vez (el último sobrescribe cualquier copia anterior, sin historial, incluidos los elementos que esa copia no marcó). No sobrevive a recargar la página ni se incluye en el fichero exportado del juego.
- **Validación al pegar**: si el mazo copiado (cuando se copió), o cualquier recurso de imagen/tipografía referenciado por las caras copiadas (cuando se copiaron), ya no existe en el proyecto (p. ej. se borró entre el momento de copiar y el de pegar), el pegado se cancela por completo y se informa del error al usuario — ni siquiera se aplican los elementos que sí serían válidos.
- **Quién puede usarlo**: exclusivo de Modo Edición (Modo Juego no tiene modal de configuración de componentes).
- **Convivencia con lo existente**: es una capacidad nueva, no sustituye ni entra en conflicto con ninguna funcionalidad ya presente en la modal de configuración ni en el editor de diseño de la carta.
- **Pegar sobrescribe sin avisar**: no hay confirmación antes de pegar ni forma de deshacer automáticamente — el usuario puede reeditar manualmente si se equivoca.
- **Elementos no copiados**: los que no se marcaron al copiar quedan totalmente intactos en la carta destino al pegar (p. ej. copiar solo "Cara frontal" nunca toca la proporción, el mazo ni la cara trasera del destino).

### Definición visual de alto nivel

- Dentro de la modal de configuración de la carta (pestaña "Específicas"), una sección propia "Estilo de la carta" (separada visualmente del resto de campos: Proporción/Mazo/"Editar diseño de la carta") con dos botones, "Copiar estilo" y "Pegar estilo". "Pegar estilo" se muestra deshabilitado mientras no haya nada copiado.
- Al pulsar "Copiar estilo", una modal de selección (checklist) con los cinco elementos (Generales, Proporción, Mazo, Cara frontal, Cara trasera), cada uno marcado por defecto, con los botones de aceptar/cancelar habituales.
- Un aviso breve tipo toast ("Estilo copiado") tras confirmar la copia.
- Si el pegado falla la validación, una modal de error con el mismo aspecto que cualquier otro error de la app (icono de alerta junto al título) y, para el detalle, una tabla con una fila por cada referencia que falta.
- Este aspecto visual (sección "Estilo de la carta", botones, checklist, toast y modal de error) es el convenio a seguir para cualquier tipo de componente que incorpore "Copiar/Pegar estilo" en el futuro — solo cambia la lista de elementos del checklist, específica de cada tipo.

## Apuntes técnicos

- Ubicación real en código: `ui/componentModal.js`, función `renderCartaSpecificFields` (pestaña "Específicas" para tipo `'carta'`), donde ya viven los campos Proporción/Mazo y el botón "Editar diseño de la carta" (que abre `ui/cardEditorModal.js` vía `openCardEditorModal`). Los botones nuevos van en ese mismo bloque, no dentro de `cardEditorModal.js`.
- Modelo de datos relevante (`ARCHITECTURE.md` sección 4, tipo `'carta'`): `properties` completo de una carta es `{ proporcion, deckId, caraActual, caraFrontal, caraTrasera }` (más `textBoxes` dentro de cada cara). "Copiar/pegar estilo" equivale a clonar `proporcion`, `deckId`, `caraFrontal` y `caraTrasera` — pero no `caraActual` (qué cara se está mostrando en ese instante no es parte del "estilo", es un estado de Modo Juego propio de cada carta).
- El elemento "Generales" del checklist corresponde a tres campos generales del propio componente (no de `properties`, ver `ARCHITECTURE.md` sección 4): `bloqueado`, `mostrarTooltip` y `subirAlMoverInteractuar` — editados en la pestaña "Generales" de `ui/componentModal.js` (líneas ~214-260 en la versión actual), no en `renderCartaSpecificFields`. Al no ser exclusivos de `'carta'` (cualquier tipo de componente los tiene), conviene que "Copiar/pegar estilo" los trate como bloque aparte de los otros cuatro, que sí son específicos de `properties` de carta.
- No existe hoy en el proyecto ningún mecanismo previo de copiar/pegar (verificado por búsqueda en `src/` sin resultados para "copiar"/"clipboard").
- El aviso de confirmación tras copiar tiene el mismo rol que `ui/toast.js` (confirmaciones breves que no requieren revisar ningún detalle, `STYLE_BIBLE.md` sección 12.1.1) — candidato a reutilizar en vez de crear un aviso ad-hoc.
- El error de validación al pegar (mazo o recurso referenciado ya no existe) es un error de la app en el sentido de `STYLE_BIBLE.md` sección 12.1: candidato directo a `showErrorModal(title, message, detail)` (`ui/errorModal.js`), el único punto ya establecido en el proyecto para comunicar errores.
- Referencias a validar antes de pegar (solo de los elementos que se estén pegando): `deckId` contra `getDecks()` (`core/state.js`); `imagenResourceId` de `caraFrontal`/`caraTrasera` y `fuenteResourceId` de cada `TextBox` de la cara correspondiente, contra `getResources()` (`core/state.js`) — mismo tipo de comprobación de existencia que ya hace `isResourceInUse`/`getComponentsUsingDeck`, pero en sentido inverso (aquí se valida que la referencia copiada siga resolviendo a algo existente, no que un recurso/mazo esté en uso).
- La sección "Estilo de la carta" es candidata a usar el patrón ya existente `fieldset.modal__section` (`STYLE_BIBLE.md` sección 12.6, `main.css`), variante meramente informativa (sin checkbox de activación) — mismo lenguaje visual que ya usan otras secciones de `componentModal.js`.
- El checklist de "Copiar estilo" (5 elementos con checkbox, todos marcados por defecto) es candidato a reutilizar/adaptar `ui/elementSelectionModal.js` (`createElementSelectionGroups`, `STYLE_BIBLE.md` sección 12.5) en vez de crear un patrón ad-hoc, aunque esa función está hoy pensada para colecciones de componentes/recursos/mazos (con `id`/label), no para una lista fija de 5 conceptos — puede necesitar adaptación, no reutilización literal.
- El detalle del error de validación al pegar es candidato a reutilizar el patrón de tabla ya usado por `ui/importReportModal.js` (`.import-report-modal__table`, `STYLE_BIBLE.md` sección 12.1.1) — mismo `<table>` con cabecera y una fila por incidencia, aunque las columnas deben adaptarse: aquí no hay "Solución" (el proyecto no autorresuelve nada, el pegado entero se cancela), solo qué elemento del estilo copiado (p. ej. "Cara frontal", "Mazo") y qué referencia concreta falta (p. ej. "Imagen de fondo — recurso eliminado", "Mazo — eliminado").
- Al implementar este cambio, `ms-how`/`ms-do` deben documentar el aspecto visual resultante (sección propia, botones, checklist, toast, modal de error) como un patrón nuevo de `STYLE_BIBLE.md` (mismo estilo que las secciones 12.5/12.6/12.7 para otros patrones reutilizables: lista de selección agrupada, secciones dentro de pestañas, menú desplegable) — algo como "Copiar/Pegar estilo de un componente" — en vez de dejarlo como una solución puntual solo descrita para `'carta'`. Así, si en el futuro se extiende a otros tipos de componente, `ms-how` tendrá ya el convenio visual documentado como fuente de la verdad, sin tener que releer este change 00085 para replicarlo.
