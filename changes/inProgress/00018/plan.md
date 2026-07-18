## (a) Anotaciones funcionales

Sin dudas técnicas pendientes de resolver con el usuario: la petición y el `description.md` ya dejan la semántica nueva completamente definida (checkbox "Bloqueado", marcado = no se puede mover en Modo Juego, por defecto; desmarcado = sí se puede mover) y confirman que no hace falta migración de datos (el mecanismo de versión ya existente invalida automáticamente los estados guardados con la semántica antigua).

Fuera de alcance: no se toca la clase CSS `text-box--movable` ni el resto del mecanismo de arrastre de `ui/componentRenderer.js` (drag, conversión de coordenadas, cursor) — solo cambia qué condición decide si un componente concreto es arrastrable en Modo Juego.

## (b) Solución técnica

1. **`src/core/component.js`**: renombrar el campo `moverEnModoJuego` a `bloqueado` en `createComponent()`, invirtiendo su valor por defecto de `false` a `true`.
2. **`src/ui/componentModal.js`**: en la pestaña "Generales":
   - Renombrar la variable/checkbox y su lectura/escritura de `workingComponent.moverEnModoJuego` a `workingComponent.bloqueado`.
   - Cambiar el texto de la etiqueta (`moveLabel`) de "Mover en Modo Juego" a "Bloqueado".
   - Actualizar el texto pasado a `createHelpIcon` para reflejar la nueva semántica, p.ej.: "Si está marcado, este componente no se puede mover en Modo Juego (opción activada por defecto). Desmárcalo para poder arrastrarlo libremente por la mesa mientras se juega."
3. **`src/modes/play/playMode.js`**: invertir la condición `canMove`, de `(component) => component.moverEnModoJuego === true` a `(component) => component.bloqueado !== true`.
4. Comprobar que no queden más referencias a `moverEnModoJuego` en `src/` (fuera de `src/_output/`, que son builds ya generados y no se tocan).

Orden de implementación: 1 → 2 → 3, y verificación final (4).

## (c) Cambios de arquitectura

En `design/docs/ARCHITECTURE.md`:
- En el bloque de forma del componente (sección donde se documenta `moverEnModoJuego: boolean, // ...`), sustituir esa línea por `bloqueado: boolean, // si el componente NO se puede mover en modo juego (true por defecto)`.
- En el párrafo que sigue a ese bloque (el que empieza "`createComponent()` inicializa..."), actualizar la frase sobre `moverEnModoJuego` para hablar de `bloqueado`, su valor por defecto `true`, y que ahora `modes/play/playMode.js` habilita el arrastre cuando **no** está marcado.
- En la descripción de `ui/componentRenderer.js` (sección 5), donde dice "...este último limitando el arrastre a los componentes con `moverEnModoJuego === true`...", cambiar a la condición inversa sobre `bloqueado`.
- En la descripción de `ui/componentModal.js` (sección 5), donde dice "...checkbox "Mover en Modo Juego" (con `ui/helpIcon.js` asociado) que fija `component.moverEnModoJuego`", actualizar el nombre del checkbox a "Bloqueado" y el campo a `component.bloqueado`.
- En la descripción de `ui/helpIcon.js` (sección 5), donde dice "...ayuda del checkbox "Mover en Modo Juego"", actualizar a "Bloqueado".

## (d) Cambios en estilo

No aplica: este cambio no introduce ni modifica convenciones de estilo visual, de interacción o de redacción — solo invierte la semántica y el texto de un checkbox ya existente, sin afectar a `styleBibleDocPath`.
