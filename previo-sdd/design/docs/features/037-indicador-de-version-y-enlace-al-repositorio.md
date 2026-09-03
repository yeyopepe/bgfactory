# 037 — Indicador de versión y enlace al repositorio

**Area**: Mesa de juego

En la esquina inferior derecha de la pantalla aparece un pequeño texto gris con dos líneas:

- La primera con el nombre de la aplicación seguido de la versión actual del prototipo (por ejemplo, `BG Factory v00245`).
- La segunda con un enlace al repositorio del proyecto en GitHub. El enlace, al pulsarlo, abre el repositorio (`https://github.com/yeyopepe/bgfactory`) en una pestaña nueva del navegador, sin sacar al usuario de la aplicación. El texto del enlace se muestra en el idioma activo de la aplicación (`Ver en Github` en español, `View on GitHub` en inglés); ver [Aplicación multi-idioma y panel de configuración](038-aplicacion-multi-idioma-y-panel-de-configuracion.md).

Todo el bloque va en un gris tenue y a tamaño pequeño, alineado a la derecha y anclado a la esquina inferior derecha. El enlace se distingue del resto por ir subrayado, con el mismo color gris que la línea de la versión. El contenido es fijo del proyecto: el usuario no puede editarlo. Se muestra igual en modo juego y en modo edición.

- **Available in**: Modo juego y modo edición, esquina inferior derecha de la pantalla
- **Code**: 00243, 00244
- **Since**: 2026-09-03
- **Last modified**: 2026-09-03
