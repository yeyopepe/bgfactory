**Fecha creación**: 2026-08-05

## (a) Anotaciones funcionales

- Fuera de alcance: cualquier otro estado transitorio del editor visual (selección de elemento, posición del panel, etc.) — este fix toca únicamente el portapapeles de copiar/pegar de elementos (`copiedElement`).
- Fuera de alcance: persistir el portapapeles entre recargas de página o entre sesiones — sigue siendo estado en memoria, tal y como ya establece `description.md`.
- No ha hecho falta resolver ninguna duda con el usuario: la causa raíz y la solución son directas (variable declarada en el ámbito equivocado).

## (b) Solución técnica

1. En `src/ui/visualEditorModal.js`, mover la declaración `let copiedElement = null;` (línea 536) fuera de la función `openVisualEditorModal` (que arranca en la línea 221) a ámbito de módulo, junto a las demás constantes de módulo ya existentes al principio del fichero (`CANVAS_MAX_SIDE`, `SHAPE_BORDER_RADIUS`, etc., líneas 26-36) — mismo patrón de estado transitorio a nivel de módulo que `selectedComponentId`/`panelStackOrder` en `modes/edit/editMode.js`, citado en `ARCHITECTURE.md`.
2. No hace falta tocar ningún otro punto: todas las lecturas/escrituras de `copiedElement` (`pasteElementAt`, el handler de "Copiar" y el `disabled: !copiedElement` de "Pegar", líneas 539-583) están dentro de funciones anidadas en `openVisualEditorModal` (o llamadas por ella) que seguirán cerrando sobre la misma variable por closure — al ser ahora una variable de módulo compartida por todas las invocaciones de `openVisualEditorModal`, sobrevive a que la función se vuelva a invocar (nuevo cierre/apertura del editor) sin perder el valor asignado en una apertura anterior.
3. Verificar manualmente el flujo descrito en `description.md`: copiar un elemento en la cara de un componente, cerrar el editor, abrir el editor de otro componente distinto, y confirmar que "Pegar" está habilitado y coloca una copia correcta del elemento.

No se requiere ningún otro cambio: no hay otros ficheros que importen o dependan de `copiedElement` (variable privada del módulo, nunca exportada), ni tests que la referencien.

## (c) Cambios de arquitectura

`design/docs/ARCHITECTURE.md`, sección 4 (cambio 00127), ya describe `copiedElement` como "variable de módulo... sobrevive a cerrar/reabrir el editor con otra carta" — la descripción ya es correcta y no necesita cambiar, salvo por una imprecisión de nombre a corregir: dice que es "variable de módulo de `cardEditorModal.js`", pero el fichero real es `ui/visualEditorModal.js` (el editor se generalizó de `cardEditorModal.js` a `visualEditorModal.js` en el cambio 00143 para cubrir también `'tableroPersonalizado'`, sin que esta mención se actualizara en su momento). `ms-do` debe corregir esa única mención de nombre de fichero al aplicar este fix, ya que a partir de ahora el código sí cumple lo que el resto de la frase describe.
