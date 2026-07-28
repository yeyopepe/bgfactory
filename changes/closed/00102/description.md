- **Nombre**: Agrandar la ventana "Ajustar imagen"
- **Código**: 00102
- **Tipo**: change

## Prompt original del usuario

la ventan apara ajustar la imagen de cada cara de la carta debe ser más grande, como la ventana de edición de la carta

## Descripción completa

La ventana "Ajustar imagen" (donde el usuario ajusta el zoom, la transparencia y la posición de la imagen de cada cara de una carta, o de otros elementos con una sola cara) es actualmente pequeña y debe agrandarse, de forma similar en tamaño a la ventana "Editor de cartas".

Cambios concretos:

1. El marco de la ventana pasa de tener un ancho fijo pequeño a adaptarse a su contenido, con un ancho máximo notablemente mayor (similar al que ya usa hoy la ventana "Editor de cartas"). El alto máximo de la ventana no cambia respecto a como está hoy.
2. Las cajas donde se ve la previsualización de la imagen (las etiquetadas "Frontal" y "Trasera" cuando hay dos caras, o una sola caja cuando solo hay una) también crecen de tamaño de forma notable, para que el usuario vea la imagen con más detalle mientras la ajusta. No basta con agrandar solo el marco exterior de la ventana: si las cajas de previsualización se quedaran con su tamaño actual, el agrandamiento no aportaría nada útil.
3. Esta ventana es un componente compartido que se reutiliza para ajustar la imagen tanto de las dos caras de una carta como de otros elementos con una sola cara/imagen. El agrandamiento debe aplicarse por igual en todos los contextos donde se abre esta ventana, no solo cuando hay dos caras.
4. No hay cambios de datos, de persistencia ni de quién puede usar esta ventana: es un cambio puramente visual/de tamaño sobre una ventana ya existente. Los controles de Zoom y Transparencia, y su comportamiento, no cambian.

### Preguntas de alcance resueltas

- **¿A qué tamaño debe crecer el marco de la ventana?** Al mismo patrón de tamaño que ya usa la ventana "Editor de cartas" (ancho ajustado al contenido, con un máximo generoso, y un alto máximo igual al actual). Confirmado por el usuario.
- **¿Deben crecer también las cajas de previsualización de la imagen, o solo el marco de la ventana?** Deben crecer también, de forma notable, ya que es el elemento que el usuario necesita ver mejor mientras ajusta la imagen. Confirmado por el usuario.
- **¿Aplica el cambio a todos los usos de esta ventana o solo al de la carta?** Aplica a todos los contextos donde se abre esta ventana compartida. Confirmado por el usuario.

## Apuntes técnicos

- Ventana implementada en `src/ui/imageAdjustModal.js` (vanilla JS, sin framework), estilos en `src/styles/main.css`.
- El elemento raíz de la ventana usa la clase base `.modal` (`max-width: 500px`, `width: 90%`, `max-height: 80vh`, definidos en `main.css` ~línea 287).
- La ventana "Editor de cartas" (`src/ui/cardEditorModal.js`) ya resuelve un agrandamiento equivalente añadiendo una clase modificadora `.card-editor-modal` (`width: fit-content; max-width: min(1500px, 95vw)`, en `main.css` ~líneas 1052-1056) sobre el mismo `.modal` base — mismo patrón a replicar para "Ajustar imagen" (p. ej. una clase `.image-adjust-modal--large` o similar).
- El tamaño de las cajas de previsualización (Frontal/Trasera) se calcula en JS a partir de la constante `PREVIEW_MAX_SIDE = 220` (línea 25 de `imageAdjustModal.js`), usada para escalar `maskWidth`/`maskHeight` (líneas 95-98), que luego se aplican como `mask.style.width`/`height` inline (líneas 114-115). Aumentar el tamaño de las previsualizaciones implica subir esa constante (propuesta orientativa: ~380-400px, a validar por `ms-how` según el resto del layout del modal).
