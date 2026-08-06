# Navegación — menú de cabecera de columna

Aplica igual en las tres ventanas de modo edición (Componentes, Recursos, Grupos). El desplegable es propio de cada columna: solo puede haber uno abierto a la vez por ventana.

```mermaid
stateDiagram-v2
    [*] --> CabeceraCerrada

    CabeceraCerrada --> MenuAbierto: Click en el nombre de la columna
    MenuAbierto --> CabeceraCerrada: Click fuera del menú / Esc
    MenuAbierto --> OtraColumnaAbierta: Click en el nombre de otra columna

    state MenuAbierto {
        [*] --> Mostrado
        Mostrado --> Mostrado: Click en "Ordenar A..Z" o "Ordenar Z..A"\n(toggle: activa/desactiva, cierra el menú)
        Mostrado --> Mostrado: Elegir valor del combo "Filtrar"\n(aplica/quita el filtro, cierra el menú)
    }

    OtraColumnaAbierta --> CabeceraCerrada: Click fuera del menú / Esc
```

Notas:
- Abrir el desplegable de una columna cierra automáticamente el de otra si estaba abierto (nunca dos desplegables visibles a la vez en la misma ventana).
- Elegir una opción de orden o un valor de filtro cierra el desplegable y aplica el cambio de inmediato sobre la tabla (recalcula filas visibles y, si aplica, el orden).
- El estado "activo" de orden/filtro no depende de que el menú esté abierto: se refleja en el indicador de la cabecera (ver `design_menu-cabecera-columna.html`) incluso con el desplegable cerrado.
