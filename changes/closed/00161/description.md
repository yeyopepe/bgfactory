- **Nombre**: Copiar/pegar de elementos de carta o tablero personalizado entre componentes distintos
- **Código**: 00161
- **Tipo**: fix
- **Fecha creación**: 2026-08-05

## Prompt original del usuario

quiero que la funcionalidad de copiar y pegar un elemento de una carta o un tablero personalizado funcione entre diferentes cartas/tablero.
ejemplo:
1. abro una carta A y copia un texto de su cada frontal.
2. cierra la carta A y abre una carta B y pego ese texto en su cara trasera.

## Descripción completa

Dentro del editor visual de una carta o de un tablero personalizado, cada cara puede llevar elementos (textos y figuras) que se pueden copiar y pegar mediante el menú contextual (click derecho). Hoy, ese "pegar" solo funciona mientras el editor sigue abierto sobre el mismo componente en el que se copió: en cuanto se cierra el editor, el elemento copiado se pierde, y al reabrir el editor sobre otra carta u otro tablero (o incluso sobre el mismo, si se ha vuelto a cerrar y abrir) la opción "Pegar" aparece deshabilitada.

**Cómo reproducirlo**:
1. Abrir el editor visual de una carta A y copiar un elemento (texto o figura) de su cara frontal.
2. Cerrar el editor de la carta A.
3. Abrir el editor visual de una carta B (o de un tablero personalizado) e intentar pegar en cualquiera de sus caras.
4. "Pegar" aparece deshabilitado — el elemento copiado no está disponible.

**Comportamiento esperado**: el último elemento copiado debe seguir disponible para pegar aunque se cierre el editor de la carta/tablero origen y se abra el editor de otro componente distinto (otra carta, un tablero personalizado, o incluso la carta/tablero de origen reabierto), en cualquier cara. No hace falta que sobreviva a recargar la página — es un portapapeles transitorio de la sesión actual, igual que ya ocurre con otros estados temporales de la aplicación (por ejemplo, la selección de componentes en modo edición).

**Casos límite**:
- Copiar un nuevo elemento sustituye siempre al anterior en el portapapeles (comportamiento ya existente, no cambia).
- Un elemento copiado que referencia una imagen o tipografía de la galería de recursos debe pegarse con normalidad en cualquier carta/tablero destino, ya que esos recursos son compartidos por todo el proyecto y no exclusivos de la carta de origen.
- Si se recarga la página, el portapapeles se pierde (no se persiste) — mismo criterio que otros estados transitorios similares del editor.

## Apuntes técnicos

- La documentación técnica (`design/docs/ARCHITECTURE.md`, sección 4, cambio 00127) ya describía `copiedElement` como "variable de módulo... sobrevive a cerrar/reabrir el editor con otra carta, no persiste en `core/state.js`" (mismo patrón que `selectedComponentId`/`panelStackOrder` de `modes/edit/editMode.js`) — es decir, el comportamiento pedido ya estaba documentado como intencionado.
- El código real (`src/ui/visualEditorModal.js:536`) declara `let copiedElement = null;` **dentro** de la función `openVisualEditorModal` (que arranca en la línea 221), no a nivel de módulo. Cada apertura del editor (usado tanto para `'carta'` como para `'tableroPersonalizado'`, mismo componente compartido) crea una clausura nueva, reseteando el portapapeles a `null`. El código nunca implementó lo que la documentación ya describía.
- La corrección debe mover el estado del portapapeles fuera de la clausura de `openVisualEditorModal`, para que sobreviva a cerrar/reabrir el editor sobre un componente distinto, sin persistirlo en `core/state.js` (transitorio, se pierde al recargar la página).
- Los datos referenciados dentro de un elemento copiado (`imagenResourceId`, `fuenteResourceId`) apuntan a recursos de la galería global (`core/resource.js`), no a nada propio de la carta origen, así que deberían seguir siendo válidos al pegar en un componente distinto sin tratamiento especial adicional.
