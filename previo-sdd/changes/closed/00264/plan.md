- **Creation date**: 2026-09-14

## (a) Functional notes

**Out of scope:** no se toca ningún otro comportamiento de `.lifted` (transform, transición, cuándo se añade/quita) ni de las piezas rectangulares/circulares, que siguen usando `box-shadow` exactamente como hoy. Tampoco se toca `.carta--flip-feedback` (mecanismo independiente, no se solapa con `.lifted` en la práctica). No se introduce ningún nuevo estado ni clase con significado propio: solo se corrige qué tipo de sombra usa `.lifted` cuando coincide con una silueta no rectangular ya existente.

**Doubts resolved with the user:** ninguna — el mockup `design_lift-shadow-shape.html` ya fue validado por el usuario y confirma el criterio (la sombra de "levantado" debe seguir la silueta real, igual que en reposo).

## (b) Technical solution

- [x] **`src/styles/main.css` — anular el `box-shadow` de `.lifted` para las piezas no rectangulares y aplicarles en su lugar un `filter: drop-shadow` equivalente al de reposo.** Justo después de la regla `.lifted` (línea ~3537), añadir un bloque de reglas compuestas que se apliquen solo cuando `.lifted` coincide con `.dice`, `.carta--hex` o `.carta--triangle` en el mismo elemento (así ocurre siempre: `dice.className = 'dice'`/`carta.className = 'carta'` ya llevan la clase de forma, y `beginDragLift` añade `.lifted` al mismo nodo — ver `componentRenderer.js`). Estas reglas deben ir **después** de `.lifted` en el archivo para ganar por orden de aparición (misma especificidad, un solo selector compuesto de dos clases cada uno):

  ```css
  /* Piezas de silueta no rectangular (recorte con clip-path en un hijo
     interior): en reposo ya usan filter: drop-shadow para que la sombra siga
     la silueta real en vez de la caja exterior (ver .dice / .carta--hex,
     .carta--triangle más arriba). El box-shadow fijo de .lifted no respeta
     ese recorte porque se pinta sobre la caja rectangular del propio
     elemento — aquí se sustituye por un filter: drop-shadow equivalente
     (mismo desplazamiento/opacidad aproximada que el box-shadow de .lifted)
     solo para esta combinación, sin alterar .lifted para el resto de piezas. */
  .dice.lifted,
  .carta--hex.lifted,
  .carta--triangle.lifted {
    box-shadow: none;
    filter: drop-shadow(6px 7px 6px rgba(0, 0, 0, 0.40));
  }
  ```

  El valor de `filter: drop-shadow(...)` es una aproximación visual del `box-shadow` de `.lifted` (`6px 7px 9px 2px rgba(0,0,0,0.35)`) expresada como `drop-shadow` (que no admite el 4º parámetro *spread*): mismo desplazamiento `6px 7px`, radio de desenfoque intermedio entre los `9px`/`2px` originales, opacidad muy similar (`0.40` vs `0.35`) para compensar que `drop-shadow` sombrea silueta+ángulos más ajustados y perceptualmente puede leerse algo más tenue que un `box-shadow` equivalente en un rectángulo. `transform`/`transition` de `.lifted` no cambian: siguen aplicándose igual (un elemento puede tener `filter` y `transform` simultáneos sin conflicto).

## (d) Style changes

- **`design/docs/style/001-tokens-visual.md`**, sección "'Lift' effect on dragging in play mode": añadir una nota indicando que, igual que en reposo, `.dice`/`.carta--hex`/`.carta--triangle` sustituyen el `box-shadow` de `.lifted` por un `filter: drop-shadow` equivalente mientras están en ese estado (selectores compuestos `.dice.lifted`, `.carta--hex.lifted`, `.carta--triangle.lifted`), para que la sombra de "levantado" siga la silueta real en vez de la caja rectangular — mismo criterio documentado ya en "Elevation, shadow and transition" para el estado en reposo, ahora también cubriendo el estado transitorio `.lifted`.

## (e) Verification

- [x] En Modo Juego, arrastrar una carta con proporción `triangulo` (o `triangulo-invertido`): mientras se arrastra, la sombra/marco visible sigue el contorno del triángulo, sin ninguna esquina rectangular sobresaliendo fuera de la silueta. Verificado con Playwright (captura de pantalla): la sombra sigue exactamente el triángulo.
- [x] En Modo Juego, arrastrar una carta con proporción `hex-vertical` (o `hex-horizontal`): mismo resultado, la sombra sigue el hexágono. Verificado con Playwright: la sombra sigue exactamente el hexágono.
- [x] En Modo Juego, arrastrar el componente `'dado'`: la sombra sigue su silueta (triángulo/cuadrado/rombo/decágono según el número de caras configurado), sin marco rectangular. Verificado con Playwright (dado de 4 caras, silueta triangular): la sombra sigue la silueta.
- [x] En Modo Juego, arrastrar una carta con proporción rectangular (`5:7`, `1:1`, etc.) y un `'tableroSimple'`: el efecto de "levantado" no cambia respecto al comportamiento actual (sigue mostrando el `box-shadow` rectangular tal cual). Verificado con Playwright: ambos casos muestran `.lifted` con su `box-shadow` original sin alterar.
- [x] Al soltar el arrastre en cualquiera de los casos anteriores, la pieza vuelve suavemente a su sombra de reposo (misma transición `var(--transition-fast)` de antes, sin salto brusco). No se ha modificado ninguna propiedad de `transition` — revisado por inspección del CSS resultante (misma declaración `transition` de `.lifted` que antes, no sobreescrita por las nuevas reglas).
