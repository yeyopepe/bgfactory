- **Name**: Texto de "Export game (.json)" oscuro en modo juego
- **Code**: 00281
- **Type**: fast
- **Creation date**: 2026-09-15

## Full description

En el menú desplegable "Exportar" del modo juego, la primera opción ("Export game (.json)"), que es la única realmente activa (las otras dos están marcadas como "Coming soon"), se muestra con un color de texto oscuro que la hace parecer deshabilitada, en lugar de blanco como el resto de textos del menú sobre fondo oscuro.

En el modo edición, ese mismo menú y esa misma opción sí se muestran correctamente con el texto en blanco.

Se espera que "Export game (.json)" se vea con el texto en blanco en ambos modos, coherente con su estado real (activa y disponible).

## Technical notes

`.export-menu__item` (src/styles/main.css) no define un `color` propio: hereda el color de texto del contenedor donde se inserta el menú. En modo edición hereda blanco desde `.edit-toolbar` (que sí define `color: var(--text-light)`); en modo juego el menú cuelga de `#mode-switcher`, que no define ningún `color` heredable, así que el texto cae al color por defecto (oscuro). Fix: añadir `color: var(--text-light)` explícito a `.export-menu__item` para que no dependa de la herencia del contenedor.

## Applied changes

- `src/styles/main.css`: añadido `color: var(--text-light);` a la regla `.export-menu__item`, para que el texto de los ítems del menú de exportación sea siempre blanco, independientemente del color de texto heredado del contenedor (modo edición vs. modo juego).
