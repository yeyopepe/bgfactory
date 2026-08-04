# Navegación — menú contextual de elemento en el editor de cartas

```mermaid
stateDiagram-v2
    [*] --> CaraEditor: Editor de cartas abierto, viendo una cara

    CaraEditor --> ElementoSeleccionado: Click derecho sobre un texto o figura
    ElementoSeleccionado --> MenuAbierto: se abre el menú junto al cursor

    MenuAbierto --> CaraEditor: Click fuera del menú / Escape (sin cambios)

    MenuAbierto --> CaraEditor: Elegir "Eliminar"\n(el elemento desaparece del lienzo)
    MenuAbierto --> CaraEditor: Elegir "Colocar arriba"\n(el elemento pasa al extremo superior del apilado)
    MenuAbierto --> CaraEditor: Elegir "Colocar abajo"\n(el elemento pasa justo encima de la imagen de fondo)
```

Notas:
- El click derecho selecciona el elemento si no lo estaba ya (mismo elemento que quedaría seleccionado con un click izquierdo).
- Las tres opciones cierran el menú al elegirse, igual que un click fuera o Escape.
- "Colocar arriba"/"Colocar abajo" no abren ninguna pantalla ni modal adicional: el resultado se ve directamente en el lienzo de la cara al cerrarse el menú.
