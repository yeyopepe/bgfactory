## (a) Anotaciones funcionales

Sin dudas de alcance pendientes de resolver con el usuario. Queda fuera de alcance cualquier otro comportamiento del editor de cartas no relacionado con la aplicación de la tipografía en la vista previa (p. ej. no se toca cómo se elige la tipografía en `ui/cardTextBoxModal.js`, ni el renderizado de la carta ya colocada en la mesa en `ui/componentRenderer.js`, que ya funciona correctamente).

## (b) Solución técnica

1. **`src/ui/cardEditorModal.js`**: importar `fontFamilyFor` de `./fontFaceRegistry.js` (mismo import ya usado con este propósito en `ui/componentRenderer.js`).
2. En la función `renderTextBox(caraKey, textBox, previewScale)` (línea ~399), justo junto al resto de estilos inline que ya aplica (`fontSize`, `color`, `fontWeight`, etc.), añadir la resolución y aplicación de la tipografía, replicando exactamente el mismo patrón que ya usa `ui/componentRenderer.js` (línea ~1096-1099) para el mismo campo `textBox.fuenteResourceId`:
   ```js
   const fontResource = textBox.fuenteResourceId ? getResources().find((r) => r.id === textBox.fuenteResourceId) : null;
   if (fontResource) {
     el.style.fontFamily = fontFamilyFor(fontResource.id);
   }
   ```
   `getResources` ya está importado en `ui/cardEditorModal.js` (usado en otros puntos del fichero), así que no hace falta añadir ese import.

Con esto, cada vez que `renderFaces()` vuelve a invocar `renderTextBox` (tanto tras aceptar el cambio de tipografía en `ui/cardTextBoxModal.js` como en cualquier otro re-render), el elemento del cuadro de texto se crea ya con el `fontFamily` correcto — mismo criterio de "tipografía por defecto" que el resto de la app cuando `fuenteResourceId` es `null` o el recurso ya no existe (no se aplica ningún `fontFamily`, y el elemento hereda la tipografía por defecto del documento).

No hace falta ningún cambio en `ui/cardTextBoxModal.js` (donde se elige la tipografía) ni en `ui/fontFaceRegistry.js` (el registro de `@font-face` ya se sincroniza globalmente y ya cubre este uso).
