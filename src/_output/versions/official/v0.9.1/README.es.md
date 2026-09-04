# 🎲 BG Factory — Un editor de juegos de mesa 100% portable

[English version](README.md)

**BG Factory** es un editor visual para crear y jugar tus propios juegos de mesa digitales, que se distribuye como **un único fichero HTML autocontenido**. Sin instalación, sin cuentas, sin servidor, sin dependencias online: descargas el fichero, lo abres con doble clic en cualquier navegador moderno, y ya tienes tu mesa de juego lista — editor y datos incluidos en el mismo `.html`.


> 🖼️ *Captura: mesa de juego infinita con varios componentes (cartas, tablero, dado) — `docs/screenshots/mesa-general.png`*

## 🚀 ¿Por qué BG Factory?

- **📦 100% portable**: todo el editor (HTML + CSS + JS) vive en un solo fichero. Cópialo en un pendrive, mándalo por email o guárdalo en la nube — allá donde lo abras, funciona igual.
- **⚡ Sin instalación ni cuentas**: no hay que instalar nada, registrarse ni depender de un servicio en la nube. Abres el fichero y empiezas a jugar o a editar. Un solo fichero HTML es todo lo que necesitas.
- **🎒 Tu partida viaja contigo**: al pulsar "Exportar" se descarga una copia completa de todo el contenido y configuración en formato JSON que puedes compartir con quien quieras y podrá abrirlo y seguir jugando o editando sin nada más.
- **✈️ Funciona sin conexión**: una vez descargado, no necesita internet para nada.
- **💾 Autoguardado local**: mientras trabajas, tu partida se guarda automáticamente en el navegador, sin que tengas que preocuparte de perder cambios.

## 🧩 Qué puedes hacer con él

### 🖌️ Un editor visual completo

- Mesa de juego infinita, con navegación libre por *pan* y *zoom*.
- Panel flotante de componentes (arrastrable, colapsable y redimensionable) con listado en tabla: ordena, filtra y busca por texto en cualquier columna con un par de clics.
- Selección múltiple con Ctrl/Cmd+clic, arrastre en bloque manteniendo distancias relativas, y borrado masivo con confirmación.
- **Agrupación de elementos**: agrupa varios componentes en una unidad con sus propias propiedades (bloqueo, visibilidad, tooltip, etiquetas), muévelos y edítalos como uno solo, y desagrúpalos cuando quieras sin perder nada.
- **Elementos "Copia"**: crea copias vinculadas y sincronizadas con un componente original — cambia el original y todas sus copias se actualizan solas (con opción de desincronizar bloqueo/visibilidad copia a copia).
- **Etiquetas**: organiza y localiza componentes por nombre; selecciona de un clic todos los elementos con una etiqueta, aunque estén guardados dentro de un mazo.
- Menús contextuales (clic derecho) específicos por modo y tipo de componente.
- Atajos de teclado y portapapeles de estilos para copiar/pegar apariencia entre componentes.
- Control fino del **orden de apilado** (z-index) en la mesa, individual o en bloque para grupos enteros.
- Efecto de **profundidad/extrusión** configurable (grosor y color) para dar volumen 3D a cualquier pieza.
- **Título y tooltip por componente**, con variables de texto dinámicas (p. ej. `{cards_current}` para mostrar cuántas cartas quedan en un mazo, siempre actualizado).

> 🖼️ *Captura: panel de componentes con filtros, grupo desplegado y menú contextual — `docs/screenshots/panel-componentes.png`*

### 🎯 Componentes de juego listos para usar

- **🃏 Cartas**: editor visual con capas de imágenes, formas geométricas (círculo, cuadrado, redondeado) y cuadros de texto con estilo propio (fuente, color, bordes, alineación, rotación libre); dos caras independientes (frontal/trasera) con volteo animado; proporciones predefinidas (póker, tarot, cuadrada, circular, hexagonal, triangular) o libres.
- **🂠 Mazos**: pila ordenada y barajable de cartas, con zona de revelado configurable (posición, texto, cara mostrada al robar), imagen propia de dorso, y menú de "Barajar"/"Ver contenido"/"Meter carta en mazo" arrastrando o desde menú contextual.
- **🎲 Dados**: número de caras configurable o lista de valores personalizados (numéricos o de texto), tipografía propia del resultado, animación de tirada y modal de resultado ampliado con doble clic.
- **🗺️ Tableros simples**: cuadrícula cuadrada o hexagonal (vertical/horizontal) con color o imagen de fondo, borde biselado o plano, con o sin sombra.
- **🖼️ Tableros personalizados**: mismo editor visual avanzado que las cartas (capas de imágenes, formas y texto) para tableros y mapas a medida, a tamaño real de píxel.
- **📝 Cuadros de texto** con formato enriquecido (Markdown o HTML).
- **📄 Visores de documentos**: texto/Markdown pegado o página web externa embebida, a modo de reglamento o ayuda de referencia siempre a mano.
- **Interacciones programadas** por componente y por tipo de acción (clic, doble clic, arrastrar, clic derecho): decide qué puede hacer el jugador con cada pieza.
- Bloqueo de movimiento configurable por componente o grupo (nunca / solo en modo juego / siempre) y opción de ocultar piezas al público en modo juego.

> 🖼️ *Captura: editor visual de una carta con capas de imagen, formas y texto — `docs/screenshots/editor-carta.png`*
> 🖼️ *Captura: mazo con zona de revelado y modal "Ver contenido" — `docs/screenshots/mazo-cartas.png`*

### 🖼️ Gestión de recursos e imágenes

- Panel de recursos independiente, con subida de un fichero, de varios a la vez o de una carpeta completa.
- Conversión automática a WebP al subir imágenes, para mantener el fichero final ligero.
- Detección de nombres duplicados con opción de reemplazar, y resumen final de la subida (añadidos, reemplazados, omitidos por formato).
- Vista previa ampliada con zoom y pan para ajustar la imagen perfecta antes de usarla.
- Recursos de ejemplo incluidos desde el primer arranque, para empezar a trastear sin tener que subir nada.
- Aviso y bloqueo al intentar borrar un recurso que sigue en uso por algún componente.

### 🕹️ Modo edición y modo juego, separados

- **Modo edición**: configura componentes, propiedades, recursos, etiquetas y disposición de la mesa, con todos los paneles y controles de diseño a la vista.
- **Modo juego**: interactúa con la partida como jugador — lanza dados, roba y voltea cartas, mueve fichas, consulta tooltips — sin arriesgarte a tocar el diseño ni ver los paneles de edición.
- Cambio instantáneo entre ambos modos, siempre sobre la misma partida (no hay dos versiones distintas del estado).

> 🖼️ *Captura: comparativa modo edición vs. modo juego de la misma mesa — `docs/screenshots/modo-edicion-vs-juego.png`*

### 🔄 Import/export flexible

- **Guardar**: descarga una copia completa del editor con tu partida embebida dentro (el propio fichero portable).
- **Exportar/Importar selectivo**: mueve componentes, recursos y etiquetas sueltos entre partidas en JSON, eligiendo exactamente qué llevarte.
- Al importar, decide entre añadir a lo existente o sobrescribir, y cómo resolver ids duplicados (sobrescribir o conservar ambos).
- Informe detallado ante conflictos de ids o referencias, y migración automática de guardados de versiones anteriores del editor.
- Título de partida editable, usado como nombre de fichero por defecto al guardar o exportar.

## ▶️ Empezar a jugar

Simplemente descárgate la última versión en este repositorio y carga directamente en tu navegador el archivo html.


## 🛠️ Desarrollo

Este proyecto es desarrollado usando [Previo](https://github.com/yeyopepe/previo-sdd), un framework de desarrollo rápido basado en IA.





