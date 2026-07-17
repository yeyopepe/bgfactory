 - **Nombre**: Botón para entrar/salir del modo edición con barra de tareas propia, eliminando la implementación actual de edición
- **Código**: 00001
- **Tipo**: change

- **Prompt original del usuario**:
  > elimina todo lo que hay implementado y empezamos con un botón para entrar y salir del modo edición. Diseña una barra de herramientas en la parte superior solo para el modo edición.

- **Descripción completa**:

  Se pide eliminar la implementación actual del flujo de modo edición y sustituirla por un flujo de entrar/salir: un botón "Entrar en modo edición" visible en modo juego, y al activarse, una barra de tareas propia del modo edición en la parte superior de la pantalla, con (al menos) un botón "Salir del modo edición" para desactivarlo y volver al modo juego.

  Contexto del estado actual del proyecto, relevante para el alcance:

  - Existe un "mode switcher" (`src/ui/modeSwitcher.js`) con dos botones intercambiables ("Modo juego" / "Modo edición") que llaman a `setMode()` (`src/core/state.js`, `state.mode: 'play' | 'edit'`, evento `mode:changed`). Es un selector de dos opciones, no un flujo de entrar/salir independiente.
  - `src/modes/edit/editMode.js` renderiza actualmente un formulario de alta/edición y el listado de componentes (vía `src/ui/componentList.js`) dentro de `#content`. No existe ninguna barra de herramientas propia del modo edición separada del contenido.
  - El modo (`state.mode`) no se persiste hoy en `localStorage` (solo se persisten los componentes); no hay estados de carga/red relevantes (todo es local y síncrono).
  - No hay roles/usuarios/permisos en el proyecto (prototipo de un solo operador local).

  Puntos de alcance planteados al usuario y respuestas confirmadas:

  1. **¿Qué se considera "implementado" a eliminar?** → El selector de modo actual (`src/ui/modeSwitcher.js`, dos botones intercambiables) y el contenido de `src/modes/edit/editMode.js` (formulario de alta/edición + listado de componentes editable). El modo edición queda, tras este cambio, reducido a la barra de tareas; no incluye ningún formulario ni listado por ahora.
  2. **¿Se elimina también la capa de datos (`core/state.js`, `core/component.js`) y el listado reutilizable (`ui/componentList.js`)?** → No. Se mantienen intactas: `componentList.js` sigue usándose en modo juego (listado de solo lectura), y las funciones de estado (`addComponent`, `updateComponent`, `removeComponent`, `replaceComponent`, `createComponent`, etc.) son necesarias para cuando se re-añada la edición en un cambio futuro, aunque de momento ninguna UI de edición las invoque.
  3. **¿Qué pasa con los datos ya guardados en `localStorage`?** → Se conservan. Los componentes ya creados con el formulario anterior seguirán viéndose en modo juego (solo lectura), aunque de momento no haya forma de editarlos/borrarlos hasta que se re-añada esa funcionalidad en un cambio futuro.
  4. **¿Qué muestra `#content` en modo edición tras el borrado?** → Un estado vacío/placeholder simple (p.ej. "Modo edición — próximamente"), ya que de momento no hay nada que mostrar ahí.
  5. **Ubicación y comportamiento del botón "Entrar en modo edición"** → Visible solo en modo juego, en la misma zona superior donde hoy está el selector (`#mode-switcher`).
  6. **Barra de herramientas del modo edición** → Franja fija en la parte superior de la pantalla, visible solo cuando el modo edición está activo, visualmente diferenciada del resto (p.ej. fondo distinto) para dejar claro que se está en ese modo. Por ahora contiene únicamente el botón "Salir del modo edición". El detalle visual de bajo nivel (colores exactos, medidas, componentes concretos a reutilizar o crear) se deja para `ms-implement`.
  7. **Persistencia del modo y permisos** → Sin cambios respecto a hoy: el modo no se persiste (al recargar siempre se vuelve a modo juego), y no hay roles — cualquiera puede entrar/salir.

  Nota: existió previamente una entrada `00001` con una propuesta distinta (que mantenía el formulario y listado de edición); fue eliminada por el usuario y no se tiene en cuenta.
