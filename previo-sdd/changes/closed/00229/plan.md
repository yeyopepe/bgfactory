- **Creation date**: 2026-09-02
- **Risk**: 1/10 — Minimal risk — local change, easily reversible

## (a) Functional notes

**Out of scope:** No se refactoriza ninguna otra regla del botón `.mode-switcher__fit-btn` ni de `#mode-switcher`/`.edit-toolbar`. No se cambia el comportamiento ni la posición del botón. No se revisa ni reordena el resto de `src/styles/main.css`. Solo se restaura la especificidad del bloque de reglas de tamaño para que el icono vuelva a verse bien en modo juego.

**Doubts resolved with the user:** Ninguna pregunta abierta. La causa raíz ya venía localizada en `description.md` (Technical notes) y el análisis técnico la confirmó: el selector `.mode-switcher__fit-btn` (especificidad 0,1,0), tras el cambio 00228, pierde el `padding: 0` frente a `#mode-switcher button` (0,1,1) en modo juego, y el botón queda con `padding: 0.5rem 1rem` que deforma el icono dentro del `36×36` fijo.

## (b) Technical solution

- [x] **`src/styles/main.css` — restaurar la especificidad del bloque de reglas de tamaño de `.mode-switcher__fit-btn`.** Cambiar el selector de la regla actual (líneas ~127-134):
  ```css
  .mode-switcher__fit-btn {
    padding: 0;
    width: 36px;
    height: 36px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  ```
  por:
  ```css
  #mode-switcher .mode-switcher__fit-btn,
  #edit-toolbar > .mode-switcher__fit-btn {
    padding: 0;
    width: 36px;
    height: 36px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  ```
  Motivo: con el ancestro `#mode-switcher` el selector recupera especificidad 0,2,0 y vuelve a ganar el `padding: 0` frente a `#mode-switcher button` (0,1,1) en modo juego; incluir además `#edit-toolbar > .mode-switcher__fit-btn` (0,2,0, ya usado en la regla de coordenadas/color de la línea ~139) mantiene el mismo tamaño en modo edición y deja el selector robusto ante una futura regla `#edit-toolbar button`. No se toca el cuerpo de las declaraciones (mismos valores). No se toca la regla `.mode-switcher__fit-btn .icon-frame { width: 18px; height: 18px; display: block }` (línea ~155), que puede seguir siendo autónoma porque no compite con ninguna otra regla.

## (d) Style changes

`previo-sdd/design/docs/style/02-componentes-layout.md` §9, bullet "Botón icono-solo" → sub-bullet "Botón flotante cuadrado independiente" → sub-punto sobre `.mode-switcher__fit-btn` (añadido por el cambio 00228). Corregir la frase que dice que las reglas de tamaño de la clase son "autónomas (selector `.mode-switcher__fit-btn`, sin ancestro `#mode-switcher`)": tras este fix, el bloque de reglas de tamaño usa el selector `#mode-switcher .mode-switcher__fit-btn, #edit-toolbar > .mode-switcher__fit-btn` — enumera explícitamente los dos contenedores para ganar por especificidad a `#mode-switcher button` (que fija `padding: 0.5rem 1rem` a todos los botones descendientes de `#mode-switcher`). La sub-regla del icono (`.mode-switcher__fit-btn .icon-frame`) sí sigue siendo autónoma. Mantener el resto del sub-punto (posición fija en la esquina, `36×36`, fondo azul, común a los dos modos) sin cambios.

## (e) Verification

- [x] En **modo juego**, el botón "Ajustar zoom" de la esquina superior derecha muestra el icono de encuadre (cuatro esquinas) centrado y a su tamaño, sin recorte ni deformación, dentro del botón cuadrado azul de 36×36.
- [x] En **modo edición**, ese mismo botón sigue viéndose igual que antes (icono centrado, 36×36, fondo azul, esquina superior derecha) — el fix no lo ha alterado.
- [x] Alternar entre modo juego y modo edición mantiene el botón "Ajustar zoom" con aspecto idéntico en ambos.
- [x] El botón "Entrar en modo edición" (modo juego), que también cuelga de `#mode-switcher`, conserva su `padding` de texto normal (`0.5rem 1rem`) — el fix no lo afecta.
- [x] Pulsar el botón "Ajustar zoom" en cualquiera de los dos modos sigue reencuadrando la vista para ver todos los elementos.
