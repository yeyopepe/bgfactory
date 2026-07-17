- **Nombre** — Componentes nuevos se crean encima de los existentes en modo edición
- **Código** — 00006
- **Tipo** — fix
- **Prompt original del usuario** — botón de añadir nuevo componente en el modo edición: cuando añado un nuevo elemento este se crea "encima" del actual y no se pueden desplazar ni seleccionar por separado. Cuando se crea un componente debe ser totalmente independiente de los demás
- **Descripción completa** —

Qué comportamiento está roto: al pulsar el botón de añadir un nuevo componente en el modo edición, el componente creado aparece visualmente encima del/los componente(s) ya existentes en la mesa, en lugar de en una posición propia e independiente. Al no tener cada componente una posición diferenciada, no es posible desplazar (arrastrar) los componentes de forma individual en la mesa, ni distinguirlos o seleccionarlos por separado salvo el que quede visualmente en la capa superior.

Cómo reproducirlo: entrar en modo edición con al menos un componente ya creado en la mesa, pulsar el botón de añadir componente en el panel flotante, rellenar el modal y aceptar. El nuevo componente se solapa exactamente con el/los anterior(es).

Qué se espera en su lugar: cada componente creado debe tener una posición propia e independiente en la mesa, sin solaparse por defecto con los demás componentes existentes, y debe poder ser desplazado (arrastrado) individualmente sobre la mesa sin afectar a la posición de los demás componentes.

No ha habido preguntas de alcance adicionales: el comportamiento roto y el esperado son claros a partir del reporte del usuario y de la inspección del código de renderizado del modo edición.
