# Historial de prompts — 00193

Información histórica del proceso de análisis, no información vigente. Recoge, tal cual y sin reformular, los prompts sucesivos con los que el usuario ha ido planteando y ampliando esta entrada — pueden ser incompletos o contradictorios entre sí, ya que reflejan cómo evolucionó la petición sesión a sesión, no el resultado final (eso vive en `description.md`).

**Uso exclusivo de `ms-new` y `ms-fix`.** Ninguna otra skill del framework (`ms-how`, `ms-do`, `ms-status`, etc.) debe leer este fichero ni tenerlo en cuenta: la fuente de la verdad sobre qué se pide es siempre `description.md`.

## 2026-08-08 — migrado desde description.md

Origen: idea `833wo` de `changes/todo/`, convertida a change con `/ms-new todo 833wo`. Texto original de la idea, tal cual:

> **Idea:** Grupos de elementos: agrupar y desagrupar
>
> Implementar funcionalidad para agrupar y desagrupar elementos en el editor del juego. Esto permitiría:
> - Seleccionar múltiples elementos y agruparlos en una unidad
> - Mover el grupo como si fuera un solo elemento
> - Desagrupar para volver a manipular elementos individualmente
> - Potencialmente anidación de grupos

El usuario, al desarrollar la idea, pidió documentar el cambio con la información reunida hasta el momento y dejar apuntadas todas las dudas pendientes para refinarlas más adelante, en vez de resolverlas ya en esta sesión.

En una sesión posterior, tras presentarle una propuesta razonada para las 12 preguntas abiertas, el usuario respondió fijando directamente el comportamiento del menú contextual y dos reglas adicionales, tal cual:

> Básicamente lo que quiero es, en el modo edición:
> - Cuando haya más de 1 elemento seleccionado, y NINGUNO es un grupo, ver en el menú contextual dos opciones nuevas:
>     1-Agrupar (habilitado)
>     2-Desagrupar (deshabilitado)
> - Cuando haya más de 1 elemento seleccionado, y AL MENOS UNO es un grupo, no se muestra menú contextual.
> - Si tengo UN solo elemento seleccionado que NO es un grupo, ambas opciones del menú contextual deben estar deshabilitadas
> - Si tengo UN solo elemento seleccionado que SÍ es un grupo, las opcoines tiene que estar:
>     1-Agrupar (deshabilitado)
>     2-Desagrupar (habilitado)
>
> Todos los elemento, aunque formen parte de un grupo, siguen siendo elementos individuales (aparecen en los listados como siempre, etc). La única diferencia es que, si forman parte de un grupo, no se podrán editar.
>
> Los grupos no se pueden redimensionar de ninguna manera, solo moverse.
>
> Pinta flujos y mockups de todo

En una tercera sesión, el usuario pidió ampliar el cambio con lo siguiente, tal cual:

> Los grupos que se creen deben tener un id único generado automáticamente y deben aparecer en la ventana de componentes con el tipo Grupo

Preguntas planteadas para acotar esa ampliación y respuestas del usuario:
- Nombre definitivo del concepto: confirmado como "Grupo" (cierra la pregunta abierta 1 de la ronda anterior).
- Acciones disponibles en la fila del grupo dentro del panel de Componentes: "Selección y Desagrupar" — la fila permite seleccionar el grupo con click y tiene un botón "Desagrupar"; sin botón "Editar" ni el resto de acciones de fila (Ocultar/Mostrar, Clonar, Copiar, Añadir a etiqueta).
- Botón "Eliminar" en esa fila: no existe.
- Formato del id autogenerado: prefijo distintivo propio (p.ej. `grupo-1`, `grupo-2`...), no el UUID genérico que usa el resto de componentes.
