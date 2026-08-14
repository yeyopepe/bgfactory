- **Nombre**: Selección de grupo con contorno diferenciado y edición individual habilitada
- **Código**: 00201
- **Tipo**: change
- **Fecha creación**: 2026-08-13

## Descripción completa

En modo edición, cuando la selección de un componente que pertenece a un "Grupo" (cambio 00193) hace que se seleccione el grupo entero, la mesa debe distinguir visualmente el elemento que se ha clicado de verdad de los demás miembros del grupo que se han sumado a la selección automáticamente:

- El elemento clicado directamente conserva el contorno de selección habitual (azul, o rojo si además es una Copia vinculada — sin cambios respecto a hoy).
- El resto de miembros del grupo (sumados por pertenecer al mismo grupo, no clicados directamente) muestran un contorno gris oscuro en su lugar, para indicar que forman parte de un todo sin ser el objetivo directo del click. Se reutiliza el gris ya existente en la paleta de la app en vez de introducir un color nuevo.
- Esta distinción aplica solo en la mesa (representación visual de los componentes). En el panel flotante "Componentes", todas las filas del grupo (incluida la fila propia del grupo) se siguen resaltando por igual, sin este matiz — el mecanismo visual ahí es un fondo de fila, no un contorno.
- Con varios elementos/grupos seleccionados a la vez (Ctrl+click sobre varios), cada elemento clicado directamente mantiene su propio contorno habitual; solo sus compañeros de grupo no clicados directamente se ven en gris.
- Caso sin un "clic" concreto sobre un miembro individual (seleccionar de golpe todos los miembros de una Etiqueta desde el panel "Etiquetas", que ya selecciona el conjunto completo): en ese caso ningún miembro de un grupo capturado así tiene un contorno habitual — todos los que pertenezcan a un grupo se muestran en gris, al no haber habido un objetivo de click individual.

Además, para un componente que pertenece a un grupo, se ajustan las acciones disponibles en su fila del panel "Componentes":

- **Se revierte parcialmente la restricción del cambio 00193**: "Editar" y "Eliminar" pasan a estar **habilitados** de nuevo — se puede editar y borrar ese componente individualmente aunque siga perteneciendo al grupo, sin necesidad de desagrupar antes.
- "Clonar" y "Copiar" pasan a estar **deshabilitados** mientras el componente pertenece a un grupo (antes estaban habilitados con normalidad).
- El doble click sobre el componente en la mesa para abrir su modal de edición **sigue bloqueado** — el desbloqueo de edición es solo a través del botón "Editar" del panel, no desde la mesa.
- El menú contextual de modo edición **no cambia**: sigue sin mostrarse cuando la selección mezcla un grupo con cualquier otro elemento, exactamente igual que ya definió el cambio 00193.
- Sin cambios en: la disolución automática del grupo al quedar con ≤1 miembro tras un borrado (00193, sigue aplicando igual ahora que "Eliminar" es más accesible); el modelo de datos de agrupación; el alcance exclusivo a modo edición.

### Preguntas planteadas y resueltas

- ¿El doble click en la mesa se reactiva también para editar un miembro agrupado? → No, de momento no se reactiva; solo el botón "Editar" del panel.
- ¿Alguna acción del menú contextual se desbloquea para estos casos? → No, el menú contextual sigue sin ser visible cuando la selección mezcla un grupo con otro elemento.
- ¿El matiz de color (contorno habitual vs gris) aplica también al resaltado de fila del panel "Componentes"? → No, solo a la mesa; el panel sigue resaltando todas las filas del grupo por igual.
- ¿Cómo se reparte el contorno con varios grupos/elementos sueltos seleccionados a la vez? → Cada elemento clicado directamente mantiene su contorno habitual; solo sus compañeros de grupo no clicados se ven en gris.
- ¿Qué pasa si la selección del grupo viene de clicar una fila de Etiqueta (sin un clic individual sobre ningún miembro)? → Ningún miembro tiene entonces el contorno habitual; todos los que pertenezcan a un grupo se muestran en gris.

## Apuntes técnicos

- Contexto ya reunido en el cambio 00193 (implementado): `groupId` en el modelo de componente (`core/component.js`), selección atómica de grupo (`getSelectionUnit`/`toggleSelect`/`handleComponentContextMenu`/`selectTag` en `modes/edit/editMode.js`), fila sintética de grupo en `ui/componentList.js`, y el contorno de selección por tipo de componente en `src/styles/main.css` (`.<tipo>--selectable.<tipo>--selected { outline: 3px dashed var(--accent-blue); outline-offset: 4px; }`, con variante `is-copy` que cambia `outline-color` a `var(--error)` — mismo patrón a replicar para la nueva variante "miembro de grupo no clicado", posiblemente con una clase nueva tipo `is-group-passenger` aplicada junto a `--selected`, análoga a `is-copy`).
- Para distinguir "elemento clicado" de "resto del grupo sumado automáticamente" hace falta que `editMode.js` guarde, además del conjunto completo `selectedComponentIds`, qué id(s) fueron el objetivo directo de cada click (no solo qué ids están seleccionados) — hoy no existe ese dato, todo pasa por el Set plano `selectedComponentIds`. Estructural para `ms-how`, no decidido aquí.
- Los tokens de color de la app están en `design/docs/style/01-tokens-visual.md` (`--text-muted: #666666`) — no hay hoy ningún gris "oscuro" dedicado a contornos; se propone reutilizar uno ya existente en vez de crear uno nuevo (a confirmar/ajustar por `ms-how` si el contraste no resulta suficiente sobre `--bg-table: #c2c2c2`).
- Botones de fila de componente en `ui/componentList.js` (`renderBody`): hoy `editButton.disabled = component.groupId != null` (00193) — hay que invertir esa condición para "Editar", y añadir el mismo tipo de condición a `cloneButton`/`copyButton` (hoy sin ninguna comprobación de `groupId`). "Eliminar" ya está habilitado hoy para un componente agrupado, sin cambios ahí.
