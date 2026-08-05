- **Nombre**: Nuevo elemento "Color de fondo" en el editor de cartas y de tableros personalizados
- **Código**: 00157
- **Tipo**: change
- **Fecha creación**: 2026-08-05

## Prompt original del usuario

en el editor de cartas y de tableros añade un nuevo elemento a la lista: Color de fondo...
Esta opción simplemente deja elegir un color (incluyendo transparente) para el fondo de la carta. Este elemento y la imagen de fondo son excluyentes.

## Descripción completa

En el editor visual de cada cara de una carta/ficha y de un tablero personalizado, el menú "Añadir elemento" (que hoy ofrece "Imagen de fondo…", "Cuadro de texto" y "Figura geométrica") recibe una cuarta opción: **"Color de fondo…"**.

**Comportamiento**

- Al elegir "Color de fondo…" se abre una ventana propia, "Configurar color de fondo", con un único campo: el color a pintar (selector de color + checkbox "Transparente") — mismo criterio de ventana dedicada que ya usa "Imagen de fondo…" en este mismo editor.
- "Color de fondo" e "Imagen de fondo" son mutuamente excluyentes: en un momento dado, el fondo de la cara solo puede pintarse con uno de los dos, nunca con ambos a la vez.
- Elegir y confirmar un color desactiva la imagen de fondo (deja de pintarse), pero sin borrar su configuración (imagen elegida, zoom, posición); si más adelante se vuelve a elegir "Imagen de fondo…", esa configuración sigue disponible. De la misma forma, volver a elegir y confirmar una imagen desactiva el color sin perder el color que se había elegido. Alternar entre los dos no hace perder la configuración del otro.
- "Color de fondo" no es un elemento repetible: a diferencia de "Cuadro de texto" o "Figura geométrica" (que se pueden añadir varias veces y se seleccionan/mueven de forma independiente sobre el lienzo), es una configuración única de la cara — igual que ya lo es "Imagen de fondo" hoy. Simplemente pinta el fondo, detrás de cualquier imagen, figura o cuadro de texto de esa cara.
- Se aplica igual a las dos caras de una carta/ficha (frontal y trasera) y a la cara única de un tablero personalizado, ya que ambos comparten el mismo editor.

**Casos límite y compatibilidad**

- Caras o tableros ya guardados antes de este cambio no se ven afectados: se comportan exactamente igual que hoy (sin color de fondo activo; si tampoco tienen imagen, siguen mostrándose en blanco).
- Con la casilla "Transparente" marcada, el fondo de la cara queda transparente, dejando ver lo que hubiera detrás en la mesa — mismo criterio que otros campos de "color + transparente" ya existentes en la aplicación.
- Este cambio no afecta al tipo "Tablero Simple", que tiene su propio sistema de tipos de fondo, ya cubierto por otro cambio.

**Preguntas de alcance resueltas con el usuario**

- ¿Es el menú "Añadir elemento" del editor compartido entre cartas y tableros personalizados, y no el desplegable de fondo de "Tablero Simple"? → Sí, confirmado.
- ¿Se configura en una ventana propia "Configurar color de fondo" con color + checkbox "Transparente"? → Sí, confirmado.
- ¿Alternar entre "Color de fondo" e "Imagen de fondo" conserva la configuración del que queda desactivado, en vez de borrarla? → Sí, confirmado.
- ¿Las caras/tableros ya guardados quedan sin cambio visual? → Sí, confirmado.
- ¿No es un elemento repetible, igual que "Imagen de fondo" hoy? → Sí, confirmado.

## Apuntes técnicos

- Menú a modificar: `ui/visualEditorModal.js`, función `createAddElementMenu` (línea ~133-165), que hoy recibe `{ onAddImage, onAddTextBox, onAddShape }` y añade los ítems con `addItem('Imagen de fondo…', onAddImage)` etc. Necesita un cuarto ítem `addItem('Color de fondo…', onAddColor)` y su callback correspondiente en el punto de uso (línea ~727, dentro de `renderFace`).
- Ventana de referencia para "selector de color + checkbox Transparente": `ui/boardPatternModal.js` (líneas ~62-94, campo `colorFondo`, cambio 00153) — mismo criterio de valor vacío `''` = transparente, `??` en vez de `||` para distinguir "vacío explícito" de "sin definir".
- Precedente exacto del mecanismo de exclusividad `fondoTipo: 'color' | 'imagen'` ya implementado en `Forma` (ver `design/docs/ARCHITECTURE.md` sección 4, descripción de `Forma`, campo `fondoTipo` sin valor por defecto explícito, `undefined` tratado hoy como `'color'`, cambio 00133) — para `cara` este cambio introduce el mismo campo pero SIN ese comportamiento "undefined trata como color": aquí `undefined`/ausente debe significar "ninguno de los dos activo" (blanco por defecto), ya que a diferencia de `Forma` (que siempre pinta algo, color o imagen) una cara sin diseño ya se muestra en blanco sin ningún campo adicional hoy.
- Renderizado del fondo de la cara: `ui/componentRenderer.js`, función `paintCartaFace` (línea ~281-303) — hoy solo pinta `cara.imagenResourceId` si existe; necesita distinguir por `cara.fondoTipo` antes de decidir si pinta imagen, color, o nada. Mismo pintado replicado en el lienzo del propio editor, `ui/visualEditorModal.js` función `renderFace` (línea ~700-713).
- El botón "Ajustar imagen…" (línea ~441-456, `adjustImageBtn`) se deshabilita hoy solo mirando si `imagenResourceId` existe en alguna cara (`faces.every(({ key }) => !working[key].imagenResourceId)`) — sin relación directa con `fondoTipo`, no necesita tocarse salvo que se decida que además debe reflejar si la imagen está "activa" (a decidir en `ms-how`).
- No existe hoy ningún botón "Quitar imagen" en el editor (una vez puesta una imagen, solo se puede reemplazar por otra, no volver a "sin imagen") — el nuevo "Color de fondo…" tampoco necesita una acción de "quitar color" explícita: basta con volver a abrir "Imagen de fondo…" y aceptar una imagen para que `fondoTipo` vuelva a `'imagen'`.
- Recurso ya usado en el proyecto para color+transparencia: `core/colorUtils.js` → `hexToRgba(hex, transparenciaPercent)`, aunque el caso más simple de este cambio (sin control deslizante de transparencia parcial, solo el checkbox binario "Transparente") probablemente no lo necesite — a valorar en `ms-how`.
