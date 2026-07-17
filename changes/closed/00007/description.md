# Selección de componente no se resalta (lista ni mesa)

- **Nombre**: Selección de componente no se resalta (lista ni mesa)
- **Código**: 00007
- **Tipo**: fix
- **Prompt original del usuario**: "lista de componentes:
- al hacer clic sobre un componente, no se resalta en la lista ni se selecciona en la mesa"
- **Descripción completa**:

Al hacer clic sobre una fila del panel flotante de componentes (modo edición), la selección debería marcar visualmente esa fila en la lista y resaltar con un contorno discontinuo el componente correspondiente en la mesa (comportamiento documentado en el cambio 00005). El usuario reporta que, en la práctica, no se percibe ningún resaltado ni en la lista ni en la mesa al hacer clic.

Pregunta de repro resuelta con el usuario: el clic problemático es sobre la **fila del panel** (no sobre la representación del componente dibujada directamente en la mesa).

Verificado con pruebas automatizadas (Playwright) contra el código actual: la clase de estado (`component-list__row--selected` / `text-box--selected`) sí se aplica correctamente al hacer clic — el problema no es de lógica de selección, sino visual: en `src/styles/main.css`, la regla `:hover` de la fila (`.component-list__row:hover`) y la del componente en la mesa (`.text-box--selectable:hover`) tienen más especificidad CSS que la clase de estado `--selected` correspondiente, así que cuando el cursor permanece sobre el elemento justo después de hacer clic (el caso habitual), el estilo de hover oculta visualmente el de selección. Se comprobó que, sin hover, el resaltado de selección sí se aplica con normalidad.

Comportamiento esperado: el resaltado de selección debe verse siempre que el componente esté seleccionado, esté o no el cursor encima en ese momento (el estado de selección debe tener prioridad visual sobre el estado de hover).
