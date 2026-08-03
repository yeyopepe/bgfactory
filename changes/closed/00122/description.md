- **Nombre**: Transparencia en el color de fondo de cuadros de texto y figuras geométricas del editor de cartas
- **Código**: 00122
- **Tipo**: change

## Prompt original del usuario

añade la opción de aplicar un nivel de transparencia a los fondos de los cuadros de texto y figuras geométricas en el editor de cartas

## Descripción completa

Hoy, en el editor de cartas, tanto los cuadros de texto como las figuras geométricas (círculo/cuadrado) que se colocan sobre una cara de la carta tienen un color de fondo configurable que es sólido: o se elige un color opaco, o se marca la casilla "Transparente" y no se pinta ningún fondo. Este cambio añade un nivel de transparencia graduable (0-100%) para ese color de fondo, de forma que se pueda pintar con un color semitransparente en vez de solo opaco o invisible.

- En la sección de fondo de la modal de edición de un cuadro de texto y de la modal de edición de una figura geométrica, junto al selector de color y la casilla "Transparente" ya existentes, se añade un control deslizante (con su valor numérico visible, 0-100%) para el "Nivel de transparencia" del color de fondo elegido.
- El control solo tiene efecto, y solo aparece habilitado, cuando hay un color de fondo elegido (casilla "Transparente" desmarcada). Si "Transparente" está marcada, el control se deshabilita, ya que no hay ningún color al que aplicarle transparencia — mismo criterio que el control de transparencia de la imagen de fondo de una cara, que solo se muestra si esa cara tiene imagen.
- 0% significa color totalmente opaco (comportamiento actual, valor por defecto) y 100% significa color totalmente invisible (equivalente visual a "Transparente", pero sin perder el color elegido, que queda recordado si se vuelve a bajar el nivel).
- El nivel de transparencia se aplica igual en el lienzo del editor de cartas y en el renderizado final de la carta en la mesa (y en la miniatura de un mazo), de forma consistente.
- El borde del cuadro de texto/figura (color, grosor, activo/no activo) no se ve afectado por este nuevo control: solo afecta al color de fondo, exactamente igual que hoy el color de fondo y el borde son independientes entre sí.
- Cuadros de texto y figuras ya guardados antes de este cambio, sin este campo, se comportan como si el nivel fuera 0% (opaco, sin cambio visual) — mismo criterio de compatibilidad hacia atrás que el resto de campos opcionales de estos dos tipos de elemento.
- No hay roles ni distinción de usuarios/sesiones en el proyecto: el control está disponible para cualquiera que use el editor de cartas, igual que el resto de propiedades de diseño de una carta.

### Preguntas de alcance resueltas

- **¿Cómo se relaciona el nuevo nivel de transparencia con el "Transparente" ya existente?** Conviven: el nivel solo aplica cuando hay un color de fondo elegido; con "Transparente" marcado el control se deshabilita, ya que no hay color al que aplicarle transparencia.
- **¿En qué rango se guarda el nivel de transparencia?** 0-100%, mismo criterio que el resto de niveles de transparencia ya existentes en el proyecto (0 = opaco por defecto, 100 = invisible).

## Apuntes técnicos

- `TextBox` y `Forma` (ARCHITECTURE.md sección 4.3) ya tienen un campo `colorFondo` (string hex o vacío = transparente); se necesita un campo nuevo, p.ej. `colorFondoTransparencia` (number 0-100, 0 por defecto), mismo naming/rango/semántica que el ya existente `transparenciaImagen` de cara de carta.
- Precedente de UI directo a reutilizar: el slider 0-100 + campo numérico sincronizado de `ui/imageAdjustModal.js` (variable `opacitySlider`/`opacityTextInput`, aplicado hoy como `img.style.opacity = 1 - transparencia/100`).
- El color de fondo se aplica hoy como `style.backgroundColor = colorFondo || 'transparent'` en tres puntos: `ui/componentRenderer.js` (línea ~309 para Forma, ~331 para TextBox en carta/mesa) y en el lienzo de `ui/cardEditorModal.js`. Aplicar el nuevo nivel requiere convertir el hex + transparencia a `rgba(r,g,b,alpha)` con `alpha = 1 - colorFondoTransparencia/100` en esos mismos puntos, en vez de asignar el hex tal cual.
- El control se añade en `ui/cardTextBoxModal.js` (en torno a la línea 403-424, junto a `bgColorInput`/`bgTransparentCheckbox`) y en `ui/cardShapeModal.js` (en torno a la línea 98-120, mismo patrón duplicado a propósito, igual que el resto de campos de fondo entre estos dos módulos).
- `core/styleClipboard.js` no incluye hoy ninguna propiedad de `TextBox`/`Forma` individuales (solo propiedades de la carta completa), así que este nuevo campo no necesita añadirse ahí.
- No se ha detectado ninguna incongruencia entre ARCHITECTURE.md/STYLE_BIBLE.md y el código real durante este análisis.
