# Navegación — Editar grupo con lista de elementos (cambio 00131)

```mermaid
stateDiagram-v2
    [*] --> PanelGrupos

    PanelGrupos --> ModalEditarGrupo: click "Editar" en una fila del panel Grupos

    state ModalEditarGrupo {
        [*] --> ListaConElementos: el grupo tiene ≥1 elemento
        [*] --> ListaVacia: el grupo tiene 0 elementos

        ListaConElementos --> ListaConElementos: click "Sacar" en un elemento\n(quedan ≥1 elementos restantes)
        ListaConElementos --> ListaVacia: click "Sacar" en el único elemento restante
    }

    ModalEditarGrupo --> PanelGrupos: Cancelar / Aceptar / click fuera de la modal\n(contador "Elementos" del panel ya actualizado)
    ModalEditarGrupo --> PanelGrupos: Eliminar (borra el grupo, con confirmación\nsi está en uso — flujo ya existente, sin cambios)
```

**Notas:**
- "Sacar" no cierra la modal ni pide confirmación: solo desvincula ese elemento del grupo y repinta la lista interna al instante (mismo patrón que la modal "Contenido del mazo").
- La transición `ListaConElementos → ListaVacia` sustituye la lista por el mensaje "No hay elementos en este grupo." en el momento en que se saca el último elemento, sin salir de la modal.
- Esta modal solo entra en juego al editar un grupo ya existente; desde "+ Añadir grupo" se abre la misma modal pero sin esta sección (no aplica, un grupo nuevo no tiene elementos).
