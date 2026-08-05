- **Nombre**: El contenido de un Tablero personalizado se reescala al redimensionarlo
- **Código**: 00152
- **Tipo**: fix
- **Fecha creación**: 2026-08-05

## Prompt original del usuario

cuando redimensiono el tablero, me redimensiona proporcionalmente todos los elementos que hay dentro. No debería ser así: redimensionar al tablero es solo eso, cambiar el tamaño del tablero (del lienzo en el que pintamos), pero sus elementos deben permanecer con su tamaño y en sus posiciones.

## Descripción completa

Al redimensionar un componente "Tablero personalizado" en la mesa (arrastrando su manejador de esquina), todos los elementos que contiene (imagen de fondo, formas geométricas, cuadros de texto) se reescalan proporcionalmente junto con el tamaño del tablero — cambian de tamaño y de posición según el nuevo ancho/alto.

Redimensionar el tablero debe cambiar solo el tamaño del lienzo (el marco visible sobre la mesa), sin tocar el tamaño ni la posición de los elementos que hay dentro — deben permanecer exactamente igual que estaban (mismo tamaño en píxeles, misma posición), igual que si el lienzo fuera una "ventana" que se agranda o encoge sobre un contenido que no se mueve. Si el nuevo tamaño del lienzo es menor que el contenido, ese contenido puede quedar recortado/fuera de la vista al no caber — comportamiento esperado, no un problema a evitar.

Consecuencia directa para el editor de diseño del tablero: como el contenido ya no se reescala nunca, el lienzo donde se diseña debería representar directamente el tamaño real que tiene el tablero en ese momento (no un lienzo de tamaño fijo arbitrario distinto del tamaño real), para que lo que se ve al diseñar coincida con lo que aparece luego en la mesa.

## Apuntes técnicos

- Causa raíz confirmada (`ms-internal-tech-analysis`): `ui/componentRenderer.js`, rama `component.type === 'tableroPersonalizado'`, pinta con `paintCartaFace(tableroContent, cara, width / TABLERO_PERSONALIZADO_DESIGN_WIDTH, width, height, height / TABLERO_PERSONALIZADO_DESIGN_HEIGHT)` — escala x/y/width/height de cada elemento según el tamaño actual del componente entre el lienzo de diseño fijo (`TABLERO_PERSONALIZADO_DESIGN_WIDTH`/`_HEIGHT`, `core/cardProportions.js`, 300×300). Ese reescalado tiene sentido para `'carta'` (proporción de diseño siempre fija), pero no para `'tableroPersonalizado'`, que se redimensiona libremente.
- Único otro punto que depende de esa misma relación de escala: `ui/visualEditorModal.js` → `getFaceDesignSize()`, que hoy devuelve el mismo tamaño fijo `TABLERO_PERSONALIZADO_DESIGN_WIDTH`/`_HEIGHT` para el lienzo del editor cuando `showProporcionSelector` es `false`.
- No hay ningún otro fichero que dependa de esta relación de escala para este tipo (confirmado por búsqueda completa en `src/`).
- No calificó para el atajo "fast" de `ms-fix`: toca más de 2 ficheros (`componentRenderer.js` + `visualEditorModal.js`, posiblemente `core/cardProportions.js` si las constantes de diseño fijas dejan de tener sentido) y requiere una decisión de diseño (qué tamaño usa el lienzo del editor una vez el contenido deja de reescalarse) — se deja para que `ms-how` la analice y decida en `plan.md`.
