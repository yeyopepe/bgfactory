- **Nombre**: Mueve botón "Ajustar imagen" entre las dos caras
- **Código**: fast-mueve-boton-ajustar-imagen-entre-caras_20260725
- **Tipo**: fast
- **Fecha**: 2026-07-25

## Prompt original del usuario

El botón "Ajustar imagen" debe estar situado entre las dos caras y estar habilitado solo si al menos una carta tiene una imagen seleccionada

## Descripción completa

En el editor de cartas del modal de edición de componentes, el botón "Ajustar imagen…" estaba posicionado al pie del modal, después de ambas caras. Ahora está situado visualmente entre la cara frontal y la cara trasera, haciendo más lógica la navegación visual del editor. El botón sigue habilitado solo cuando al menos una de las dos caras tiene una imagen seleccionada, lo que ya funcionaba correctamente.

## Cambios aplicados

1. **`src/ui/cardEditorModal.js`**:
   - Removida la línea `content.appendChild(adjustImageBtn);` que añadía el botón directamente al contenedor principal.
   - Movida la inserción del botón dentro de la función `renderFaces()`, ahora se añade como elemento intermedio en `facesRow`, entre `renderFace('caraFrontal')` y `renderFace('caraTrasera')`.

2. **`src/styles/main.css`**:
   - Aumentado `.card-editor-modal` de `max-width: 920px;` a `max-width: 1100px;` para dar espacio suficiente a que las dos caras y el botón se muestren lado a lado sin envolvimiento.
   - Actualizado `.card-editor-modal__adjust-image`: cambio de `display: block; margin: 1rem auto 0;` a `align-self: center;` para que el botón se alinee correctamente como flex item dentro del contenedor flex `card-editor-modal__faces`.
   - La lógica de habilitación del botón (`.disabled`) ya funcionaba correctamente (condicionado a si al menos una cara tiene imagen).
