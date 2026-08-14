- **Nombre**: Voltear carta desde el menú contextual de Modo Edición
- **Código**: 00205
- **Tipo**: change
- **Fecha creación**: 2026-08-14

## Descripción completa

En Modo Edición, al pulsar el botón derecho sobre uno o varios elementos de la mesa se abre un menú contextual (ver "Menú contextual de elemento en modo edición"). Se añade a ese menú una nueva acción "Voltear carta", en la misma sección donde ya vive "Añadir a etiqueta".

- **Cuándo aparece**: la fila solo se muestra cuando todos los elementos afectados por el menú en ese momento (la selección múltiple vigente, o el grupo completo si el click derecho actúa sobre un grupo) son cartas. Si la selección mezcla cartas con cualquier otro tipo de elemento, la fila no aparece — mismo criterio que ya siguen otras acciones específicas de este menú.
- **Qué hace**: al pulsarla, cada carta afectada da la vuelta a sí misma — pasa de mostrar su cara frontal a la trasera, o de la trasera a la frontal, según la cara que tuviera cada una en ese momento. Con varias cartas seleccionadas, cada una voltea de forma independiente según su propio estado (no se fuerza a todas a terminar mostrando la misma cara). Es el mismo efecto que ya provoca hacer click sobre una carta en Modo Juego, solo que aquí se dispara desde esta nueva acción de menú, sin necesidad de cambiar a Modo Juego.
- **Qué no cambia**: esta acción no afecta a si la carta está bloqueada, oculta, ni a ninguna otra propiedad suya — solo a la cara que muestra.
- **Copias**: si alguna de las cartas afectadas es una Copia vinculada a un original, el volteo se aplica igual sobre ella, sin ningún comportamiento especial ni afectar a la sincronización con el original (la cara mostrada de una copia ya es independiente de su original hoy).
- El menú se cierra igual que el resto de sus acciones: al elegirla, al hacer click fuera, o con ESC.

## Apuntes técnicos

- Handler a modificar: `handleComponentContextMenu` en `src/modes/edit/editMode.js:562`, añadiendo la nueva fila a la sección `specificItems` (línea ~664).
- Icono: seguir el mismo patrón de SVGs locales 24x24 ya usado en ese fichero (`createCloneIcon`, `createHiddenIcon`, etc., `editMode.js:38-96`) — no existe todavía un icono de "voltear/flip" reutilizable, hay que crear uno nuevo con el mismo estilo.
- Volteo de cada carta afectada: `replaceComponent(c.id, updateComponent(c, { properties: { caraActual: c.properties.caraActual === 'frontal' ? 'trasera' : 'frontal' } }))`, mismo criterio que ya usa `onCartaFlip` en `src/modes/play/playMode.js:174-175`.
- Texto de la fila: "Voltear carta", reutilizando el texto que el proyecto ya usa para esta acción en `src/core/interactions.js` y en la sección "Interacciones" del menú contextual de Modo Juego.
- `properties.caraActual` ya está en `NON_SYNCED_PROPERTY_KEYS` (`src/core/component.js:89`), así que no hace falta tratamiento especial para copias vinculadas.
- Actualizar `design/docs/features/027-menu-contextual-de-elemento-en-modo-edicion.md` para documentar la nueva fila y su condición de visibilidad.
