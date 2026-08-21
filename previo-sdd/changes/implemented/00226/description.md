- **Name**: El desplegable "Exportar" queda tapado por otros elementos
- **Code**: 00226
- **Type**: fast
- **Creation date**: 2026-08-20

## Full description

El desplegable "Exportar" de la barra superior del modo edición (introducido en el cambio 00171) debe mostrarse siempre por encima de cualquier otro elemento de la pantalla al abrirse. Antes de esta corrección quedaba tapado por otros elementos de la interfaz (por ejemplo, los paneles flotantes de componentes, recursos o etiquetas), en vez de mostrarse siempre en primer plano. Ahora se muestra siempre por delante de todo, incluidas las notificaciones ("toast"), que eran hasta ahora el elemento con mayor prioridad visual del proyecto.

## Technical notes

`.export-menu` (`src/styles/main.css`) tenía `z-index: 10`. Se revisaron todos los `z-index` estáticos del CSS (máximo previo: `1100`, `.toast`) y el `z-index` dinámico de los paneles flotantes (`applyPanelStackOrder`, `src/modes/edit/editMode.js`, rango `15`-`17`). Se sube `.export-menu` a `z-index: 1200`, por encima de cualquier otro valor existente en el proyecto.

## Applied changes

- `src/styles/main.css` — `.export-menu`: `z-index` cambiado de `10` a `1200`, con comentario explicando que es intencionalmente el valor más alto del proyecto (por encima de `.toast`, `1100`).
