- **Nombre**: Tablero personalizado con Editor visual
- **Código**: 00143
- **Tipo**: change
- **Fecha creación**: 2026-08-05

## Prompt original del usuario

Idea apuntada en `changes/todo/hm722` ("Tablero personalizado con editor visual"):

> Crear un nuevo elemento tipo "tablero personalizado" que permita:
> - Usar una imagen de fondo (como en el caso de las figuras geométricas mejoradas)
> - Tener las mismas posibilidades visuales que en las cartas
>
> Como parte de esta idea, el actual "editor de cartas" se convertiría en un componente más genérico llamado "Editor visual", reutilizable tanto para cartas como para estos tableros personalizados.
>
> Esto implica una refactorización arquitectónica de los componentes de edición.

Refinada después en conversación con el usuario (ver más abajo).

## Descripción completa

Se añade un nuevo tipo de elemento, "Tablero personalizado", que se puede colocar en la mesa igual que cualquier otro elemento (carta, tablero simple, dado...). A diferencia del "Tablero simple" ya existente (que solo admite un color/patrón de cuadrícula o una única imagen de fondo), el tablero personalizado se diseña con el mismo editor visual completo que hoy usan las cartas: se le puede poner una imagen de fondo, añadir formas geométricas (círculos, cuadrados, redondeadas, con color o con su propia imagen) y cuadros de texto, colocando y superponiendo todos esos elementos libremente sobre el lienzo.

El "Editor de cartas" actual deja de ser exclusivo de las cartas y pasa a ser un "Editor visual" general, reutilizado tanto para diseñar una carta como para diseñar un tablero personalizado. La diferencia entre ambos usos es que una carta tiene dos caras que se diseñan por separado (frontal y trasera, como hoy), mientras que un tablero personalizado tiene una única cara/diseño, ya que un tablero no se voltea. El botón para maximizar la ventana del editor, que ya existe hoy, se mantiene disponible en ambos casos.

"Tablero simple" y "Tablero personalizado" conviven como dos opciones distintas al crear un elemento nuevo — ninguno sustituye al otro; se elige uno u otro según si basta con un fondo simple o se necesita diseñar el tablero con imágenes/formas/texto.

Sobre la mesa, el tablero personalizado se puede redimensionar libremente en cualquier proporción (como el tablero simple), y su diseño se reescala proporcionalmente al cambiar su tamaño (mismo comportamiento que ya tiene una carta al redimensionarse).

El borde del tablero personalizado usa el mismo efecto de relieve/bisel que ya tiene "Tablero simple" (y "Dado") — decisión explícita del usuario: el bisel se aplica a todos los tableros por igual, a diferencia de la carta, cuyo borde no lleva ese relieve.

### Casos límite confirmados

- Un tablero personalizado sin ningún diseño (sin imagen, sin formas, sin texto) se muestra en blanco con el tamaño configurado, sin ningún aviso — igual que ocurre hoy con una carta o un visor de documentos vacíos.
- Si se cancela el editor a medias, los cambios de esa sesión de edición se descartan por completo y el tablero conserva el diseño que tenía antes de abrirlo — igual que ya ocurre hoy al cancelar el editor de cartas.

### Convivencia con lo existente

- "Tablero simple" y "Tablero personalizado" quedan como dos tipos de elemento independientes y visibles por separado al crear un elemento nuevo.

### Alcance de los datos

- El diseño de un tablero personalizado se guarda junto con el resto de datos del elemento, con el mismo guardado automático y el mismo export/import de partida que ya tiene cualquier otro elemento. El proyecto es una herramienta de un único usuario local, sin partidas ni sesiones de otras personas, así que no hay ningún matiz adicional de alcance.

### Quién puede usarlo

- El proyecto no distingue roles: cualquiera que esté en modo edición puede crear y diseñar un tablero personalizado, igual que el resto de tipos de elemento.

## Apuntes técnicos

- Editor de cartas actual: `ui/cardEditorModal.js`. Cada `'carta'` tiene `caraFrontal`/`caraTrasera`, cada una con `imagenResourceId`+`ajusteImagen`, `formas` (`Forma[]`, tipo `core/cardFaceElements.js`) y `textBoxes` (`TextBox[]`), orden de apilado mezclado (`getOrderedFaceElements`), menú contextual (copiar/pegar/eliminar/colocar arriba-abajo) y botón maximizar/restaurar (cambio 00132, clase `card-editor-modal--maximized`). La generalización a "Editor visual" debe parametrizarse por número de caras (2 para `carta`, 1 para el nuevo tipo).
- `'tableroSimple'` (`ARCHITECTURE.md` sección 4): borde con bisel (`bordeColor`/`bordeGrosor`, tonos claro/oscuro derivados, `STYLE_BIBLE.md` sección 13, excepción de estilo acotada hoy a `'tableroSimple'`/`'dado'`) — el nuevo tipo debe entrar en esa misma excepción de estilo. Fondo vía `fondoTipo: 'colorPatron' | 'imagen'`, sin editor propio (usa `boardPatternModal.js`/`boardImageModal.js`).
- `'carta'` usa borde simple sin bisel (`bordeColor`/`bordeGrosor` de la cara, `0` = sin borde) — el nuevo "Editor visual" generalizado debe permitir que cada tipo consumidor decida si su borde lleva o no el bisel (carta: no: tablero personalizado: sí).
- Alta de un tipo nuevo: lista de tipos en `ui/componentTypeModal.js` (`TYPE_OPTIONS`) + valores por defecto en `createDefaultComponent`/`DEFAULT_*_PROPERTIES` de `ui/componentModal.js` (`ARCHITECTURE.md` sección 9 — "Alta de un tipo de componente nuevo").
- **Incongruencia de documentación detectada**: `ARCHITECTURE.md` (sección 4, párrafo del alta de tipo) dice que `ui/componentTypeModal.js` solo ofrece `'texto'`, `'tableroSimple'` o `'dado'`. El código real (`src/ui/componentTypeModal.js`, `TYPE_OPTIONS`) ya ofrece seis tipos: `texto`, `tableroSimple`, `dado`, `documento`, `carta`, `mazo`. Queda desactualizado desde que se añadieron los tipos posteriores; debe corregirse para reflejar la lista completa actual (y, tras este cambio, incluir también `tableroPersonalizado`).
