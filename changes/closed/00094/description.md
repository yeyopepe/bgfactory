- **Nombre**: Carta hexagonal no seleccionable ni etiqueta visible en sus esquinas (modo edición)
- **Código**: 00094
- **Tipo**: fix

## Prompt original del usuario

cuando la carta es hexagonal (cualquier variante), en el modo edición:
- el id sale cortado
- al hacer clic no selecciona el objeto ni lo puedo redimensionar

## Descripción completa

Cuando una carta tiene una proporción hexagonal ("Hexagonal (vértices arriba/abajo)" o "Hexagonal (vértices izquierda/derecha)"), en modo edición aparecen dos problemas sobre esa carta en la mesa:

1. **La etiqueta identificativa sale cortada.** Al pasar el ratón por encima o al tener la carta seleccionada, la etiqueta que muestra "Carta: <id>" en la esquina superior izquierda aparece recortada, en vez de mostrarse completa como ocurre con el resto de proporciones (rectangulares y "Circular").
2. **Las esquinas de la carta no responden al click.** Al hacer click sobre las zonas de las esquinas de la carta (fuera de la silueta hexagonal, pero dentro de su caja rectangular delimitadora), no se selecciona el componente ni se puede arrastrar o usar su manejador de redimensionado. Con el resto de proporciones (incluida "Circular", que también deja esquinas "vacías" fuera del círculo) esas mismas zonas de esquina sí son clicables y permiten seleccionar/arrastrar/redimensionar la carta con normalidad.

**Comportamiento esperado**: con proporción hexagonal, en modo edición, la etiqueta identificativa debe verse completa (sin recortarse), y toda la caja rectangular de la carta debe seguir siendo clicable para seleccionar/arrastrar/redimensionar el componente, igual que con el resto de proporciones. Solo el contenido visual de la cara (imagen/texto) debe recortarse con la silueta hexagonal exacta — el recorte no debe afectar a la zona sensible al click ni a los elementos superpuestos sobre la carta (etiqueta identificativa, insignia de candado, manejador de redimensionado).

Captura adjunta por el usuario: una carta hexagonal en modo edición, con la etiqueta "...cha: 284a0f62-13a7-4aad-a..." visiblemente cortada en su borde superior/lateral, superpuesta sobre el hexágono blanco.

## Apuntes técnicos

Introducido en el cambio 00089 (proporciones hexagonales de carta). El recorte de silueta hexagonal se aplica en `ui/componentRenderer.js` mediante `clip-path` (vía `getCartaShapeCss()` de `core/cardProportions.js`) tanto al elemento `.carta` exterior como a su `cartaContent` interior. A diferencia de `border-radius` (usado para "Circular"/rectangular, que no afecta a la zona sensible al puntero ni recorta visualmente a los hijos posicionados fuera del radio), `clip-path` sí recorta tanto el renderizado de los elementos hijos posicionados fuera del polígono (de ahí que la etiqueta `.component-id-label`, hija de `.carta` y anclada en su esquina superior izquierda, quede cortada) como la zona de hit-testing del propio elemento (de ahí que las esquinas fuera del hexágono dejen de responder a click/arrastre, y que el manejador de redimensionado, también hijo de `.carta` y anclado en su esquina inferior derecha, quede fuera de la zona clicable). Aplicar el `clip-path` solo al elemento `.carta` exterior (no solo al interior) fue una decisión explícita del plan de 00089 para que el recorte de silueta también delimitara la zona sensible al puntero — el problema es que esa misma extensión de comportamiento a `.carta` es la causa de ambos síntomas.
