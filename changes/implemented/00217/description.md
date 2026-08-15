- **Nombre**: Separador visual entre título y ayuda en "Ayuda jugador"
- **Código**: 00217
- **Tipo**: fast
- **Fecha creación**: 2026-08-15

## Descripción completa

En la sección "Ayuda jugador" del modal de propiedades de un componente (pestaña "Generales"), tras el reordenamiento del cambio 00215, el bloque del título ("Mostrar título de componente" + botón "Editar título de componente…") y el bloque de ayuda/tooltip ("Mostrar ayuda" + campo "Ayuda") quedan uno justo debajo del otro sin ninguna separación visual, lo que dificulta distinguir dónde termina uno y empieza el otro.

Se añade una línea separadora horizontal entre el botón "Editar título de componente…" y el checkbox "Mostrar ayuda", para marcar visualmente el límite entre ambos bloques dentro de la misma sección.

## Apuntes técnicos

- `src/ui/componentModal.js`, sección "Ayuda jugador" (`helpSection`): insertar un separador (`<hr>` o `div` con `border-top: 1px solid var(--border-neutral)`, mismo token de borde neutro ya usado en el resto de la app) entre `helpSection.appendChild(titleEditField)` y la declaración del bloque `tooltipField` (ver cambio 00215).

## Cambios aplicados

- `src/styles/main.css`: nueva clase `.modal__divider` (BEM, elemento de `.modal`) junto a `.modal__field` — `border-top: 1px solid var(--border-neutral)` (token de borde neutro ya usado en toda la app), sin borde en los otros lados, `margin: 0 0 1rem` (mismo espaciado inferior que `.modal__field`).
- `src/ui/componentModal.js`: insertado un elemento `<hr class="modal__divider">` (`helpDivider`) en `helpSection`, entre `titleEditField` y `tooltipField` — separa visualmente el bloque de título del bloque de ayuda/tooltip dentro de "Ayuda jugador".
