- **Nombre**: Etiqueta de identificación cortada en fichas pequeñas
- **Código**: 00044
- **Tipo**: fix

## Prompt original del usuario

ms-fix si la ficha es pequeña, la etiqueta del modo edición sale cortada. Debería verse completamente, como pasa con el resto de elementos

## Descripción completa

En modo edición, cualquier componente sobre la mesa muestra siempre una pequeña etiqueta identificativa ("Tipo: id") anclada en su esquina superior izquierda, visible al pasar el ratón por encima o al estar seleccionado.

Para el componente "Ficha" (cambio 00029), cuando la ficha es de tamaño pequeño y su identificador es más ancho o alto que la propia ficha, la etiqueta aparece recortada en vez de mostrarse completa. En el resto de tipos de componente (cuadro de texto, tablero, dado, visor de documentos) la etiqueta se ve siempre entera aunque sea más grande que el propio componente, sobresaliendo visualmente de sus límites si hace falta.

Se espera que la ficha se comporte igual que el resto: la etiqueta identificativa debe verse siempre completa, sin recortarse, con independencia del tamaño de la ficha.

## Apuntes técnicos

- El comportamiento se reproduce en modo edición, pasando el ratón sobre una ficha pequeña (o dejándola seleccionada) cuyo `id` sea largo.
- Sospecha inicial (a confirmar/detallar en el análisis de causa raíz de `ms-implement`): `ui/componentRenderer.js` aplica `overflow: hidden` al contenedor `.ficha` para recortar el fondo (color/texto/imagen) a la forma cuadrada o circular configurada; el `<span class="component-id-label">` de `ui/componentRenderer.js` (`createIdentifierLabel`) se añade como hijo de ese mismo contenedor, por lo que también queda recortado por ese `overflow: hidden` cuando es más grande que la ficha. Otros tipos (`.board`, `.dice`, `.document-viewer`) no aplican `overflow: hidden` al contenedor raíz (o, en el caso de `.document-viewer`, solo a un `div` interno de contenido, no al elemento donde cuelga la etiqueta), por lo que su etiqueta nunca se ve afectada.
