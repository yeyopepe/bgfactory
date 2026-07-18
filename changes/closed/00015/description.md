- **Nombre**: Checkbox "Mover en Modo Juego" en configuración de componentes
- **Código**: 00015
- **Tipo**: change

## Prompt original del usuario

ms-new añade a la ventana de configuración de todos los controles (sección Generales) un checkbox llamado "Mover en Modo Juego" para indicar si el control puede moverse en modo juego (false po defecto).

---

ms-new 00015 añadimos algunas cosas:
- define un componente y estilo para incorporar ayudas en forma de iconos con "?" que muestran un tooltip al pasar por encima de ellos.
- Aplica esto en el checkbox de este cambio, para incorporar la ayuda sobre él

---

Sí a todo pero te añado más cambios:
- El botón de ayuda tiene dos comportamientos: un tooltip (en caso de textos planos de menos 200 caracteres) o una modal si el texto es mayor o tiene formato.

## Descripción completa

Se añade a la ventana de configuración de cualquier tipo de control (componente), en su pestaña "Generales", un nuevo checkbox llamado "Mover en Modo Juego". Este checkbox indica si ese componente concreto podrá arrastrarse libremente por toda la mesa mientras se está en Modo Juego. Por defecto viene desmarcado (false).

Hoy, en Modo Juego, ningún componente puede moverse: esa capacidad solo existe en el editor. Con este cambio, los componentes que tengan el checkbox marcado sí podrán arrastrarse por cualquier parte de la mesa durante el Modo Juego, sin ninguna restricción de zona ni límite adicional. Los componentes que no lo tengan marcado permanecen fijos en su sitio, igual que ocurre actualmente.

El checkbox se ubica justo debajo del campo "ID del componente" en la pestaña "Generales", con el mismo estilo que otros checkboxes ya existentes en la ventana de configuración (checkbox + etiqueta en línea).

Al pasar el ratón sobre un componente movible en Modo Juego, se muestra el mismo tipo de indicador visual (cursor de arrastre) que ya usa el editor para señalar que un elemento se puede mover.

Los componentes creados antes de este cambio, al no tener este dato guardado todavía, se comportan como si estuviera desmarcado (no movibles en Modo Juego), sin que esto rompa nada de lo ya guardado.

### Preguntas de alcance resueltas

- **¿El movimiento en Modo Juego tiene alguna restricción de zona?** No: cuando está activado, el componente puede moverse por toda la mesa sin límites.
- **¿Afecta a componentes ya creados sin este dato?** Se tratan como no movibles (comportamiento por defecto), manteniendo compatibilidad con lo ya guardado.

### Ampliación: componente de ayuda reutilizable ("?" con tooltip/modal)

Se define un nuevo elemento de ayuda reutilizable en toda la aplicación: un icono circular pequeño con el símbolo "?" que, al pasar el ratón por encima, muestra información de ayuda asociada al elemento junto al que aparece. No es exclusivo de este cambio — es un componente genérico, pensado para usarse en cualquier otro punto de la app que necesite una ayuda contextual similar en el futuro.

Este icono de ayuda tiene dos comportamientos posibles según el contenido a mostrar:
- **Tooltip** (globo de texto flotante junto al icono): se usa cuando el texto de ayuda es plano (sin formato) y tiene menos de 200 caracteres. Aparece al pasar el ratón por encima y desaparece al retirarlo.
- **Modal**: se usa cuando el texto de ayuda es más largo (200 caracteres o más) o necesita formato (por ejemplo, varios párrafos, listas). En ese caso, pasar el ratón por encima no basta — se abre una ventana modal con el contenido completo de ayuda al hacer click sobre el icono.

Quien use este componente en cada punto de la app simplemente proporciona el texto/contenido de ayuda; el propio componente decide automáticamente si mostrarlo como tooltip o como modal según ese contenido (longitud y si tiene formato o no), sin que quien lo usa tenga que elegir explícitamente el modo.

**Aplicación en este cambio**: se añade uno de estos iconos de ayuda junto a la etiqueta del checkbox "Mover en Modo Juego" (sustituyendo al texto de ayuda fijo que mostraba la maqueta inicial de este cambio). Su contenido es el texto plano "Permite arrastrar este componente por toda la mesa mientras se juega. Desactivado por defecto." (por debajo de 200 caracteres, sin formato), por lo que en este caso concreto se mostrará siempre como tooltip.

### Preguntas de alcance resueltas (ampliación)

- **¿Activación por teclado/foco, además de hover?** No por ahora: solo se activa con el ratón (hover para tooltip, click para abrir la modal), igual que el resto de interacciones de la app hoy, que no contempla navegación por teclado.
- **¿Convive el tooltip con el texto de ayuda fijo que ya proponía la maqueta?** No: el icono de ayuda sustituye a ese texto fijo: la ayuda solo se ve al interactuar con el icono, no permanece visible por defecto.

## Apuntes técnicos

- El checkbox se añade en `src/ui/componentModal.js`, en la pestaña "Generales" (función que construye `idField`), siguiendo el mismo patrón que el checkbox "Transparente" ya existente en la pestaña "Específicas" de ese mismo fichero.
- El modelo de componente vive en `src/core/component.js` (`createComponent`/`updateComponent`); el nuevo dato debe añadirse como campo general del componente (mismo nivel que `id`/`type`/`x`/`y`), no dentro de `properties` (que es específico por tipo), ya que aplica a cualquier tipo de control.
- El Modo Juego se renderiza en `src/modes/play/playMode.js`, que llama a `renderComponentsOnTable(table.worldEl, getComponents())` en `src/ui/componentRenderer.js` sin pasar `onMove` — hoy no hay ninguna lógica de arrastre activa ahí. `componentRenderer.js` ya implementa lógica de arrastre (`onMove`, drag con `mousedown`/`mousemove`/`mouseup`) usada en el editor, que puede reutilizarse/adaptarse para habilitar el arrastre en Modo Juego condicionado a este nuevo campo.
