- **Nombre**: Agrupación de elementos: agrupar y desagrupar
- **Código**: 00193
- **Tipo**: change
- **Fecha creación**: 2026-08-08

## Prompt original del usuario

Origen: idea `833wo` de `changes/todo/`, convertida a change con `/ms-new todo 833wo`. Texto original de la idea, tal cual:

> **Idea:** Grupos de elementos: agrupar y desagrupar
>
> Implementar funcionalidad para agrupar y desagrupar elementos en el editor del juego. Esto permitiría:
> - Seleccionar múltiples elementos y agruparlos en una unidad
> - Mover el grupo como si fuera un solo elemento
> - Desagrupar para volver a manipular elementos individualmente
> - Potencialmente anidación de grupos

El usuario, al desarrollar la idea, pidió documentar el cambio con la información reunida hasta el momento y dejar apuntadas todas las dudas pendientes para refinarlas más adelante, en vez de resolverlas ya en esta sesión.

## Descripción completa

En el editor de la mesa de juego (modo edición), se podrá seleccionar varios componentes de cualquier tipo (cuadro de texto, tablero simple/personalizado, dado, visor de documentos, carta, mazo) y agruparlos en una unidad persistente:

- Una vez agrupados, un solo click sobre cualquier miembro selecciona todo el grupo de golpe, sin tener que rehacer la selección múltiple manual cada vez.
- El grupo se mueve como un bloque (arrastrar cualquier miembro mueve a todos, manteniendo su posición relativa).
- Una acción "Desagrupar" deshace la agrupación y permite volver a seleccionar/mover cada elemento por separado.
- Se contempla, como posibles extensiones futuras de la misma idea, el redimensionado conjunto del grupo completo y la anidación (grupos dentro de grupos) — sin decidir todavía si forman parte de esta primera versión.

**Nombre del concepto**: se usa el nombre provisional "Agrupación"/"grupo" en este documento, evitando cualquier confusión con "Etiquetas" (el proyecto ya tuvo un concepto llamado "Grupo", puramente organizativo por nombre y sin relación con la posición en la mesa, renombrado a "Etiqueta" en el cambio 00190). El nombre definitivo de esta funcionalidad queda como pregunta abierta.

**Punto de partida ya existente en la app** (no es parte de lo nuevo, pero condiciona el diseño): hoy ya se pueden seleccionar varios componentes a la vez (Ctrl+click) y moverlos juntos arrastrando cualquiera de ellos, manteniendo la distancia relativa entre ellos. Lo que falta es que esa selección se pueda "fijar" como una unidad con identidad propia (persistente, recuperable con un solo click, sin tener que repetir Ctrl+click cada vez) y una acción explícita para deshacerla.

**Propuesta de partida para las acciones** (sin confirmar por el usuario): "Agrupar seleccionados" y "Desagrupar" como dos entradas nuevas en el menú contextual de modo edición (el mismo menú, ya existente, que reúne hoy "Ocultar/Mostrar", "Clonar", "Copiar", "Eliminar" y "Añadir a etiqueta" sobre la selección activa) — "Agrupar seleccionados" visible con 2 o más elementos seleccionados, "Desagrupar" visible cuando la selección actual es exactamente un grupo ya formado.

**Feedback visual de partida** (sin confirmar): al hacer click en un miembro de un grupo ya formado (sin mantener Ctrl), se selecciona automáticamente todo el grupo con el mismo resaltado que ya usa hoy la selección múltiple manual (contorno discontinuo), sin ninguna marca visual adicional permanente sobre los componentes agrupados mientras no están seleccionados.

### Preguntas abiertas para refinar en una próxima sesión

Ninguna de estas está confirmada por el usuario todavía — quedan pendientes de resolver antes o durante la planificación técnica (`ms-how`):

1. Nombre definitivo del concepto ("Agrupación", reutilizar "Grupo" ahora que quedó libre, "Conjunto", "Bloque"...).
2. Qué aporta exactamente "agrupar" frente a la selección múltiple con Ctrl ya existente — la propuesta de partida es que agrupar simplemente persiste una selección con identidad propia, pero no está confirmado que sea así de simple.
3. Redimensionado conjunto: ¿al redimensionar el grupo se escalan proporcionalmente todos sus miembros, o esta primera versión no ofrece redimensionado de grupo (solo selección + movimiento)?
4. Anidación: ¿grupos dentro de grupos desde el principio, o se deja fuera de esta versión y solo se documenta/implementa el caso plano (un grupo de componentes sueltos, sin grupos anidados)?
5. Dónde viven las acciones "Agrupar"/"Desagrupar": ¿solo en el menú contextual (propuesta de partida), también un atajo de teclado (p. ej. Ctrl+G / Ctrl+Shift+G), un botón en el panel de Componentes, o varias vías combinadas?
6. Representación en el panel flotante de Componentes: ¿el grupo aparece como una fila propia (tipo "Grupo", con sus miembros dentro, quizá expandible/colapsable), o cada componente sigue apareciendo suelto en el panel, con algún indicador de a qué grupo pertenece?
7. Acceso a un miembro individual sin desagrupar del todo: ¿algún gesto (p. ej. doble click) para "entrar" en el grupo y seleccionar/mover un único miembro sin deshacer la agrupación completa, o hay que desagrupar siempre para tocar un miembro suelto?
8. Casos límite pendientes de definir:
   - Qué pasa con el grupo si se elimina un componente que pertenece a él (¿se deshace automáticamente si queda con 0 o 1 miembro, o el grupo puede tener un único miembro?).
   - Si un miembro está bloqueado (campo "Bloqueado"): ¿bloquea el movimiento de todo el grupo, o solo el suyo dentro del grupo (el resto sí se mueve)?
   - Qué pasa si alguno de los miembros del grupo es una carta guardada dentro de un mazo.
   - Si conviven dentro del mismo grupo miembros con distinto estado de "Oculto"/"Bloqueado", o de distintos tipos de componente.
9. Convivencia con "Copias vinculadas": ¿un grupo puede contener a la vez una copia y su original? ¿La pertenencia a un grupo se sincroniza automáticamente entre una copia y su original (como ya ocurre con la pertenencia a Etiquetas), o queda fuera de esa sincronización (como la posición o el orden de apilado, que son siempre independientes por copia)?
10. Alcance y persistencia de los datos: se asume que, al pedirse una unidad "persistente", el grupo debe guardarse en el autoguardado del navegador y en "Guardar a fichero"/"Exportar" igual que el resto de datos de un componente — a confirmar explícitamente.
11. Quién puede usarlo: se asume que, igual que la selección múltiple actual, esta funcionalidad es exclusiva de modo edición (no existe agrupación en modo juego) — a confirmar.
12. Definición visual: si además del resaltado de selección ya existente hace falta algún indicador visual propio y permanente de "este elemento pertenece a un grupo", visible incluso cuando no está seleccionado.

## Apuntes técnicos

Reunidos por `ms-internal-tech-analysis`; sin incongruencias detectadas entre la documentación técnica y el código real en los puntos revisados.

- La selección múltiple con Ctrl+click ya existe hoy en `modes/edit/editMode.js` (variable de módulo `selectedComponentIds`, `Set<string>` transitorio en memoria, **no persistido** — se pierde al recargar la página), y ya mueve en bloque a todos los seleccionados manteniendo distancias relativas al arrastrar uno de ellos. El redimensionado, en cambio, hoy solo se ofrece con selección de exactamente un elemento (`ui/resizeHandle.js`).
- El modelo de componente (`core/component.js`, ver `design/docs/architecture/01-component-model.md`) no tiene hoy ningún campo de agrupación espacial. Los únicos campos de "pertenencia" existentes son `etiquetaIds` (Etiquetas — puramente organizativo por nombre, sin relación con posición ni movimiento, ver `design/docs/architecture/03-groups-resources.md`) y `copyOf` (copias vinculadas y sincronizadas, concepto distinto). Si la solución técnica representa el grupo como un campo compartido entre componentes (p. ej. un futuro `groupId`), debería seguir el checklist de "campo/colección nuevo" de `design/docs/architecture/INDEX.md` (persistencia en `core/persistence.js`/`core/fileExport.js`, suscripción del autoguardado, posible migración de partidas guardadas sin el campo, etc.) — nota para la fase de solución técnica (`ms-how`), no una decisión ya tomada aquí.
- El menú contextual de modo edición (`modes/edit/editMode.js` → `handleComponentContextMenu`, ver `design/docs/architecture/04-modes.md`) ya opera sobre el conjunto seleccionado (`affectedComponents`) con acciones tipo "Ocultar/Mostrar", "Clonar", "Copiar", "Eliminar", "Añadir a etiqueta" — sitio natural, por patrón ya existente, para añadir "Agrupar seleccionados"/"Desagrupar" si se sigue ese mismo criterio.
