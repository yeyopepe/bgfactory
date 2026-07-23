- **Nombre**: Revisión visual completa y homogeneización del estilo de la app
- **Código**: 00063
- **Tipo**: change

## Prompt original del usuario

quiero una revisión completa del estilo visual de la app en el estado actual. Quiero que propongas cambios para homogeneizar y añadir mejoras visuales que den un aspecto mejor acabado al conjunto.
Puedes proponer quitar antiguas restricciones.
Quiero la lista completa de cambios por componente y mockups que comparen para cada componente cada cambio: lo que hay ahora y cómo cambiará

---

Divide el análisis en dos bloques: modo juego (estilo visual de los componentes y cómo funciona el juego) y modo edición (todos los elementos de trabajo exclusivos del modo edición)

---

Confirmo todo, pero quiero que todo esté dentro de un solo cambio.
Espero a tener todos los mockups para validar todo el conjunto

## Descripción completa

Revisión visual completa de la app para homogeneizar el estilo entre todos sus componentes y dar un aspecto más acabado y pulido al conjunto, relajando restricciones visuales antiguas que hoy limitan innecesariamente el aspecto de la app. Es un cambio puramente de aspecto: no se añade ninguna funcionalidad nueva, no cambia ninguna interacción existente, ni quién puede usar qué — todo sigue funcionando exactamente igual que hoy, solo cambia cómo se ve. Se documenta como un único cambio, organizado en dos bloques según el momento en que se ve cada elemento (Modo Juego / Modo Edición), y unos fundamentos compartidos que aplican a ambos.

### Fundamentos compartidos (aplican a toda la app, en ambos modos)

1. **Dirección estética**: se mantiene un estilo funcional y ordenado (no decorativo ni recargado), pero se abandona el aspecto totalmente plano actual a favor de una profundidad moderada y consistente. La interfaz de herramientas (paneles, ventanas emergentes, listas, botones) gana una capa sutil de profundidad; las piezas de juego sobre la mesa (tablero, dado, ficha, carta) ganan algo más de carácter de "objeto físico", no solo de interfaz.
2. Se elimina la restricción general que hoy prohíbe sombras, bordes muy redondeados, degradados y transiciones en toda la app. En su lugar se define un sistema explícito y homogéneo (ver puntos siguientes) que sustituye también a las excepciones puntuales que existían hasta ahora para casos concretos (el relieve del tablero y el dado, las esquinas redondeadas de la carta, el efecto de "levantar" al arrastrar): esos casos dejan de ser excepciones aisladas y pasan a ser aplicaciones normales de la nueva regla general. Se mantiene la prohibición de degradados llamativos y de animaciones complejas — la mejora es de acabado, no un cambio de dirección hacia un estilo decorativo.
3. **Sistema de elevación** con 3 niveles reutilizables en toda la app: nivel 0 (plano — la mesa de juego, contenido embebido dentro de otros elementos), nivel 1 (flotante sutil — paneles de trabajo, tarjetas de listas, piezas de juego sobre la mesa), nivel 2 (superpuesto — ventanas modales, el nivel más alto, como ya tienen hoy).
4. **Escala de bordes redondeados** unificada en dos tamaños: uno pequeño para controles (botones, campos, elementos pequeños de listas) y uno mayor para contenedores destacados (modales, paneles, tarjetas, carta) — hoy hay tres tamaños distintos usados de forma inconsistente según el sitio.
5. Se añaden **transiciones suaves y sutiles** en los estados de hover/foco de botones, filas de listas e items interactivos — hoy el cambio visual en hover es instantáneo y sin transición.
6. Se **consolidan los distintos tonos de gris** usados sueltos por la app (bordes, fondos de fila, fondos de cabecera de tabla) en 2-3 colores reutilizables, para que dejen de variar ligeramente de un sitio a otro sin motivo.
7. La **tipografía** se mantiene sin fuentes externas (fuente del sistema operativo, para no aumentar el peso del fichero final de la app), pero se revisa y refuerza la jerarquía de tamaños y pesos donde hoy es plana.

### Bloque 1 — Modo Juego (estilo visual de las piezas y de la experiencia de jugar)

- Mesa infinita donde se colocan las piezas (fondo punteado, arrastre de la vista).
- Piezas de juego: tablero (ya tiene relieve simulado en su borde), dado (ya tiene una silueta con profundidad y un efecto de tirada), ficha y carta (hoy completamente planas). Se extiende el mismo lenguaje de "pieza física" (profundidad de nivel 1) también a ficha y carta, más el cuadro de texto y el visor de documentos, para que todas las piezas se sientan hechas del mismo material entre sí en vez de que unas tengan volumen y otras no.
- Cabecera superior de la app y selector de modo (botones para cambiar entre modo juego/edición y encajar la vista).
- Ventana emergente que muestra el resultado del dado en grande al hacer doble click sobre él.
- Aviso breve no bloqueante (tipo "toast") que aparece tras ciertas acciones.
- Identificación de una pieza al pasar el ratón por encima (tooltip nativo del navegador con su tipo e identificador) — sin cambios de comportamiento, solo homogeneizado dentro del sistema visual general.
- Efecto de "levantar" la pieza al arrastrarla en este modo (ya existe, se homogeneiza dentro del nuevo sistema de elevación en vez de ser una excepción aislada).

### Bloque 2 — Modo Edición (elementos de trabajo exclusivos de este modo, no visibles jugando)

- Barra de herramientas de edición (salir del modo edición, guardar, exportar, importar).
- Panel flotante de "Componentes" y panel flotante de "Recursos": cabecera arrastrable, buscador, lista con los elementos, botón para añadir uno nuevo, y la esquina inferior derecha para redimensionar el panel.
- Listas de componentes y de recursos dentro de esos paneles (tablas con acciones de editar/clonar/eliminar).
- Ventanas modales: elegir el tipo de componente a crear, editar las propiedades de un componente (con pestañas de propiedades generales/específicas), editar un recurso (con vista previa de imagen o de fuente), galería para elegir una imagen de fondo de tablero, elegir el patrón del tablero, elegir el tipo de fuente del dado, ajustar la posición/zoom de una imagen sobre una pieza, editor de las dos caras de una carta, y la ventana de error.
- Icono de ayuda contextual (con su variante de burbuja de texto corta y su variante de ventana emergente para textos largos).
- Etiqueta que identifica una pieza sin necesidad de abrirla, superpuesta sobre su esquina (exclusiva de este modo; en modo juego la identificación es el tooltip nativo mencionado en el bloque 1).
- Contorno discontinuo azul que marca una pieza seleccionada o bajo el ratón, y la esquina de redimensionado que aparece sobre la pieza seleccionada.

### Preguntas de alcance resueltas

- **¿Todo el conjunto o solo algunas pantallas?** → Toda la app, ambos modos.
- **¿Mantener el aspecto totalmente plano o añadir profundidad?** → Profundidad moderada y consistente (ver fundamentos compartidos).
- **¿Se pueden quitar restricciones antiguas de la guía de estilo?** → Sí, se sustituye la prohibición general de sombras/radios grandes/degradados/transiciones por el sistema explícito descrito arriba.
- **¿Uno o dos cambios (uno por bloque)?** → Un único cambio con los dos bloques dentro.
- **¿Cuándo se valida la propuesta?** → El usuario validará el conjunto completo de maquetas visuales comparativas (antes/después) de todos los componentes a la vez, no componente a componente.

### Definición visual de alto nivel

No se introduce ningún elemento nuevo en la interfaz ni se altera la posición o forma de activación de los elementos existentes — es un cambio de aspecto (color, borde, sombra, espaciado, tipografía, transición) sobre los elementos ya existentes descritos arriba, aplicado de forma homogénea en toda la app. Las maquetas comparativas (antes/después) de cada componente se preparan a continuación de este documento.

## Apuntes técnicos

- La guía de estilo actual está en `design/docs/stylebible/STYLE_BIBLE.md`. Su sección 13 ("Qué NO hacer") es la que prohíbe sombras/radios grandes/degradados/animaciones y documenta las 3 excepciones puntuales existentes hoy (bisel de tablero/dado, esquinas de carta, efecto `.lifted`). Este cambio reemplaza el contenido de esa sección por el nuevo sistema de elevación/radios/transiciones — no es una excepción más, es un cambio de la regla general.
- Todos los colores viven como custom properties en `:root` de `src/styles/main.css` (sección 2 de la guía de estilo). Los grises sueltos a consolidar (hoy no son tokens): `#ddd`, `#eee`, `#f0f0f0`, `#e0e0e0`, `#f9f9f9`.
- Radios actuales verificados en `src/styles/main.css`: `3px` (botones pequeños de acción en listas), `4px` (botones, inputs, paneles, items de selección), `8px` (`.modal`, `.carta`). La nueva escala de dos tamaños debe decidir a qué tamaño final se mapea cada uso actual.
- Ningún botón/elemento tiene hoy `transition` en `main.css` — el único feedback de hover es un cambio instantáneo de `opacity`/`background`/`border-color`.
- `.component-panel` y `.resource-panel` no tienen `box-shadow` hoy; solo `.modal` y `.help-icon__tooltip` lo tienen (mismo valor: `0 4px 20px rgba(0,0,0,0.15)`).
- El relieve de Tablero y la silueta con profundidad del Dado se calculan en JS con un helper `shadeColor` en `src/ui/componentRenderer.js` (no son sombras CSS) — cualquier ampliación de "profundidad" a Ficha/Carta debe decidir en `ms-implement` si sigue este mismo patrón (colores de borde calculados) o pasa a usar `box-shadow`/tokens de elevación CSS, dado que ahora dejan de ser un caso especial.
- `ms-tech-analysis` no detectó incongruencias entre `STYLE_BIBLE.md` y el código real de `src/styles/main.css` / `src/ui/componentRenderer.js`: lo documentado coincide con lo implementado.
- Estructura de ficheros de componentes UI relevante para el reparto en bloques: cada "componente" visual vive como función en `src/ui/*.js` (un fichero por componente), con sus clases definidas en el único `src/styles/main.css`.
