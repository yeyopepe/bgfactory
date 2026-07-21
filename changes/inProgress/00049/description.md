- **Nombre**: Bloqueo de proporción 1:1 al redimensionar con Shift
- **Código**: 00049
- **Tipo**: change

## Prompt original del usuario

Al redimensionar una ficha circular ahora se puede hacer libremente, sin mantener el aspecto. Quiero que además, si mantengo pulsada la tecla Shift al redimensionar, mantenga un aspecto 1:1.

## Descripción completa

Al redimensionar cualquier elemento que permita ajustar ambos ejes (ancho y alto) libremente — ficha, tablero, dado, caja de texto, visor de documento — mantener pulsada cualquier tecla Shift mientras se arrastra el manejador de esquina fuerza un aspecto 1:1 (cuadrado), en vez de permitir ancho y alto completamente libres como ahora. Sin Shift pulsado, se mantiene el comportamiento actual (libre).

Puntos de alcance resueltos con el usuario:
- Se aplica a todo redimensionado de ambos ejes de forma consistente (ficha, tablero, dado, caja de texto, visor de documento), ya que el manejador de redimensionado es un componente genérico compartido por todos ellos. Los paneles laterales, que solo redimensionan en el eje horizontal, no se ven afectados.
- El estado de la tecla Shift se evalúa en vivo en cada movimiento del ratón durante el arrastre: si se suelta a mitad de camino, el resto del arrastre vuelve a ser libre; y viceversa, si se pulsa a mitad, el resto pasa a ser 1:1. No se fija el comportamiento al iniciar el arrastre.
- No se añade ningún feedback visual nuevo (ni cambio de cursor ni indicador) mientras Shift está pulsado: el usuario percibe el efecto únicamente por el propio redimensionado cuadrado en vivo.

No hay componente visual nuevo (ningún elemento, panel o control nuevo en pantalla): es un cambio de comportamiento de interacción sobre un manejador ya existente. No se genera propuesta visual.

Sin casos límite adicionales relevantes (no afecta a datos persistidos, a roles/modos, ni a convivencia con otra funcionalidad más allá de la ya descrita).
