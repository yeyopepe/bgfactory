- **Nombre**: Etiqueta de identificador recortada en cartas y fichas en modo edición
- **Código**: 00057
- **Tipo**: fix

## Prompt original del usuario

en el modo edición, las etiquetas con el ide de las cartas y las fichas cuando las selecciono no se ve entero. Esto ya nos pasó con otros elementos en el pasado

## Descripción completa

En modo edición, al seleccionar una carta o una ficha, aparece una etiqueta superpuesta sobre el componente mostrando su identificador. Esa etiqueta no se ve completa: el texto queda cortado por el borde del propio componente, en vez de mostrarse entero aunque sobresalga.

Este mismo tipo de problema (la etiqueta de identificador no se ve entera) ya ha ocurrido antes con otros tipos de componente, por causas distintas cada vez.

Se espera que la etiqueta de identificador se vea siempre completa, sin recortarse, al seleccionar cualquier componente en modo edición — incluyendo cartas y fichas — igual que ya ocurre correctamente para el resto de tipos de componente.

## Apuntes técnicos

- La etiqueta se crea en `src/ui/componentRenderer.js`, función `createIdentifierLabel(component)` (línea ~217), y se añade como hijo del contenedor de cada componente cuando `identifyMode === 'label'` (activo en modo edición): ficha en línea ~803, carta en línea ~943 (también textBox en línea ~277).
- Estilo en `src/styles/main.css:530-544` (`.component-id-label`): `position: absolute; top: 2px; left: 2px; white-space: nowrap;`, sin `max-width` ni `text-overflow: ellipsis` — por diseño original (change 00032) la etiqueta puede sobresalir del ancho del componente en vez de recortar su texto, ya que el id puede ser largo.
- Causa raíz probable: los contenedores `ficha` (línea ~796) y `carta` (línea ~935) fijan `style.overflow = 'hidden'` (necesario para recortar la imagen/forma circular/bordes redondeados del propio componente). Como la etiqueta es hija de ese mismo contenedor, ese `overflow: hidden` recorta también la etiqueta cuando su texto es más ancho que el componente.
- Esta familia de bug ya se corrigió antes por mecanismos distintos, ninguno relacionado con `overflow`:
  - change `00033`: el contenido de texto se sobrescribía después de añadir la etiqueta como hija (orden de asignación de `textContent`).
  - change `00035`: la etiqueta quedaba tapada por la cabecera fija de la app cuando el componente estaba cerca del borde superior (de ahí el anclaje actual `top: 2px; left: 2px`, dentro del propio componente).
  - fix `fast-etiqueta-encima-dibujo-componente_20260719`: la etiqueta quedaba tapada por el propio dibujo (SVG) del componente; se añadió `z-index: 1`.
  - Ninguno de esos fixes cubre el recorte por `overflow: hidden` del contenedor padre, que es el mecanismo detectado aquí.
- Ficha (change `00029`) y Carta (change `00053`) se añadieron después del diseño original de la etiqueta (`00032`) y ambas introdujeron `overflow: hidden` en su propio contenedor sin revisar el impacto sobre la etiqueta ya existente.
