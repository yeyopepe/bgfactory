- **Nombre**: Mazo: mostrar el dorso de la primera carta sin aplicar su giro
- **Código**: 00181
- **Tipo**: change
- **Fecha creación**: 2026-08-06

## Prompt original del usuario

lo mazos ahora muestran el dorso de la primera carta que hay en el mazo (o una imagen por defecto si está vacía). El problema es que la imagen del dorso de la primera carta puede estar girada y no queda bien.
El mazo, si tiene cartas, debe mostrar siempre el recurso del dorso de la primera carta sin aplicar los giros

## Descripción completa

La caja visual de un mazo (tanto en modo juego como en modo edición), cuando tiene al menos una carta, muestra el dorso de la primera carta de la pila como representación del mazo. Ese dorso puede tener configurado un giro (rotación de 90°, 180° o 270°) sobre su imagen de fondo, pensado para cuando esa carta se ve suelta en la mesa boca abajo. Al reutilizarse esa misma imagen para representar la caja del mazo, ese giro se aplica igual y el resultado se ve mal orientado, ya que la caja del mazo no tiene por qué coincidir con la orientación pensada para la carta suelta.

A partir de este cambio, la caja del mazo debe mostrar siempre la imagen de fondo del dorso de la primera carta sin aplicar ningún giro, independientemente del que tenga configurado esa cara.

### Preguntas de alcance resueltas con el usuario

1. **¿A qué giro se refiere exactamente "sin aplicar los giros"?** Únicamente al giro de la imagen de fondo del dorso. Si esa misma cara tiene, además de la imagen, alguna figura o cuadro de texto con su propio giro individual configurado, esos elementos SÍ se siguen mostrando girados con normalidad — son elementos de diseño propios de la cara, no "el recurso del dorso" al que se refiere este cambio.
2. **¿Dónde debe aplicarse esta corrección?** Únicamente a cómo se pinta la caja del mazo en la mesa, en ambos modos (juego y edición). No afecta a:
   - Cómo se muestra esa misma carta cuando está fuera del mazo, suelta en la mesa: sigue mostrando su dorso con el giro configurado con normalidad.
   - La ventana de "Ver contenido del mazo": ahí se muestran miniaturas de la cara frontal de cada carta del mazo, no del dorso, así que no le afecta este cambio.

### Casos límite

- **Mazo vacío**: sin cambios, sigue mostrando la imagen por defecto ya existente.
- **Dorso de la primera carta sin imagen configurada** (fondo de color liso o vacío): sin cambios, no hay ningún giro de imagen que ignorar si no hay imagen de fondo.

## Apuntes técnicos

- Código relevante: `src/ui/componentRenderer.js`, rama `component.type === 'mazo'` (~línea 1661-1698), que llama a `paintCartaFace(mazoContent, cartaArriba.properties?.caraTrasera, renderScale, width, height)` (línea ~1695). `paintCartaFace` (línea 298) es una función compartida también usada para pintar la carta normal en la mesa, `'tableroPersonalizado'` y las miniaturas de `ui/mazoContentModal.js` — dentro de ella, la imagen de fondo se pinta con `applyImageAdjustStyle(img, cara.ajusteImagen, faceWidth, faceHeight)` (línea 316, importada de `src/ui/imageAdjustModal.js`), que es quien aplica `rotation` como `transform: rotate(Ndeg)` sobre la propia imagen (línea ~60 de `imageAdjustModal.js`).
- Como `paintCartaFace`/`applyImageAdjustStyle` se reutilizan en varios sitios donde SÍ debe respetarse la rotación (carta suelta en la mesa, tableroPersonalizado, miniaturas de mazoContentModal), la solución técnica tendrá que encontrar la forma de que, específicamente en la llamada desde la rama `'mazo'`, se ignore ese único campo sin afectar al resto de usos — por ejemplo pasando una copia de `cara` con `ajusteImagen.rotation` forzado a `0` en esa llamada concreta, en vez de tocar la firma compartida de `paintCartaFace`/`applyImageAdjustStyle`.
- No se detectó ninguna incongruencia entre `design/docs/ARCHITECTURE.md` y el código real sobre este punto.
