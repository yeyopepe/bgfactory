# Plan — 00103: Negrita, cursiva y subrayado en los cuadros de texto de las cartas

## (a) Anotaciones funcionales

- **Fuera de alcance** (ya delimitado en `description.md`, se deja constancia aquí): no afecta al tipo de componente genérico `'texto'` suelto sobre la mesa; no se incorpora un editor de texto enriquecido — el formato se aplica siempre al cuadro completo, nunca a rangos/fragmentos seleccionados.
- **Dudas resueltas con el usuario**: ninguna — la descripción funcional (`description.md`) resolvía ya todos los aspectos necesarios (combinabilidad, granularidad, valores por defecto, ubicación de los controles) sin ambigüedad, y el análisis técnico (`ms-internal-tech-analysis`) no encontró ningún punto que requiriera decisión adicional del usuario.

## (b) Solución técnica

Los tres campos nuevos siguen exactamente el mismo criterio que los seis campos de alineación/márgenes del cambio 00099: opcionales, `false` por defecto, sin objeto de creación que los inicialice explícitamente (se leen con fallback `|| false` allí donde se usan) y sin ninguna migración.

1. **`ui/cardTextBoxModal.js`** — añadir, justo después del campo "Color" (tras la línea 243) y antes de la sección "Borde", una nueva fila "Estilo de texto" con tres botones-icono tipo interruptor (negrita/cursiva/subrayado), combinables entre sí:
   - Reutilizar el marcado/clases `.align-group`/`.align-group__btn` ya existentes (mismo look que `createAlignGroup`), pero **sin** la exclusión mutua de esa función: cada botón alterna su propio booleano de forma independiente (`working.negrita`, `working.cursiva`, `working.subrayado`), sin desactivar los demás. Más simple escribir un pequeño bucle propio para esta fila que forzar `createAlignGroup` (pensada para selección única) a un modo que no es el suyo.
   - Inicializar `working.negrita = working.negrita || false` (y análogos para `cursiva`/`subrayado`) antes de construir los botones, mismo patrón que `working.alineacionHorizontal`/`working.bordeActivo`.
   - Cada botón: icono SVG (negrita/cursiva/subrayado, ver iconografía ya usada en `design_estilo-texto-modal.html` como referencia visual), `title`/`aria-label` descriptivo, clase `active` reflejando su propio booleano, y al pulsar solo cambia su propio campo en `working` y su propia clase `active` (sin tocar los otros dos botones).
2. **`src/core/textBoxLayout.js` no se toca** — `getTextBoxLayoutStyle` cubre alineación/márgenes (layout de posición), no tipografía; negrita/cursiva/subrayado se aplican como propiedades de fuente sueltas, igual que ya se hace con `tamañoFuente`/`color` en los dos puntos de render (no hay una función compartida para esos dos tampoco, mismo criterio de simplicidad).
3. **`src/ui/componentRenderer.js`** (~línea 1024-1025, donde ya se fija `textEl.style.fontSize`/`textEl.style.color` para el `TextBox` de la carta en la mesa — cubre tanto modo juego como modo edición, es el mismo punto de render para ambos) — añadir tres líneas análogas:
   - `textEl.style.fontWeight = textBox.negrita ? 'bold' : 'normal';`
   - `textEl.style.fontStyle = textBox.cursiva ? 'italic' : 'normal';`
   - `textEl.style.textDecoration = textBox.subrayado ? 'underline' : 'none';`
4. **`src/ui/cardEditorModal.js`** (~línea 345-346, donde ya se fija `el.style.fontSize`/`el.style.color` para el lienzo del editor, dentro de `renderTextBox`) — mismas tres líneas, mismo criterio.
5. **`design/docs/ARCHITECTURE.md` sección 4** — ampliar el shape de `TextBox` (línea 139) añadiendo `negrita: boolean`, `cursiva: boolean`, `subrayado: boolean` (booleans, `false` por defecto), y añadir la nota de "opcionales y sin migración" (línea 143) al criterio ya existente ahí. Esto lo aplica `ms-do` en su paso de actualización de documentación.

## (c) Cambios de arquitectura

Ver punto 5 de la sección (b): ampliación del shape de `TextBox` en `design/docs/ARCHITECTURE.md` sección 4 (líneas 139 y 143) con los tres campos nuevos, mismo criterio de "opcional y sin migración" que el resto de campos de ese modelo.

## (d) Cambios en estilo

`design/docs/stylebible/STYLE_BIBLE.md` sección 12.10 ("Grupo de botones de opción única (icono-solo)") documenta hoy `.align-group`/`.align-group__btn` explícitamente como patrón de **elección única** ("nunca más de una opción activa a la vez"). Este cambio reutiliza la misma clase visual para un grupo de **interruptores independientes y combinables** (puede haber más de un `.active` a la vez), lo cual es una extensión de ese patrón, no un caso cubierto por la redacción actual. `ms-do` debe actualizar la sección 12.10 para:

- Aclarar que `.align-group`/`.align-group__btn` tiene dos variantes de uso: selección única (la ya documentada, alineación horizontal/vertical) y grupo de interruptores independientes combinables (nuevo, "Estilo de texto" de `ui/cardTextBoxModal.js`, cambio 00103) — mismo marcado y mismos estados visuales (reposo/hover/`active`), la única diferencia es la lógica de qué botones pueden estar `active` simultáneamente.
- Mantener la advertencia de no crear un patrón ad-hoc distinto para esto: cualquier grupo de interruptores combinables futuro con iconos debe reutilizar igualmente `.align-group`/`.align-group__btn` en su variante "combinable".
