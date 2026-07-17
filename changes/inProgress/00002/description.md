# Mesa de juego infinita, barra de edición a todo el ancho y restyle general

- **Código**: 00002
- **Tipo**: change

## Prompt original del usuario

> esta app representa una mesa de juego infinita. la barra superior del modo edición debe ocupar todo el ancho de la pantalla. Aplica un estilo visual general de estilo moderno y minimalista, con predominancia de tonos grises y azules.

> Añadimos cambios a esta funcionalidad:
> 1. la ventana modal de edición de componentes debe tener 2 secciones diferencidas con tabs: las generales (ahora solo el id del elemento) y las específicas (de momento vacía)
> 2. esa modal debe tener un botón para aceptar los cambios o cancelarlos

> Más cambios:
> - En el modo juego solo añade ahora un único elemento de prueba: un cuadro de texto.
> - Añade a sus opciones (tab específico de este tipo de elementos), la posibilidad de cambiar su contenido y el tamaño de la fuente.
> - Actualiza los mockups para que se muestre lo que incluye este cambio. No añadas otras cosas.
> - En los mockups usa un estilo con tonos de grises en lugar de azules

> Más cambios:
> - Cambia los mockups: Fondo de la pantalla (la mesa) en gris 50% y barra de edición gris 20%
> - añade como opción específica a elementos tipo texto la posibilidad de cambiar el color del texto (negro por defecto) y el color del fondo (transparente por defecto)

## Descripción completa

La app representa conceptualmente una "mesa de juego infinita". Este cambio introduce varias piezas relacionadas:

1. **Mesa infinita funcional**: el área de contenido/tablero pasa a ser una superficie navegable mediante pan (arrastrar) y zoom (rueda del ratón / gestos), con un rango de zoom acotado para evitar extremos ilegibles. Los componentes (cartas, tokens, etc.) **no** se posicionan aún libremente sobre la mesa ni tienen coordenadas propias — queda fuera de este cambio, para uno futuro. El listado de componentes se mantiene aparte, como hoy, sin cambios en su comportamiento.
2. **Barra superior del modo edición a todo el ancho**: hoy `.edit-toolbar` tiene `width:100%`, pero el `body` tiene `max-width:720px; margin:2rem auto`, por lo que la barra solo cubre esos 720px centrados, no la pantalla completa. Debe pasar a cubrir el 100% del ancho real del viewport, independientemente del ancho del contenido/mesa debajo.
3. **Restyle visual general de toda la app** (modo juego y modo edición, no solo edición): estilo moderno y minimalista, con predominancia de tonos grises y azules, aplicado de forma consistente al fondo de la mesa, la barra de edición, el botón de entrada a modo edición, el listado de componentes y el pie de versión.
4. **Modal de creación/edición de componentes con tabs**: el botón "Editar" de un componente existente, y la creación de un componente nuevo, abren el mismo modal (sustituye a la idea previa de formulario inline sobre el panel). El modal tiene dos pestañas: **Generales**, que por ahora solo contiene el campo `id` del componente (editable), y **Específicas**, cuyo contenido depende del tipo de componente (ver punto 5 — por ahora solo existe un tipo, "cuadro de texto"). El modal tiene dos botones: **Aceptar** (aplica los cambios y cierra) y **Cancelar** (descarta los cambios y cierra, el componente queda como estaba o, si se estaba creando uno nuevo, no se añade).
5. **Primer tipo de componente concreto: "cuadro de texto"**: por ahora es el único tipo de componente que existe en la app (elemento de prueba para validar el concepto de componente renderizado sobre la mesa). Su pestaña **Específicas** en el modal permite editar cuatro propiedades propias de este tipo: **Contenido** (el texto que muestra), **Tamaño de fuente**, **Color de texto** (negro por defecto) y **Color de fondo** (transparente por defecto). En modo juego, este componente se renderiza directamente sobre la mesa infinita como un cuadro de texto real, con su contenido, tamaño de fuente y colores aplicados, en una posición fija (sin arrastre todavía). Al arrancar la app sin datos persistidos en `localStorage`, el estado inicial ya incluye automáticamente una instancia de este componente de prueba, para que se vea sin pasos previos del usuario; a partir de ahí sigue el ciclo de vida normal de cualquier componente (autoguardado, editable/eliminable desde el modo edición).
6. **Colores del fondo de mesa y de la barra de edición**: el fondo de la mesa pasa a ser un gris al 50% (interpretado como `hsl(0, 0%, 50%)` = `#808080`) y el fondo de la barra de modo edición un gris al 20% (`hsl(0, 0%, 20%)` = `#333333`), sustituyendo los tonos gris-azulado oscuro usados en los mockups anteriores.

### Preguntas de alcance resueltas con el usuario

- **¿"Mesa infinita" es solo metáfora visual o funcionalidad real de pan/zoom?** → Funcionalidad real: pan y zoom sobre la mesa.
- **¿Se aplica el restyle a toda la app o solo al modo edición?** → A toda la app (modo juego y edición).
- **¿Los componentes se posicionan libremente sobre la mesa en este cambio?** → No. De momento la mesa es solo el fondo navegable; el listado de componentes se mantiene aparte, como hoy. Añadir posición propia a los componentes queda para un cambio futuro.
- **¿Se persiste la posición/zoom de la cámara?** → No, de momento. Al recargar la página, la mesa vuelve siempre a su vista/zoom inicial por defecto.
- **¿Qué campos tiene la pestaña "Generales" del modal?** → Por ahora solo el `id` del componente, y es editable (no solo de referencia).
- **¿El modal con tabs se usa tanto para crear como para editar componentes?** → Sí, el mismo modal sirve para ambos casos; al crear uno nuevo, el id ya viene generado pero también es editable.
- **¿Qué pasa si el usuario deja el id vacío o lo cambia a uno que ya usa otro componente?** → Se bloquea el botón "Aceptar" (o se muestra un error inline) hasta que el id sea válido: no vacío y único entre los componentes existentes.
- **El "cuadro de texto" de prueba, ¿aparece como fila del listado o se dibuja de verdad sobre la mesa?** → Se renderiza de verdad sobre la mesa infinita, como un cuadro de texto visual con su contenido y tamaño de fuente, en una posición fija (sin drag por ahora).
- **¿De dónde sale ese componente de prueba: creación manual o precarga automática?** → Precarga automática: si no hay datos persistidos en `localStorage` al arrancar, el estado inicial ya incluye una instancia de este componente. No hay carga de datos de ejemplo si ya existe algo persistido (para no duplicarlo en cada recarga).
- **¿Cómo se interpreta "gris 50%" / "gris 20%"?** → Como porcentaje de luminosidad en HSL: `hsl(0,0%,50%)` (`#808080`) para la mesa y `hsl(0,0%,20%)` (`#333333`) para la barra de edición.
- **¿"Color de fondo" transparente por defecto significa que se ve el gris de la mesa por debajo?** → Sí: al ser `transparent`, el cuadro de texto no dibuja ningún fondo propio y se ve directamente el fondo de la mesa detrás.

### Casos límite y estados

- **Estado vacío**: sin componentes, la mesa sigue siendo navegable (pan/zoom) con la nueva estética de fondo.
- **Zoom**: acotado a un rango razonable (a definir en la fase de implementación) para no llegar a extremos ilegibles.
- **Sin estados de carga**: todo ocurre en memoria/DOM, no hay operaciones asíncronas nuevas implicadas.
- **Sin flujo de cancelación**: el pan/zoom es una interacción continua y directa (arrastrar, rueda del ratón), no tiene un paso de confirmar/cancelar.
- **Modal — cancelar**: cierra el modal sin aplicar ningún cambio; si se estaba editando un componente existente, queda tal cual estaba; si se estaba creando uno nuevo, no se añade a la lista.
- **Modal — id inválido**: si el campo `id` queda vacío o coincide con el de otro componente ya existente, el botón "Aceptar" queda bloqueado (o al pulsarlo se muestra un error inline) hasta que el valor sea válido.
- **Cuadro de texto — recarga con datos ya persistidos**: si ya hay componentes guardados en `localStorage` (incluida, en su caso, una edición previa del cuadro de texto de prueba), no se vuelve a precargar uno nuevo; se cargan los datos persistidos tal cual, igual que hoy.
- **Cuadro de texto — contenido vacío**: si el usuario borra el contenido desde la pestaña Específicas, el cuadro de texto se renderiza vacío sobre la mesa (sin texto), sin que esto bloquee el guardado — a diferencia del `id`, no es un campo obligatorio.
- **Cuadro de texto — color de fondo transparente**: al ser el valor por defecto, no bloquea nada; el usuario puede fijar un color sólido si quiere que el cuadro destaque sobre la mesa.

### Convivencia con lo existente

- Sustituye el layout actual de documento centrado (`max-width:720px` en `body`) por un layout de mesa a pantalla completa.
- No afecta al modelo de datos de componente (`core/component.js`) en su forma (sigue siendo `{ id, type, name, properties, image }`), a la persistencia existente (autoguardado/export/import JSON) ni al bus de eventos.
- Cambia el comportamiento actual del `id`: hoy `createComponent()` lo genera con `crypto.randomUUID()` y nada en el código lo trata como editable; este cambio lo convierte en un campo editable por el usuario desde el modal, con la validación de no-vacío/único indicada arriba.
- El "cuadro de texto" usa el modelo de componente ya existente (`type: 'cuadro-texto'` o similar, `properties: { contenido, tamañoFuente }`), sin cambios estructurales en `core/component.js`. La precarga automática se añade en el arranque de `main.js`, en la misma rama donde hoy se comprueba si hay datos persistidos (`loadFromLocalStorage`) — si no los hay, se inicializa el estado con este componente en vez de dejarlo vacío.

### Alcance de los datos

No aplica cambio en el modelo de datos persistido. La posición/zoom de la cámara del pan/zoom no se guarda en ningún sitio (ni `localStorage` ni el JSON exportado); es puramente un estado de la vista, en memoria, que se reinicia al recargar. El componente "cuadro de texto" precargado, en cambio, sí sigue el ciclo normal de persistencia una vez creado: el autoguardado existente lo escribe en `localStorage` como a cualquier otro componente, así que ediciones posteriores sobre él sobreviven a recargar la página.

### Quién puede usarlo

No aplica — el proyecto no tiene roles ni distinción de usuarios/sesiones.

### Definición visual de alto nivel

- **Fondo de la mesa**: gris al 50% (`#808080`), uniforme o con sutil textura/patrón que refuerce la sensación de superficie infinita, visible tanto en modo juego como en modo edición.
- **Barra de modo edición**: franja fija en la parte superior, ahora a todo el ancho de la pantalla, con fondo gris al 20% (`#333333`) y texto claro.
- **Botón "Entrar en modo edición"** (modo juego): estilo consistente con la nueva paleta (acento azul sobre fondo neutro).
- **Listado de componentes**: tarjetas/filas con fondo gris claro o neutro, bordes sutiles, acentos azules en botones de acción (editar/eliminar/añadir).
- **Interacción de pan/zoom**: arrastrar con el ratón (o gesto táctil) mueve la mesa; rueda del ratón (o pellizco táctil) hace zoom in/out dentro de un rango acotado; no hay controles de UI adicionales visibles para esto en esta fase (la interacción es directa sobre la superficie).
- **Modal de creación/edición de componente**: ventana centrada sobre la mesa, con overlay semitransparente detrás. Cabecera con dos pestañas ("Generales" / "Específicas"); la pestaña activa resaltada con el acento de la paleta. Contenido de la pestaña "Generales": campo `id` editable, con mensaje de error inline si queda vacío o duplicado. Contenido de la pestaña "Específicas" para el tipo "cuadro de texto": campo "Contenido" (texto), campo "Tamaño de fuente" (numérico), campo "Color de texto" (selector de color, negro por defecto) y campo "Color de fondo" (selector de color, transparente por defecto). Pie del modal con dos botones: "Cancelar" (estilo neutro) y "Aceptar" (deshabilitado si el id no es válido).
- **Cuadro de texto sobre la mesa** (modo juego): se dibuja como un bloque de texto simple (sin borde de tarjeta), con el contenido configurado, aplicando el tamaño de fuente, el color de texto y el color de fondo indicados (transparente por defecto, dejando ver el gris de la mesa detrás), en una posición fija sobre la superficie visible inicial de la mesa.
- **Nota de paleta en las maquetas**: en los mockups de este punto (cuadro de texto + su tab específico) se ha probado un acento en tonos de gris en lugar del azul usado hasta ahora, a modo de exploración — queda pendiente de validar/unificar con el resto de la paleta en la fase de implementación.
