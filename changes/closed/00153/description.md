- **Nombre**: Color de fondo y borde des/activable en Tablero Simple
- **Código**: 00153
- **Tipo**: change
- **Fecha creación**: 2026-08-05

## Prompt original del usuario

en los tableros simples hay que añadir una propiedad "color de fondo" (permite transparente) si el tipo de fondo elegido es "color y patrón"
también añade, en las propiedades específicas del componente Tablero Simple, un check para des/activar el borde

## Descripción completa

En el componente "Tablero Simple" se añaden dos propiedades nuevas, editables desde sus propiedades específicas:

**1. Color de fondo (con opción "Transparente")**

Cuando el tipo de fondo elegido para el tablero es "Color y patrón", ya existe una ventana propia ("Configurar fondo — Color y patrón", accesible con el botón "Configurar fondo") donde se ajustan las propiedades de ese tipo de fondo (color del patrón, grosor, forma de casilla, filas, columnas). El nuevo campo "Color de fondo" se añade dentro de esa misma ventana, junto al resto de propiedades de "Color y patrón": un selector de color acompañado de un checkbox "Transparente". Este color se pinta detrás del patrón (las líneas o forma del patrón se siguen dibujando encima, con su propio color, sin verse afectadas).

Este campo solo existe dentro de la configuración de "Color y patrón" — no aparece ni afecta cuando el tipo de fondo es "Imagen" (que tiene su propia ventana de configuración, independiente).

Hasta ahora, el fondo de un tablero con "Color y patrón" era siempre blanco opaco, sin poder cambiarse. A partir de este cambio, ese color pasa a ser configurable, con la opción adicional de dejarlo transparente (para que se vea lo que haya debajo del tablero en la mesa).

Compatibilidad: los tableros que ya existan antes de este cambio, y los tableros nuevos mientras no se toque este campo, se siguen viendo exactamente igual que ahora (fondo blanco opaco) — el cambio no altera el aspecto de nada ya creado.

**2. Activar/desactivar borde**

Se añade un checkbox "Activar borde" junto a las propiedades de borde (color y grosor) que ya tenía el Tablero Simple. Hasta ahora el borde se dibujaba siempre, sin poder quitarse. A partir de este cambio, desmarcando ese checkbox el borde deja de dibujarse en el tablero; el color y el grosor que se hubieran configurado se conservan (no se pierden), simplemente dejan de aplicarse mientras el checkbox esté desmarcado. Al volver a marcarlo, el borde reaparece con los mismos valores que tenía.

Compatibilidad: tanto los tableros ya existentes como los nuevos nacen con el borde activado, para no alterar su aspecto actual.

**Alcance**

Ambos cambios afectan exclusivamente al componente "Tablero Simple". No afectan al componente "Tablero Personalizado", que tiene su propio sistema de fondo y borde independiente.

**Datos**

Ambas propiedades se guardan como parte de la configuración propia de cada tablero, igual que el resto de sus propiedades (color de borde, grosor, tipo de fondo, etc.): se conservan al guardar la partida, se incluyen al exportar, y no dependen de usuario ni de partida (la aplicación no distingue entre usuarios ni sesiones).

**Preguntas de alcance resueltas con el usuario**

- ¿El color de fondo aplica también al tipo de fondo "Imagen"? No, solo a "Color y patrón".
- ¿Qué patrón de campo usar para el color con opción transparente? El más simple ya usado en otras propiedades de color de fondo de la app (color + checkbox "Transparente"), sin control adicional de opacidad graduable.
- ¿El color de fondo va por delante o por detrás del patrón? Por detrás — el patrón se sigue viendo encima.
- ¿Qué aspecto tienen los tableros ya existentes tras este cambio? Ninguno cambia: nacen/quedan con fondo blanco opaco y borde activado, igual que antes.
- ¿Dónde se ubica el nuevo campo "Color de fondo"? Dentro de la ventana ya existente "Configurar fondo — Color y patrón" (el mismo sitio donde ya se configuran el resto de propiedades de ese tipo de fondo), no directamente en la lista de propiedades específicas del tablero — corrección del usuario tras ver el mockup inicial, que lo proponía fuera de esa ventana.

## Apuntes técnicos

- `ui/componentModal.js`: `DEFAULT_BOARD_PROPERTIES` (con `bordeColor`, `bordeGrosor`, `fondoTipo`, `patronColor`, etc.) y `renderBoardSpecificFields(container)` son el punto donde viven hoy los campos específicos de `tableroSimple`. La sección "Borde" (fieldset `modal__section`) es hoy meramente informativa (sin checkbox); pasa a seguir el patrón "des/activador" de `STYLE_BIBLE.md` sección 12.6 (checkbox delante del `<legend>`, deshabilita visualmente el resto de campos de la sección sin perder valores) — mismo patrón ya usado en `bordeActivo` de `Shape`/`TextBox` de carta.
- `ui/componentRenderer.js`, rama `component.type === 'tableroSimple'` (~línea 647 en adelante): hoy fija `board.style.backgroundColor = '#ffffff'` de forma hardcodeada cuando `fondoTipo !== 'imagen'` (línea 687) — este es el punto a sustituir por el nuevo color configurable. El bisel del borde (`shadeColor(bordeColor, ±0.35)` sobre los 4 lados) se calcula en las líneas 665-672; con el checkbox desactivado, ese bloque no debe aplicarse.
- Patrón "color + checkbox Transparente" simple ya usado en las propiedades específicas de `carta` (`componentModal.js`, campo "Color de fondo" ~línea 767-809): `colorFondo` vacío (`''`) representa transparente, valor hex si no. Renderizado con `hexToRgba` (`core/colorUtils.js`) en otros puntos del código (`Shape`/`TextBox` de carta) que además usan un segundo campo `colorFondoTransparencia` (0-100%) — variante con slider de opacidad, descartada para este cambio a favor de la versión simple sin ese campo.
- El campo "Color de fondo" va dentro de `ui/boardPatternModal.js` (`openBoardPatternModal`), la sub-modal "Configurar fondo — Color y patrón" que ya se abre desde el botón "Configurar fondo" de `componentModal.js` (`renderBoardSpecificFields`) cuando `fondoTipo === 'colorPatron'`. Esa sub-modal ya gestiona `patronColor`/`patronGrosor`/`patronForma`/`patronFilas`/`patronColumnas` sobre un objeto `working` local, aplicados a `props` solo al pulsar "Aceptar" (`onAccept`); el nuevo campo debe seguir el mismo circuito (añadirse a `working`, propagarse en `onAccept` de `componentModal.js` junto a los demás `props.patron*`). No toca `renderBoardSpecificFields` en sí más que para propagar el nuevo valor tras el `onAccept` de `openBoardPatternModal`.
- Nombres de propiedad a decidir en `ms-how` (no fijados aquí): algo como `props.colorFondo` (ojo: ya existe una propiedad `colorFondo` con otro significado en otros tipos de componente, no colisiona porque `properties` es específico por componente, pero conviene revisar consistencia de nombre) y `props.bordeActivo` (mismo nombre que ya usa `Shape`/`TextBox` de carta para el mismo concepto).
