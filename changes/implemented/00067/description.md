- **Nombre**: Transición suave al levantar/soltar un componente en Modo Juego
- **Código**: 00067
- **Tipo**: change

## Prompt original del usuario

"ms-name el mover un elemento en el modo juego, el offset que aplica para simular que es levanta la ficha es demasiado brusco. Aplica una transición"

## Descripción completa

En Modo Juego, cuando el jugador empieza a arrastrar un componente movible (ficha, carta, dado, texto, tablero o documento — cualquier tipo que no esté "Bloqueado"), la mesa aplica un efecto visual de "levantar la ficha": la pieza se desplaza ligeramente y gana una sombra más pronunciada mientras dura el arrastre, y vuelve a su aspecto normal al soltarla. Actualmente ese cambio de aspecto ocurre de golpe (de un fotograma a otro), lo que se percibe como brusco.

Se pide suavizar ese cambio con una transición, de forma que tanto el gesto de "levantar" (al empezar a arrastrar) como el de "soltar" (al terminar) se vean como un movimiento progresivo y no como un salto instantáneo.

Alcance de este cambio:

- Solo se suaviza la transición entre el estado "en la mesa" y el estado "levantado" (desplazamiento + sombra). No cambia ninguna otra característica del efecto: ni la magnitud del desplazamiento, ni la intensidad de la sombra, ni el momento en que se activa/desactiva (al empezar/terminar el arrastre).
- Sigue aplicando exclusivamente en Modo Juego, sobre componentes no bloqueados; Modo Edición no se ve afectado — el arrastre en ese modo no usa este efecto y sigue igual que hasta ahora.
- La duración/suavidad de la transición sigue el mismo criterio ya usado en el resto de la app para transiciones de interacción (hover/foco de botones, filas, tabs, etc.): un cambio rápido y sutil (150ms), no una animación llamativa ni lenta.
- La transición aplica igual en ambos sentidos: tanto al levantar como al soltar la pieza, de forma simétrica.

Preguntas de alcance resueltas con el usuario:

- **¿Se confirma añadir la transición aunque hoy el efecto está documentado como deliberadamente instantáneo?** Sí — se confirma invertir ese criterio para este efecto concreto; deja de ser un cambio de golpe y pasa a comportarse como el resto de elementos interactivos de la app.
- **¿Qué duración/suavidad usar?** La misma que ya usa el resto de la app para transiciones de interacción (150ms, sin efecto de rebote ni aceleración especial).
- **¿La transición aplica solo al soltar, o también al levantar?** A ambos gestos por igual.

## Apuntes técnicos

- Implementación actual: `src/styles/main.css` (~línea 1537-1544), clase `.lifted` con `transform: translate(-4px, -9px)` y `box-shadow: 6px 7px 9px 2px rgba(0,0,0,0.35)`, sin `transition`. El comentario adjunto en el CSS dice explícitamente "Cambio de aspecto instantáneo (sin transición), igual que siempre" — hay que actualizarlo si deja de ser cierto.
- La clase se añade/quita vía `ui/componentRenderer.js` (`beginDragLift`/`endDragLift`, líneas ~247-258), invocadas solo cuando `renderComponentsOnTable` recibe `liftOnDrag: true` — hoy solo lo activa `modes/play/playMode.js`; `modes/edit/editMode.js` no.
- `STYLE_BIBLE.md` sección 13 ("Efecto 'levantar' al arrastrar en Modo Juego") documenta explícitamente el comportamiento instantáneo actual como una excepción deliberada dentro de la prohibición general de animaciones/transiciones complejas de esa sección (junto al temblor del dado). Este cambio requiere actualizar esa sección para reflejar que `.lifted` pasa a usar `transition` (con el mismo token `var(--transition-fast)` ya documentado en la sección 6), dejando claro que esto no reabre la prohibición general de animaciones complejas (`@keyframes`, animaciones narrativas), que se mantiene para el resto de casos (temblor/parpadeo del dado, contorno de selección).
- No hay incongruencia código/documentación: ambos coinciden en que hoy el efecto es instantáneo. La actualización de `STYLE_BIBLE.md` es una actualización intencionada de la regla, no la corrección de una incongruencia.
