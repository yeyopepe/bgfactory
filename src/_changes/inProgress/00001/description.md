 - **Nombre**: Botón para entrar/salir del modo edición con barra de tareas propia
- **Código**: 00001
- **Tipo**: change

- **Prompt original del usuario**:
  > un botón para entrar en el modo edición. Al activar el modo edición debe aparecer una barra de tareas específica de ese modo en la parte superior y un botón para desactivarlo

- **Descripción completa**:

  Se pide sustituir el selector de modo actual por un flujo de entrar/salir: un botón "Entrar en modo edición" visible en modo juego, y al activarse, una barra de tareas propia del modo edición en la parte superior de la pantalla, con (al menos) un botón "Salir del modo edición" para desactivarlo y volver al modo juego.

  Contexto del estado actual del proyecto, relevante para el alcance:

  - Existe un "mode switcher" (`src/ui/modeSwitcher.js`) con dos botones intercambiables ("Modo juego" / "Modo edición") que llaman a `setMode()` (`src/core/state.js`, `state.mode: 'play' | 'edit'`, evento `mode:changed`). Es un selector de dos opciones, no un flujo de entrar/salir independiente.
  - No existe ninguna barra de herramientas propia del modo edición separada del contenido: `src/modes/edit/editMode.js` renderiza directamente el formulario de alta/edición y el listado de componentes dentro de `#content`.
  - No hay roles/usuarios/permisos en el proyecto (prototipo de un solo operador local); cualquiera que abra la app puede activar/desactivar el modo edición, igual que hoy.
  - El modo (`state.mode`) no se persiste hoy en `localStorage` (solo se persisten los componentes); no hay estados de carga/red relevantes (todo es local y síncrono).

  Preguntas de alcance planteadas al usuario y respuestas confirmadas:

  1. **¿Qué hacemos con el "mode switcher" actual al introducir el nuevo flujo de entrar/salir?** → Se **sustituye**: desaparece el selector de dos botones; en su lugar, un botón "Entrar en modo edición" visible en modo juego (en la misma zona superior donde hoy está el mode switcher), y al activarse, la barra de tareas del modo edición con el botón "Salir del modo edición".
  2. **¿Qué debe incluir la barra de tareas del modo edición en este cambio?** → Alcance mínimo: **solo el botón de salida**. No se añaden en este cambio otras acciones (como exportar/importar JSON, ya existentes en `src/data/persistence.js` sin UI conectada) — eso queda para un change futuro.
  3. **Al recargar la página, ¿se recuerda que se estaba en modo edición, o siempre se vuelve a modo juego?** → Se mantiene el comportamiento actual: el modo **no se persiste** en `localStorage`; al recargar la página siempre se vuelve a "Modo juego", y hay que volver a pulsar "Entrar en modo edición" si se desea.

  Además, se confirma que:

  - El contenido actual de `#content` en modo edición (formulario de alta/edición y listado de componentes de `editMode.js`) se mantiene igual; la nueva barra es un elemento adicional por encima, no sustituye ese contenido.
  - No hay restricciones de rol: cualquier usuario de la app puede activar/desactivar el modo edición, sin cambios respecto al comportamiento actual.
