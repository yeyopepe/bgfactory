- **Nombre**: Filtro de Tipo en mayúsculas
- **Código**: 00199
- **Tipo**: fast
- **Fecha creación**: 2026-08-13

## Descripción completa

En el panel flotante de componentes del modo edición, la columna "Tipo" de la tabla tiene un filtro desplegable ("Filtrar" → "Todos" / valores). Los valores de ese desplegable aparecían con la primera letra en minúscula (carta, dado, documento, mazo, tableroPersonalizado, tableroSimple, texto), salvo el valor sintético "Grupo" (fila que representa un grupo de componentes), que ya aparecía capitalizado.

Ahora todos los valores del desplegable se muestran con la primera letra en mayúscula (Carta, Dado, Documento, Mazo, TableroPersonalizado, TableroSimple, Texto, Grupo), de forma consistente.

Es un cambio puramente visual, limitado al texto mostrado en las opciones de ese desplegable de filtro: el valor real usado internamente para filtrar no cambia, y el texto de la columna "Tipo" en las filas de la tabla tampoco cambia (sigue mostrando el valor tal cual, p.ej. "carta").

## Apuntes técnicos

- El desplegable de filtro lo genera `src/ui/columnHeaderMenu.js` (`openColumnHeaderMenu`), reutilizado también por `resourceList.js` y `tagList.js` a través de `src/ui/tableColumnMenu.js` (`attachColumnMenu`).
- Se añadió un parámetro opcional `formatFilterLabel(value)` en `openColumnHeaderMenu` (por defecto identidad) que transforma solo el texto mostrado en cada `<option>`, sin tocar `option.value` (que sigue siendo el valor real usado para filtrar).
- `attachColumnMenu` propaga `columnDef.formatFilterLabel` si existe.
- En `src/ui/componentList.js`, la definición de columna `tipo` (`COMPONENT_LIST_COLUMN_DEFS`) ahora incluye `formatFilterLabel: capitalize` (función local que capitaliza la primera letra). Ninguna otra columna de `componentList.js` ni las columnas de `resourceList.js`/`tagList.js` pasan este parámetro, así que su comportamiento no cambia.

## Cambios aplicados

- `src/ui/columnHeaderMenu.js`: añadido parámetro opcional `formatFilterLabel` a `openColumnHeaderMenu`, usado al fijar `option.textContent` (el `option.value` sigue siendo el valor real sin transformar).
- `src/ui/tableColumnMenu.js`: `attachColumnMenu` propaga `columnDef.formatFilterLabel` a `openColumnHeaderMenu` cuando la columna lo define.
- `src/ui/componentList.js`: añadida función local `capitalize`, y la definición de columna `tipo` ahora pasa `formatFilterLabel: capitalize`.
