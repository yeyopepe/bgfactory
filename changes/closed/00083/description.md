- **Nombre**: Redimensionado vertical de las ventanas flotantes del modo edición
- **Código**: 00083
- **Tipo**: change

## Prompt original del usuario

las ventanas del modo edición (lista componentes, etc) deben tmabién poder redimensionarse en vertical

## Descripción completa

Las ventanas flotantes del modo edición — "Componentes", "Recursos" y "Mazos" — hoy solo se pueden redimensionar en horizontal (arrastrando su esquina inferior derecha). Deben poder redimensionarse también en vertical, con el mismo manejador de esquina.

- **Alcance**: aplica a las tres ventanas flotantes del modo edición ("Componentes", "Recursos" y "Mazos"), que ya comparten hoy el mismo comportamiento de redimensionado horizontal.
- **Interacción**: el manejador de la esquina inferior derecha pasa a permitir arrastrar en ambas dimensiones a la vez (ancho y alto simultáneamente) — un único punto de arrastre combinado, sin añadir un segundo manejador aparte solo para el alto.
- **Qué crece**: al cambiar el alto, lo que crece o decrece es la zona de listado (la tabla de filas) de cada ventana; la cabecera (título, control de colapso, filtro de texto si lo tiene) y el pie (botón de añadir) mantienen siempre su alto actual, fijo.
- **Límites**: el alto mínimo debe dejar visible al menos la cabecera y una fila de la tabla. No hay alto máximo, salvo no salirse por abajo del área visible de la mesa — mismo criterio que ya aplica hoy al ancho, que tampoco tiene máximo salvo no salirse del borde derecho de la pantalla.
- **Persistencia**: el alto elegido por el usuario se guarda en el autoguardado, igual que ya ocurre con el ancho, de forma independiente por cada una de las tres ventanas. Sobrevive a colapsar/expandir la ventana: al expandirla de nuevo, se restaura el último alto guardado.
- **Definición visual**: no se añaden elementos visuales nuevos. El manejador de redimensionado (icono de esquina inferior derecha) es el mismo que ya existe hoy; solo cambia su comportamiento para responder también al eje vertical, no únicamente al horizontal.

### Preguntas de alcance resueltas

- ¿Aplica a las tres ventanas? → Sí, a "Componentes", "Recursos" y "Mazos".
- ¿Un único manejador combinado o uno independiente para el alto? → Un único manejador combinado en la esquina, igual que ya se usa para redimensionar componentes en la mesa.
- ¿Límite máximo de alto? → No, mismo criterio que el ancho: solo se recorta para no salirse del área visible.
- ¿Qué parte de la ventana crece? → Solo la zona de listado (tabla); cabecera y pie quedan fijos.
- ¿Se persiste el alto? → Sí, igual que el ancho, y sobrevive a colapsar/expandir.

## Apuntes técnicos

- Las tres ventanas (`ui/componentList.js`, `ui/resourceList.js`, `ui/deckList.js`) comparten el mismo patrón de panel flotante y usan `ui/resizeHandle.js` con `axis: 'x'` (solo horizontal), límites actuales 290–600px o hasta el borde derecho de la pantalla.
- `ui/resizeHandle.js` ya soporta genéricamente `axis: 'both'` (reutilizado hoy para redimensionar componentes en la mesa), por lo que no hace falta un mecanismo nuevo, solo aplicarlo también a estos paneles.
- El alto de la zona de listado está hoy fijado por CSS (`max-height: 320px` en `.component-panel__body`, `.resource-panel__body`, `.deck-panel__body`), con scroll vertical interno cuando hay más filas de las que caben.
- El estado persistido de cada ventana (`core/state.js`: `panelState`, `resourcePanelState`, `deckPanelState`) guarda hoy `{ collapsed, position, width }` (Recursos añade además `columnWidths`) — no existe campo de alto; habrá que añadirlo a los tres, replicando el mismo criterio que ya existe para `width` (persistencia, eventos `*PanelState:changed`, restauración al cargar).
