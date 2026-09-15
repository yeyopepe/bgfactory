- **Name**: Indicador de modo edición y renombrado del botón "Modo Juego"
- **Code**: 00283
- **Type**: change
- **Creation date**: 2026-09-15

## Full description

En modo edición se añade un pequeño indicador de texto, situado debajo del título del juego, que confirme visualmente que la aplicación está en ese modo. El texto reutiliza la misma etiqueta que ya usa el botón de cambio a modo edición ("Modo Edición"), en vez de introducir una redacción nueva. Este indicador solo aparece en modo edición; en modo juego no se muestra nada nuevo.

Además, el botón que permite pasar de modo edición a modo juego (hoy con el texto "Modo Juego") cambia su texto a "Ir al Modo Juego", para dejar más claro que es una acción de navegación hacia el otro modo. El botón que permite pasar de modo juego a modo edición (hoy "Modo Edición") no cambia.

Puntos de alcance resueltos con el usuario:
- El indicador no afecta a datos, persistencia ni permisos: es puramente visual/textual.
- El indicador desaparece por completo al volver a modo juego (no queda ningún rastro).
- El cambio de texto del botón afecta únicamente al botón de salida de modo edición (paso a modo juego), no al de entrada a modo edición.
- El indicador debe tener un tamaño y color claramente visibles (no un texto apagado/diminuto): validado con un tamaño de letra intermedio entre el texto normal de la interfaz y el título, en un tono azul de acento.
- La franja de cabecera en modo edición incorpora además una trama sutil de fondo (líneas diagonales muy tenues sobre el degradado ya existente), para reforzar visualmente que se está en ese modo.

## Technical notes

- El indicador de modo edición encaja de forma natural en `src/ui/appTitle.js`, que ya conoce el modo activo (`getState().mode` / `MODES.EDIT`) y repinta `h1#app-title` en cada cambio de modo o de título (`renderAppTitle`). El texto puede reutilizar la clave i18n existente `toolbar.modeEdit` ("Modo Edición") en vez de crear una clave nueva.
- El texto del botón de salida de modo edición se genera en `src/ui/editModeToggle.js`, función `createModeButton()`. Importante: la rama `isPlay === false` (app en modo edición) es la que usa `iconTextButton(iconSvg('mode-play'), t('toolbar.modePlay'))` — icono + texto —, y es esa clave (`toolbar.modePlay`) la que hay que cambiar de "Modo Juego" a "Ir al Modo Juego" en `src/data/i18n.es.js`, con su equivalente en `src/data/i18n.en.js` ("Play Mode" → p. ej. "Go to Play Mode"). La rama `isPlay === true` (app en modo juego) es texto plano sin icono con la clave `toolbar.modeEdit` ("Modo Edición") y no se toca.
- Hay tests funcionales que verifican el texto de este botón por su clave i18n (`src/test/functional/top-controls.test.js`), así que seguirán pasando al cambiarse solo el valor de la clave, no la clave en sí.
- Mockups validados en `design_cabecera-modo-edicion.html` y `design_cabecera-modo-juego.html`: el indicador usa un tamaño intermedio entre el texto normal de la interfaz y el título (equivalente al token `--text-md`, 18px) en un tono azul de acento sobre el fondo oscuro de la cabecera; además, la franja de cabecera en modo edición añade una trama sutil de líneas diagonales muy tenues sobre el degradado de fondo ya existente (`h1`, `src/styles/main.css`), para reforzar visualmente el modo activo.
