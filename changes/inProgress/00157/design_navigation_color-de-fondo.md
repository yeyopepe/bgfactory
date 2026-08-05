# Navegación — "Color de fondo" en el editor visual (carta / tablero personalizado)

```mermaid
stateDiagram-v2
    [*] --> EditorAbierto: se abre el editor de una cara\n(carta o tablero personalizado)

    EditorAbierto --> MenuAñadirElemento: click en "Añadir elemento ▾"

    MenuAñadirElemento --> EditorAbierto: click fuera del menú\n(se cierra sin elegir nada)

    MenuAñadirElemento --> ModalImagen: elige "Imagen de fondo…"
    MenuAñadirElemento --> ModalColor: elige "Color de fondo…" (nueva opción)
    MenuAñadirElemento --> EditorAbierto: elige "Cuadro de texto" / "Figura geométrica"\n(se añaden directamente, sin modal)

    ModalImagen --> EditorAbierto: Cancelar\n(sin cambios)
    ModalImagen --> EditorConImagen: Aceptar\n(fondoTipo = 'imagen')

    ModalColor --> EditorAbierto: Cancelar\n(sin cambios)
    ModalColor --> EditorConColor: Aceptar\n(fondoTipo = 'color')

    EditorConImagen --> MenuAñadirElemento: click en "Añadir elemento ▾"
    EditorConColor --> MenuAñadirElemento: click en "Añadir elemento ▾"

    note right of ModalColor
        Ventana "Configurar color de fondo":
        selector de color + checkbox "Transparente"
    end note

    note right of EditorConColor
        El fondo de la cara se pinta con el color elegido.
        Si había una imagen configurada, deja de pintarse
        pero su configuración no se pierde: sigue disponible
        si se vuelve a elegir "Imagen de fondo…".
    end note
```

**Notas**

- "Cuadro de texto" y "Figura geométrica" no abren modal: añaden el elemento directamente sobre el lienzo (comportamiento ya existente, sin cambios). Solo "Imagen de fondo…" y la nueva "Color de fondo…" abren una ventana de configuración antes de aplicar el cambio.
- `EditorConImagen` y `EditorConColor` son mutuamente excluyentes en todo momento: la cara nunca tiene ambos fondos activos a la vez, solo el `fondoTipo` vigente decide cuál se pinta.
