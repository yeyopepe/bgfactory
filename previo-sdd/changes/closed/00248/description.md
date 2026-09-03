- **Name**: Traducir el nombre de tipo en las celdas de la lista de componentes
- **Code**: 00248
- **Type**: fast
- **Creation date**: 2026-09-03

## Full description

Seguimiento del cambio 00246. En el panel de lista de componentes del modo edición, la columna "Tipo" de la tabla sigue mostrando el valor interno del tipo con la primera letra en mayúscula (por ejemplo "Carta", "TableroSimple", "TableroPersonalizado", "Dado", "Mazo"), en vez del nombre de tipo traducido al idioma activo.

El filtro de esa columna ya se corrigió en 00246, pero las celdas de la lista en sí no, así que quedan inconsistentes: el desplegable de filtro muestra el nombre traducido ("Card/Token", "Simple board", …) y la fila de al lado muestra el valor crudo en español.

Las celdas deben mostrar el mismo texto de tipo traducido que el filtro y que el resto de la interfaz. Las filas sintéticas de grupo deben seguir mostrando su etiqueta "Grupo" / "Group".

El comportamiento funcional no cambia (ordenación y filtrado siguen igual): solo el texto que se ve en la columna "Tipo".

## Technical notes

- `src/ui/componentList.js`: hay dos asignaciones `typeCell.textContent = capitalize(component.type);` — una en la fila sintética de grupo y otra en la fila de componente. Deben pasar a usar el helper `formatTypeFilterLabel(component.type)` que ya existe en el archivo (añadido en 00246, envuelve `getComponentTypeLabel`, que devuelve el valor tal cual para tipos desconocidos → cubre las filas de grupo, cuyo `type` ya llega traducido vía `componentList.groupRowType`).
- Tras el cambio, la función local `capitalize` queda sin uso en el archivo: se elimina.
- Consistente con el patrón de traducción en el punto de consumo que documenta `previo-sdd/design/docs/architecture/010-internationalization-i18n.md`.

## Applied changes

- **`src/ui/componentList.js`**:
  - El helper `formatTypeFilterLabel` (añadido en 00246) se renombra a `formatTypeLabel`, ya que ahora lo usan tanto el filtro de columna como las celdas de la lista; su cuerpo (delegar en `getComponentTypeLabel`) y su comentario se actualizan en consecuencia. La def de la columna `tipo` pasa a `formatFilterLabel: formatTypeLabel`.
  - Las dos asignaciones `typeCell.textContent = capitalize(component.type)` (fila de grupo y fila de componente) pasan a `typeCell.textContent = formatTypeLabel(component.type)`.
  - Eliminada la función local `capitalize`, que ya no se usa.

Verificado: `node --check src/ui/componentList.js` y `python src/scripts/build.py` completan sin errores.
