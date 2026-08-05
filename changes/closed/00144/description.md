- **Nombre**: Control de tamaño (alto/ancho) en la configuración de los componentes, con proporción vinculada opcional
- **Código**: 00144
- **Tipo**: change
- **Fecha creación**: 2026-08-05

## Prompt original del usuario

quiero tener más control sobre el tamaño de los elementos sobre la mesa. Quiero que añadas  en la configuración de todos los elementos, apartado General, una sección llamada "Tamaño" dónde:
- poder ver y modificar el valor de alto y ancho que tiene actualmente el elemento.
- un checkbox (marcado por defecto) titulado "mantener proporción". Si está marcado, cada cambio que se introduzca en el alto modifica automáticamente el valor del ancho en consecuencia (segúnn la proporción actual del elemento) y viceversa

## Descripción completa

Al configurar cualquier componente de la mesa (cuadro de texto, tablero simple, dado, visor de documentos, carta/ficha o mazo), en su apartado "General" aparece una nueva sección llamada "Tamaño", con:

- **Alto** y **Ancho**: dos campos numéricos (en píxeles) que muestran el tamaño actual del componente y permiten cambiarlo escribiendo directamente el valor deseado, sin tener que salir de la configuración ni arrastrar el elemento en la mesa.
- **Mantener proporción**: un checkbox, marcado por defecto cada vez que se abre la configuración. Mientras esté marcado, cambiar el valor de "Alto" recalcula automáticamente "Ancho" para conservar la proporción que tenía el elemento en ese momento, y viceversa. Si se desmarca, "Alto" y "Ancho" se pueden cambiar de forma totalmente independiente.

Esta sección aplica igual a los seis tipos de componente existentes — no hay ningún tratamiento especial por tipo.

### Casos límite y puntos de alcance resueltos

- **Componentes cuyo tamaño todavía no se ha fijado nunca** (algunos componentes, típicamente un cuadro de texto recién creado, se ajustan automáticamente a su contenido hasta que el usuario los redimensiona por primera vez): los campos "Alto"/"Ancho" muestran igualmente el tamaño que el componente ocupa en ese momento en la mesa. En cuanto se edita cualquiera de los dos valores, el tamaño queda fijado de forma explícita, igual que ya ocurre hoy al redimensionar arrastrando la esquina del componente en la mesa.
- **Convivencia con "Carta/Ficha"**: este tipo ya tiene, en otra parte de su configuración, un desplegable "Proporción" (cuadrada, panorámica, hexagonal...) que fuerza una relación de aspecto concreta al elegirla. Ese mecanismo no cambia. La nueva sección "Tamaño" es independiente: el checkbox "Mantener proporción" siempre usa la proporción que el componente tenga en cada momento (la que resulte de lo último aplicado, sea por ese desplegable o por una edición manual anterior), sin ninguna relación directa entre ambos controles.
- **Redimensionado arrastrando la esquina del componente en la mesa**: sigue funcionando exactamente igual que hoy (alto y ancho totalmente libres e independientes). El checkbox "Mantener proporción" solo afecta a los dos campos numéricos de esta nueva sección de la configuración, no a ese arrastre.
- El estado del checkbox "Mantener proporción" no se guarda: cada vez que se abre la configuración de un componente, aparece marcado por defecto.

## Apuntes técnicos

- Ubicación: pestaña "Generales" de `ui/componentModal.js`, nueva sección justo después del campo "ID del componente" y antes del campo "Bloqueado".
- Patrón de sección a reutilizar: `.modal__section` con `<legend class="modal__section-title">` (STYLE_BIBLE.md sección 12.6), variante meramente informativa — el checkbox "Mantener proporción" es un campo más dentro de la sección, no el des/activador de toda la sección.
- Patrón de fila de campos numéricos relacionados a reutilizar: STYLE_BIBLE.md sección 8, "Extensión a N campos numéricos relacionados" (cambio 00099) — fila `display:flex; gap:0.5rem` con un sub-div `flex:1` por campo; ejemplo ya existente en `ui/cardTextBoxModal.js`.
- Modelo de datos: `width`/`height` (`number | null`) ya existen en todos los tipos de componente (ARCHITECTURE.md sección 4) — no hace falta ningún campo nuevo en el modelo, solo UI en la modal.
- `ui/componentModal.js` ya tiene un mecanismo de recálculo width→height ligado a la "Proporción" de Carta (líneas ~1056-1060, 1082-1084, 1168-1170) que sirve como referencia de patrón, aunque no es directamente reutilizable: allí la proporción es fija por un desplegable de valores discretos, no la proporción "actual" arbitraria del componente que pide este cambio.
- No se ha detectado ninguna incongruencia entre ARCHITECTURE.md/STYLE_BIBLE.md y el código real relevante para este cambio.
