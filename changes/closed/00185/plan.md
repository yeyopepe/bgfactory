- **Fecha creación**: 2026-08-07

## (a) Anotaciones funcionales

**Fuera de alcance:** ningún otro comportamiento se toca. No se modifica el indicador `.component-copy-badge` (sigue en rojo, `var(--error)`), ni la lógica de creación/sincronización de copias, ni ningún otro indicador de esquina (candado, oculto). Solo cambia el color de fondo de `.component-has-copies-badge`.

**Dudas resueltas con el usuario:** el usuario ya validó la maqueta (`design_indicador-tiene-copias-azul.html`, cambio 00185) y eligió la Opción B: token `--accent-blue-dark` (`#123a66`) como nuevo fondo del badge, en vez de `--accent-blue` (`#2c7dd8`). No ha surgido ninguna duda técnica nueva durante la planificación.

## (b) Solución técnica

1. **`src/styles/main.css` — cambiar el fondo de `.component-has-copies-badge`.** En la regla existente (línea 2500), sustituir `background: var(--error);` (línea 2508) por `background: var(--accent-blue-dark);`. Ningún otro valor de la regla cambia (`color: var(--text-light)` sigue dando contraste suficiente sobre el nuevo azul oscuro, mismo criterio que `.component-id-label`, que ya usa `--accent-blue-dark` de fondo con texto claro).
2. **`src/styles/main.css` — actualizar el comentario que precede a la regla.** El comentario de las líneas 2497-2499 dice hoy "mismo lenguaje visual que `.component-copy-badge` (icono, color `var(--error)`, esquina inferior izquierda)". Reescribirlo para reflejar que el color ya no coincide con `.component-copy-badge`:
   ```css
   /* Indicador de "Tiene copias": mismo icono y esquina inferior izquierda que
      .component-copy-badge, pero con fondo var(--accent-blue-dark) (no var(--error)) para no
      confundirse con el indicador de copia — y en forma de píldora con el número de copias
      vinculadas, ya que no cabe en el círculo fijo de 18px. */
   ```

## (d) Cambios en estilo

- **`design/docs/style/03-modales-menus.md`, §12.3, apartado `Indicador de "Tiene copias" (.component-has-copies-badge)`** — el texto actual dice: "Lenguaje visual idéntico a `.component-copy-badge` (mismo icono, mismo fondo `var(--error)`, `pointer-events: none`, permanente mientras el componente tenga copias vinculadas, solo modo edición vía `showCopyIndicator`) pero en forma de píldora en vez de círculo fijo...". Sustituir por una redacción que refleje que el fondo ya **no** coincide con `.component-copy-badge`: mismo icono/forma de píldora/esquina/`pointer-events`/condición de visibilidad, pero fondo `var(--accent-blue-dark)` — mismo azul que ya usa `.component-id-label` (§12.3, "Etiqueta identificativa de componente") — precisamente para diferenciarse a simple vista del indicador de copia (que sigue en rojo), en vez de compartir su familia visual.

## (e) Verificación

1. En modo edición, un componente original con al menos una copia vinculada muestra la píldora del indicador de "tiene copias" con fondo azul oscuro (mismo tono que la etiqueta identificativa `.component-id-label`), no rojo.
2. En modo edición, una copia sigue mostrando su indicador `.component-copy-badge` en rojo, sin cambios.
3. Ambos indicadores conviven sin confundirse visualmente: al ver un original con copias y una de sus copias a la vez, cada uno usa un color distinto (azul vs. rojo).
4. El texto "(N)" y el icono del indicador de "tiene copias" siguen siendo legibles (contraste suficiente) sobre el nuevo fondo azul oscuro.
