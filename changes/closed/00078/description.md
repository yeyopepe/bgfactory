- **Nombre**: Atajos de teclado en modo edición (Esc/Intro/Supr)
- **Código**: 00078
- **Tipo**: change

## Prompt original del usuario

algunos cambios de usabilidad:
En el modo edición:
- Si pulso la tecla borrar y tengo un elemento seleccionado, se elimina
- En cualquier modal que esté abierta, si pulso la tecla esc, tiene el mismo comportamiento que el botón cancelar
- En cualquier modal que esté abierta, si pulso la tecla intro, tiene el mismo comportamiento que el botón aceptar

Sí. Revísalo de nuevo para cumplir las siguientes reglas de oro:
- la tecla ESC es el equivalente al botón CANCELAR si está presente en la ventana actual
- la tecla INTRO es el equivalente al botón ACEPTAR si está presente en la ventana actual
- la tecla SUPR es el equivalente al botón SUPRIMIR si está presente en la ventana actual o estamos en el modo edición y hay un elemento seleccionado

## Descripción completa

Se añaden tres atajos de teclado de propósito general en el modo edición, pensados como equivalentes directos de botones ya existentes en cada contexto — no introducen ninguna acción, confirmación ni validación nueva, solo un atajo para disparar lo que ya existe:

1. **Tecla ESC** — equivale al botón "Cancelar" (o "Cerrar", en las ventanas que solo tienen ese botón de cierre) de la ventana que esté abierta en ese momento.
2. **Tecla INTRO** — equivale al botón "Aceptar" de la ventana que esté abierta en ese momento, si esa ventana tiene ese botón.
3. **Tecla SUPR** — equivale al botón "Suprimir"/"Eliminar" de la ventana que esté abierta en ese momento, si esa ventana tiene ese botón; si no hay ninguna ventana abierta pero estamos en modo edición y hay un elemento seleccionado, SUPR lo elimina directamente (mismo efecto que pulsar su botón "Eliminar" habitual).

Regla general: cuando el botón equivalente no exista en el contexto actual (p. ej. INTRO en una ventana que solo tiene "Cerrar", o SUPR sin ninguna ventana abierta y sin ningún elemento seleccionado), la tecla no hace nada.

### Dudas de alcance resueltas con el usuario

- **Alcance de SUPR**: no se limita a la selección de un elemento — aplica primero a cualquier ventana abierta que tenga un botón de suprimir/eliminar, y solo si no hay ninguna ventana abierta actúa sobre el elemento seleccionado en modo edición. Confirmado explícitamente por el usuario con la regla: "la tecla SUPR es el equivalente al botón SUPRIMIR si está presente en la ventana actual o estamos en el modo edición y hay un elemento seleccionado".
- **Alcance de la selección**: hoy solo existe selección de componentes en la mesa/lista de componentes del modo edición; los recursos de la galería no tienen ese concepto, por lo que SUPR sin ninguna ventana abierta solo puede afectar a un componente seleccionado, nunca a un recurso.
- **Confirmación al eliminar**: todas las vías de borrado ya existentes piden confirmación antes de eliminar. Los atajos de teclado no cambian esto: al disparar la misma acción que el botón, se dispara también la misma confirmación que esa acción ya tenía — no se añade una confirmación nueva ni se salta la existente.
- **ESC/INTRO en ventanas de un solo botón** (p. ej. avisos de error, de ayuda o de informe, que solo tienen "Cerrar", no "Aceptar"): ESC actúa igual que ese botón de cierre; INTRO no hace nada en esas ventanas, al no existir botón "Aceptar".
- **INTRO con el foco en un campo de texto de varias líneas** (p. ej. el contenido de un cuadro de texto o de un documento): pulsar Intro ahí debe seguir insertando un salto de línea con normalidad, sin disparar el botón "Aceptar" de la ventana.
- **INTRO/SUPR con el foco en un campo de texto de una sola línea** (nombre, identificador, número...): INTRO sí dispara "Aceptar" (comportamiento típico de formulario); SUPR, en cambio, no debe interferir con borrar texto mientras se está escribiendo en ese campo — no dispara ninguna eliminación en ese caso.
- **Botón "Aceptar" deshabilitado** (p. ej. por una validación no superada): INTRO no hace nada si el botón está deshabilitado, mismo criterio que si se hiciera click sobre él estando deshabilitado.
- **Ventanas anidadas** (una ventana abierta desde dentro de otra): los tres atajos actúan siempre sobre la ventana que esté más "encima" (la última abierta), sin afectar a las que haya debajo ni cerrarlas de forma encadenada.
- **Diálogos nativos de confirmación del navegador** (los que preguntan "¿Eliminar...?" antes de borrar): quedan fuera de este cambio, el navegador ya gestiona ESC/INTRO de forma nativa en ellos.
- **Definición visual**: este cambio no introduce ningún elemento visual nuevo — es puramente comportamiento de teclado sobre elementos ya existentes. No se generan propuestas visuales.

## Apuntes técnicos

- No existe hoy ningún manejo global de teclado en la app (`keydown` a nivel de documento). El único precedente es un `keydown` local en `ui/imageAdjustModal.js` (línea 225) que hace `blur()` del input de zoom al pulsar Enter — no relacionado con este cambio, no se debe tocar.
- Todas las modales de la app siguen el mismo patrón estructural `.modal-overlay` > `.modal` con botones `.btn-cancel` (Cancelar/Cerrar), `.btn-accept` (Aceptar, cuando aplica) y `.btn-eliminar` (Eliminar/Suprimir, cuando aplica) — pero cada fichero en `src/ui/*.js` construye su propia modal de forma independiente: no hay ningún helper/base de modal compartido en JS, solo la convención de nombres de clase. Esto sugiere que la implementación más consistente es un único listener `keydown` global (p. ej. en `main.js` o un módulo nuevo en `ui/`) que localice la modal `.modal-overlay` visible "más arriba" del DOM (la última añadida a `document.body`, ya que cada modal se hace `document.body.appendChild(overlay)` al abrirse) y dispare el `.click()` del botón correspondiente dentro de ella (`.btn-cancel`, `.btn-accept` si no está `disabled`, `.btn-eliminar`) — sin tener que tocar cada uno de los ~15 ficheros de modal individualmente. Queda a decisión de `ms-implement` el diseño técnico concreto.
- Botones de eliminar dentro de una modal usan siempre la clase `.btn-eliminar` (`ui/componentModal.js:1175`, `ui/resourceModal.js:42`, `ui/cardTextBoxModal.js:258`) — distinta de los botones "Eliminar" de fila en los listados (`component-list__action-btn--danger` en `ui/componentList.js:134`, no dentro de una modal), lo que permite distinguir "hay modal con botón suprimir" de "no hay modal, hay fila seleccionable".
- Selección de componente en modo edición: variable de módulo `selectedComponentId` en `modes/edit/editMode.js:27`, gestionada por `toggleSelect()` (línea 215) y usada tanto por la mesa (`ui/componentRenderer.js`, prop `selectedId`) como por la lista (`ui/componentList.js`, prop `selectedId`). El borrado ya existente de una fila (`ui/componentList.js:131-139`) pide confirmación y llama a `onRemove(component)` → `removeComponent(component.id)` (`editMode.js:243-245`); el atajo SUPR sin modal abierta debe reutilizar exactamente ese mismo camino (mismo mensaje de confirmación) para el componente cuyo id sea `selectedComponentId`, no una vía nueva.
- Posible incongruencia entre documentación y código detectada (no relacionada directamente con este cambio, pero relevante para quien lo implemente): `design/docs/ARCHITECTURE.md` sección 3 dice que "hacer click sobre la representación de un componente en la mesa" abre la modal de edición, pero el código actual (`ui/componentRenderer.js`) liga `onSelect` (abre modal) a `dblclick`, y el `click` simple dispara `onToggleSelect` (selección/resaltado). El código manda: un solo click selecciona/resalta, doble click abre la modal. Sugerencia de actualización de documentación para quien la aplique más adelante.
- Ningún modal usa actualmente `<textarea>` con `keydown` propio salvo el ya mencionado de zoom (que es un `input`, no un `textarea`); los `<textarea>` existentes (`ui/cardTextBoxModal.js:35`, `ui/componentModal.js:318,731,955`) no tienen ningún manejo de tecla propio hoy, así que la exclusión de INTRO en foco de `textarea` es responsabilidad exclusiva del nuevo listener global, no de cada modal.
