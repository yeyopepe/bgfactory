- **Nombre**: Buscador de texto en la ventana de componentes
- **Código**: 00050
- **Tipo**: change

## Prompt original del usuario

ms-new añade el mismo buscador de la lista de recursos a la lista de componentes

## Descripción completa

Se añade a la lista de componentes (el panel flotante "Componentes") un buscador de texto, igual al que ya existe hoy en la lista de recursos.

Comportamiento:

- Cuando el panel de componentes está expandido y hay al menos un componente, aparece un cuadro de texto justo debajo de la cabecera del panel, encima de la tabla, con el texto de ejemplo "Filtrar componentes…". Sin icono, igual que en el buscador de recursos.
- El filtrado ocurre en vivo, letra a letra, sin necesidad de pulsar ningún botón ni Intro.
- La coincidencia es parcial (basta con que el texto escrito aparezca en cualquier parte), sin distinguir mayúsculas de minúsculas ni tener en cuenta los acentos.
- El buscador filtra por dos datos de cada componente: su identificador y su tipo (el mismo valor que ya se ve hoy en la columna "Tipo" de la tabla: texto, tablero, dado, ficha, visor de documentos, etc.). A diferencia del buscador de recursos, no filtra por "nombre", porque los componentes no tienen ese dato.
- Si el texto escrito no coincide con ningún componente, la tabla desaparece y en su lugar se muestra el mensaje: "No hay componentes que coincidan con «texto escrito»."
- Si no hay ningún componente todavía (antes de escribir nada), no se muestra el cuadro de búsqueda, y se mantiene el mensaje que ya existe hoy: "No hay componentes todavía."
- Lo que se escribe en el buscador es temporal: no se guarda en ningún sitio y se pierde al recargar la página.
- El buscador convive sin problema con el resto de funciones que ya tiene el panel de componentes (seleccionar una fila, cambiar su orden, arrastrar el panel, redimensionarlo, colapsarlo): no sustituye ni cambia ninguna de ellas.
- El buscador solo aparece en el modo edición, igual que el resto del panel de componentes hoy — no cambia el alcance de quién puede usarlo.

Definición visual: el cuadro de búsqueda ocupa todo el ancho disponible del panel y se sitúa entre la cabecera del panel y la tabla de componentes, con el mismo aspecto visual que el buscador ya existente en el panel de recursos.

Preguntas de alcance resueltas con el usuario:

- ¿Sobre qué campos debe buscar, dado que los componentes no tienen "nombre" como los recursos? → Id y Tipo.
- ¿Se confirma el resto del comportamiento igual que en recursos (filtrado en vivo, sin distinguir mayúsculas/acentos, texto no persistente, mismos textos de marcador de posición y de "sin resultados" adaptados a componentes)? → Sí, igual que en recursos.

## Apuntes técnicos

- Precedente exacto a replicar: change cerrado 00042 (`changes/closed/00042/`), que implementó este mismo buscador en `src/ui/resourceList.js`.
- Patrón de referencia en `resourceList.js`: estado de filtro a nivel de módulo (`filterText`, línea 19), función `normalize()` (líneas 21-23: lowercase + normalización NFD + eliminación de diacríticos), función `matchesFilter(resource, query)` (líneas 25-33, comprueba `resource.name`, la etiqueta de tipo y `resource.id`). El input de filtro (líneas 174-187, clase `resource-panel__filter`, placeholder `'Filtrar recursos…'`, listener `input` que re-renderiza el cuerpo) solo se renderiza si `resources.length > 0` (línea 173); si no, se resetea `filterText` a `''` (línea 189). `renderBody()` (líneas 35-98) gestiona el mensaje de vacío/sin-coincidencias y la tabla.
- CSS de referencia en `src/styles/main.css`: `.resource-panel__filter` (~línea 999), `.resource-panel__filter input[type="text"]` (~línea 1004, incluye estado `:focus` en ~1014), y `.resource-list__empty-filter` (~línea 1056).
- Archivo destino equivalente: `src/ui/componentList.js`, función `renderComponentList(container, components, {...})`. Campos disponibles en cada componente: `id`, `type` (string en bruto, sin mapeo a etiqueta legible como en recursos, p. ej. `'texto'`, `'tablero'`, `'dado'`, `'ficha'`, `'visorDocumentos'`), `order`.
- No existe actualmente ninguna clase CSS `.component-panel__filter` ni mecanismo de filtro en `componentList.js` — confirmado por inspección directa y por una nota técnica ya dejada en su momento en el propio change 00042 ("No existe ningún patrón de filtro/búsqueda ya implementado en el proyecto, se comprobó también en el panel análogo de componentes, componentList.js").
- Sugerencia para la fase de planificación técnica (no es una decisión tomada aquí): valorar si conviene extraer un pequeño helper común de normalización de texto, dado que tras este cambio habría dos implementaciones casi idénticas del mismo patrón (`resourceList.js` y `componentList.js`).
