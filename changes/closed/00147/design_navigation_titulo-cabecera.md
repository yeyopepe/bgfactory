# Navegación — edición del título de cabecera

```mermaid
stateDiagram-v2
    [*] --> Reposo

    Reposo: Título en reposo\n(h1 normal, texto + versión)
    ReposoHover: Reposo con hover\n(icono de lápiz visible)\n[solo en modo edición]
    Editando: Campo editable in-place\n(texto libre editable, versión fija al final)
    Confirmado: Título actualizado\n(h1 normal, nuevo texto + versión)

    Reposo --> ReposoHover: ratón sobre el título\n(modo edición)
    ReposoHover --> Reposo: ratón fuera
    ReposoHover --> Editando: click sobre el título

    Editando --> Confirmado: Enter / click fuera\ncon texto no vacío
    Editando --> Reposo: Enter / click fuera\ncon texto vacío\n(revierte al valor anterior)

    Confirmado --> Reposo
```

**Notas:**
- En modo juego, el título nunca pasa por `ReposoHover` ni `Editando` — se muestra siempre en el estado `Reposo`/`Confirmado`, sin reaccionar al ratón ni al click.
- La versión (`v.NNNNN`) no participa en esta navegación: se muestra igual en todos los estados y nunca se selecciona ni edita.
- El estado `Confirmado` persiste el título en el estado del juego (localStorage + fichero exportado), por lo que sobrevive a recargar la página o reabrir el fichero.
