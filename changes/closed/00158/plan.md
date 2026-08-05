- **Fecha creación**: 2026-08-05

## (a) Anotaciones funcionales

- **Fuera de alcance**: "Dado" y "Carta/Ficha" no llevan este check (ya fijado en `description.md`).
- **Etiqueta**: el checkbox se llama "Sombra" (no "Sombra de contacto"), a petición explícita del usuario tras validar la maqueta.
- No han surgido dudas técnicas adicionales: la sección "Visual" y el patrón `.modal__field--checkbox` ya están establecidos por el cambio 00154, y se reutilizan tal cual.

## (b) Solución técnica

1. **`src/ui/componentModal.js` — `DEFAULT_BOARD_PROPERTIES`**: añadir `sombra: true`.
2. **`src/ui/componentModal.js` — `DEFAULT_TABLERO_PERSONALIZADO_PROPERTIES`**: añadir `sombra: true` como campo de primer nivel, hermano de `cara`/`biselado` (mismo criterio que `biselado`, cambio 00154).
3. **`src/ui/componentModal.js` — `renderBoardSpecificFields`**: dentro del `fieldset` "Visual" ya existente, añadir un segundo `.modal__field--checkbox` justo debajo de "Biselado en el borde": checkbox + `<label>` "Sombra", inicializado a `props.sombra !== false` y que en `change` actualiza `props.sombra = checkbox.checked`.
4. **`src/ui/componentModal.js` — `renderTableroPersonalizadoSpecificFields`**: mismo segundo checkbox "Sombra" dentro del mismo `fieldset` "Visual", debajo de "Biselado en el borde".
5. **`src/styles/main.css`**: añadir dos reglas modificadoras, junto a las ya existentes `.board`/`.tablero-personalizado` (líneas ~701-703 y ~732-734): `.board--sin-sombra` y `.tablero-personalizado--sin-sombra`, ambas con `box-shadow: none` — mismo criterio de modificador BEM que `--selectable`/`--selected`/`--movable` ya usados por ambas clases.
6. **`src/ui/componentRenderer.js` — rama `tableroSimple`**: tras leer `props`, añadir `board.classList.toggle('board--sin-sombra', props.sombra === false)`.
7. **`src/ui/componentRenderer.js` — rama `tableroPersonalizado`**: mismo criterio, `tablero.classList.toggle('tablero-personalizado--sin-sombra', props.sombra === false)`.

Un tablero guardado antes de este cambio, sin la propiedad `sombra`, evalúa `props.sombra === false` a `false` → no se añade el modificador → conserva la sombra actual, sin cambio visual.

## (d) Cambios en estilo

En `design/docs/stylebible/STYLE_BIBLE.md`:

- **Sección 12.6**, bullets de `ui/componentModal.js` tipo `'tableroSimple'` y `'tableroPersonalizado'` (actualizados en el cambio 00154): añadir a la sección "Visual" el segundo checkbox "Sombra".
- **Sección 6** (sistema de elevación/sombras) o donde corresponda: anotar que `'tableroSimple'`/`'tableroPersonalizado'` son ahora los primeros tipos de componente cuya sombra de contacto (`--shadow-1`) es opcional por componente (`properties.sombra`, `true` por defecto), vía las clases modificadoras `.board--sin-sombra`/`.tablero-personalizado--sin-sombra` (`box-shadow: none`) — a diferencia del resto de piezas (Dado, Carta/Ficha, Mazo, Visor de documentos), cuya sombra sigue fija por clase CSS sin excepción.
