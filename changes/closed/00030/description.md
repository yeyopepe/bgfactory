- **Nombre**: Aumentar tamaño de la tipografía del resultado del dado
- **Código**: 00030
- **Tipo**: fix

## Prompt original del usuario

aumenta el tamaño base de la tipografía de los resultados de los dados

## Descripción completa

El texto del resultado que se muestra sobre la cara del componente "Dado" (cambio 00020) se ve demasiado pequeño en proporción al tamaño del propio dado, dificultando su lectura. Se espera que, para un mismo tamaño de dado, el número o texto del resultado se muestre notablemente más grande que hasta ahora, manteniendo el mismo comportamiento ya existente: el texto sigue centrado sobre la cara del dado, respeta el color de números y la tipografía configurados, y sigue ajustándose proporcionalmente si el dado se redimensiona.

## Apuntes técnicos

- El tamaño de fuente del resultado se calcula hoy como una proporción fija del tamaño del dado (`ui/componentRenderer.js`, rama `'dado'` de `renderComponentsOnTable`, variable `resultEl.style.fontSize`), no como un valor absoluto — aumentar esa proporción.
