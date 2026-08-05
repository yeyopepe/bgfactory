# Navegación — Alta y edición de un Tablero personalizado

```mermaid
stateDiagram-v2
    [*] --> ModoEdicion

    ModoEdicion --> SelectorTipo: Click "+ Añadir componente"
    SelectorTipo --> ModoEdicion: Cancelar
    SelectorTipo --> EditorVisual_1cara: Elegir "Tablero personalizado" y Aceptar
    SelectorTipo --> EditorVisual_2caras: Elegir "Carta/Ficha" y Aceptar

    state "Editor visual — 1 cara (tablero)" as EditorVisual_1cara {
        [*] --> DisenandoTablero
        DisenandoTablero --> Maximizado: Click botón maximizar
        Maximizado --> DisenandoTablero: Click botón restaurar
    }

    state "Editor visual — 2 caras (carta, sin cambios)" as EditorVisual_2caras {
        [*] --> DisenandoCarta
    }

    EditorVisual_1cara --> ModoEdicion: Cancelar (descarta cambios)
    EditorVisual_1cara --> ModoEdicion: Aceptar (aplica diseño al componente)
    EditorVisual_2caras --> ModoEdicion: Cancelar / Aceptar (comportamiento ya existente)

    ModoEdicion --> EditorVisual_1cara: Editar un Tablero personalizado ya creado
```

## Notas

- `SelectorTipo` es la modal ya existente (`ui/componentTypeModal.js`), con la nueva opción "Tablero personalizado" añadida junto a "Tablero simple" (ver `design_selector-tipo-componente.html`).
- `EditorVisual_1cara` y `EditorVisual_2caras` son el mismo componente ("Editor visual" generalizado), abierto con distinto número de caras según el tipo — no dos modales separadas.
- El estado `Maximizado`/restaurado es transitorio a esa apertura del editor, sin persistencia entre usos (igual que ya ocurre hoy en el editor de cartas).
- Igual que con una carta, reabrir el editor sobre un Tablero personalizado ya existente entra directamente en `DisenandoTablero` con el diseño guardado cargado.
