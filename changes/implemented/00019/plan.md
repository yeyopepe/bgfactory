# Plan — 00019: Nuevo tipo de componente "Tablero"

## (a) Anotaciones funcionales

**Fuera de alcance:**
- No se construye ningún mecanismo de enumeración de `/src/img` en build time (ver duda resuelta abajo).
- No se añade ninguna función para subir imágenes nuevas desde la modal del tablero (ya existe esa función en el panel "Recursos", que es de donde se eligen).
- No se toca ningún otro tipo de componente ni la convención general de estilo plano, salvo la excepción de bisel acotada expresamente a "Tablero" (ya prevista en `description.md`).

**Duda resuelta con el usuario:**
- Pregunta: los apuntes técnicos de `description.md` plantean como decisión abierta si el fondo tipo "Imagen" debe construir un mecanismo nuevo de enumeración de `/src/img` en build time, o reutilizar el sistema de recursos ya existente (`core/resource.js`, panel "Recursos" de `editMode.js`) — que además ya está preparado explícitamente para que un componente lo consuma (`isResourceInUse` ya recorre `properties`).
- Respuesta: se reutiliza el sistema de recursos existente. La galería de la sub-modal "Imagen" lista los recursos con `type === 'imagen'` (`getResources()` filtrado), y el tablero guarda en `properties.imagenResourceId` el id del recurso elegido. Esto también evita trabajo extra: al vivir en `properties`, el borrado de un recurso en uso ya queda bloqueado automáticamente por `isResourceInUse`, sin tocar ese fichero.

**Asunciones menores tomadas sin preguntar (bajo riesgo, sin alternativa razonable mejor):**
- El "resto del fondo del tablero" sobre el que se dibuja la cuadrícula (fondo tipo "Color y patrón") es blanco liso; el color elegido por el usuario solo tiñe las líneas divisorias, nunca el relleno de las casillas (coherente con "no casillas alternas tipo ajedrez").
- Grosor de las líneas del patrón: `1px`, línea fina nítida (no configurable, no se pide en la descripción).
- Tamaño inicial del tablero al crearlo: `200×200px` (cuadrado, coherente con "se le asigna un tamaño cuadrado por defecto").

## (b) Solución técnica

1. **`ui/componentModal.js` — desplegable de tipo al crear:**
   - En la tab "Generales", justo encima del campo ID, añadir un campo `modal__field` con `<select>` "Tipo" (opciones "Cuadro de texto" → `'texto'`, "Tablero" → `'tablero'`), **visible solo si `isNew`** (si no, se omite el campo por completo, no solo deshabilitado).
   - Al cambiar el `<select>`: `workingComponent.type = valor`; si pasa a `'tablero'` y no tiene ya `width`/`height` fijados por el usuario, asigna `width = 200, height = 200` y aplica los valores por defecto de `properties` del tablero (ver punto 2) vía `updateComponent`-style merge (sin pisar `id`/`bloqueado` ya introducidos); si vuelve a `'texto'`, deja `width`/`height` a `null` (comportamiento actual) y no toca `properties` (por si el usuario alterna tipo antes de aceptar, aunque no es el flujo esperado). Tras el cambio, vuelve a invocar `renderSpecificTab()`.
   - `workingComponent` para `isNew` sigue creándose con `createComponent({ type: 'texto' })` como hoy (tipo por defecto del desplegable).

2. **Valores por defecto de `properties` para `'tablero'`:**
   ```js
   {
     bordeColor: '#000000',
     bordeGrosor: 2,
     fondoTipo: 'colorPatron', // 'colorPatron' | 'imagen'
     patronColor: '#000000',
     patronForma: 'cuadrada',  // 'cuadrada' | 'hexagonal'
     patronFilas: 8,
     patronColumnas: 8,
     imagenResourceId: null,
   }
   ```
   Se definen como constante exportada (p. ej. `DEFAULT_BOARD_PROPERTIES`) en `ui/componentModal.js` o en un módulo nuevo pequeño si conviene reutilizarla desde `componentRenderer.js` para valores de respaldo — se decide al implementar según lo que resulte más simple sin crear una capa nueva innecesaria.

3. **`ui/componentModal.js` — tab "Específicas" para `'tablero'`:**
   Añadir rama `else if (workingComponent.type === 'tablero')` en `renderSpecificTab()`:
   - Campo color de borde (`input[type=color]`) → `properties.bordeColor`.
   - Campo grosor de borde (`input[type=number]`, min 1, max 20) → `properties.bordeGrosor`.
   - Campo desplegable "Tipo de fondo" (Color y patrón / Imagen) → `properties.fondoTipo`.
   - Botón "Configurar fondo" junto al desplegable: al hacer click, abre la sub-modal correspondiente al valor **actual** de `properties.fondoTipo` en ese momento:
     - `'colorPatron'` → `openBoardPatternModal` (punto 4).
     - `'imagen'` → `openBoardImageModal` (punto 5).
   - Ambas sub-modales reciben los valores actuales de `properties` y, en su `onAccept`, mutan `workingComponent.properties` directamente (merge, no reemplazo total) sin cerrar la modal principal. Como piden campos ya cubiertos por properties de fondo, cambiar el desplegable de tipo de fondo **no** borra la configuración ya hecha del tipo anterior (ambos bloques de propiedades — patrón e imagen — conviven siempre en `properties`; solo cambia cuál está "activo" según `fondoTipo`).

4. **Nuevo fichero `ui/boardPatternModal.js`** — sub-modal "Color y patrón":
   - Misma estructura visual que `resourceModal.js`/`componentModal.js` (`modal-overlay`/`modal`/`modal__header`/`modal__content`/`modal__footer`, sin tabs).
   - Campos: color (`input[type=color]`), forma de casilla (`select`: Cuadrada / Hexagonal), filas (`input[type=number]`, 1–50), columnas (`input[type=number]`, 1–50).
   - Footer: "Cancelar" (`btn-cancel`, cierra sin aplicar) y "Aceptar" (`btn-accept`, invoca `onAccept({ patronColor, patronForma, patronFilas, patronColumnas })` y cierra).
   - `openBoardPatternModal({ properties, onAccept })`: precarga los campos con los valores actuales de `properties` (o los defaults del punto 2 si faltan).

5. **Nuevo fichero `ui/boardImageModal.js`** — sub-modal "Imagen":
   - Misma estructura de overlay/modal/header/footer. El contenido es una galería en grid (CSS grid, no tabla) de los recursos con `type === 'imagen'` (`getResources()` filtrado, importado desde `core/state.js` y `core/resource.js`): cada celda muestra una miniatura (`<img>`, `object-fit: cover`) y el nombre del recurso; click la selecciona (único, resaltado con el mismo tratamiento de "seleccionado" ya usado en la app — contorno con `--accent-blue`).
   - Si no hay recursos de tipo imagen: mensaje "No hay imágenes disponibles" y botón "Aceptar" deshabilitado.
   - Precarga la selección actual si `properties.imagenResourceId` apunta a un recurso todavía existente.
   - Footer: "Cancelar" y "Aceptar" (deshabilitado sin selección), `onAccept(resourceId)`.
   - Nuevas clases BEM: `.board-image-modal__gallery`, `.board-image-modal__item`, `.board-image-modal__item--selected`, `.board-image-modal__thumb`, `.board-image-modal__name`, `.board-image-modal__empty` — añadidas a `main.css` siguiendo tokens/espaciado ya definidos (sección 2/4/5 de `STYLE_BIBLE.md`).

6. **`ui/componentRenderer.js` — renderizado del tipo `'tablero'`:**
   - Añadir rama `else if (component.type === 'tablero')` en `renderComponentsOnTable`, análoga a la de `'texto'` en cuanto a posición/selección/movimiento/redimensionado (reutiliza exactamente el mismo patrón de `onSelect`/`onToggleSelect`/`onMove`/`canMove`/`onResize` vía `attachResizeHandle` con `axis: 'both'`, sin forzar proporción cuadrada; mínimo de redimensionado p. ej. 40×40px). Siempre usa `component.width`/`component.height` explícitos (nunca `null`, se fijan al crear).
   - Estructura: un `div.board` con `box-sizing: border-box` y borde bisel:
     - Grosor de borde = `properties.bordeGrosor`, mismo en los cuatro lados, `border-style: solid`.
     - Color: lados superior e izquierdo con un tono más claro de `properties.bordeColor`, lados inferior y derecho con un tono más oscuro — vía una función auxiliar local `shadeColor(hex, percent)` (aclara/oscurece mezclando con blanco/negro un porcentaje fijo, p. ej. ±25%), definida en el propio fichero (no se crea una capa `core/` nueva para esto, es un detalle puro de renderizado).
   - Fondo, según `properties.fondoTipo`:
     - `'colorPatron'`: `background-color: #ffffff` (ver asunción en (a)) + cuadrícula:
       - **Casillas cuadradas/rectangulares**: `background-image` con dos `linear-gradient` (uno horizontal, uno vertical, ambos de `properties.patronColor` a transparente en 1px) y `background-size: {cellWidth}px {cellHeight}px`, con `cellWidth = width / patronColumnas` y `cellHeight = height / patronFilas` — encaja siempre exacto (sin recorte), casillas rectangulares si el tablero no es cuadrado.
       - **Casillas hexagonales**: se dibuja con un `<svg>` hijo posicionado absoluto que cubre todo el `div.board` (`width`/`height` al 100%), con un `<polygon>` (`fill: none`, `stroke: patronColor`, `stroke-width: 1`) por cada hexágono de la rejilla `patronFilas × patronColumnas`. Cálculo del tamaño máximo de hexágono `a` (hexágono "flat-top", centro-a-vértice) que quepa sin recortes ni exceder el tablero:
         ```
         anchoHex = 2a
         altoHex  = √3 · a
         pasoX    = 1.5a           (distancia entre centros de columnas consecutivas)
         pasoY    = altoHex        (distancia entre centros de filas; columnas impares desplazadas altoHex/2)
         anchoTotal = anchoHex + pasoX · (columnas - 1)
         altoTotal  = altoHex · filas + (columnas > 1 ? altoHex/2 : 0)
         a = min( width  / (2 + 1.5·(columnas-1)),
                   height / (√3·filas + (columnas>1 ? √3/2 : 0)) )
         ```
         El margen sobrante (mínimo inevitable) se reparte a partes iguales a cada lado (centrado), colocando el `<svg viewBox>`/grupo de hexágonos centrado dentro del `div.board`. Este cálculo y dibujo se extraen a una función auxiliar local (p. ej. `renderHexGrid(svgEl, width, height, filas, columnas, color)`), reutilizada tal cual sin crear módulo nuevo.
       - Este bloque de fondo (gradiente CSS o SVG) se recalcula en cada llamada a `renderComponentsOnTable` (ya se limpia y reconstruye todo el `worldEl` en cada render, igual que el resto de componentes), de forma que un redimensionado del tablero (`onResize`/`onResizeEnd`) dispara un re-render con el tamaño de casilla ya adaptado — sin lógica de resize específica adicional.
     - `'imagen'`: busca el recurso `getResources().find(r => r.id === properties.imagenResourceId)`; si existe, `background-image: url(resource.dataUrl)`, `background-size: cover`, `background-position: center` (cubre todo el tablero manteniendo proporción, recortando sobrante); si no existe (sin selección o recurso borrado — caso límite no bloqueante ya que `isResourceInUse` impide borrar uno en uso, pero cabe si nunca se llegó a elegir ninguno), fondo blanco liso igual que el caso sin patrón.
   - El mismo aspecto se usa en modo edición y modo juego (sin diferencias), ya que `renderComponentsOnTable` es compartido por ambos modos.

7. **`core/component.js`**: sin cambios — el modelo genérico ya soporta cualquier `type` y `properties` libres.

8. **`STYLE_BIBLE.md`**: añadir una entrada en la sección 13 ("Qué NO hacer") documentando la excepción de bisel, acotada expresamente al tipo de componente "Tablero" (no es un cambio de dirección estética general de la app).

9. **`ARCHITECTURE.md`**:
   - Sección 4 ("Tipos de componente implementados"): añadir entrada `'tablero'` con sus propiedades específicas (igual que ya se documenta `'texto'`).
   - Sección 4 (nota sobre `image`): aclarar que el campo general `component.image` sigue sin usarse — el tablero referencia un recurso vía `properties.imagenResourceId`, no vía `image` ni vía `/src/img`.
   - Sección 5: actualizar la descripción de `ui/componentRenderer.js` (ya no "de momento solo texto") y de `ui/componentModal.js` (desplegable de tipo al crear) para reflejar el segundo tipo soportado; mencionar los dos ficheros nuevos (`ui/boardPatternModal.js`, `ui/boardImageModal.js`).

## (c) Cambios de arquitectura

Ver punto 9 de la sección (b): se actualiza `ARCHITECTURE.md` secciones 4 y 5 para documentar el nuevo tipo `'tablero'`, sus propiedades, y los dos módulos UI nuevos (`boardPatternModal.js`, `boardImageModal.js`), sin alterar la arquitectura por capas general (todo encaja en los patrones ya existentes: `core` no cambia, `ui` gana dos módulos siguiendo el mismo patrón que `resourceModal.js`).

## (d) Cambios en estilo

Ver punto 8 de la sección (b): se añade a `STYLE_BIBLE.md` sección 13 la excepción explícita de bisel para "Tablero", y se documentan (en la sección 7, nomenclatura BEM) las clases nuevas de `ui/boardImageModal.js`.
