# Fix: no abrir configuración al soltar un elemento arrastrado

- **Nombre**: No abrir ventana de configuración al soltar un elemento tras arrastrarlo
- **Código**: 00004
- **Tipo**: fix
- **Prompt original del usuario**: "cuando arrastro un elemento en el modo edición, al soltarlo me abre siempre la ventana de configuración. Solo debe abrir la configuración si hago doble clic en el elemento"
- **Descripción completa**: En el modo edición, al arrastrar un elemento (componente) y soltarlo en una nueva posición, actualmente se abre siempre la ventana modal de configuración del componente. Este comportamiento es incorrecto: la ventana de configuración debe abrirse únicamente cuando el usuario hace doble clic sobre el elemento, no como consecuencia de soltarlo tras un arrastre. Se espera que tras soltar un elemento arrastrado, este quede simplemente reposicionado, sin abrir ningún modal; el modal de configuración solo debe dispararse con doble clic explícito sobre el elemento.
