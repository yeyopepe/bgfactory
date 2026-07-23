- **Nombre**: Reducir el offset del efecto "levantar" en Modo Juego
- **Código**: 00069
- **Tipo**: change

## Prompt original del usuario

"Yo lo percibo igual que antes. ¿Puedes hacer que el offset sea menor? Así la sensación no es tan brusca"

## Descripción completa

En Modo Juego, al arrastrar un componente movible (ficha, carta, dado, texto, tablero o documento — cualquier tipo no bloqueado), la mesa aplica un efecto visual de "levantar la ficha": la pieza se desplaza ligeramente y gana una sombra más pronunciada mientras dura el arrastre, volviendo a su aspecto normal al soltarla. El cambio 00067 ya suavizó ese efecto con una transición progresiva, pero el usuario sigue percibiendo el gesto como brusco pese a esa transición, y pide reducir la magnitud del desplazamiento para que la sensación sea menos brusca.

Alcance de este cambio:

- Se reduce el desplazamiento del efecto "levantar" a, aproximadamente, la mitad de la magnitud actual en ambos ejes.
- La sombra que acompaña al efecto se mantiene exactamente igual — no se pidió reducirla, solo el desplazamiento.
- No cambia nada más del efecto: sigue activándose/desactivándose en los mismos momentos (al empezar/terminar el arrastre), sigue aplicando solo en Modo Juego sobre componentes no bloqueados, y mantiene la transición progresiva ya añadida en el cambio 00067. Modo Edición no se ve afectado.

Preguntas de alcance resueltas con el usuario:

- **¿Qué nueva magnitud de desplazamiento?** Aproximadamente la mitad de la actual.
- **¿Se reduce también la sombra?** No, se deja igual; solo se reduce el desplazamiento.

## Apuntes técnicos

- El valor actual vive en `src/styles/main.css`, clase `.lifted` (~línea 1541-1545 tras el cambio 00067): `transform: translate(-4px, -9px)`, `box-shadow: 6px 7px 9px 2px rgba(0,0,0,0.35)`, y ya incluye `transition: transform var(--transition-fast), box-shadow var(--transition-fast);` (añadida en el cambio 00067).
- Propuesta acordada con el usuario para la nueva magnitud: `translate(-2px, -4px)` (mitad aproximada en ambos ejes). La sombra se deja tal cual.
- El valor exacto del desplazamiento (`translate(-4px, -9px)`) está documentado explícitamente en `design/docs/stylebible/STYLE_BIBLE.md`, sección 13 ("Efecto 'levantar' al arrastrar en Modo Juego") — este cambio requiere actualizar esa cifra en la Style Bible también.
- La clase se añade/quita vía `ui/componentRenderer.js` (`beginDragLift`/`endDragLift`), sin cambios necesarios ahí — es un cambio puramente de valor CSS.
