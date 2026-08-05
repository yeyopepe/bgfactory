# Navegación: fondo de imagen en una figura geométrica

```mermaid
stateDiagram-v2
    [*] --> ModalFigura: doble click sobre una figura en el editor de cartas

    ModalFigura: Modal "Editar figura"\n(sección Fondo: Color/Imagen)

    ModalFigura --> ModalFigura: elige tipo de fondo "Color"\n(comportamiento actual, sin cambios)

    ModalFigura --> GaleriaImagenes: tipo de fondo "Imagen" + "Elegir imagen..."
    GaleriaImagenes: Galería de Recursos\n(grid de imágenes, ya existente)
    GaleriaImagenes --> AvisoSinImagenes: la galería no tiene ninguna imagen
    AvisoSinImagenes: Aviso "No hay imágenes disponibles"
    AvisoSinImagenes --> ModalFigura: Cerrar

    GaleriaImagenes --> ModalFigura: elige una imagen (Aceptar)
    GaleriaImagenes --> ModalFigura: Cancelar (sin elegir nada)

    ModalFigura --> AjusteImagen: "Ajustar imagen..." (solo si ya hay imagen elegida)
    AjusteImagen: Editor de ajuste de imagen\n(zoom / posición, ya existente,\nrecortado a la forma de la figura)
    AjusteImagen --> ModalFigura: Aceptar (guarda zoom/posición)
    AjusteImagen --> ModalFigura: Cancelar (no guarda nada)

    ModalFigura --> [*]: Cancelar / Aceptar / Eliminar / Duplicar
```

Notas:
- "Elegir imagen..." y "Ajustar imagen..." son dos botones independientes dentro de la misma sección "Fondo": el primero cambia qué imagen está elegida, el segundo abre el ajuste de zoom/posición sobre la imagen ya elegida. "Ajustar imagen..." está deshabilitado mientras no haya ninguna imagen elegida.
- Tanto la Galería de Recursos como el Editor de ajuste de imagen son componentes ya existentes en el proyecto (reutilizados sin cambios visuales propios); solo cambia desde dónde se invocan.
- Ningún paso de este flujo sale del modal "Editar figura": todas las transiciones vuelven a él, que a su vez solo se cierra con sus propios botones de pie (Cancelar/Aceptar/Eliminar/Duplicar), sin cambios respecto al comportamiento actual.
