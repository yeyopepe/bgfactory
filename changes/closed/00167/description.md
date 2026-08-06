- **Nombre**: Distintivo visual de "Copia" en modo edición
- **Código**: 00167
- **Tipo**: change
- **Fecha creación**: 2026-08-06

## Prompt original del usuario

incluir un distintivo visual en el modo edición para identificar los elementos que son copias de otros

## Descripción completa

En modo edición, cualquier elemento de la mesa que sea una "Copia" vinculada a otro elemento (mediante la funcionalidad ya existente de "Copiar" del panel de componentes) debe mostrar sobre sí mismo, de forma permanente, un pequeño distintivo visual que permita identificarlo a simple vista como copia, sin necesidad de abrirlo ni de consultar el panel lateral.

- El distintivo se muestra siempre que el elemento sea una copia, no solo al pasar el ratón por encima o al seleccionarlo — igual que ya ocurre hoy con los distintivos existentes de "Bloqueado" y "Oculto".
- Solo es visible en modo edición. En modo juego no se muestra ningún distintivo de este tipo.
- Aplica a cualquier tipo de elemento que pueda ser copia (no hay restricción por tipo).
- Un elemento puede ser copia, estar bloqueado y estar oculto a la vez; los tres distintivos deben poder convivir sobre el mismo elemento sin solaparse entre sí ni con la etiqueta identificativa que ya muestra el tipo/id del elemento.
- El distintivo es solo visual (un icono), sin texto ni información adicional al pasar el ratón por encima.
- El distintivo se muestra con fondo rojo e icono blanco, a diferencia de los distintivos de "Bloqueado"/"Oculto" (fondo oscuro neutro, icono blanco), para distinguirse a simple vista.
- Además, cuando un elemento que es copia está seleccionado o bajo el cursor, el contorno discontinuo y la etiqueta identificativa que ya se muestran para cualquier elemento seleccionado cambian de azul (color estándar) a rojo — mismo rojo que el icono del distintivo — para reforzar de un vistazo que se trata de una copia. En el resto de elementos (no copias) ese contorno y etiqueta se mantienen en azul, sin cambios.

### Preguntas de alcance resueltas

- **¿Dónde se coloca respecto a los distintivos ya existentes?** En la esquina del elemento que queda libre (las otras tres ya están en uso: identificación de tipo/id, bloqueado, oculto).
- **¿Se toca también el listado de componentes del panel lateral?** No, ese listado ya distingue las copias con un ✓ en su propia columna; este cambio se limita a la representación del elemento sobre la mesa.
- **¿Qué icono representa "copia"?** Dos cuadrados superpuestos, mismo trazo/tamaño que los iconos ya usados para "Bloqueado" (candado) y "Oculto" (ojo tachado), pero con el círculo de fondo en rojo (en vez del fondo oscuro neutro de esos dos) y el icono en blanco.
- **¿De qué color es el rojo del distintivo y de la selección de una copia?** El mismo tono rojo para ambos casos (fondo del distintivo, contorno de selección y etiqueta identificativa de una copia).

## Apuntes técnicos

- El modelo de componente ya distingue una copia mediante `copyOf: string | null` (`ARCHITECTURE.md`, sección "Copias vinculadas", cambio 00097).
- Ya existen dos insignias permanentes análogas en modo edición, pintadas por `ui/componentRenderer.js`: `.component-lock-badge` (candado, esquina superior derecha, activa con el parámetro `showLockIndicator` de `renderComponentsOnTable`) y `.component-hidden-badge` (ojo tachado, esquina inferior derecha, activa con `showHiddenIndicator`) — ambas círculo 18px, fondo `rgba(0,0,0,.55)`, icono en `var(--text-light)`, `pointer-events: none`, visibles de forma permanente mientras la condición se cumpla, solo pasadas por `modes/edit/editMode.js` (en `modes/play/playMode.js` no se pasan estos parámetros). Ver `STYLE_BIBLE.md` sección 12.3.
- La esquina superior izquierda la ocupa `.component-id-label` (etiqueta identificativa con tipo/id), visible solo en `:hover`/selección — no en juego constante como las otras dos.
- La esquina inferior izquierda es la única de las cuatro aún libre: es donde debería ir la nueva insignia (`.component-copy-badge` o nombre análogo), siguiendo el mismo patrón que `showLockIndicator`/`showHiddenIndicator` (p. ej. un nuevo parámetro `showCopyIndicator` en `renderComponentsOnTable`, activado solo desde `modes/edit/editMode.js`).
- El panel "Componentes" (`ui/componentList.js`) ya tiene una columna `component-list__copy-cell` que muestra `✓` cuando `component.copyOf` es truthy — no requiere cambios.
- El contorno discontinuo de selección/hover (`outline: 2px/3px dashed var(--accent-blue)`) y el fondo de `.component-id-label` (`var(--accent-blue-dark)`) están duplicados por cada tipo de componente en `src/styles/main.css` (bloques `.text-box--selectable`, `.board--selectable`, `.tablero-personalizado--selectable`, `.dice--selectable`, `.document-viewer--selectable`, `.carta--selectable`, todos con la misma regla `outline-color`/fondo). Para que una copia muestre ambos en rojo hace falta un selector adicional condicionado a que el componente sea copia (p. ej. un modificador `--copy` añadido por `ui/componentRenderer.js` cuando `component.copyOf` es truthy) repetido en los mismos seis bloques, o una regla más genérica que los cubra a todos sin duplicar por tipo — a valorar por `ms-how`.
- El proyecto ya tiene un token rojo en `:root` (`--error: #d32f2f`, "estados de error y acciones destructivas") — mismo tono a reutilizar aquí según la sección 2 de `STYLE_BIBLE.md` ("nunca hardcodear un color que ya tenga token"), aunque semánticamente no es un error: si `ms-how` prefiere no sobrecargar `--error` con este significado adicional, valorar un token nuevo dedicado (p. ej. `--copy-indicator`) con el mismo valor u otro rojo, dejando constancia del motivo.
