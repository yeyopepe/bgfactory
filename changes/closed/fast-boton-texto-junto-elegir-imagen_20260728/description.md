- **Nombre**: Botón "+ Texto" junto a "Elegir imagen..." en el editor de cartas
- **Código**: fast-boton-texto-junto-elegir-imagen_20260728
- **Tipo**: fast
- **Fecha**: 2026-07-28

## Prompt original del usuario

el botón "+ texto" debe estar arriba, al lado de "elegir imagen..."

## Descripción completa

En el Editor de cartas, el botón "+ Texto" de cada cara (frontal/trasera) aparecía debajo de los controles de Borde, al final de la fila de acciones. Ahora aparece justo al lado de "Elegir imagen...", en la parte superior de esa fila, antes de los controles de Borde.

## Cambios aplicados

- [src/ui/cardEditorModal.js](src/ui/cardEditorModal.js): dentro de `renderFace`, se movió la creación y el `appendChild` del botón `addTextBoxBtn` ("+ Texto") para que ocurra inmediatamente después de `actionsRow.appendChild(chooseImageBtn)`, en vez de después del bloque de "Borde". No se cambió ninguna lógica ni estilo, solo el orden de inserción en `actionsRow`.
