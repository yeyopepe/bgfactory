# Navegación — Pestaña "Copias"

```mermaid
stateDiagram-v2
    [*] --> PestañaCopias

    state PestañaCopias {
        [*] --> Vacía
        Vacía --> ConCopias: el objeto pasa a tener copias\n(vía acción "Copiar" desde el panel de Componentes)
        ConCopias --> Vacía: se eliminan todas las copias vinculadas
    }

    PestañaCopias --> ListadoDeCopias: click "Ver listado de copias"\n(solo visible en estado ConCopias)
    ListadoDeCopias --> PestañaCopias: click "Cerrar"

    ConCopias --> ConCopias: click "Sincronizar todas las copias"\n(con confirmación) — ver diagrama de flujo en description.md
    ConCopias --> ConCopias: marcar/desmarcar checkbox "Oculto"\nde "Desincronizar todas las copias" (sin confirmación) — ver diagrama de flujo en description.md
```

Notas:

- "Ver listado de copias" abre `ListadoDeCopias` como ventana nueva por encima de la ventana de propiedades (mismo patrón que "Ver contenido del mazo"), sin cerrar ni sustituir la ventana de propiedades debajo. Cerrarla vuelve exactamente al mismo estado de la pestaña "Copias".
- Los botones "Sincronizar todas las copias" y el checkbox "Oculto" de "Desincronizar todas las copias" no cambian de pantalla ni abren nada — actualizan el estado de las copias y la propia pestaña se refresca en el sitio (transición reflexiva). Su lógica interna paso a paso ya está detallada como diagramas de flujo en `description.md`.
