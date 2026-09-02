# Idea: xesvn

## Idea
Botón "Publicar" (variante de solo mesa ofuscada)

## Code
xesvn

## Creation date
2026-09-02

## Notes

Idea democionada desde el cambio/fix `00198` (originalmente de tipo `change`) el 2026-09-02 por haber sido despriorizada. Se conserva todo el material acumulado.

### Descripción funcional completa (volcado literal del `## Full description` del cambio 00198)

**Origen:** esta entrada nace de dividir el cambio 00080 ("Botón 'Publicar' y script `build_obf.py`") en dos cambios independientes, tras detectarse en la implementación que el análisis conjunto era más complejo de lo esperado. Esta mitad cubre únicamente el botón "Publicar"; la otra mitad (script `build_obf.py` desde terminal) vive en el cambio 00197. `build.py` no cambia: sigue generando el entregable base sin ofuscar (mesa + edición), y es ese entregable el que, abierto en el navegador, ya debe contener el botón "Publicar" dentro de su modo edición.

Un botón **"Publicar"** dentro de la propia app (modo edición) que genera la variante de **solo mesa** (sin modo edición) ya ofuscada.

Vive en la barra de herramientas de modo edición, junto a "Guardar"/"Exportar"/"Importar" — mismo criterio de visibilidad: solo en modo edición, nunca para un jugador en modo juego. Genera y descarga, sin salir de la app ni depender de terminal/Python, el HTML ofuscado de la variante de solo mesa (sufijo "game"), a partir de la partida que esté cargada en ese momento en el navegador.

Qué contiene el entregable generado:

- Todo lo que hoy es exclusivo del modo edición desaparece: sin botón para entrar en modo edición, sin la barra de herramientas de edición, sin paneles de gestión de componentes/recursos, sin ventanas de configuración/edición ni las de exportar/importar partida — incluidos los huecos vacíos en pantalla que hoy reservan esos controles. Lo compartido con el modo juego (modelo de datos de componentes, autoguardado, mesa infinita, interacción con fichas/dados/cartas, etc.) se mantiene igual que hoy.
- El CSS no se recorta (se mantiene íntegro, sin separar por marcadores): el único efecto es que el fichero final pesa algo más de lo estrictamente necesario, sin ningún efecto visible ni funcional, ya que el HTML/JS de edición ya no está presente para que ese CSS se llegue a aplicar.
- Los recursos (imágenes y tipografías) que ningún componente de la partida esté usando se eliminan de la galería empaquetada — "en uso" = referenciado en cualquier profundidad de las `properties` de algún componente, sin trato especial para los 38 recursos por defecto (fondos de localización, mochila, objetos, reversos de evento): si no están en uso, se eliminan igual que cualquier otro. Si la partida no tiene ningún componente, todos sus recursos se consideran no usados y se eliminan igualmente — mismo criterio sin excepción.

Comportamiento del botón:

- Al pulsarlo, pide nombre de fichero igual que "Guardar" (`prompt()` nativo del navegador), precargado con `{título completo de la app}-game.html`.
- Mientras dura la operación (recortar el código exclusivo de edición, filtrar recursos no usados y ofuscar el bundle, todo en el propio navegador), el botón muestra el estado "Publicando…" deshabilitado. Al terminar, dispara la descarga del fichero con el nombre confirmado.
- Opera siempre sobre la partida actualmente cargada en la app (mismo estado que vería "Guardar") — nunca sobre una partida vacía ni un fichero aparte.
- El código exclusivo de modo edición se identifica mediante marcadores introducidos en el código fuente que señalan explícitamente qué partes son exclusivas de ese modo, para que el recorte sea fiable y no dependa solo de ocultar el botón de acceso (ocultarlo no basta: el código de edición seguiría presente e incluido en el fichero final, solo que inaccesible desde la interfaz). No hace falta eliminar el 100% del código de modo edición del proyecto fuente — sigue existiendo en `/src` para poder seguir generando también la build completa.
- No toca el número de versión del proyecto: usa la versión vigente tal cual para nombrar/identificar el entregable, sin registrarla como una versión oficial nueva.

Casos límite:

- **Se pulsa "Publicar" en un entorno sin bundle embebido** (p. ej. `src/index.html` de desarrollo, servido con Live Server, sin JS/CSS ya incrustados): muestra un error claro explicando que hace falta abrir un entregable ya generado por `build.py`, en vez de generar un fichero corrupto o a medias.
- **Marcadores de bloque de "exclusivo de edición" desbalanceados** (falta el de cierre, o aparece uno de cierre sin su apertura): se aborta con una notificación/modal de error dentro de la propia app indicando dónde ha fallado, sin generar un entregable a medias ni con marcadores visibles.
- **Falla el paso de ofuscado**: se aborta sin descargar nada, con el mismo modal de error.

Quién puede usarlo: quien desarrolla el proyecto, desde dentro de la propia app en modo edición — no es funcionalidad para el jugador final, y no depende de tener Python ni la terminal a mano.

Componente visual: sí — nuevo botón "Publicar" en la barra de herramientas de modo edición, con su estado deshabilitado/"Publicando…" durante la operación. Ver `design_boton-publicar.html` y `design_navigation_publicar.md`.

### Material conservado

- `original-change-description.md` — la entrada de workflow original completa (incluye la sección `## Technical notes` con todo el análisis técnico ya hecho: mecanismo de detección de código exclusivo de edición, reutilización de `core/resource.js` / `core/fileExport.js`, ofuscación vendorizada para navegador, y las "Notas técnicas del plan anterior" volcadas del cambio 00080 descartado — solución técnica en 9 tareas, diagramas Mermaid, cambios de arquitectura propuestos, y verificación).
- `original-change-history.md` — el historial de prompts / conversación del cambio.
- `design_boton-publicar.html` — mockup HTML autocontenido del botón "Publicar".
- `design_navigation_publicar.md` — especificación de la ubicación del botón en la barra de herramientas de modo edición.

No había `plan.md`: el cambio estaba en fase de documentación inicial (pendiente de `pv-how`).
