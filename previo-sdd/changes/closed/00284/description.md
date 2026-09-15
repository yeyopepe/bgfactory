- **Name**: Borde superior fijo del modal de propiedades al cambiar de pestaña
- **Code**: 00284
- **Type**: change
- **Creation date**: 2026-09-15

## Full description

Al abrir la ventana de propiedades de un componente y cambiar entre sus pestañas ("Generales", "Apariencia", "Contenido", "Interacciones", "Copias"), la ventana cambia de altura según el contenido de cada pestaña. Actualmente la ventana se centra verticalmente en la pantalla, así que al cambiar de altura también se desplaza verticalmente su posición — el usuario percibe un "salto" además del simple cambio de contenido.

Comportamiento pedido: el borde superior de la ventana debe permanecer siempre en el mismo punto de la pantalla al cambiar de pestaña, de forma que el usuario perciba únicamente el cambio de contenido (equivalente a moverse solo horizontalmente), sin ningún desplazamiento vertical de la ventana.

### Puntos analizados y confirmados

1. **Punto de anclaje del borde superior**: queda fijado en la posición que correspondería a la pestaña con más altura de contenido (la más alta de las 5 pestañas actuales). En las pestañas con menos contenido, la ventana simplemente deja más espacio libre por debajo, entre su borde inferior y el borde inferior de la pantalla — nunca sube por encima de esa posición de referencia.
2. **Alcance**: el cambio afecta únicamente a la ventana de propiedades de componente. No se extiende a ninguna otra ventana con pestañas del proyecto.
3. **Pestaña que no cabe en pantalla**: se mantiene el comportamiento actual — si el contenido de la pestaña de referencia (la más alta) no cabe en el espacio disponible entre el borde superior fijado y el borde inferior de la pantalla, aparece scroll interno dentro de la ventana, igual que ocurre hoy. No se introduce ninguna excepción al anclaje fijo.
4. **Redimensionado de la ventana del navegador**: mientras la ventana de propiedades está abierta, si el usuario redimensiona la ventana del navegador, la posición del borde superior se recalcula para seguir encajando bien en el nuevo tamaño.
5. **Datos/roles/coexistencia**: no aplica — es un cambio puramente visual/de comportamiento, sin datos nuevos que guardar, sin restricción por roles, y sin relación detectada con otro cambio en curso.

### Definición visual de alto nivel

La ventana de propiedades deja de centrarse verticalmente sin más criterio que su altura variable; su borde superior queda anclado a una posición fija en pantalla, equivalente a la que ocuparía mostrando la pestaña de mayor altura, y esa posición se recalcula si la ventana del navegador cambia de tamaño. El ancho y el resto del aspecto de la ventana no cambian.

## Technical notes

- `src/styles/main.css`: `.modal-overlay` (línea ~599) centra `.modal` con `display:flex; align-items:center; justify-content:center`. `.modal`/`.component-editor-modal` (línea ~647) tiene `max-height: 80vh` con `overflow:hidden` — de ahí que el centrado por flexbox desplace el borde superior al cambiar la altura del contenido.
- `src/ui/componentModal.js`: `switchTab()` (línea ~331) solo alterna `display: block/none` de los contenidos de cada pestaña; no existe ningún cálculo de posición vertical en el JS actual.
- `previo-sdd/design/docs/style/003-modales-menus.md` ("Wide modals") documenta el ancho de `.component-editor-modal` (`clamp()` recalculado en resize sin JS) pero no cubre su posicionamiento vertical — no hay inconsistencia entre documentación y código, simplemente el punto no está documentado todavía.
- No se ha detectado relación con ningún otro change/fix en curso bajo `previo-sdd/changes/**`.
