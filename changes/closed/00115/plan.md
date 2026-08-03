## (a) Anotaciones funcionales

**Fuera de alcance**: no se toca el menú contextual de Modo Juego (Bloquear/Desbloquear, Barajar, Ver contenido..., Meter en mazo...), ni el doble-click del dado (modal de resultado grande), ni el arrastre/"Bloqueado" — todos siguen funcionando exactamente igual, con independencia del nuevo ajuste. No se añade ninguna interacción nueva a ningún tipo; solo se permite desactivar las tres que ya existen.

**Dudas resueltas con el usuario** (ver también `description.md`):
- ¿Qué es una "interacción programada"? El efecto de un click sobre el componente en Modo Juego, específico del tipo (Dado→Lanzar, Carta→Voltear, Mazo→Sacar carta de arriba). Confirmado.
- ¿Cuántas opciones por combo? Dos: "Ninguna" y el nombre de la interacción, ya que hoy cada tipo tiene como mucho una. Confirmado, pero el modelo de datos se diseña para poder admitir un tipo con más de una interacción en el futuro sin cambiar su forma.
- ¿Sincroniza con Copias? Sí, como el resto de propiedades de configuración (no como estado transitorio de partida). Confirmado.

## (b) Solución técnica

1. **Registro central de interacciones por tipo** — nuevo fichero `src/core/interactions.js`:
   - Exporta una constante `TYPE_INTERACTIONS` que mapea cada `type` de componente a un array de interacciones `{ key, label }` (hoy: `dado` → `[{ key: 'lanzar', label: 'Lanzar dado' }]`, `carta` → `[{ key: 'voltear', label: 'Voltear carta' }]`, `mazo` → `[{ key: 'sacarCarta', label: 'Sacar carta de arriba' }]`; el resto de tipos, sin entrada o array vacío).
   - Exporta `getInteractionsForType(type)` (devuelve `TYPE_INTERACTIONS[type] || []`) y `isInteractionActive(component, key)` (devuelve `!(component.interaccionesDesactivadas || []).includes(key)`), para reutilizar el mismo criterio en `componentModal.js` y en `playMode.js`/`componentRenderer.js`.
   - Este registro es el único sitio que sabe "qué interacciones tiene cada tipo" — hoy ese conocimiento está implícito y disperso (el propio `if (onDiceResult)` en `componentRenderer.js`, el `if (component.type === 'mazo')` del menú contextual en `playMode.js`, etc.); no se tocan esos sitios existentes, solo se añade este registro como nueva fuente para el nuevo combo y para la comprobación de activación.

2. **Modelo de datos** — `src/core/component.js`:
   - Añadir el parámetro `interaccionesDesactivadas = []` a `createComponent(...)`, incluido en el objeto devuelto (mismo patrón que `mostrarTooltip`/`subirAlMoverInteractuar`: campo de primer nivel, no dentro de `properties`, porque no es específico del tipo sino un ajuste general de interacción).
   - `updateComponent` no necesita cambios (el spread de `changes` ya cubre sobrescribir este campo).
   - `syncCopyWithOriginal(copy, original)`: añadir `interaccionesDesactivadas: original.interaccionesDesactivadas` al objeto devuelto, junto a `mostrarTooltip`/`subirAlMoverInteractuar`/`grupoId` — se sincroniza igual que esos campos, no se toca `NON_SYNCED_PROPERTY_KEYS` (esa tabla es solo para claves de `properties`, y este campo no vive ahí).
   - Compatibilidad con guardados antiguos: no hace falta ninguna migración explícita en `core/state.js` (`loadComponents`) — con `component.interaccionesDesactivadas || []` en `isInteractionActive` ya se interpreta la ausencia del campo como "ninguna interacción desactivada", igual criterio que ya usan `mostrarTooltip`/`subirAlMoverInteractuar`/`oculto` con `?? valorPorDefecto` en sus puntos de lectura, sin necesidad de una función de migración dedicada.

3. **UI de la nueva sección** — `src/ui/componentModal.js`, pestaña "Generales", justo después de `generalContent.appendChild(groupField);` (línea ~395) y antes de `function validateId()`:
   - Importar `getInteractionsForType` de `../core/interactions.js`.
   - Construir un `fieldset.modal__section` con `legend.modal__section-title` = "Interacciones programadas" (mismo patrón ya usado en la app — `STYLE_BIBLE.md` sección 12.6 — no hay que documentar nada nuevo de estilo), añadido a `generalContent` solo si `getInteractionsForType(workingComponent.type).length > 0`.
   - Dentro, una fila por interacción: `label` con el nombre de la interacción (o un texto fijo "Al hacer click" si solo hay una — a decidir en implementación siguiendo el mockup `design_seccion-interacciones-programadas.html`, que usa "Al hacer click" como etiqueta de fila) + `select` con dos `option` ("Ninguna" y el `label` de la interacción), reutilizando el patrón de `select` simple ya usado para `groupSelect` (sin la parte de "crear nuevo").
   - Estado inicial del `select`: seleccionado el nombre de la interacción si `isInteractionActive(workingComponent, interaction.key)`, o "Ninguna" en caso contrario.
   - `change` listener: actualiza `workingComponent.interaccionesDesactivadas` añadiendo o quitando `interaction.key` del array (creando el array si no existe), mismo patrón imperativo ya usado por el resto de campos de esta modal (mutación directa de `workingComponent`, sin `updateComponent` hasta el "Aceptar" final).
   - Como esta sección depende del tipo y el tipo no cambia tras la creación (ver `ARCHITECTURE.md`: "el tipo, una vez elegido, no se puede cambiar"), no hace falta reconstruirla dinámicamente al cambiar de tipo — se calcula una sola vez al abrir la modal, igual que el resto de la pestaña "Generales".

4. **Efecto en Modo Juego** — `src/ui/componentRenderer.js` (`renderComponentsOnTable`):
   - Importar `isInteractionActive` de `../core/interactions.js`.
   - En el bloque `if (onDiceResult)` (línea ~903, dado) añadir `&& isInteractionActive(component, 'lanzar')` a la condición que añade la clase `dice--clickable` y registra el listener de `click` (líneas ~873 y ~903) — así, si la interacción está desactivada, el dado deja de mostrarse como clicable y el click no dispara nada, sin tocar el `dblclick` (`onDiceOpenResult`, que sigue funcionando igual).
   - En el bloque `if (onCartaFlip)` (línea ~1283, carta) añadir `&& isInteractionActive(component, 'voltear')` al mismo condicional que añade `carta--clickable` y el listener de `click`.
   - En el bloque `if (onMazoDraw)` (línea ~1440, mazo) añadir `&& isInteractionActive(component, 'sacarCarta')` al mismo condicional que añade `mazo--clickable` y el listener de `click`.
   - No se toca `modes/play/playMode.js`: los callbacks `onDiceResult`/`onCartaFlip`/`onMazoDraw` que le pasa a `renderComponentsOnTable` siguen siendo los mismos; el filtrado ocurre dentro de `componentRenderer.js`, por componente, que es donde ya se decide si se registra el listener.

## Orden de implementación

1. `src/core/interactions.js` (registro + helpers).
2. `src/core/component.js` (`createComponent`, `syncCopyWithOriginal`).
3. `src/ui/componentModal.js` (sección nueva en "Generales").
4. `src/ui/componentRenderer.js` (condicionar los tres listeners de click existentes).
