## (a) Anotaciones funcionales

- Fuera de alcance: no se cambia el criterio de cuándo se muestra la etiqueta (hover/selección), ni el tooltip nativo del modo juego, ni ningún otro comportamiento del cambio 00032 — solo su posicionamiento respecto al componente.
- No hubo dudas que resolver con el usuario: se verificó con una reproducción real (Playwright) que la etiqueta sí se genera en el DOM con el texto correcto (fix 00033 funcionó), pero queda visualmente oculta detrás de la cabecera fija de la app cuando el componente está muy cerca del borde superior de la mesa (caso del componente de texto de ejemplo, que arranca en `x=0, y=0`).

## (b) Solución técnica

1. **Causa raíz**: `.component-id-label` (`src/styles/main.css`) se posiciona con `top: -1.4rem`, es decir, completamente por encima del borde superior del componente. Cuando el componente está cerca del origen de la mesa (`y` bajo) y la cámara está en su posición por defecto, ese desplazamiento hacia arriba cae detrás de la cabecera fija de la app (`z-index` superior, sección 10 de `STYLE_BIBLE.md`), dejando la etiqueta oculta aunque exista y esté en `display: block`. Los componentes creados por el usuario no lo sufren porque arrancan con un pequeño margen (`x`/`y` >= 100), suficiente para que la etiqueta no llegue a solaparse con la cabecera.
2. **`src/styles/main.css`, regla `.component-id-label`**: cambiar el anclaje para que la etiqueta quede siempre dentro del área ocupada por el propio componente (superpuesta a su esquina superior izquierda) en vez de sobresalir por encima — así nunca depende de que haya espacio libre por encima del componente, sea cual sea su posición en la mesa. Cambiar `top: -1.4rem; left: -3px;` por `top: 2px; left: 2px;` (mismo `pointer-events: none`, fondo, tipografía y demás propiedades sin cambios). Se mantiene el comportamiento ya acordado de poder sobresalir del ancho del componente si el id es largo (`white-space: nowrap`, sin recorte).
3. Verificar visualmente con el mismo caso reproducido (componente de texto de ejemplo en `x=0, y=0`, modo edición, hover) que la etiqueta queda ahora completamente visible, sin quedar tras la cabecera.

## (d) Cambios en estilo

- Actualizar `STYLE_BIBLE.md` sección 12.3 (añadida en el cambio 00032): la etiqueta ya no "sobresale por encima" del componente sino que se superpone a su esquina superior izquierda, precisamente para no depender de que haya espacio libre por encima y evitar que quede oculta tras la cabecera u otro elemento fijo cuando el componente está cerca del borde de la mesa.
