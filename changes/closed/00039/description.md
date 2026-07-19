- **Nombre**: Listas de tareas (checkboxes) en el parser Markdown
- **Código**: 00039
- **Tipo**: change

## Prompt original del usuario

Añade también la implementación de los checkboxes (vacio: - [ ], marcado: - [x]). También tiene que funcionar con indentado

## Descripción completa

Se amplía el parser Markdown del componente "Visor de documentos" (cambios 00036/00037) para reconocer la sintaxis de "lista de tareas" (task list, extensión habitual de Markdown más allá de la sintaxis básica de markdownguide.org ya cubierta): un ítem de lista sin ordenar cuyo texto empieza por `[ ]` (vacío) o `[x]`/`[X]` (marcado) se muestra como una casilla de verificación junto al resto del texto del ítem, en vez de como el texto literal `[ ]`/`[x]`.

Igual que el resto de la lista, estos ítems pueden anidarse (una lista de tareas dentro de otro ítem, a cualquier profundidad), respetando el indentado mínimo de 2 espacios o 1 tabulador ya corregido en el fix 00038.

Puntos de alcance:

- **Interactividad**: las casillas se muestran deshabilitadas (no se pueden marcar/desmarcar con un click). El "Visor de documentos" es una representación de solo lectura del texto pegado por quien configuró el componente — no hay ningún mecanismo para que quien vea la partida edite ese texto ni para guardar un estado de marcado distinto del que ya está escrito en el propio Markdown. Si alguien quiere cambiar una casilla, edita el texto de origen (cambiando `[ ]` por `[x]`) igual que para cualquier otro cambio de contenido.
- **Variantes reconocidas**: `[ ]` para vacía; `[x]` o `[X]` (mayúscula o minúscula) para marcada. Cualquier otro contenido entre corchetes al principio de un ítem (por ejemplo `[ ]a` sin espacio tras el corchete, o `[?]`) no se reconoce como casilla y el ítem se muestra como texto literal, igual que cualquier otra sintaxis mal formada ya gestionada hoy (sin validar ni avisar).
- **Aspecto**: solo aplica a listas sin ordenar (con `-`, `*` o `+`); una lista numerada no admite casillas. El ítem con casilla no muestra además la viñeta habitual de lista (bolita), como es convención estándar en cualquier lista de tareas.
- **Convivencia con lo existente**: es una extensión del mismo parser (`markdownToHtml`), no un tipo de contenido nuevo ni una propiedad nueva del componente — sigue usando el mismo campo `contenido`/`formato` ya existente.

Casos límite: una lista con ítems mezclados (unos con casilla y otros sin ella) es válida — cada ítem se evalúa por separado. Un documento vacío o sin ninguna lista de tareas se comporta exactamente igual que hoy.

Alcance de los datos y quién puede usarlo: sin cambios respecto a lo ya establecido en 00036 — el texto (incluidas las casillas escritas en él) se guarda como parte de las propiedades del componente, mismo acceso desde Modo Edición y Modo Juego.

Definición visual de alto nivel: cada ítem de lista de tareas muestra una casilla de verificación deshabilitada (marcada o no, según el Markdown) inmediatamente antes de su texto, alineada con el propio texto, sustituyendo a la viñeta de lista habitual — sin ningún otro cambio de aspecto respecto al resto de la lista.

## Apuntes técnicos

- Módulo a ampliar: `src/core/markdown.js`, dentro de `parseList` (o al construir cada `<li>`): detectar si el texto del ítem (tras des-indentar y antes de aplicar `parseInline`) empieza por `[ ]`, `[x]` o `[X]` seguido de un espacio, solo para listas sin ordenar. Si coincide, generar `<li class="task-list-item"><input type="checkbox" disabled ...> resto-del-texto</li>` en vez del `<li>` normal, aplicando `parseInline` solo al resto del texto (sin el propio marcador `[ ]`/`[x]`).
- `src/styles/main.css`: la clase `.task-list-item` (o equivalente) necesita `list-style: none` para no mostrar la viñeta junto al checkbox, dentro del ámbito ya existente de `.document-viewer__content` — sin introducir ninguna excepción nueva a la guía de estilo (no hay sombras, bisel ni animación implicados).
- El HTML resultante (incluido el `<input type="checkbox">`) sigue pasando por `sanitizeHtml` antes de insertarse en el DOM, sin cambios en ese módulo.
