- **Nombre**: Contador de elementos en el título de las listas de componentes y recursos
- **Código**: fast-contador-de-elementos-en-titulo-de-listas_20260724
- **Tipo**: fast
- **Fecha**: 2026-07-24

## Prompt original del usuario

en la barra de títulos de la lista de componentes y recursos, añade entre paréntesis el número de elementos que se mostrando (sin filtrar o filtrados)

## Descripción completa

Se pedía que el título de los paneles flotantes "Componentes" y "Recursos" (modo edición) mostrara, entre paréntesis, cuántos elementos se están viendo en ese momento — el total si no hay filtro activo, o el número de coincidencias si el usuario ha escrito algo en el filtro.

Ahora el título de cada panel muestra el conteo actual, p.ej. "Componentes (12)" o "Recursos (3)", y se actualiza en vivo mientras se escribe en el cuadro de filtro.

## Cambios aplicados

- `src/ui/componentList.js`: el `<strong>` del título del panel ya no tiene el texto fijo `'Componentes'`; se calcula como `` `Componentes (${n})` `` tanto en el render inicial (con el listado ya filtrado) como dentro del listener `input` del filtro, donde se recalcula junto con `renderBody`.
- `src/ui/resourceList.js`: mismo cambio, análogo, sobre el título `'Recursos'` y su listener de filtro.
