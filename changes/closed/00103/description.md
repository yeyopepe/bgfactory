- **Nombre**: Negrita, cursiva y subrayado en los cuadros de texto de las cartas
- **Código**: 00103
- **Tipo**: change

## Prompt original del usuario

añade a las propiedades de los textos de las cartas controles para marcar negrita, cursiva y subrayado

## Descripción completa

Se añaden a los cuadros de texto de las caras de una carta (los que se editan haciendo doble click sobre un cuadro de texto dentro del editor de cartas) tres controles nuevos de formato: **negrita**, **cursiva** y **subrayado**.

- **Alcance**: afecta únicamente a los cuadros de texto de las caras de una carta. No afecta al tipo de componente genérico "Texto" que se coloca suelto sobre la mesa, que queda fuera de este cambio.
- **Combinabilidad**: los tres controles son interruptores independientes entre sí — se puede activar cualquier combinación de ellos a la vez (por ejemplo, negrita y subrayado juntos), o ninguno.
- **Granularidad**: el formato se aplica siempre al contenido completo del cuadro de texto, no a fragmentos o rangos de texto seleccionados dentro de él. Esto es coherente con cómo ya funcionan el resto de propiedades de un cuadro de texto (tamaño de letra, color, alineación): todas se aplican al cuadro entero, no a partes de su contenido. El proyecto no incorpora con este cambio un editor de texto enriquecido (rich text).
- **Valores por defecto**: los tres controles empiezan desactivados. Un cuadro de texto creado antes de este cambio se comporta igual que uno con los tres desactivados, sin ningún cambio visual respecto a como se veía hasta ahora.
- **Ubicación de los controles**: una fila nueva de tres botones tipo interruptor (uno por cada formato), situada junto a los campos ya existentes de tamaño de fuente y color del cuadro de texto, dentro de la modal de edición de ese cuadro.
- **Resultado visual**: el texto del cuadro se muestra en negrita, cursiva, subrayado o cualquier combinación de los tres, tanto en el editor de cartas como en la carta ya colocada sobre la mesa (en modo juego y en modo edición) — de forma consistente con cómo ya se refleja cualquier otra propiedad del cuadro de texto en ambos sitios.

## Apuntes técnicos

- Modelo de datos a ampliar: `TextBox` en `design/docs/ARCHITECTURE.md` sección 4, shape actual `{ id, contenido, fuenteResourceId, tamañoFuente, color, x, y, width, height, bordeActivo, bordeColor, bordeGrosor, bordeTipo, colorFondo, alineacionHorizontal, alineacionVertical, margenSuperior, margenDerecha, margenInferior, margenIzquierda }` — añadir tres booleans (p. ej. `negrita`, `cursiva`, `subrayado`), opcionales y `false` por defecto, mismo criterio de "sin migración" que el resto de campos opcionales de este modelo (nota ya existente en la sección 4: "Todos estos campos son opcionales y sin migración").
- UI a modificar: `src/ui/cardTextBoxModal.js` (añadir la fila de tres botones-icono tipo interruptor, análogos a `working.alineacionHorizontal`/`working.alineacionVertical` pero combinables en vez de excluyentes; podría reutilizarse el lenguaje visual de `.align-group`/`.align-group__btn` de la sección 12.10 del Style Bible, adaptado a interruptores independientes en vez de opción única).
- Render a modificar (dos puntos, mismo patrón ya usado hoy por `tamañoFuente`/`color` de `TextBox`):
  - `src/ui/componentRenderer.js` (~línea 1024, donde ya se fija `textEl.style.fontSize` para el `TextBox` sobre la carta en la mesa) — añadir `fontWeight`/`fontStyle`/`textDecoration` según los tres nuevos campos.
  - `src/ui/cardEditorModal.js` (~línea 345, donde ya se fija `el.style.fontSize` para el lienzo del editor) — mismo tratamiento.
- No se ha detectado ninguna incongruencia entre la documentación técnica (`ARCHITECTURE.md`, `STYLE_BIBLE.md`) y el código real: ambas fuentes coinciden en el modelo actual de `TextBox`.
