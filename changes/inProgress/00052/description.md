- **Nombre**: Imágenes por cara en dados
- **Código**: 00052
- **Tipo**: change

## Prompt original del usuario

"Añadir en los dados la configuración de caras una lista de recursos (imagen)."

Notas de la idea original (todo/b7k2m): "Añadir una opción a la configuración de caras: una lista de recursos (imagen). Hay que incluir también que se pueda ajustar cada imagen por separado. Depende del editor de imágenes que se implementará con las fichas en el change 00029."

## Descripción completa

Se añade a la configuración de caras de los dados una tercera forma de definir las caras, junto a las dos que ya existen (número máximo de caras, y lista de valores): un modo de **imágenes por cara**, en el que cada cara del dado muestra una imagen en lugar de un número.

Al elegir este modo, se muestra una entrada por cada cara del dado (según el número de caras configurado), y cada entrada permite asignar una imagen y ajustarla individualmente (recorte y zoom), igual que ya se puede hacer hoy con la imagen de una ficha.

Los tres modos de caras son excluyentes entre sí: un dado está en uno de los tres modos a la vez, nunca combinándolos.

### Casos límite resueltos

- **Cara sin imagen asignada**: se muestra como un hueco vacío (placeholder), igual que ocurre hoy con una ficha sin imagen asignada. Nunca se muestra un número de respaldo en su lugar.
- **Cambio en el número de caras** después de haber asignado imágenes: la asignación existente se conserva por posición.

```mermaid
flowchart TD
    A[Usuario cambia el número de caras del dado] --> B{¿Nuevo número de caras\nmayor, menor o igual?}
    B -->|Igual| C[No hay cambios en las imágenes asignadas]
    B -->|Menor| D[Se recortan las imágenes de las caras que ya no existen]
    B -->|Mayor| E[Se conservan las imágenes existentes\ny se añaden caras nuevas vacías al final]
```

- **Ajuste de una imagen a medias / cancelado**: si el usuario abre el editor de ajuste de una cara y cancela sin confirmar, esa cara conserva la imagen y el ajuste que tenía antes de abrir el editor (o queda vacía si no tenía ninguna).

### Convivencia con lo existente

No sustituye a los modos actuales de caras (número máximo, lista de valores): es una tercera alternativa más, seleccionable de la misma forma que las otras dos.

### Alcance de los datos

La configuración de imágenes por cara se guarda junto con el resto de propiedades del dado, como parte de los datos del proyecto — igual que el resto de configuración de componentes. El proyecto no distingue usuarios ni sesiones, por lo que esta configuración persiste igual para cualquiera que abra el proyecto guardado, y se mantiene igual al recargar.

### Quién puede usarlo

Se configura desde el mismo sitio donde hoy se elige el modo de caras del dado (modo de edición del componente). No introduce ningún rol o restricción de uso nuevo respecto a los que ya existen para otros componentes con imagen (como la ficha).

### Definición visual de alto nivel

- En el modal de configuración del dado, junto al selector de modo de caras existente, aparece la nueva opción "imágenes por cara".
- Al seleccionarla, se muestra una lista con una miniatura por cada cara del dado.
- Cada miniatura es pulsable y abre el mismo editor de ajuste de imagen ya usado para la ficha (arrastre + zoom sobre la imagen elegida), con un botón para aceptar el ajuste o cancelar sin aplicar cambios.
- Una miniatura sin imagen asignada se muestra como un hueco vacío con indicación de que falta configurar esa cara.
- En el tablero, la cara del dado en este modo pinta la imagen ya ajustada en el lugar donde hoy se pinta el número, recortada exactamente a la silueta 2D que ya tiene ese dado según su número de caras (triángulo, cuadrado, diamante o forma redondeada de muchas caras) — nunca como un recorte cuadrado genérico que ignore la forma del dado. Una cara sin imagen asignada muestra ese mismo hueco vacío recortado a su silueta correspondiente.

## Apuntes técnicos

- El modelo de datos actual del dado (`src/ui/componentModal.js`, `DEFAULT_DADO_PROPERTIES`) no tiene concepto de "cara" como entidad individual: todo son propiedades globales del componente (`modoCaras: 'numeroMaximo' | 'lista'`, `numeroMaximoCaras`, `listaValores` como texto). Este cambio requiere introducir un array de caras (p.ej. `{ resourceId, ajusteImagen }` por posición) para cuando `modoCaras` sea el nuevo valor de imágenes.
- El editor de ajuste de imagen ya existe y está implementado (change 00029, cerrado): `src/ui/imageAdjustModal.js` expone `openImageAdjustModal({ shape, width, height, resource, adjustment, onAccept })` y `applyImageAdjustStyle(imgEl, adjustment)` — ya reutilizado por `ficha` vía `imagenResourceId` + `ajusteImagen`. Esta misma API es la que debe reutilizarse por cara de dado.
- Los recursos de imagen se modelan en `src/core/resource.js` (`RESOURCE_TYPES.IMAGE`) como data URI embebido (`dataUrl`), igual que usan hoy `tablero` y `ficha` vía `<x>ResourceId`.
- El renderizado de la silueta del dado según nº de caras vive en `src/ui/componentRenderer.js`; ahí habrá que pintar la imagen ajustada (vía `applyImageAdjustStyle`) en vez del número cuando el modo de caras sea el de imágenes.
- Incongruencia detectada entre documentación y código (no bloqueante para este cambio, pero a tener en cuenta): tanto un comentario en `src/core/resource.js` como `ARCHITECTURE.md` (~línea 135) afirman que `isResourceInUse` "siempre da `false`" — es un residuo desactualizado del change 00017; la función sí recorre `component.image` y `properties`, y con `tablero`/`ficha` referenciando recursos reales hoy puede devolver `true`. El código manda sobre esa documentación.
- `renderDiceSilhouette` (`src/ui/componentRenderer.js` ~línea 90) ya calcula 4 siluetas según `posibles.length`: triángulo (4), cuadrado axis-aligned (6), diamante/rombo (8), y decágono regular para cualquier otro valor (10, 12, 20, o listas de valores con otro tamaño). La imagen de cada cara debe recortarse a esa misma silueta (p. ej. vía `clip-path: polygon(...)` con los mismos puntos que ya genera `polygonPoints()`/el bloque `count===6`), no a un cuadrado genérico — ver maqueta `design_cara-dado-tablero.html`, que incluye los puntos de recorte exactos para las 4 formas como referencia.
