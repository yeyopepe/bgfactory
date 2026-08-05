- **Fecha creación**: 2026-08-05

## (a) Anotaciones funcionales

- Fuera de alcance: no se toca el panel flotante "Grupos" del modo edición en tamaño, redimensionado ni scroll — solo se reordena. No se toca tampoco el panel "Recursos" en tamaño/scroll, solo su orden.
- Fuera de alcance: no se ordena por ningún otro criterio (tipo de recurso, número de elementos de un grupo, etc.) — solo por nombre.
- Duda resuelta con el usuario (ronda de validación de la maqueta): el límite de filas visibles en la lista de checkboxes de "Grupos" (modal de componente) se reduce de 8 a **3**, tras revisar la maqueta `design_generales-grupos-checkboxes-scroll.html`.
- Nota de contexto: esta entrada (00141) se documentó antes de que se implementara y cerrara el cambio 00142 (`accionClickDerecho`, ajeno a este alcance). La solución de abajo está basada en el estado real y actual del código, no en el que había cuando se escribió `description.md`.

## (b) Solución técnica

1. **Nuevo módulo `src/core/textSort.js`** — utilidad pura y genérica, mismo criterio de granularidad que otros módulos de `core/` (`colorUtils.js`, `textBoxLayout.js`): expone `sortByName(items)`, que devuelve una copia nueva del array (`[...items]`) ordenada por `item.name` con `localeCompare(b.name, 'es', { sensitivity: 'base' })` (insensible a mayúsculas y a tildes — mismo resultado práctico que combinar `toLowerCase()` + quitar diacríticos, pero en una sola llamada nativa). Reutilizada por los tres puntos de abajo, para que el criterio de orden sea idéntico en los tres sitios sin duplicar lógica.

2. **`src/ui/componentModal.js` — sección "Grupos" de la pestaña "Generales"**:
   - Importar `sortByName` de `core/textSort.js`.
   - En `populateGroupCheckboxes()` (línea ~355), iterar `sortByName(getGroups())` en vez de `getGroups()` sin ordenar.
   - **Separar la fila "+ Crear nuevo grupo…" (`createItem`) de la zona con scroll**: hoy `createItem` se añade dentro del mismo contenedor `groupCheckboxList` que los checkboxes (línea 386), así que si se le pone `max-height`/`overflow-y` a `groupCheckboxList` esa fila también scrollearía y podría quedar oculta. Hay que sacarla a un contenedor hermano fuera de la zona de scroll:
     - Crear un nuevo `<div>` (p.ej. `groupCheckboxScroll`) que envuelva únicamente el bucle de checkboxes (no `createItem`), y aplicarle una clase CSS nueva (p.ej. `.modal__section-scroll` o similar, ver tarea 5) en vez de `max-height`/`overflow-y` inline.
     - `groupCheckboxList` pasa a ser un contenedor sin estilo de scroll propio, con dos hijos: el nuevo `groupCheckboxScroll` (checkboxes) y `createItem` (fuera de él) — o, más simple, renombrar conceptualmente: el `<div>` que hoy es `groupCheckboxList` pasa a ser solo la zona con scroll de los checkboxes, y `createItem` se mueve a un `appendChild` directo sobre `groupSection` (después de `groupCheckboxList`, antes de `newGroupRow`), en vez de dentro de `populateGroupCheckboxes()`.
   - El resto del flujo (`newGroupRow`, `validateNewGroupName`, `newGroupCreateBtn`) no cambia.

3. **`src/ui/groupList.js` — panel flotante "Grupos"**:
   - Importar `sortByName` de `../core/textSort.js`.
   - En `renderBody(body, groups, components, {...})` (línea ~11), ordenar `groups` con `sortByName(groups)` antes de iterarlos para pintar las filas (no antes: el `if (groups.length === 0)` de la línea 14 no necesita el array ordenado, solo su longitud). No se toca `.group-panel__body` ni el redimensionado.

4. **`src/ui/resourceList.js` — panel flotante "Recursos"**:
   - Importar `sortByName` de `../core/textSort.js`.
   - En `renderBody(body, resources, {...})` (línea ~37), ordenar `resources` con `sortByName(resources)` justo al entrar en la función (antes de comprobar `resources.length === 0`, para que el mensaje de "no hay resultados" siga funcionando igual) — así cubre de un solo punto tanto el render inicial (línea ~285, `displayedResources` ya filtrado) como el re-render al escribir en el cuadro de filtro (línea ~269, `filtered`), sin duplicar la llamada a `sortByName` en cada call site.

5. **`src/styles/main.css`** — nueva regla para la zona de checkboxes de grupos con scroll (p.ej. `.group-checkbox-list__scroll` o el nombre de clase elegido en la tarea 2): `max-height` aproximado a 3 filas con el espaciado actual de `.modal__field--checkbox`/`.modal__field` (`margin-bottom: 1rem` cada fila, ver línea ~468-477) — unos `6.5rem` (~104px), y `overflow-y: auto`. Mismo patrón ya usado en el proyecto para topar listas cortas por altura aproximada en vez de por cálculo exacto de N filas (ver `.element-selection-group__list`, `STYLE_BIBLE.md` sección 12.5, tope `12rem`).

## (c) Cambios de arquitectura

En `design/docs/ARCHITECTURE.md`, en el párrafo que describe la sección "Grupos" de `ui/componentModal.js` (añadido en el cambio 00139) y en el párrafo que describe el panel flotante "Grupos" (sección 3), añadir una frase indicando: (1) que los grupos se listan ordenados alfabéticamente (insensible a mayúsculas/tildes, `core/textSort.js` → `sortByName`) en ambos sitios y en el panel "Recursos", en vez del orden de `getGroups()`/`getResources()`; (2) que la lista de checkboxes de "Grupos" en la modal de componente limita a 3 filas visibles con scroll vertical interno (la fila "+ Crear nuevo grupo…" queda fuera del scroll, siempre visible), ajustándose a su contenido real con menos de 3 grupos.

## (d) Cambios en estilo

En `design/docs/stylebible/STYLE_BIBLE.md`, sección 12.6 ("Secciones dentro de pestañas de propiedades") o como nota junto a la 12.5 ("Lista de selección agrupada"), documentar la nueva variante: una zona interna con scroll propio (`max-height` + `overflow-y: auto`, tope aproximado por número de filas en vez de cálculo exacto) dentro de un `.modal__section`, usada por primera vez en la sección "Grupos" de `ui/componentModal.js` (cambio 00141) — reutilizable por cualquier sección futura de una pestaña de propiedades que necesite el mismo patrón (lista potencialmente larga dentro de un recuadro con borde, con algún elemento de acción fijo fuera del scroll).
