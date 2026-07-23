## (a) Anotaciones funcionales

- Fuera de alcance: no cambia la magnitud del desplazamiento (`translate(-4px, -9px)`) ni la intensidad de la sombra del efecto `.lifted`, ni el momento en que se activa/desactiva (sigue disparándose exactamente igual, al empezar/terminar el arrastre). Tampoco se extiende este efecto a Modo Edición.
- Duda resuelta con el usuario: ¿se confirma invertir la regla de "instantáneo, sin transición" que documenta hoy la Style Bible para este efecto? → Sí, se invierte solo para `.lifted`; se mantiene la prohibición general de animaciones complejas (`@keyframes`, animaciones narrativas) para el resto de casos (temblor/parpadeo del dado, contorno de selección).
- Duda resuelta con el usuario: ¿qué duración/easing? → El token estándar ya usado en toda la app para transiciones de interacción: `var(--transition-fast)` (150ms ease).
- Duda resuelta con el usuario: ¿aplica solo al soltar o a ambos gestos? → A ambos (levantar y soltar), de forma simétrica.

## (b) Solución técnica

1. **`src/styles/main.css`** (~línea 1537-1544): añadir `transition: transform var(--transition-fast), box-shadow var(--transition-fast);` a la regla `.lifted`. No hace falta ninguna otra propiedad transicionada (solo `transform` y `box-shadow` cambian entre el estado normal y `.lifted`).
2. Actualizar el comentario adjunto a `.lifted` en el mismo fichero, que hoy dice explícitamente "Cambio de aspecto instantáneo (sin transición), igual que siempre" — dejar de decir que es instantáneo y reflejar que ahora transiciona con el token estándar de la app.
3. No hace falta tocar `ui/componentRenderer.js`: `beginDragLift`/`endDragLift` (líneas ~251-258) solo añaden/quitan la clase `.lifted` vía `classList`; la transición CSS entre ambos estados la gestiona el navegador automáticamente sin cambios de lógica JS. Como la clase se añade/quita simétricamente en ambas funciones, el mismo `transition` cubre tanto el gesto de levantar como el de soltar sin tratamiento especial por separado.

## (d) Cambios en estilo

- **`STYLE_BIBLE.md`, sección 13, apartado "Efecto 'levantar' al arrastrar en Modo Juego"**: reescribir la frase "Es un cambio de aspecto instantáneo (se añade/quita la clase de golpe), sin `transition` ni `@keyframes` — coherente con la prohibición de animaciones complejas de esta sección" para reflejar que `.lifted` ahora usa `transition` con `var(--transition-fast)` (el mismo token ya documentado en la sección 6 para hover/foco de elementos interactivos), aplicada tanto al levantar como al soltar. Dejar explícito que esto no reabre la prohibición general de animaciones complejas de la sección 13 (`@keyframes`, animaciones narrativas), que sigue aplicando sin cambios al resto de casos (temblor/parpadeo del dado, contorno de selección `--selectable`/`--selected`).
