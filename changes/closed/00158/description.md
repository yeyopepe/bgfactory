- **Nombre**: Check "Sombra" en la sección Visual de Tablero simple y Tablero personalizado
- **Código**: 00158
- **Tipo**: change
- **Fecha creación**: 2026-08-05

## Prompt original del usuario

"Dentro de esta nueva sección Visual añade otro check para controlar si el elemento tiene sombra o es totalmente plano"

## Descripción completa

La sección de propiedades "Visual" de "Tablero simple" y "Tablero personalizado" (introducida por el cambio 00154, con el checkbox "Biselado en el borde") incorpora un segundo checkbox: **"Sombra"**, marcado (activado) por defecto.

Hoy, ambos tipos de tablero proyectan siempre una sombra suave que los "asienta" sobre la mesa (misma sombra de contacto que comparten el resto de piezas del juego). Con este check:

- **Marcado** (comportamiento actual, por defecto): el tablero sigue proyectando esa sombra de contacto.
- **Desmarcado**: el tablero se dibuja totalmente plano, sin ninguna sombra.

### Alcance

Aplica únicamente a "Tablero simple" y "Tablero personalizado". No afecta a "Dado" ni a "Carta/Ficha", que mantienen siempre su sombra de contacto actual.

### Ubicación

Segundo checkbox dentro de la sección "Visual" ya existente (debajo de "Biselado en el borde"), en la modal de propiedades específicas de ambos tipos de tablero. Etiqueta: "Sombra" (sin la palabra "de contacto", a petición del usuario).

### Casos límite y convivencia

- Es independiente del checkbox "Activar borde" (tablero simple, cambio 00153) y del checkbox "Biselado en el borde" (cambio 00154): los tres controles conviven sin relación entre sí — cualquier combinación es válida (p.ej. sin borde y con sombra, o con borde plano y sin sombra).
- Tableros creados antes de este cambio, sin la nueva propiedad guardada, se comportan igual que si el check estuviera marcado (con sombra) — sin ningún cambio visual en partidas ya existentes al abrirlas.
- El valor del check se guarda como cualquier otra propiedad del componente y viaja con el resto del estado del tablero al exportar/importar como JSON, sin tratamiento especial.
- Disponible para editarse en modo edición; el efecto (con sombra o plano) se ve tanto en modo juego como en modo edición.

## Apuntes técnicos

- `.board` (tablero simple) y `.tablero-personalizado` (tablero personalizado), en `src/styles/main.css` (líneas ~701-703 y ~732-734), aplican hoy `box-shadow: var(--shadow-1)` (sombra de contacto nivel 1, `STYLE_BIBLE.md` sección 6) de forma fija por clase CSS — sin ninguna opción para desactivarla, igual que pasaba con el bisel del borde antes del cambio 00154.
- La sección "Visual" ya existe (cambio 00154, `src/ui/componentModal.js` → `renderBoardSpecificFields`/`renderTableroPersonalizadoSpecificFields`), primera sección de las propiedades específicas de ambos tipos, con el checkbox "Biselado en el borde" (`properties.biselado`, boolean, `true` por defecto) — el nuevo checkbox debería seguir el mismo patrón (`.modal__field--checkbox`) justo debajo, dentro del mismo `fieldset.modal__section`.
- Al aplicarse vía clase CSS fija (no vía estilo inline calculado en JS como el bisel), `ms-how` deberá decidir el mecanismo para desactivar la sombra por componente: candidato más directo, una clase modificadora (p.ej. `.board--sin-sombra`/`.tablero-personalizado--sin-sombra` con `box-shadow: none`) añadida condicionalmente desde `ui/componentRenderer.js`, mismo criterio que otros modificadores ya existentes de esas clases (`--selectable`, `--selected`, `--movable`).
