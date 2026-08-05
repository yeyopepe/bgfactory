- **Nombre**: Imágenes como fondo de figuras geométricas
- **Código**: 00133
- **Tipo**: change
- **Fecha creación**: 2026-08-04

## Prompt original del usuario

Permitir poner imágenes como fondo de las figuras geométricas en el editor de cartas, con la capacidad de hacer zoom y ajustar la posición/tamaño de la imagen dentro de la figura. Similar a las capacidades que tendrían los nuevos tableros personalizados.

## Descripción completa

En el editor de cartas, al configurar el fondo de una figura geométrica (círculo, cuadrado o forma redondeada) dentro del diseño de una carta, se añade la posibilidad de usar una imagen en vez de un color liso.

- La imagen se elige siempre de la galería de imágenes ya subidas al proyecto (misma galería que ya se usa hoy para elegir la imagen de fondo de una carta o de un tablero); esta funcionalidad no permite subir una imagen nueva directamente.
- Una vez elegida la imagen, se puede ajustar su zoom y su posición dentro de la figura, para encuadrar la parte que interese — igual que ya se puede hacer hoy con la imagen de fondo de una carta. El recorte final respeta la forma de la figura (círculo, cuadrado o forma redondeada), sea cual sea.
- Poner una imagen de fondo sustituye por completo al color de fondo que tuviera la figura: mientras el fondo sea una imagen, el color queda descartado (no se combinan).
- El borde de la figura (si está activado) se sigue mostrando igual, por encima de la imagen.
- Si todavía no hay ninguna imagen subida a la galería, al intentar elegir "Imagen" como tipo de fondo se avisa de que no hay ninguna imagen disponible, en vez de dejar continuar sin nada que elegir.
- Si se cancela el ajuste de zoom/posición a medias, no se guarda ningún cambio y la figura queda como estaba.
- Si se cambia el tipo de figura (por ejemplo de cuadrada a circular) teniendo ya puesta una imagen, la imagen y su ajuste de zoom/posición se conservan; solo cambia la forma con la que se recorta visualmente.
- Al copiar/pegar o duplicar una figura que tiene imagen de fondo, la copia se lleva también esa misma imagen y su ajuste.
- Esta funcionalidad solo se configura en el editor de cartas (modo edición). Una vez configurada, la figura con su imagen de fondo se ve igual tanto en modo edición como en modo juego, sin ninguna interacción adicional sobre ella durante la partida.
- Si se intenta borrar de la galería una imagen que está en uso como fondo de alguna figura, el borrado se bloquea con un aviso, igual que ya ocurre hoy con cualquier otra imagen en uso en el proyecto.

### Preguntas de alcance resueltas

- **Origen de la imagen**: siempre de la galería de imágenes ya subidas, nunca subida directa desde este flujo.
- **Formas soportadas**: las tres formas de figura existentes (círculo, cuadrado, redondeada) admiten imagen de fondo con zoom/ajuste de posición.
- **Relación con el color de fondo**: la imagen sustituye completamente al color, no conviven.
- **Borde**: se sigue aplicando igual, por encima de la imagen.

## Apuntes técnicos

- Modelo de datos de una figura (`Forma`, dentro de `cara.formas` de una carta): hoy tiene `{ id, tipo: 'circular' | 'cuadrada' | 'redondeada', x, y, width, height, colorFondo, colorFondoTransparencia, bordeActivo, bordeColor, bordeGrosor, orden }`, editado en `src/ui/cardShapeModal.js`. No tiene ningún campo de imagen todavía.
- Ya existe un mecanismo reutilizable pensado explícitamente para esto: `src/ui/imageAdjustModal.js` (`openImageAdjustModal`/`applyImageAdjustStyle`), el mismo que usa hoy la imagen de fondo de cada cara de carta (zoom 100–300%, posición X/Y). Es el candidato natural a reutilizar para las figuras.
- **Incongruencia doc/código detectada**: `design/docs/ARCHITECTURE.md` (sección 4, definición de `Forma`) documenta `tipo: 'circular' | 'cuadrada'` (solo dos valores) — el código real (`src/ui/cardShapeModal.js`, líneas ~38-48) tiene un tercer valor, `'redondeada'`, ya implementado y en uso. El código manda: la solución debe contemplar las tres formas, y de paso conviene corregir esa documentación.
- `src/ui/imageAdjustModal.js` (líneas ~116-117) hoy solo sabe recortar su máscara de previsualización en `circular` (border-radius 50%) o en las formas hexagonales (vía clip-path); cualquier otro valor de `shape` cae al `border-radius: 0` por defecto (recorte cuadrado a secas) — no reconoce hoy un recorte de esquinas redondeadas. Para que el ajuste de imagen de una figura `'redondeada'` se vea con esquinas curvas (en vez de un recorte cuadrado a secas) habría que extender este módulo para reconocer ese `shape` — por ejemplo aplicando el mismo `border-radius: 8px` que ya usan en el resto de la app la figura/carta rectangular con esquinas redondeadas.
- El fondo del tablero (`ui/boardImageModal.js`/`fondoTipo` en `properties`) ya tiene un patrón similar de "Color y patrón" vs "Imagen" que puede servir de referencia para el selector de tipo de fondo de la figura, aunque el mecanismo de ajuste de imagen que usa el tablero es distinto (sin zoom/paneo) del de `imageAdjustModal.js`.
- Borrado de recurso en uso: `core/resource.js` (`isResourceInUse`/`getComponentsUsingResource`) ya recorre en profundidad `properties` de cualquier componente, así que un nuevo campo de imagen dentro de `cara.formas[].` quedaría cubierto automáticamente sin cambios adicionales en ese mecanismo.
