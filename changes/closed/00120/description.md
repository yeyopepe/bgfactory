- **Nombre**: Checkbox activador de borde en figuras geométricas de carta
- **Código**: 00120
- **Tipo**: fix

## Prompt original del usuario

En las propiedades de las nuevas figuras geométricas, la sección del borde debe ser igual que en el resto de la app, con un check para indicar si habrá borde o no

## Descripción completa

Al configurar una figura geométrica (círculo/elipse o cuadrado) del editor de cartas, la sección "Borde" de su modal se comporta hoy de forma distinta al resto de elementos configurables similares de la app: es una sección meramente informativa donde el grosor puede valer `0` para indicar "sin borde". Se espera que se comporte igual que el borde de un cuadro de texto de carta, que usa un checkbox explícito "Activar borde": con el checkbox desmarcado no hay borde (los campos de color y grosor quedan deshabilitados pero conservan su valor sin perderlo), y marcado se aplica el color/grosor configurados. El rango de grosor pasa de 0–20 a 1–20, ya que `0` deja de tener sentido como valor especial.

Para no cambiar el aspecto que ya tenían las figuras creadas hasta ahora (nacían con un borde visible de 2px por defecto), una figura nueva debe seguir naciendo con el borde activado.

## Apuntes técnicos

- `ui/cardShapeModal.js` (cambio 00118): cambiar el `fieldset.modal__section` "Borde" (hoy meramente informativo) al patrón `modal__section-title--toggle` que ya usa `ui/cardTextBoxModal.js` para su propio borde (checkbox en el `<legend>`, clase `modal__section--disabled` + `disabled` en los inputs mientras está desmarcado).
- Modelo de datos `Forma` (`caraFrontal`/`caraTrasera` de `'carta'`, `design/docs/ARCHITECTURE.md` sección 4): añadir campo `bordeActivo: boolean`.
- `ui/cardEditorModal.js` (`renderShape`, y la creación de una figura nueva desde el menú "Añadir elemento") y `ui/componentRenderer.js` (`paintCartaFace`): la condición para pintar el borde de una figura pasa de `shape.bordeGrosor > 0` a `shape.bordeActivo`.
- Actualizar `ARCHITECTURE.md`, `STYLE_BIBLE.md` y `FEATURES.md` en los puntos donde el cambio 00118 documentó el borde de una figura como "sin checkbox activador" — ese texto queda obsoleto con este fix.
