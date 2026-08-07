- **Nombre**: Mostrar icono de mazo vacío cuando el mazo con imagen configurada se queda sin cartas
- **Código**: 00197
- **Tipo**: fast
- **Fecha creación**: 2026-08-07

## Prompt original del usuario

cuando un mazo tiene configurada una imagen y el mazo se queda sin cartas, debe mostrar la imagen ya existente para indicar que no quedan cartas. Cuando hay al menos 1 carta, debe volver a mostrarse la imagen configurada

## Descripción completa

Cuando un mazo tiene configurada una imagen propia (el diseño de su reverso), esa imagen se sigue mostrando aunque el mazo se quede sin cartas — en vez de mostrar el icono que ya existe en la app para indicar "mazo vacío" (el mismo que se muestra en un mazo sin imagen configurada cuando se queda sin cartas).

Comportamiento esperado: si el mazo se queda con 0 cartas, se muestra siempre el icono de "mazo vacío", tenga o no imagen configurada. En cuanto el mazo vuelve a tener al menos 1 carta, se muestra de nuevo la imagen configurada (o, si no tiene imagen configurada, el reverso de la carta de arriba, como ya ocurre hoy).

## Apuntes técnicos

Bug en `ui/componentRenderer.js`, rama de renderizado del tipo `'mazo'` dentro de `renderComponentsOnTable`: la condición `if (props.imagenResourceId)` pinta la imagen configurada sin comprobar antes si `cartaIds` (cartas del mazo) está vacío. Solo la rama `else` (sin imagen configurada) contempla el caso de mazo vacío, llamando a `renderMazoEmptyPlaceholder`.

## Cambios aplicados

- `src/ui/componentRenderer.js`: en la rama de renderizado de `'mazo'`, se calcula `cartaArriba` (la primera carta del mazo, o `null` si `cartaIds` está vacío) antes de decidir qué pintar. Ahora la imagen configurada (`props.imagenResourceId`) solo se pinta si además hay `cartaArriba`; si no hay ninguna carta, se pinta siempre `renderMazoEmptyPlaceholder`, tenga o no imagen configurada.
