- **Nombre**: Patrón de tablero sin remate en el borde derecho e inferior
- **Código**: 00070
- **Tipo**: fix

## Prompt original del usuario

cuando se pinta el patrón de casillas circulares en el tablero, el grosor se ve claramente en el lateral izquierdo y superior, pero no en el derecho e inferior. mira la captura

## Descripción completa

En el fondo "Color y patrón" de un tablero, con forma de casilla cuadrada/rectangular, las líneas de la cuadrícula solo se ven con nitidez en el borde izquierdo y en el borde superior del conjunto. El borde derecho y el borde inferior de la cuadrícula no muestran ninguna línea, quedando esos dos lados sin remate visual — como si el patrón estuviera "abierto" solo por dos de sus cuatro lados (ver captura adjunta del usuario: rejilla 8x8 con líneas gruesas arriba y a la izquierda de cada celda, pero sin línea de cierre a la derecha ni abajo del conjunto completo).

Comportamiento esperado: las cuatro líneas exteriores de la cuadrícula (izquierda, superior, derecha e inferior) deben verse igual de nítidas que las líneas interiores que separan las celdas — el patrón debe quedar visualmente cerrado por los cuatro lados, no solo por dos.

Solo aplica a la forma de casilla cuadrada/rectangular. No se ha reportado el mismo problema en la forma hexagonal; si el análisis técnico determina que comparte la misma causa, se puede ampliar, pero no es el foco de este fix.
