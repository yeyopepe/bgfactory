- **Name**: Botón "Ajustar zoom" en la misma esquina y color en ambos modos, y "Salir del modo edición" a la derecha
- **Code**: 00228
- **Type**: change
- **Creation date**: 2026-09-02

## Full description

En el editor de tableros hay un botón "Ajustar zoom" (un icono de encuadre que reencuadra la vista para que se vean todos los elementos de la mesa). Ese botón está disponible tanto en el modo juego como en el modo edición, y hace lo mismo en los dos.

Hoy no se ve igual en cada modo:

- En **modo juego** aparece arriba del todo, en la esquina superior derecha de la pantalla, como un botón cuadrado con fondo azul.
- En **modo edición** aparece más abajo, dentro de la barra de herramientas del modo edición (la franja que cruza toda la parte superior bajo el título), y con otro aspecto: sin fondo, solo un contorno claro.

Esto se percibe como una incoherencia: es el mismo botón con la misma función, pero cambia de sitio y de color según el modo.

### Comportamiento deseado

1. **Misma posición en los dos modos.** En modo edición, el botón "Ajustar zoom" deja de estar dentro de la barra de herramientas y pasa a mostrarse en la esquina superior derecha de la pantalla, exactamente en el mismo punto en el que ya aparece en modo juego (misma separación respecto al borde superior y al borde derecho). Queda por encima de la cabecera, sin taparse ni solaparse con la barra de herramientas del modo edición, que sigue justo debajo.

2. **Mismo color y forma en los dos modos.** El botón "Ajustar zoom" tiene el mismo aspecto en modo juego y en modo edición: botón cuadrado con fondo azul. Se abandona en modo edición el aspecto de solo contorno.

3. **Su función y su etiqueta accesible no cambian** en ninguno de los dos modos: sigue reencuadrando la vista para ver todos los elementos, y mantiene su texto descriptivo para lectores de pantalla.

### Reordenación de la barra de herramientas del modo edición

Al sacar el botón "Ajustar zoom" de la barra de herramientas del modo edición, esa barra queda con dos acciones: "Importar" y "Exportar".

- Se mueve el botón **"Salir del modo edición"** —que hoy está a la izquierda del todo de esa barra— al **extremo derecho** de la misma, después de "Importar" y "Exportar". El orden pasa a ser: **Importar · Exportar · Salir del modo edición**.
- "Salir del modo edición" **cambia de color**: pasa a tener fondo azul sólido con texto blanco (el mismo esquema de acción primaria que el botón "Entrar en modo edición" del modo juego), en lugar del contorno claro transparente que tiene hoy. Conserva su icono y su texto. Los otros botones de la barra ("Importar", "Exportar") mantienen su estilo de contorno transparente.

## Technical notes

- Ambos botones se generan en `src/ui/editModeToggle.js`:
  - `createFitButton(className)` crea el botón "Ajustar zoom". En modo juego lo monta `renderModeSwitcher` dentro del contenedor `#mode-switcher` con la clase `mode-switcher__fit-btn`; en modo edición lo monta `renderEditToolbar` dentro de `.edit-toolbar` (grupo `.toolbar-group--view`) sin clase, heredando el estilo de `.edit-toolbar button`.
  - `renderEditToolbar` construye la barra con grupos `.toolbar-group` separados por `.toolbar-divider`; el botón "Salir del modo edición" es el primer grupo (`sessionGroup`). Hay que moverlo al final y darle estilo de acción primaria (fondo `var(--accent-blue)`, texto `var(--text-light)`) — no puede heredar tal cual `.edit-toolbar button` (contorno transparente); necesita una clase/regla propia que solo afecte a ese botón, sin tocar "Importar"/"Exportar".
- `#mode-switcher` en `src/styles/main.css`: `position: fixed; top: 0.5rem; right: 1rem; z-index: 101` (por encima de la cabecera `h1`, `z-index: 100`). `.mode-switcher__fit-btn`: `36×36`, `padding: 0`, fondo `var(--accent-blue)` heredado de `#mode-switcher button`.
- `.edit-toolbar` es una franja en el flujo flex (hija de `<body>` tras el `<h1>` de `3.5rem`), no flotante — de ahí que el botón aparezca "desplazado hacia abajo" en modo edición.
- Para modo edición hay que renderizar el botón "Ajustar zoom" como elemento fijo en la esquina superior derecha (reutilizando `mode-switcher__fit-btn` y las coordenadas de `#mode-switcher`, o montándolo también en ese contenedor). Revisar `#mode-switcher button` (regla que da el fondo azul) para que aplique igual en modo edición, y `.toolbar-group--view` por si queda sin uso.
- La documentación de estilo (`design/docs/style/02-componentes-layout.md` §9) ya describe `.mode-switcher__fit-btn` como "botón flotante cuadrado independiente (36px), mismo fondo/color de acción primaria del contexto" — el resultado esperado es coherente con esa guía. No se detectó ninguna inconsistencia entre documentación y código.
- Sin implicaciones de seguridad: cambio puramente visual/de layout, sin datos, red, entradas nuevas ni persistencia.
