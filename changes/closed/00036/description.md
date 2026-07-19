- **Nombre**: Visor de documentos (nuevo tipo de componente)
- **Código**: 00036
- **Tipo**: change

## Prompt original del usuario

ms-new nuevo elemento en pantalla: un visor de documentos con formato html y md. Se representa visualmente como una hoja con fondo blanco y con el contenido renderizado. Dale un efecto como de una libreta sencilla. Propiedades específicas: - contenido: un cuadro de texto multilinea para pegar el contenido que se quiere mostrar.

Permite elegir el tipo de contenido:
- Un texto (la opción actual)
- Una url que apunte a una pagina html

## Descripción completa

Se añade un nuevo tipo de componente, "Visor de documentos" (junto a los tres ya existentes: cuadro de texto, tablero y dado), que muestra contenido renderizado sobre una hoja con fondo blanco.

Propiedades específicas de este componente:
- **Tipo de contenido** (selector): "Texto" o "URL".
  - **Texto**: cuadro de texto multilínea para pegar el contenido, junto con un segundo selector **Formato** (HTML / Markdown, por defecto Markdown), que indica cómo interpretar ese contenido antes de renderizarlo.
  - **URL**: campo de texto con un enlace a una página HTML externa, que se muestra embebida. Si el sitio de destino bloquea ser embebido, se muestra superpuesto el mensaje "No se pudo cargar el contenido".

Preguntas de alcance resueltas con el usuario durante el análisis:

- **Formato del texto pegado**: se añade el selector "Formato" (HTML/Markdown) descrito arriba. Confirmado.
- **Sanitización/seguridad**: como el estado del proyecto se guarda y puede exportarse como un único HTML autocontenido, un `<script>` pegado (por descuido o intencionadamente) se ejecutaría al abrir ese fichero en otra sesión. Se confirma que el contenido resultante (el HTML pegado directamente, o el generado a partir de Markdown) se sanitiza antes de mostrarse: se elimina cualquier `<script>`, atributos de evento (`on...`) y enlaces `javascript:`.
- **Estilo visual**: el efecto "de libreta" se resuelve con un aspecto plano y sencillo (hoja blanca), sin sombras marcadas, esquinas muy redondeadas, gradientes ni animaciones — se mantiene dentro de la guía de estilo visual ya existente en el proyecto, sin pedir ninguna excepción.
- **Ajuste y scroll del contenido**: el contenido siempre se adapta al ancho del componente (nunca aparece scroll horizontal). Si el contenido es más alto que el tamaño del componente, aparece scroll vertical únicamente.
- **Errores de formato**: si el Markdown o HTML pegado está mal formado, se muestra tal cual lo interprete el navegador; no se valida ni se avisa al usuario — es responsabilidad suya.

Casos límite:
- Contenido vacío: se muestra la hoja en blanco, sin ningún mensaje (igual que ocurre hoy con un cuadro de texto vacío).
- Contenido o URL más alto que el tamaño del componente: scroll vertical dentro de ese tamaño fijo.
- URL bloqueada por el sitio de destino: mensaje superpuesto "No se pudo cargar el contenido".

Convivencia con lo existente: es un componente más entre los tipos disponibles al añadir un componente nuevo. Hereda automáticamente las propiedades generales que ya tiene cualquier componente (bloqueado, mostrar tooltip).

Alcance de los datos: el contenido (texto u URL, formato elegido) se guarda como parte de las propiedades del propio componente, igual que el resto, y persiste con el autoguardado del proyecto. Es un dato compartido, no distinto por usuario (el proyecto no distingue sesiones ni jugadores en su estado).

Quién puede usarlo: cualquier usuario en Modo Edición puede añadir y configurar este componente, igual que con el resto de tipos. Se muestra también en Modo Juego.

## Apuntes técnicos

- Seguir el patrón de `src/ui/componentTypeModal.js` (añadir entrada a `COMPONENT_TYPES`) y `src/ui/componentModal.js` → `renderSpecificTab` (añadir un caso de tipo nuevo, análogo al de `'texto'`, que ya tiene un campo `contenido` como `<textarea>`, líneas ~211-226).
- Hoy no existe en el proyecto ningún renderizador de HTML/Markdown ni lógica de sanitización (confirmado revisando `src/`) — hay que incorporarlos desde cero. El build genera un único HTML autocontenido sin Node.js, así que si se usa código de terceros para parsear Markdown o sanitizar HTML, debe vendorizarse inline en el propio código fuente (no como dependencia npm/CDN).
- `src/ui/componentRenderer.js` hoy solo pinta `'texto'` como `textContent` plano (línea ~247); `'tablero'` y `'dado'` tienen su propia lógica de renderizado. Hay que añadir un caso nuevo para este tipo de componente.
- La guía de estilo (`design/docs/stylebible/STYLE_BIBLE.md:176`) prohíbe sombras, esquinas muy redondeadas, gradientes y animaciones salvo el bisel de tablero/dado — este componente debe respetar esa restricción (aspecto plano, confirmado con el usuario), no se necesita ninguna excepción.
- Para el tipo "URL", la forma habitual de embeber una página externa sin problemas de CORS es un `<iframe>`; si el sitio de destino envía cabecera `X-Frame-Options` o `Content-Security-Policy: frame-ancestors`, el iframe no cargará — de ahí el mensaje de error superpuesto acordado.
