- **Nombre**: Sección "Disposición" configurable y reorganización del modal de propiedades del mazo
- **Código**: 00207
- **Tipo**: change
- **Fecha creación**: 2026-08-14

## Descripción completa

En el modal de "Editar propiedades del componente", pestaña "Específicas" de un mazo, los campos se reorganizan en dos secciones con título, y se añaden dos campos nuevos.

**Sección "Disposición"** agrupa:
- **Forma** (ya existente, sin cambios de comportamiento): Rectangular/Circular.
- **Orientación** (ya existente, sin cambios de comportamiento): Vertical/Horizontal, oculta cuando la forma es circular.
- **Disposición carta revelada** (nuevo): elige en qué lado del mazo se descubren las cartas — Arriba, Abajo, Derecha o Izquierda. Hoy ese lado está fijo siempre a la derecha; pasa a ser configurable. Por defecto queda en "Derecha", igual que el comportamiento actual, así que un mazo ya existente no cambia su aspecto hasta que alguien edite este campo explícitamente. A diferencia de "Orientación", este campo se muestra también cuando la forma es circular: la zona donde se revela la carta puede colocarse en cualquiera de los 4 lados independientemente de la forma del mazo. Cambiar este campo no mueve las cartas que ya se hubieran sacado del mazo anteriormente — solo afecta a partir de ese momento.
- **Texto carta revelada** (nuevo): texto libre que se muestra dentro del recuadro donde aparece la carta al sacarla del mazo. Por defecto "Carta revelada" (hoy es un texto fijo, igual para todos los mazos). Se puede dejar vacío: en ese caso el recuadro se muestra sin ningún texto, sin aviso ni restricción.

**Sección "Imagen"** agrupa los controles ya existentes para la imagen propia del mazo (vista previa, "Elegir imagen…", "Ajustar imagen…", "Quitar imagen"), sin cambios de comportamiento — solo pasan a estar visualmente agrupados bajo esta sección.

**Fuera de cualquier sección**, igual que hoy: el contador de "N cartas" (arriba del todo) y el botón "Ver contenido del mazo" (abajo del todo).

Estos campos solo son editables en modo edición, igual que el resto de la pestaña "Específicas", y se guardan como el resto de propiedades del mazo (mismo alcance de datos que hoy, sin distinción de usuario o sesión).

## Apuntes técnicos

- `core/deck.js` → `getMazoRevealZoneRect(mazo)` calcula hoy siempre el rectángulo de la zona de revelado pegado al lado derecho del mazo (`x: mazo.x + width + MAZO_REVEAL_GAP`, gap fijo `MAZO_REVEAL_GAP = 20`). Debe generalizarse para calcular ese rectángulo en los 4 lados según la nueva propiedad de disposición, manteniendo el mismo gap. Esta función la usa tanto el pintado decorativo de la zona (`ui/componentRenderer.js` → `renderMazoRevealZone`, incluido el redibujado en vivo durante el arrastre del mazo) como el cálculo de dónde aparece la carta al sacarla (`computeSacarCartaDeMazo`).
- `ui/componentRenderer.js` → `renderMazoRevealZone`: el texto fijo `zone.textContent = 'Carta revelada'` pasa a leerse de la nueva propiedad del mazo.
- Ficheros con los defaults/tipos y el formulario: `ui/componentModal.js` — `DEFAULT_MAZO_PROPERTIES`, patrón de listas de opciones ya usado por `MAZO_ORIENTACIONES`/`MAZO_FORMAS` (aplicable a la nueva lista de opciones de disposición), y `renderMazoSpecificFields` (reestructuración en `fieldset.modal__section` + `legend.modal__section-title`, patrón ya usado en otros tipos de componente dentro del mismo fichero).
- Mazos guardados sin las propiedades nuevas se resuelven con fallback al valor por defecto al leer (mismo patrón que otras properties opcionales del proyecto), sin necesidad de migración explícita en `core/state.js`.
- No requiere cambios en `core/persistence.js` ni `core/fileExport.js`: las properties de un componente se serializan de forma genérica, no hay lista explícita por tipo (`design/docs/architecture/INDEX.md` §8).
