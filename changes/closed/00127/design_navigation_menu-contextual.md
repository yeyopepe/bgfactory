# Navegación — menú contextual con Copiar/Pegar (editor de cartas)

```mermaid
stateDiagram-v2
    [*] --> SinMenu

    SinMenu --> MenuSobreElemento: Click derecho sobre un elemento
    SinMenu --> MenuZonaVacia: Click derecho sobre zona vacía del lienzo

    state MenuSobreElemento {
        [*] --> Copiar
        [*] --> Pegar_A
        [*] --> Eliminar
        [*] --> ColocarArriba
        [*] --> ColocarAbajo
    }

    state MenuZonaVacia {
        [*] --> Pegar_B
    }

    MenuSobreElemento --> SinMenu: Copiar
    MenuSobreElemento --> SinMenu: Eliminar / Colocar arriba / Colocar abajo
    MenuSobreElemento --> ElementoPegado: Pegar (habilitado)
    MenuZonaVacia --> ElementoPegado: Pegar (habilitado)

    ElementoPegado --> SinMenu: elemento nuevo seleccionado en el lienzo

    SinMenu --> SinMenu: Click fuera del menú / ESC (cierra sin acción)
```

Notas:
- "Pegar" es el mismo destino (`ElementoPegado`) se invoque desde el menú sobre un elemento o desde el menú en zona vacía — el resultado no depende de dónde se abrió el menú, solo de la posición del cursor.
- Si no hay nada copiado, "Pegar" aparece pero no es una transición disponible (deshabilitada): el menú permanece abierto hasta elegir otra opción o cerrarlo.
- Cerrar el menú sin elegir nada (click fuera o ESC) es el comportamiento ya existente, sin cambios.
