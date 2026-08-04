- **Nombre**: Arrastre en bloque no movía en vivo al resto de la selección múltiple
- **Código**: 00109
- **Tipo**: fix

## Prompt original del usuario

Al mover los elementos seleccionados, solo se mueve uno y el resto se actualizan cuando suelto el botón. Quiero que se muevan todos a la vez

## Descripción completa

Tras el cambio 00108 (selección múltiple de componentes con Ctrl en modo edición), al arrastrar uno de varios elementos seleccionados, solo el elemento que se arrastra directamente se movía en tiempo real siguiendo al cursor. El resto de elementos de la selección permanecían quietos en pantalla durante todo el arrastre, y solo saltaban a su posición final en el momento de soltar el botón del ratón.

El comportamiento esperado es que, al arrastrar cualquiera de los elementos seleccionados, todos los elementos de la selección se muevan a la vez y en tiempo real durante todo el gesto de arrastre (no solo al soltar), manteniendo siempre entre ellos la misma distancia relativa — igual sensación de "moverse en bloque" que si estuvieran agrupados físicamente, sin ningún salto visual al final del arrastre.

No cambia nada más del comportamiento ya descrito en el cambio 00108: solo se corrige el momento en el que se ve reflejado el movimiento del resto de la selección (durante el arrastre, no al soltar).
