- **Nombre**: Orden alfabético y límite de filas visibles en la sección "Grupos" de la modal de componente, y orden alfabético en Recursos
- **Código**: 00141
- **Tipo**: change
- **Fecha creación**: 2026-08-05

## Prompt original del usuario

La lista de grupos puede llegar a crecer bastante así que, en la sección de grupos, pon un límite de 8 grupos visibles y aplica scroll vertical para el resto. También ordénalos por orden alfabético.
En la ventana con la lista de recursos aplica también una ordenación por orden alfabético

## Descripción completa

Dos ajustes de listado en modo edición, pensados de cara a que las colecciones de grupos y recursos puedan crecer bastante con el tiempo. Corrección de alcance tras una primera vuelta: el límite de filas visibles + scroll es para la sección "Grupos" **de la modal de propiedades de un componente** (lista de checkboxes introducida en el cambio 00139, pestaña "Generales"), no para el panel flotante "Grupos" del modo edición — ese panel flotante no cambia salvo el orden alfabético.

### 1. Sección "Grupos" de la modal de propiedades de un componente — límite de filas visibles + orden alfabético

- La lista de checkboxes de grupos (pestaña "Generales" de la modal de un componente, ver [Grupos, organización de elementos por nombre](#grupos-organización-de-elementos-por-nombre)) pasa a mostrar como máximo 3 checkboxes a la vez; si hay más de 3 grupos, aparece scroll vertical dentro de esa lista para ver el resto. La fila final "+ Crear nuevo grupo…" (y el campo de texto que aparece al activarla) queda siempre visible, fuera de la zona con scroll.
- Con 3 grupos o menos, la lista se ajusta a su contenido real, sin hueco vacío ni scroll.
- Los grupos se listan ordenados alfabéticamente por nombre (insensible a mayúsculas y a tildes, mismo criterio de comparación que ya usa el proyecto para detectar nombres de grupo duplicados), en vez del orden actual (el que devuelve `getGroups()`). El orden alfabético es puramente de visualización: no reordena ni afecta a cómo se guardan/exportan los grupos, ni a cómo se guarda `grupoIds` en el componente.

### 2. Panel flotante "Grupos" del modo edición — sin cambios salvo orden alfabético

- El panel flotante "Grupos" (listado en tabla, con columnas Nombre/Elementos/Acciones, redimensionable a mano) no cambia de comportamiento ni de tamaño: sigue teniendo su altura fija/redimensionable actual, sin límite de filas ni scroll nuevo.
- Su única modificación es que las filas pasan a listarse ordenadas alfabéticamente por nombre (mismo criterio que el punto 1), en vez del orden actual.

### 3. Panel flotante "Recursos" — orden alfabético

- Los recursos (imágenes y tipografías mezclados, sin agrupar por tipo) se listan ordenados alfabéticamente por nombre, mismo criterio de comparación que en Grupos (insensible a mayúsculas/tildes), en vez del orden actual.
- Se aplica tanto a la lista completa como al resultado ya filtrado por el cuadro de filtro de texto existente.
- Igual que en Grupos, es puramente de visualización: no reordena el array de estado ni afecta a export/import.
- No se pide ningún cambio de altura/límite de filas en este panel.

### Preguntas de alcance resueltas

- **Criterio de orden alfabético**: insensible a mayúsculas y a tildes (mismo criterio que ya usa el proyecto para comparar nombres, p. ej. al validar que un nombre de grupo no esté duplicado). Se aplica por igual a la lista de checkboxes de la modal de componente, al panel flotante "Grupos" y al panel "Recursos".
- **Alcance del límite de 3 + scroll**: exclusivo de la lista de checkboxes de grupos dentro de la modal de propiedades de un componente. El panel flotante "Grupos" del modo edición no se toca en tamaño/scroll, solo se reordena.

### Definición visual de alto nivel

En la pestaña "Generales" de la modal de un componente, la sección "Grupos" (lista de checkboxes dentro de un recuadro con borde, ver cambio 00139) pasa a mostrar sus checkboxes ordenados alfabéticamente y, cuando hay más de 3 grupos, con scroll vertical interno limitado a esa altura — la fila "+ Crear nuevo grupo…" queda siempre visible debajo, sin desplazarse. Con 3 grupos o menos, la lista se ajusta a su alto real. El panel flotante "Grupos" y el panel "Recursos" no cambian de aspecto ni de tamaño, solo el orden en que aparecen sus filas.

## Apuntes técnicos

- `src/ui/componentModal.js`: la sección "Grupos" de la pestaña "Generales" (introducida en el cambio 00139) es un `fieldset.modal__section` con un `<div>` interno `groupCheckboxList` poblado por `populateGroupCheckboxes()`, que itera `getGroups()` sin ordenar y añade al final el ítem "+ Crear nuevo grupo…" (`createItem`) dentro del mismo contenedor `groupCheckboxList`. Para el límite de 3 + scroll sin afectar a la fila de crear grupo, esta última tendría que quedar fuera de la zona con `max-height`/`overflow-y` (o separarse en su propio contenedor hermano, fuera del que sí tiene scroll).
- `src/ui/groupList.js` / `src/modes/edit/editMode.js`: `renderGroupList(groupListContainer, getGroups(), getComponents(), {...})` — `getGroups()` se pasa tal cual, sin ordenar; aplicar aquí el mismo orden alfabético, sin tocar `.group-panel__body` (`src/styles/main.css` línea ~2144, `height: 320px` fija) ni el comportamiento de redimensionado existente.
- `src/ui/resourceList.js`: `renderBody(body, resources, {...})` recibe `resources` ya filtrado por `matchesFilter` antes de pintarse (cuadro de filtro de texto existente); el orden alfabético debe aplicarse sobre el resultado ya filtrado (o antes, es equivalente).
- Ningún cambio de arquitectura de datos: `core/state.js` sigue devolviendo `groups`/`resources` en su orden interno (inserción); el ordenado es solo de presentación en la capa `ui/*`.
- Criterio de comparación insensible a mayúsculas/tildes ya usado en el proyecto: `core/group.js` → `isGroupNameTaken` (recorta y compara en minúsculas, sin normalizar tildes) y `ui/resourceList.js` → `normalize()` (minúsculas + `normalize('NFD')` para quitar diacríticos, usado por el filtro de texto) — al implementar el orden, decidir si reutilizar `normalize()` de `resourceList.js` o `localeCompare` con opciones de sensibilidad, para que el criterio sea consistente en los tres sitios (checklist de la modal, panel Grupos, panel Recursos).
- Referencia de patrón ya existente para scroll con tope aproximado por número de filas: `.element-selection-group__list` (`STYLE_BIBLE.md` sección 12.5), tope `12rem`.
