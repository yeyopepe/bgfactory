# Plan — 00002: Mesa de juego infinita, barra de edición a todo el ancho y restyle general

## (a) Anotaciones funcionales

**Fuera de alcance** (explícito en la descripción):
- Posición propia / arrastre de componentes sobre la mesa (coordenadas persistidas). La mesa es solo fondo navegable; el listado de componentes se mantiene aparte.
- Persistencia de la posición/zoom de la cámara (se reinicia siempre al recargar).
- Otros tipos de componente además de "cuadro de texto".
- Roles o distinción de usuarios/sesiones.

**Preguntas ya resueltas con el usuario** (recogidas en `description.md`, no se repiten aquí en detalle): alcance del restyle (toda la app), campos de la pestaña "Generales" (solo `id`, editable), validación de `id` (no vacío + único, bloquea "Aceptar"), origen del componente de prueba (precarga automática solo si no hay datos persistidos), interpretación de "gris 50%/20%" (HSL de luminosidad), semántica de fondo transparente en el cuadro de texto.

**Decisión técnica tomada durante el análisis** (no requería confirmación del usuario, es un detalle de implementación): el "cuadro de texto" se renderiza sobre la mesa **solo en modo juego** (es la superficie de partida). En modo edición, la mesa se muestra igualmente como fondo navegable (mismo componente `ui/table.js`, misma estética), pero encima se mantiene el panel con el listado de componentes y las acciones de alta/edición/borrado — no se duplica el renderizado visual del cuadro de texto ahí, igual que hoy el modo edición no renderiza la partida. Esto es coherente con la capa `modes/*` actual (cada modo compone su propia vista sobre el mismo estado) y con el punto de la descripción que dice que el listado "se mantiene aparte, como hoy, sin cambios en su comportamiento".

## (b) Solución técnica

1. **`src/ui/table.js` (nuevo)** — módulo reutilizable que implementa la mesa infinita: crea una superficie con dos capas (`viewport` fijo al contenedor + `world` interior con `transform: translate(...) scale(...)`), y engancha los listeners de pan (`mousedown`/`mousemove`/`mouseup` sobre el viewport, arrastrando el `world`) y zoom (`wheel`, acotado a un rango razonable, p. ej. `0.5`–`2.5`, centrado en el puntero). Expone una función `createInfiniteTable(container)` que devuelve `{ el, worldEl }`: `el` es la superficie completa a insertar en el DOM, `worldEl` es donde cada modo debe añadir el contenido que quiera posicionar sobre la mesa (de momento, el cuadro de texto en modo juego). No depende de `core/state.js` ni conoce componentes — es una pieza de `ui/` genérica, según la capa de arquitectura existente.

2. **`src/ui/componentModal.js` (nuevo)** — modal de creación/edición de componente con overlay, dos tabs ("Generales"/"Específicas") y pie con "Cancelar"/"Aceptar". Expone `openComponentModal({ component, onAccept })`:
   - Si `component` es `null`, es alta nueva (se crea con `createComponent({ type: 'cuadro-texto' })` internamente al abrir, ya que es el único tipo existente); si no, es edición del componente pasado.
   - Tab "Generales": campo `id` (editable, precargado). Validación en vivo: no vacío y único entre `getComponents()` (excluyendo el propio id si se está editando) — si falla, error inline y botón "Aceptar" deshabilitado.
   - Tab "Específicas": el contenido depende de `component.type`. Para `'cuadro-texto'`: campos "Contenido" (texto), "Tamaño de fuente" (numérico), "Color de texto" (`input type=color`, por defecto `#000000`), "Color de fondo" (por defecto vacío/`transparent`, con opción de fijar un color — usar un checkbox o valor especial para representar "transparente" ya que `input type=color` no soporta transparencia nativamente). Para cualquier otro `type` no reconocido: tab vacía (mensaje "Sin propiedades específicas"), preparado para futuros tipos.
   - "Cancelar": cierra el modal sin tocar el estado.
   - "Aceptar" (solo habilitado si el id es válido): construye el componente final con `updateComponent()` (o el creado con `createComponent` si es alta) aplicando `id` y `properties` de los campos, y llama a `addComponent`/`replaceComponent` de `core/state.js` según corresponda; cierra el modal.
   - Reutiliza el modelo existente (`core/component.js`) sin cambiarlo — este módulo es quien decide qué `properties` corresponden a cada `type`, no `core/`.

3. **`src/modes/edit/editMode.js` (reescribir el placeholder)** — modo edición ahora funcional:
   - Renderiza la mesa infinita (`createInfiniteTable`) como fondo de toda la vista.
   - Sobre ella, un panel con `renderComponentList` (de `ui/componentList.js`, sin cambios) pasando `onEdit`/`onRemove`: `onEdit` abre `openComponentModal({ component })`; `onRemove` llama directamente a `removeComponent(component.id)` de `core/state.js` (no requiere modal, es una acción directa como hoy).
   - Botón "Añadir componente": abre `openComponentModal({ component: null })`.

4. **`src/modes/play/playMode.js` (ampliar)**:
   - Renderiza la mesa infinita (`createInfiniteTable`) igual que en edición, para que la estética/navegación sea consistente en ambos modos.
   - Para cada componente de `getComponents()` con `type === 'cuadro-texto'`, crea un bloque de texto (`div`) con su `properties.contenido`, `properties.tamañoFuente`, `properties.colorTexto`, `properties.colorFondo` aplicados vía estilo inline, y lo añade al `worldEl` de la mesa en una posición fija (mismo punto para todos por ahora, p. ej. cerca del origen del mundo — no hay coordenadas propias por componente, está fuera de alcance).
   - Mantiene debajo/aparte el `renderComponentList` de solo lectura (sin `onEdit`/`onRemove`), igual que hoy — sin cambios de comportamiento.

5. **`src/main.js` (precarga automática)** — en la rama `else` donde hoy se hace `renderAll()` por no haber datos persistidos, sustituir por: crear un componente inicial con `createComponent({ type: 'cuadro-texto', properties: { contenido: <texto de ejemplo>, tamañoFuente: <valor por defecto>, colorTexto: '#000000', colorFondo: '' } })` y añadirlo con `addComponent()` (esto ya emite `components:changed`, que dispara `renderAll` + autoguardado vía los listeners existentes — no hace falta llamar a `renderAll()` aparte en esa rama).

6. **`src/index.html` (ajustes mínimos de estructura)** — mantener los mismos ids (`edit-toolbar`, `mode-switcher`, `content`, `app-version`) para no romper `main.js`; ajustar el documento a layout de pantalla completa (sin contenedor centrado de ancho fijo) para que la mesa pueda ocupar todo el viewport disponible bajo la barra/título.

7. **`src/styles/main.css` (restyle general)**:
   - Quitar `max-width:720px; margin:2rem auto` del `body`; pasar a `margin:0`, `min-height:100vh`, sin padding lateral fijo.
   - `.edit-toolbar`: `position:fixed; top:0; left:0; width:100%` (deja de depender del ancho del `body`), fondo `#333333` (gris 20%), texto claro.
   - Nueva clase para la superficie de la mesa (usada por `ui/table.js`): fondo `#808080` (gris 50%), ocupando el alto disponible bajo la barra/título.
   - Paleta general gris/azul: variables CSS (`--bg-table`, `--bg-toolbar`, `--accent-blue`, `--text-*`, `--card-*`) aplicadas a botón "Entrar en modo edición", listado de componentes (tarjetas/filas), pie de versión.
   - Estilos del modal (`.modal-overlay`, `.modal`, `.modal__tabs`, `.modal__tab.active`, `.modal__field`, `.modal__error`, `.btn-cancel`, `.btn-accept:disabled`), inspirados en la maqueta `design_modal-edicion-componente.html` solo como referencia visual (colores/proporciones), sin reutilizar su marcado.
   - Estilo del cuadro de texto renderizado sobre la mesa (sin borde de tarjeta, tipografía libre según `tamañoFuente`).

Orden de implementación: 7 (base CSS) → 1 (`table.js`) → 3 y 4 (modos) → 2 (`componentModal.js`, integrado en 3) → 5 (precarga) → 6 (ajustes HTML en paralelo con 7).

## (c) Cambios de arquitectura

Actualizar `design/docs/ARCHITECTURE.md`:
- **Sección 3 (Modo juego vs modo edición)**: reflejar que `modes/edit/editMode.js` deja de ser un placeholder — ahora compone la mesa infinita (`ui/table.js`) y el listado de componentes con acciones reales de alta/edición/borrado a través de `ui/componentModal.js`.
- **Sección 4 (Modelo de datos de componente)**: anotar que `id` deja de generarse únicamente en `createComponent()` sin más — ahora es editable por el usuario desde `ui/componentModal.js`, con validación de no-vacío/único hecha en esa capa de UI (no en `core/component.js`, que no cambia su forma). Añadir que `'cuadro-texto'` es el primer `type` concreto en uso, con `properties: { contenido, tamañoFuente, colorTexto, colorFondo }`.
- **Nueva mención en la capa `ui/`**: documentar `ui/table.js` (mesa infinita con pan/zoom, genérica, sin conocimiento de componentes) y `ui/componentModal.js` (modal de alta/edición con tabs, específico de componentes) como nuevos módulos reutilizables entre modos.
