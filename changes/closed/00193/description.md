- **Nombre**: Agrupación de elementos: agrupar y desagrupar
- **Código**: 00193
- **Tipo**: change
- **Fecha creación**: 2026-08-08

## Descripción completa

En el editor de la mesa de juego (modo edición), se podrá seleccionar varios componentes de cualquier tipo (cuadro de texto, tablero simple/personalizado, dado, visor de documentos, carta, mazo) y agruparlos en una unidad persistente:

- Una vez agrupados, un solo click sobre cualquier miembro selecciona todo el grupo de golpe, sin tener que rehacer la selección múltiple manual cada vez.
- El grupo se mueve como un bloque (arrastrar cualquier miembro mueve a todos, manteniendo su posición relativa).
- Los grupos **no se pueden redimensionar de ninguna forma** — solo moverse. Confirmado por el usuario: descarta definitivamente el redimensionado conjunto que antes se dejaba como posible extensión futura.
- Una acción "Desagrupar" deshace la agrupación y permite volver a seleccionar/mover/editar cada elemento por separado.
- Mientras un componente pertenece a un grupo, **no se puede editar individualmente** (no se abre su modal de propiedades, ni con doble click en el lienzo ni con el botón "Editar" del panel de Componentes). El resto de su comportamiento como elemento individual no cambia: sigue apareciendo en el panel de Componentes en su propia fila (tipo, id, etc.), exactamente igual que un componente sin agrupar.
- La anidación (grupos dentro de grupos) sigue sin decidirse — se deja fuera de esta primera versión salvo que se retome más adelante.

**Nombre del concepto**: confirmado como "Grupo" (el concepto anterior con ese nombre, puramente organizativo por nombre y sin relación con la posición en la mesa, quedó libre al renombrarse a "Etiqueta" en el cambio 00190 — sin conflicto ya).

**Aparición en el panel de Componentes**: cada grupo creado obtiene, además de sus miembros (que siguen apareciendo cada uno en su propia fila, sin cambios — ver más abajo), su **propia fila** en el panel flotante "Componentes":
- **Id**: único, generado automáticamente con un formato propio y reconocible (p.ej. `grupo-1`, `grupo-2`...), distinto del identificador que usa el resto de componentes.
- **Tipo**: se muestra como "Grupo".
- **Acciones de esa fila**: la fila es seleccionable (click sobre ella selecciona el grupo entero, igual que hacer click sobre cualquiera de sus miembros en la mesa) y ofrece un botón "Desagrupar" (deshace la agrupación, equivalente a la opción del menú contextual). No tiene botón "Editar" ni el resto de acciones de fila que sí tienen los componentes normales (Ocultar/Mostrar, Clonar, Copiar, Eliminar, Añadir a etiqueta).

**Punto de partida ya existente en la app** (no es parte de lo nuevo, pero condiciona el diseño): hoy ya se pueden seleccionar varios componentes a la vez (Ctrl+click) y moverlos juntos arrastrando cualquiera de ellos, manteniendo la distancia relativa entre ellos. Lo que falta es que esa selección se pueda "fijar" como una unidad con identidad propia (persistente, recuperable con un solo click, sin tener que repetir Ctrl+click cada vez) y una acción explícita para deshacerla.

**Comportamiento del menú contextual (confirmado por el usuario)**: el menú contextual de modo edición (el mismo menú, ya existente, que reúne hoy "Ocultar/Mostrar", "Clonar", "Copiar", "Eliminar" y "Añadir a etiqueta" sobre la selección activa) añade dos entradas nuevas, "Agrupar" y "Desagrupar", cuyo estado depende exactamente de la selección activa:

| Selección activa | Menú contextual | Agrupar | Desagrupar |
|---|---|---|---|
| 2+ elementos, ninguno es un grupo | se muestra | habilitado | deshabilitado |
| 2+ elementos, al menos uno es un grupo | **no se muestra ningún menú contextual** | — | — |
| 1 elemento, no es un grupo | se muestra | deshabilitado | deshabilitado |
| 1 elemento, es un grupo | se muestra | deshabilitado | habilitado |

Notas:
- Un grupo ya formado cuenta como "1 elemento" a efectos de esta tabla: un click simple sobre cualquiera de sus miembros selecciona el grupo entero como una única unidad, no N miembros sueltos.
- El resto de entradas ya existentes del menú ("Ocultar/Mostrar", "Clonar", "Copiar", "Eliminar", "Añadir a etiqueta") no cambian de comportamiento en las filas donde el menú sí se muestra — se asume que siguen operando sobre la selección activa igual que hoy (propuesta, ver preguntas abiertas).
- No existe ninguna acción para incorporar un elemento suelto a un grupo ya existente ("fusionar" selección con grupo) — la única vía es agrupar una selección completamente suelta, o desagrupar un grupo entero (propuesta, ver preguntas abiertas).

**Feedback visual de partida** (sin confirmar): al hacer click en un miembro de un grupo ya formado (sin mantener Ctrl), se selecciona automáticamente todo el grupo con el mismo resaltado que ya usa hoy la selección múltiple manual (contorno discontinuo), sin ninguna marca visual adicional permanente sobre los componentes agrupados mientras no están seleccionados.

### Resuelto en esta ronda

- **Redimensionado**: descartado por completo, ni para el grupo ni para un miembro mientras esté agrupado — solo movimiento.
- **Dónde viven las acciones**: confirmado, solo en el menú contextual, con el estado exacto fijado en la tabla de arriba.
- **Panel de Componentes**: cada componente miembro sigue apareciendo en su propia fila normal, sin cambios. Además, el grupo en sí obtiene su propia fila con id único autogenerado (formato propio, p.ej. `grupo-1`) y tipo "Grupo"; esa fila solo permite seleccionar el grupo y "Desagrupar" — sin "Editar", "Eliminar" ni el resto de acciones de fila (ver detalle en "Aparición en el panel de Componentes" arriba). *(Actualizado — contradice lo documentado en la ronda anterior, que descartaba cualquier fila/indicador nuevo en el panel.)*
- **Acceso a un miembro individual sin desagrupar**: no aplica — mientras un componente está en un grupo no se puede editar individualmente en absoluto (ver regla en "Descripción completa"), así que no hace falta ningún gesto para "entrar" al grupo.
- **Qué aporta "agrupar" frente a Ctrl+click**: persiste la selección con identidad propia (clic simple reselecciona el grupo entero) y añade la restricción de no-edición individual; ambas piezas ya están fijadas por el usuario.

### Resuelto en esta ronda (ms-how)

- **Anidación**: fuera de alcance. Solo grupos planos — un grupo no puede contener a otro grupo como miembro. La fila propia de grupo en el panel de Componentes no necesita distinguir "raíz" de "anidado".
- **Grupo con 0 o 1 miembro**: si al eliminar un componente el grupo queda con 1 o 0 miembros, se deshace automáticamente; el/los miembro(s) restante(s) vuelve(n) a comportarse como componente(s) suelto(s).
- **Miembro bloqueado dentro de un grupo**: el campo "Bloqueado" de un miembro no bloquea el movimiento del grupo en ningún sentido. Mientras el componente pertenece a un grupo, si se mueve el grupo, ese miembro se mueve también junto con el resto, esté bloqueado o no.
- **Convivencia con "Copias vinculadas"**: la pertenencia a un grupo **no** se sincroniza entre una copia y su original — se trata igual que la posición o el orden de apilado (siempre independiente por copia), no igual que las Etiquetas.
- **Carta guardada dentro de un mazo**: no es un caso a resolver aparte — hoy una carta dentro de un mazo no se dibuja como componente independiente en la mesa, así que nunca es seleccionable/arrastrable y por tanto nunca puede ser miembro de un grupo.
- **Miembros con distinto estado ("Oculto"/"Bloqueado") o de distinto tipo dentro del mismo grupo**: permitido sin restricción — cada miembro mantiene su propio estado individual (salvo la regla de bloqueo de arriba), el grupo no impone homogeneidad.

### Asumido de partida (propuestas del documento, sin objeción del usuario)

- **Persistencia**: el grupo (incluida su fila en el panel de Componentes) se guarda en el autoguardado del navegador y en "Guardar a fichero"/"Exportar", igual que el resto de datos de un componente.
- **Alcance de uso**: exclusivo de modo edición, igual que la selección múltiple actual — no existe agrupación en modo juego.
- **Indicador visual permanente**: no se añade ninguna marca visual adicional mientras el grupo no está seleccionado, más allá del resaltado de selección ya existente.
- **Alcance de "no se puede editar"**: solo bloquea abrir el modal de propiedades (doble click / botón "Editar" del panel); el resto de acciones (Clonar, Copiar, Eliminar, Ocultar, Añadir a etiqueta) siguen disponibles sobre el grupo como unidad, según la tabla del menú contextual de arriba.
- **Incorporar un elemento suelto a un grupo ya existente**: fuera de esta versión — la única vía es agrupar una selección completamente suelta, o desagrupar un grupo entero.
- **Filtro/orden de la columna "Tipo"**: "Grupo" se comporta como cualquier otro valor de esa columna, sin tratamiento especial ni exclusión de filtros existentes.

## Apuntes técnicos

Reunidos por `ms-internal-tech-analysis`; sin incongruencias detectadas entre la documentación técnica y el código real en los puntos revisados.

- La selección múltiple con Ctrl+click ya existe hoy en `modes/edit/editMode.js` (variable de módulo `selectedComponentIds`, `Set<string>` transitorio en memoria, **no persistido** — se pierde al recargar la página), y ya mueve en bloque a todos los seleccionados manteniendo distancias relativas al arrastrar uno de ellos. El redimensionado, en cambio, hoy solo se ofrece con selección de exactamente un elemento (`ui/resizeHandle.js`).
- El modelo de componente (`core/component.js`, ver `design/docs/architecture/01-component-model.md`) no tiene hoy ningún campo de agrupación espacial. Los únicos campos de "pertenencia" existentes son `etiquetaIds` (Etiquetas — puramente organizativo por nombre, sin relación con posición ni movimiento, ver `design/docs/architecture/03-groups-resources.md`) y `copyOf` (copias vinculadas y sincronizadas, concepto distinto). Si la solución técnica representa el grupo como un campo compartido entre componentes (p. ej. un futuro `groupId`), debería seguir el checklist de "campo/colección nuevo" de `design/docs/architecture/INDEX.md` (persistencia en `core/persistence.js`/`core/fileExport.js`, suscripción del autoguardado, posible migración de partidas guardadas sin el campo, etc.) — nota para la fase de solución técnica (`ms-how`), no una decisión ya tomada aquí.
- El menú contextual de modo edición (`modes/edit/editMode.js` → `handleComponentContextMenu`, ver `design/docs/architecture/04-modes.md`) ya opera sobre el conjunto seleccionado (`affectedComponents`) con acciones tipo "Ocultar/Mostrar", "Clonar", "Copiar", "Eliminar", "Añadir a etiqueta" — sitio natural, por patrón ya existente, para añadir "Agrupar"/"Desagrupar" si se sigue ese mismo criterio.
- El "no se puede editar mientras está en un grupo" tiene hoy dos puntos de entrada distintos que habría que bloquear: el doble click sobre el componente en el lienzo (`onSelect: openEditModalFor` en `modes/edit/editMode.js`, cableado en `ui/componentRenderer.js` para cada tipo de componente) y el botón "Editar" de su fila en el panel de Componentes (`onEdit` en `ui/componentList.js`, botón `editButton`).
- El desplazamiento con teclado (flechas) sobre la selección múltiple (`moveSelectedComponent` en `modes/edit/editMode.js:146`) ya filtra hoy los componentes bloqueados (`c.bloqueado !== 'todos'`) y mueve el resto — mismo patrón que se podría reutilizar si un miembro bloqueado dentro de un grupo debe frenar solo su propio movimiento (pregunta abierta 2).
- El panel flotante "Componentes" (`ui/componentList.js`, ver `design/docs/architecture/04-modes.md`) hoy solo tiene filas de componente real: columnas Id/Tipo/Acciones, botones "Editar"/"Clonar"/"Copiar"/"Eliminar" por fila (oculto "Copiar" si la fila ya es una copia). Una fila de grupo (sin "Editar" ni "Eliminar", con "Desagrupar" en su lugar) es un tipo de fila nuevo sin precedente exacto en esta tabla — el panel "Etiquetas" (`ui/tagList.js`) es la referencia más cercana a "fila seleccionable sin ser un componente", pero esa sí tiene "Editar"/"Eliminar" propios y vive en una ventana flotante aparte, no dentro de "Componentes". Nota para `ms-how`: hay que decidir si la fila de grupo sale del mismo `components` array (i.e. el grupo se modela como un componente más, con `type: 'grupo'` y sin las acciones que no aplican) o de una colección aparte que `componentList.js` tenga que fusionar visualmente con las filas de componente — con implicaciones distintas en persistencia, filtros de columna y ids.
- El campo `id` de un componente normal se genera con `crypto.randomUUID()` y es editable/único vía `ui/componentModal.js` (ver `design/docs/architecture/01-component-model.md`). El id de grupo pedido por el usuario usa un formato y contador propios (`grupo-N`), distinto de ese esquema — decisión ya tomada por el usuario, no una incongruencia; queda para `ms-how` definir cómo convive ese contador con la unicidad de ids ya validada en la capa UI para el resto de componentes.
