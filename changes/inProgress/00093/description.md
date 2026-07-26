- **Nombre**: Línea de descripción del elemento en el menú contextual de modo juego
- **Código**: 00093
- **Tipo**: change

## Prompt original del usuario

añade al menú contextual del modo juego la descripción del elemento en la primera linea, con un separador del resto: tipo de elemento, identificador y propiedad diferenciadora según el tipo (si es un dado: número de caras; si es tablero, tamaño AAxBB)

## Descripción completa

Al hacer click derecho sobre un componente en la mesa de juego se abre un menú contextual con opciones (por ejemplo, Bloquear/Desbloquear). Se añade a ese menú una primera línea, de solo lectura (no es una opción que se pueda pulsar), con la descripción del elemento sobre el que se ha abierto el menú. Esa línea queda separada visualmente del resto de opciones del menú mediante un separador, igual que ya existen otros separadores dentro de ese mismo menú.

La línea de descripción incluye:

- El tipo de elemento (Texto, Tablero, Dado, Documento o Carta/Ficha) y su identificador, con el mismo formato que ya se usa hoy en otras partes de la app para identificar un elemento ("Tipo: identificador").
- A continuación, una propiedad adicional que varía según el tipo de elemento y que ayuda a distinguirlo de otros del mismo tipo:
  - **Dado**: el número de caras que tiene configuradas actualmente (cuenta el número de resultados posibles, sea cual sea la forma en que estén configurados esos resultados).
  - **Tablero**: el tamaño actual del tablero en la mesa, en el formato "AAxBB" (ancho x alto), reflejando el tamaño real que tiene en ese momento (puede haberse redimensionado desde su tamaño de creación).
  - **Texto, Documento y Carta/Ficha**: estos tipos no tienen ninguna propiedad especialmente diferenciadora, así que la línea muestra solo el tipo y el identificador, sin nada más.

### Casos límite y alcance resueltos

- La línea se calcula en el momento de abrir el menú a partir del estado actual del elemento; no se guarda ni persiste nada nuevo, y desaparece al cerrar el menú como el resto de su contenido.
- No es una acción: no se puede pulsar ni tiene ningún efecto, es puramente informativa.
- Está disponible igual para cualquier persona que use el modo juego (el proyecto no distingue roles ni usuarios distintos en este modo).
- Un dado configurado con una lista de valores en vez de un número máximo también cuenta con "número de caras": se refiere al número de resultados posibles, no a que sean necesariamente números.

### Definición visual

- Se muestra como la primera fila del menú contextual, antes de cualquier otra opción (incluida "Bloquear"/"Desbloquear"), y con un separador visual entre ella y el resto del menú.
- Su aspecto es el de una línea informativa, no el de una opción del menú: no reacciona al pasar el ratón por encima ni cambia el cursor, a diferencia de las opciones que sí se pueden pulsar.

## Apuntes técnicos

- Ya existe `formatComponentIdentifier(component)` en `src/ui/componentRenderer.js` (apoyado en el mapa `COMPONENT_TYPE_LABELS`) que genera exactamente el texto "Tipo: id" — reutilizable como base de esta línea.
- Para el número de caras del dado, reutilizar `core/dice.js` → `getPosibleValores(component).length`, que ya funciona igual tanto si `modoCaras` es `'numeroMaximo'` como `'lista'`.
- El tamaño del tablero se lee de `component.width`/`component.height` (tamaño real actual del componente), no de ninguna propiedad dentro de `properties`.
- El menú contextual se abre y construye en `modes/play/playMode.js` (callback `onContextMenu`), que ya pasa `interactionItems` a `ui/contextMenu.js` (`openContextMenu`); esta nueva línea es candidata a viajar como un parámetro nuevo similar, a decidir en `ms-how`.
- Estilo de referencia ya existente para contenido informativo de solo lectura dentro de este mismo menú: `STYLE_BIBLE.md` sección 12.8 (Menú contextual de componente), clases `.context-menu__info-*` (usadas hoy por la sección "Interacciones" al final del menú).
