 - **Nombre**: Botón para entrar/salir del modo edición con barra de herramientas propia
- **Código**: 00001
- **Tipo**: change

- **Prompt original del usuario**:
  > un botón para entrar en el modo edición. Al activar el modo edición debe aparecer una barra de tareas específica de ese modo en la parte superior y un botón para desactivarlo

- **Descripción completa**:

  Se pide añadir un botón para entrar en el modo edición del prototipo. Al activarse el modo edición, debe aparecer una barra de herramientas específica de ese modo en la parte superior de la pantalla (distinta del contenido normal), que incluya al menos un botón para desactivar el modo edición y volver al modo anterior (juego).

  Contexto del estado actual del proyecto, relevante para entender el alcance:

  - Actualmente existe un "mode switcher" (`src/ui/modeSwitcher.js`) con dos botones ("Modo juego" / "Modo edición") que alternan el modo activo llamando a `setMode()`. Es un selector de dos opciones, no un botón de "entrar" en un modo con un botón de "salir" independiente.
  - No existe ninguna barra de herramientas específica del modo edición separada del área de contenido: `src/modes/edit/editMode.js` renderiza directamente el formulario de alta/edición y la lista de componentes dentro del área de contenido normal.
  - Lo que se pide es un flujo distinto al actual: un botón para entrar en modo edición, y mientras el modo edición está activo, una barra propia de ese modo en la parte superior con (al menos) un botón para desactivarlo. No se ha especificado si esta nueva barra sustituye al "mode switcher" actual o convive con él, ni si debe incluir más acciones además del botón de desactivar — eso se deja para el análisis técnico de `ms-implement`, ya que no afecta al alcance funcional pedido (entrar/salir del modo edición mediante una barra específica de ese modo).
