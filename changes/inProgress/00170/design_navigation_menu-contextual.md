# Navegación — menú contextual de elemento en Modo Edición (cambio 00170)

```mermaid
stateDiagram-v2
    [*] --> SinMenu

    SinMenu --> MenuAbierto: Clic derecho sobre un elemento de la mesa

    state MenuAbierto {
        [*] --> ActuaSobreSeleccionActual: el elemento clicado YA estaba en la selección múltiple
        [*] --> ActuaSoloSobreEste: el elemento clicado NO estaba en la selección\n(la reemplaza, igual que un clic izquierdo)
    }

    MenuAbierto --> SinMenu: Clic en "Clonar"\n(clona todos los afectados, omite copias vinculadas)
    MenuAbierto --> SinMenu: Clic en "Copiar"\n(copia todos los afectados, omite copias vinculadas)
    MenuAbierto --> SinMenu: Clic en "Eliminar"\n(pide confirmación: simple si es 1, detallada si son varios)
    MenuAbierto --> SinMenu: Elegir grupo en "Añadir a grupo"\n(añade el grupo a todos los afectados, sin quitar los que ya tenían)
    MenuAbierto --> SinMenu: Clic fuera del menú, o tecla ESC\n(se cierra sin hacer nada)
```

**Notas:**
- "Añadir a grupo" solo es accionable si existe al menos un grupo en la partida; si no hay ninguno, la fila se muestra pero deshabilitada y no cierra el menú al pulsarla.
- El cierre del menú (por acción, clic fuera o ESC) es siempre inmediato — no hay estados intermedios de carga.
