- **Name**: Reordenar propiedades Visuales del Dado con nueva sección "Estilo"
- **Code**: 00221
- **Type**: change
- **Creation date**: 2026-08-19

## Full description

En la modal de edición de propiedades de un componente de tipo Dado, pestaña "Visuales", se reordenan las secciones y se agrupan los campos de estilo visual en una sección propia.

Orden actual:
1. Tamaño
2. Extrusión
3. Color del cuerpo (campo suelto)
4. Color de los números (campo suelto)
5. Tipo de fuente (campo suelto)

Nuevo orden:
1. **Tamaño** — sin cambios (Alto, Ancho, Mantener proporción).
2. **Estilo** (sección nueva, mismo tipo de recuadro con título que "Tamaño" y "Extrusión") — agrupa:
   - Color del cuerpo
   - Color de los números
   - Tipo de fuente (botón "Elegir tipografía" + nombre de la tipografía elegida, o "Por defecto")
3. **Extrusión** — sin cambios (Profundidad, Color de extrusión).

### Alcance

- Afecta únicamente a la pestaña "Visuales" del tipo de componente Dado. El resto de tipos de componente no cambian: mantienen su orden actual (Tamaño → Extrusión → sus secciones específicas).
- No se añade, quita ni renombra ningún dato: los tres campos agrupados ya existen tal cual hoy (mismas etiquetas, mismos controles, mismo comportamiento). El cambio es exclusivamente de disposición visual dentro de la modal.
- No afecta a la persistencia, al guardado a fichero, ni a ningún otro modo o pantalla de la app — es una reordenación interna de un modal de edición ya existente.

## Technical notes

- Fichero afectado: `src/ui/componentModal.js`.
- Hoy `sizeSection` se crea y se appendea a `visualContent` (~línea 638), `extrusionSection` se define justo después y se appendea (~línea 701). `renderDadoSpecificFields(container, visualContainer)` se invoca más tarde (~línea 1131) y dentro de ella (~líneas 1355-1499) appendea directamente a `visualContainer` (sin fieldset propio) los campos "Color del cuerpo", "Color de los números" y "Tipo de fuente", quedando en el DOM después de Extrusión.
- Para el nuevo orden, la sección "Estilo" (fieldset con legend "Estilo", mismo patrón que `sizeSection`/`extrusionSection`) debe crearse y appendearse a `visualContent` antes de `extrusionSection` (entre el append de `sizeSection` y la definición/append de `extrusionSection`), y los tres campos de estilo dentro de `renderDadoSpecificFields` deben appendearse a esa nueva sección en vez de directamente a `visualContainer`.
- No se ha detectado ninguna inconsistencia entre la documentación técnica (`design/docs/architecture/02-component-types.md`, tipo `'dado'`) y el código: las propiedades `colorCuerpo`, `colorNumeros` y `fuenteResourceId` ya están documentadas igual que en `DEFAULT_DADO_PROPERTIES`.
