- **Nombre**: Ver la lista de copias vinculadas en la modal de propiedades del original
- **Código**: 00187
- **Tipo**: change
- **Fecha creación**: 2026-08-07

## Prompt original del usuario

También añade una sección nueva en la ventana de propiedades de los elementos (en General) para consultar el número y la lista de copias que tiene

## Descripción completa

Un elemento Original con Copias vinculadas (ver la funcionalidad de "Elementos tipo Copia") ya muestra sobre la mesa, en modo edición, una píldora con el número de copias que tiene, pero para ver cuáles son concretamente hay que buscarlas una a una en la mesa o en el panel de componentes.

Se añade, dentro de la ventana de propiedades de un elemento (pestaña "Generales", sección informativa "General"), el número de copias vinculadas de ese elemento y un botón para abrir una modal aparte con la lista de identificadores de esas copias — la lista puede llegar a ser larga (un original puede tener muchas copias), así que no se muestra en línea dentro de la propia sección, sino en una modal secundaria dedicada, igual que ya existe para consultar el contenido de un mazo.

**Cuándo se muestra**: solo cuando el elemento que se está editando es un Original con al menos una copia vinculada. Si no tiene ninguna copia, no aparece nada nuevo (igual que la píldora de la mesa, que tampoco aparece sin copias). No aplica a la modal reducida que se abre al editar una Copia — esa modal ya es distinta y ya muestra el id de su propio elemento original.

**Preguntas de alcance resueltas con el usuario**:
- Ubicación: al final de la sección "General" ya existente (debajo de Bloqueado/Oculto/Mostrar tooltip/Subir al mover), no como sección nueva aparte.
- Contenido: el número de copias en la propia sección, y la lista completa de sus ids en una modal aparte (abierta con un botón), en vez de en línea — para no descontrolar el alto de la sección cuando hay muchas copias. La lista en sí es de solo lectura: solo id de cada copia, sin interacción ni datos adicionales.

**Datos**: es información derivada del estado actual de la partida en el momento de abrir la modal — no se guarda nada nuevo, se recalcula cada vez.

## Apuntes técnicos

- Modal de propiedades: `src/ui/componentModal.js`. La sección informativa "General" ya existente (fieldset `modal__section`, `infoSection`/`infoLegend`, líneas ~300-307) agrupa hoy Bloqueado/Oculto/Mostrar tooltip/Subir al mover — el número de copias y el botón para ver la lista se añaden al final de ese mismo fieldset.
- `getComponents` ya está importado en `componentModal.js` (desde `core/state.js`) — permite calcular `getComponents().filter(c => c.copyOf === workingComponent.id)` sin nuevas dependencias.
- Precedente directo a reutilizar para la modal de la lista: `ui/mazoContentModal.js` (`openMazoContentModal`) — misma estructura (`modal-overlay`/`modal`, cabecera, `modal__content` con lista, `modal__footer` con botón "Cerrar", cierre al click fuera), pero sin la parte de miniatura de carta ni el botón "Sacar" (esta lista es de solo lectura, no hay acción "sacar copia" desde aquí). Nueva modal propia (p. ej. `ui/componentCopiesModal.js`), no reutiliza literalmente `mazoContentModal.js` porque el dominio es distinto (copias de un componente cualquiera, no cartas de un mazo).
- Patrón de estilo existente para filas de solo lectura label/valor: `.context-menu__info-row` + `.context-menu__info-label`/`.context-menu__info-value` (ver `design/docs/style/03-modales-menus.md` §12.3/12.8) — para la fila "Copias vinculadas: N" dentro de la sección "General", y para cada fila de id dentro de la modal de la lista.
- Botón para abrir la modal de la lista: mismo patrón ya usado en `componentModal.js` para "Ver contenido del mazo" (tipo `'mazo'`, ~línea 1591-1596) — botón suelto `.btn-cancel` dentro de un `.modal__field`, sin `.modal__section` propio.
- Relacionado con el fix 00186 (icono de copias no se actualiza si una copia está en un mazo) — ambos giran en torno a `copyOf`/recuento de copias, pero son entradas independientes: 00186 es un bug del indicador visual sobre la mesa, esta es una funcionalidad nueva dentro de la modal de propiedades.
