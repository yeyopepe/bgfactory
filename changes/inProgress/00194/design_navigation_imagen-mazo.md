# Navegación — Imagen propia del mazo

```mermaid
stateDiagram-v2
    [*] --> SinImagenPropia: Abrir propiedades de un Mazo → pestaña "Específicas"

    SinImagenPropia --> Galeria: click "Elegir imagen…"
    Galeria --> SinImagenPropia: Cancelar
    Galeria --> ConImagenPropia: elegir imagen (click o doble click)

    SinImagenPropia --> SinImagenPropia: click "Ajustar imagen…" (deshabilitado, sin efecto)

    ConImagenPropia --> Ajuste: click "Ajustar imagen…"
    Ajuste --> ConImagenPropia: Cancelar
    Ajuste --> ConImagenPropia: Aceptar (guarda zoom/posición/rotación/transparencia)

    ConImagenPropia --> Galeria: click "Elegir imagen…" (reemplazar)
    ConImagenPropia --> SinImagenPropia: click "Quitar imagen"

    note right of ConImagenPropia
        Al reemplazar o quitar la imagen,
        el ajuste (zoom/posición/rotación)
        y la transparencia se pierden.
    end note

    note right of SinImagenPropia
        Sin imagen propia, el mazo se
        sigue viendo en la mesa como hoy:
        dorso de la carta de arriba, o
        icono neutro si está vacío.
    end note
```

- **SinImagenPropia**: pestaña "Específicas" del mazo, sin imagen propia configurada — botón "Ajustar imagen…" deshabilitado, sin botón "Quitar imagen" visible. En la mesa, el mazo se pinta igual que hoy (dorso de la carta de arriba / icono de vacío).
- **Galeria**: modal de galería de imágenes (reutilizada de otros elementos del juego), con buscador.
- **ConImagenPropia**: mismo modal que "SinImagenPropia", ya con imagen propia elegida — miniatura visible, botones "Ajustar imagen…" y "Quitar imagen" habilitados. En la mesa, el mazo pasa a pintarse siempre con esta imagen, tenga o no cartas dentro.
- **Ajuste**: modal de ajuste de imagen (zoom, transparencia, rotación), reutilizada de otros elementos del juego.

Cerrar/cancelar cualquiera de las dos modales secundarias (Galería, Ajuste) vuelve siempre a la pestaña "Específicas" sin perder los cambios ya aceptados anteriormente.
