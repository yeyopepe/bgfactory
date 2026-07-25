- **Nombre**: Compactar espacio central del editor de cartas entre las dos caras
- **Código**: 00092
- **Tipo**: change

## Prompt original del usuario

el espacio central entre las dos caras es demasiado ancho, hay mucho espacio en blanco con el botón ajustar imagen en medio. deberían quedar ambas zonas más cerca (parte de la carta frontal y parte de la trasera) y en medio, mejor ajustado, el botón de ajustar imagen. Quiero un mockup para validarlo

## Descripción completa

En el editor de cartas (modal "Editor de cartas" del modo edición de componentes), el botón "Ajustar imagen…" se encuentra situado entre la cara frontal y la cara trasera de la carta. Con la disposición actual, ambas caras quedan muy separadas entre sí, dejando un hueco central de espacio en blanco excesivo en el que el botón queda flotando, sin sensación de estar bien encajado entre las dos zonas.

Se pide un ajuste puramente visual (sin cambiar ningún comportamiento) para que:
- La cara frontal y la cara trasera se muestren visualmente más próximas entre sí, reduciendo el espacio en blanco entre ellas.
- El botón "Ajustar imagen…" quede mejor ajustado dentro de ese espacio central reducido, sintiéndose parte de la transición entre ambas caras en lugar de perdido en un hueco amplio.

No cambia ni la posición relativa del botón (sigue entre las dos caras) ni su comportamiento de habilitación (sigue activo solo cuando al menos una de las dos caras tiene una imagen seleccionada).

### Dudas de alcance resueltas

1. **Comportamiento en pantallas estrechas**: el editor ya apila las caras verticalmente cuando no cabe todo en horizontal. Se mantiene ese apilado tal cual; el ajuste de espaciado solo afecta a cómo se ve el conjunto cuando las dos caras están una junto a otra (horizontal).
2. **Convivencia con lo existente**: este cambio no sustituye ni la posición del botón ni su lógica de habilitación (ambas ya validadas y funcionando), solo corrige el espaciado visual de esa misma disposición.
3. **Datos**: no aplica; es un ajuste de maquetación, no hay datos implicados.
4. **Quién lo usa**: mismo alcance actual — cualquier usuario que abra el editor de cartas desde el modo edición de componentes.
5. **Definición visual de alto nivel**: el conjunto formado por cara frontal + botón + cara trasera debe verse compacto y centrado en el modal, con las dos caras próximas entre sí y el botón encajado justo en el hueco entre ambas, sin espacio sobrante ni a los lados del botón ni entre este y cada cara.

Se adjunta una propuesta visual (mockup) con esta disposición más compacta para validar antes de planificar la solución técnica.

## Apuntes técnicos

- El layout actual vive en `src/ui/cardEditorModal.js` (contenedor `facesRow` con clase `card-editor-modal__faces`, que inserta `renderFace('caraFrontal')`, el botón `adjustImageBtn` y `renderFace('caraTrasera')` en ese orden) y en `src/styles/main.css`.
- Reglas CSS relevantes (`src/styles/main.css`): `.card-editor-modal` (`max-width: 1100px`), `.card-editor-modal__faces` (`display: flex; gap: 1.5rem; flex-wrap: wrap; justify-content: center;`) y `.card-editor-modal__adjust-image` (`align-self: center;`).
- Este espaciado amplio se introdujo en el change `fast-mueve-boton-ajustar-imagen-entre-caras_20260725` (subida de `max-width` de 920px a 1100px para colocar el botón entre caras sin envolver). Este cambio 00092 corrige ese resultado visual sin deshacer la posición del botón.
- El ancho de cada cara (`.card-editor-modal__canvas`) es variable: se calcula en JS a partir de `getDesignSize(working.proporcion)` y un `previewScale`, según la proporción de carta elegida (p.ej. "Poker estándar vertical 5:7"), así que la solución de espaciado debe funcionar con distintos anchos de canvas, no solo con el de la proporción por defecto.
