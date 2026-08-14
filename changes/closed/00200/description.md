
- **Nombre**: Columna Tipo en mayúsculas
- **Código**: 00200
- **Tipo**: fast
- **Fecha creación**: 2026-08-13

## Descripción completa

En el panel flotante de componentes del modo edición, la columna "Tipo" de la tabla mostraba el tipo de cada componente en minúscula (carta, dado, documento, mazo, tableroPersonalizado, tableroSimple, texto), salvo el valor sintético "Grupo" (fila que representa un grupo de componentes), que ya aparecía capitalizado.

Ahora el texto de esa columna se muestra siempre con la primera letra en mayúscula (Carta, Dado, Documento, Mazo, TableroPersonalizado, TableroSimple, Texto, Grupo), igual que ya se hizo para el desplegable de filtro de esa misma columna en el cambio 00199.

Es un cambio puramente visual: el valor real del tipo de componente, el filtro de texto libre y el filtro por columna siguen funcionando igual que antes (comparan contra el valor sin capitalizar).

## Apuntes técnicos

- En `src/ui/componentList.js`, la celda de tipo se rellena en dos sitios (fila de grupo sintética y fila de componente normal): `typeCell.textContent = component.type` en ambos casos. Se reutilizó la función local `capitalize` (introducida en el cambio 00199 para el filtro) también aquí: `typeCell.textContent = capitalize(component.type)`.
- No se tocó `COMPONENT_LIST_COLUMN_DEFS` (`getValue`) ni `matchesColumnFilters`/`matchesQuery`: siguen comparando contra `component.type` sin capitalizar, así que el filtrado no cambia de comportamiento.

## Cambios aplicados

- `src/ui/componentList.js`: las dos asignaciones `typeCell.textContent = component.type` (fila de grupo y fila de componente) pasan a `typeCell.textContent = capitalize(component.type)`.
