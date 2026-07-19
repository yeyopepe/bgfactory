## Idea
Implementar nuevo elemento: ficha y editor de imagen para elementos de tablero.

Propiedades generales:
- Bloqueado (false por defecto)

Propiedades específicas:
- Forma: cuadrada o circular
- Borde: color y grosor
- Fondo: color, texto (debe estar centrado vertical y horizontalmente siempre y ajustarse al tamaño de la ficha) o imagen (recurso). 
        - En el caso de ser una imagen, al seleccionarla, el usuario debe poder redimensionarla y moverla sobre la forma de la ficha elegida hasta que esté conforme con la apariencia final. Esto es solo para saber como se debe ver la imagen en esta ficha (offset, zoom, recorte, etc), NUNCA cambia el recurso. Todo esto es una nueva funcionalidad reutilizable porque en el futuro habrá otros elementos que incorporen imágenes de fondo y también quiero que se pueda configurar la forma en que se vea esa imagen para ese elemento en concreto.

## Código
k7m3x

## Notas
Implementar meeples o fichas.
