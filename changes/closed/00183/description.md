- **Nombre**: Indicador de "tiene copias" en el componente original
- **Código**: 00183
- **Tipo**: change
- **Fecha creación**: 2026-08-07

## Prompt original del usuario

en las cartas que tienen copias deberíamos añadir el mismo icono que tienen las copias con un número entre paréntesis indicando el número de copias que tiene.

## Descripción completa

Hoy, cuando se crea una "Copia" de un componente (carta, ficha, tablero, etc.), esa copia muestra en modo edición una pequeña insignia en su esquina que la identifica visualmente como copia de otro elemento. Sin embargo, el componente original del que parten esas copias no muestra ninguna indicación de que tiene copias vinculadas a él — hay que abrir su panel o buscarlo manualmente para saberlo.

Se añade un nuevo indicador, visible solo en modo edición, sobre el componente original: la misma insignia (mismo icono, mismo color) que ya usan las copias, pero acompañada de un número entre paréntesis que indica cuántas copias tiene ese original — por ejemplo "(2)" si tiene dos copias vinculadas.

- Se muestra en la misma esquina del componente donde las copias muestran su propia insignia (esquina inferior izquierda), ya que un original nunca puede llevar esa insignia de copia él mismo — no hay conflicto entre ambas.
- El número refleja siempre las copias vinculadas actuales: si se elimina una copia, el número baja (o el indicador desaparece del todo si ya no queda ninguna); si se crea una copia nueva, el número sube.
- Un componente nunca puede mostrar a la vez la insignia de "soy una copia" y la de "tengo copias" — son mutuamente excluyentes, ya que no se permiten copias de copias.
- El indicador no se ve afectado por que el original esté bloqueado u oculto: convive igual que hoy conviven esas otras indicaciones, cada una en su propia esquina.
- Aplica a cualquier tipo de componente que pueda tener copias (cartas, fichas, tableros, dados, etc.), no solo a las cartas — igual que la insignia de copia ya existente, que tampoco es exclusiva de las cartas.
- No se muestra en modo juego, igual que el resto de indicadores similares de esquina (bloqueado, oculto, copia): son ayudas de edición, no información relevante durante la partida.

### Preguntas de alcance resueltas

- **¿A qué tipos de componente aplica?** → A los 7 tipos de componente existentes, no solo a "carta". Coherente con que la insignia de copia original tampoco es exclusiva de cartas.
- **¿Cómo conviven el icono y el número, si el hueco original es un círculo pequeño sin espacio para texto?** → El indicador se ensancha en forma de píldora (mismo alto que el círculo actual, ancho mayor) para dar cabida al icono seguido del número entre paréntesis, en vez de forzar el número dentro de un círculo fijo.
- **¿Se muestra también en modo juego?** → No, solo en modo edición, igual que el resto de indicadores de esquina existentes (bloqueado, oculto, copia).

## Apuntes técnicos

- Insignia de copia existente: `.component-copy-badge` (`ui/componentRenderer.js`, `createCopyBadge`; CSS en `src/styles/main.css`), pintada cuando `showCopyIndicator` está activo y `component.copyOf` no es `null`. Ver `design/docs/style/03-modales-menus.md` §12.3 ("Indicador de Copia").
- Modelo de copias vinculadas: `copyOf` en `design/docs/architecture/01-component-model.md`, sección "Copias vinculadas" — no se permiten copias de copias, así que el conteo de copias de un original es directo y no recursivo (componentes cuyo `copyOf === id` del original).
- `showCopyIndicator` se activa hoy desde `modes/edit/editMode.js` (línea ~533) junto con `showLockIndicator`/`showHiddenIndicator`, al llamar a `renderComponentsOnTable` (`ui/componentRenderer.js`).
- Ninguna incongruencia detectada entre documentación técnica y código real durante el análisis.
