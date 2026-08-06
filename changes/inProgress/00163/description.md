- **Nombre**: Girar 90° elementos de texto y figura geométrica en el editor de cartas y tablero
- **Código**: 00163
- **Tipo**: change
- **Fecha creación**: 2026-08-06

## Prompt original del usuario

en el editor de cartas y tablero, añade la posibilidad de girar 90º cada elemento texto o figura geométrica de manera independiente.

## Descripción completa

En el editor visual que se usa para diseñar el contenido de una carta o de un tablero personalizado (donde se colocan textos y figuras geométricas sobre un lienzo), se añade la posibilidad de girar cada elemento de texto y cada figura geométrica 90 grados, de forma independiente para cada uno de ellos — girar un elemento no afecta al resto de elementos de esa misma cara, ni al tablero o carta en sí.

La acción se activa desde el menú contextual (click derecho) que ya aparece hoy al hacer click derecho sobre un elemento seleccionado en el lienzo del editor, junto a las opciones ya existentes (Copiar, Pegar, Eliminar, Colocar arriba, Colocar abajo): se añade una nueva opción "Girar 90°". Cada vez que se usa, el elemento gira otros 90 grados más sobre sí mismo, en un ciclo de 0° → 90° → 180° → 270° → 0°.

Al girar, el espacio que ocupa el elemento (su posición y tamaño) no cambia — solo gira visualmente su contenido dentro de ese mismo espacio. Si tras girar el contenido no encaja del todo en ese espacio, puede quedar recortado por los bordes del elemento, igual que ya puede pasar hoy con otro contenido que no cabe en su marco.

El giro se ve reflejado tanto dentro del propio editor como en la carta o tablero ya colocado sobre la mesa de juego, en modo edición y en modo juego, para que lo que se ve al diseñar coincida siempre con lo que se ve jugando.

Un elemento guardado antes de este cambio se comporta como si no estuviera girado (0°), sin ningún cambio visual respecto a como se ve hoy.

Si se duplica un elemento, se copia y pega dentro del editor, o se usa "Copiar/Pegar estilo" entre elementos, el ángulo de giro se conserva igual que el resto de sus propiedades (color, tamaño de fuente, bordes, etc.).

Esta posibilidad de girar queda disponible únicamente dentro del editor visual, en modo edición — no afecta al componente de texto independiente que se puede colocar directamente sobre la mesa, ni gira la carta o el tablero completos (solo el elemento de texto o figura seleccionado dentro de su diseño).

**Preguntas de alcance resueltas con el usuario:**
- *¿Cómo se activa el giro?* → Desde el menú contextual del elemento, como una opción más junto a las ya existentes.
- *¿El giro cambia el tamaño del espacio que ocupa el elemento (por ejemplo, intercambiando ancho y alto)?* → No: el espacio (posición y tamaño) del elemento se mantiene igual antes y después de girar; solo gira el contenido dentro de él.

## Apuntes técnicos

- El editor visual es `src/ui/visualEditorModal.js` (usado por los tipos de componente `'carta'` y `'tableroPersonalizado'`). Los elementos a los que aplica este cambio son `TextBox` (texto) y `Forma` (figura geométrica), ambos definidos dentro de cada cara (`caraFrontal`/`caraTrasera`/`cara`) con `{ id, x, y, width, height, ... }` en píxeles reales.
- Ya existe un precedente de rotación en el proyecto, pero a otro nivel: `ajusteImagen.rotation` (dentro de `Forma`/`cara.ajusteImagen`, cambio 00140) rota solo la *imagen de relleno* de una figura o del fondo de una carta, no el elemento contenedor. El botón "Girar" de `src/ui/imageAdjustModal.js` (líneas ~190-193) cicla `rotation = (rotation + 90) % 360`, y `applyImageAdjustStyle` (líneas ~39-61) aplica `transform: rotate(Ndeg)` recalculando el ajuste de `cover` cuando la rotación es 90/270. Este mismo patrón de ciclo 0/90/180/270 es el propuesto para el nuevo campo `rotation` de `TextBox`/`Forma`.
- El menú contextual sobre un elemento (`openElementContextMenu` en `src/ui/visualEditorModal.js`, líneas ~569-621) ya tiene las acciones "Copiar", "Pegar", "Eliminar", "Colocar arriba", "Colocar abajo" — sitio propuesto para añadir "Girar 90°".
- El renderizado de estos elementos ocurre en dos puntos que deben mantenerse sincronizados: `src/ui/visualEditorModal.js` (`renderTextBox`/`renderShape`, lienzo del editor) y `src/ui/componentRenderer.js` (`paintCartaFace`, líneas ~281+, componente ya colocado en la mesa).
- Copiar/pegar dentro del editor (`copiedElement`/`pasteElementAt`) y "Copiar/Pegar estilo" (`core/styleClipboard.js`) son los mecanismos existentes que deben conservar el nuevo campo `rotation` igual que el resto de propiedades del elemento.
- **Incongruencia documentación/código detectada**: `design/docs/ARCHITECTURE.md` (sección 4, varias menciones en torno a las líneas 154-168) sigue llamando al editor visual `ui/cardEditorModal.js`; el fichero real, tras un renombrado posterior, es `src/ui/visualEditorModal.js` (el nombre antiguo también queda referenciado en un comentario de `src/ui/globalShortcuts.js`). El código manda: cualquier actualización de la documentación técnica derivada de este cambio debe usar `visualEditorModal.js`.
