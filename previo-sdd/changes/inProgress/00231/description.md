- **Name**: Botón y modal de changelog en la esquina superior derecha
- **Code**: 00231
- **Type**: change
- **Creation date**: 2026-09-02

## Full description

Se añade en la esquina superior derecha de la interfaz un botón nuevo que, al pulsarlo, abre una ventana modal de solo lectura con el contenido del changelog (registro de cambios) de la aplicación: la lista de novedades, cambios y correcciones agrupada por versión.

Comportamiento previsto (provisional, pendiente de cerrar las preguntas abiertas de más abajo):

- **Botón**: icono, sin texto, del mismo tamaño y aspecto que el botón "Ajustar zoom" que ya existe en esa esquina. Se coloca junto a él (a su izquierda) para no desplazar ni tapar los controles que ya hay ahí.
- **Disponibilidad**: visible siempre, tanto en modo juego como en modo edición. La aplicación no distingue perfiles de usuario, así que no hay restricción por rol.
- **Modal**: sigue el mismo patrón visual que el resto de ventanas modales de la aplicación (fondo oscurecido, panel centrado, botón "Cerrar" al pie). Tiene una cabecera con título, el contenido del changelog en el cuerpo y, si el texto es largo, una zona con barra de desplazamiento propia dentro de la modal para que no crezca sin límite.
- **Cierre**: con el botón "Cerrar", pulsando fuera del panel, o con la tecla Escape, igual que las demás modales.
- **Contenido vacío**: si por lo que sea no hubiera nada que mostrar, la modal enseña un texto de reserva del tipo "No hay novedades registradas".
- **Idioma**: el contenido se muestra en español.
- El indicador de versión actual que aparece hoy en la esquina inferior no cambia; este botón es independiente de él.

### Fuera del alcance de esta primera versión

- Ningún distintivo de "hay novedades sin leer" sobre el botón.
- No se recuerda cuál fue la última versión que el usuario vio ni existe un "marcar como leído".
- El contenido no se descarga de ningún sitio en tiempo de ejecución: irá incluido dentro de la propia aplicación.

### Preguntas abiertas (a resolver al continuar el análisis, antes de planificar la solución)

1. **De dónde toma la modal el contenido del changelog** (lo que el propio encargo deja pendiente). Sobre la mesa, todas compatibles con que la aplicación siga siendo un único fichero autocontenido:
   - (a) un fichero de changelog propio, mantenido a mano, que forme parte de la aplicación y se incruste al generar el entregable;
   - (b) el contenido escrito directamente dentro de la propia aplicación como texto;
   - (c) reaprovechar el contenido de los changelog que el marco de trabajo ya genera por versión, sincronizándolo hacia la aplicación (a mano o con un pequeño proceso automático).
   Sin decidir.
2. **Formato de presentación**: ¿texto con formato (títulos, listas, negritas), o texto plano tal cual? Propuesta provisional: texto con formato. Sin confirmar.
3. **Título y etiqueta**: ¿"Novedades", "Registro de cambios", "Changelog"? Afecta tanto al título de la modal como a la etiqueta accesible del botón. Sin decidir.
4. **Icono del botón**: ¿documento/notas, campana de novedades, estrella…? Sin decidir.
5. **Qué se muestra**: ¿el historial completo de versiones, o solo las últimas? Propuesta provisional: historial completo con desplazamiento. Sin confirmar.
6. **Colocación exacta en modo edición**: hoy el botón "Ajustar zoom" en modo edición vive fuera de la barra de herramientas de ese modo. ¿El botón nuevo se le suma ahí al lado, o se replantea juntar ambos en un mismo grupo compartido por los dos modos? Sin decidir.

## Technical notes

- **Esquina superior derecha hoy**: ocupada en ambos modos por el botón icono-solo "Ajustar zoom" (`.mode-switcher__fit-btn`, 36×36px, `<svg class="icon-frame">` + `title`/`aria-label`), montado desde `src/ui/editModeToggle.js`. En modo juego va dentro de `#mode-switcher` (`position: fixed; top: 0.5rem; right: 1rem; z-index: 101; display:flex; gap:0.5rem`) junto a "Entrar en modo edición"; en modo edición se monta como elemento `position: fixed` independiente (`#edit-toolbar > .mode-switcher__fit-btn`, misma posición y z-index), fuera de la `.edit-toolbar`. El botón nuevo debería seguir el mismo patrón icono-solo y convivir en esa zona sin desplazar lo existente (pregunta abierta 6).
- **Patrón de modal**: único en el proyecto — `.modal-overlay` + `.modal` (`max-width: 500px` por defecto) + `.modal__content` + `.modal__footer` con `.btn-cancel` "Cerrar"; `z-index: 1000`. Referencia mínima directamente reutilizable: `src/ui/helpIcon.js` (`openHelpModal({ text, html })`). El cierre con ESC/INTRO lo cubre `src/ui/globalShortcuts.js` para cualquier `.modal-overlay` con `.modal__footer .btn-cancel`, sin código propio. Modal más ancha que 500px: segunda clase de bloque propia con su `max-width` en `src/styles/main.css` (`design/docs/style/03-modales-menus.md` §12.4), nunca `style` inline. Contenido largo con scroll: contenedor con `max-height` + `overflow-y: auto` (`03-modales-menus.md` §12.6.1).
- **Render de markdown en cliente ya disponible**: `src/core/markdown.js` (`markdownToHtml`, envoltorio sobre `src/vendor/marked.js`, CommonMark + GFM, ya vendorizado, sin CDN) + `src/core/sanitizeHtml.js` (`sanitizeHtml`, quita `<script>`, handlers `on*` y `href/src` con `javascript:`). Patrón establecido: `content.innerHTML = sanitizeHtml(markdownToHtml(texto))` (usado por el "Visor de documentos" en `src/ui/componentRenderer.js`). No se añaden dependencias nuevas.
- **No existe changelog en `/src`**: `#app-version` solo pinta `CURRENT_VERSION` (`'v00235'`) de `src/data/version.js` (contador interno que `src/scripts/build.py` incrementa y reescribe en cada empaquetado).
- **Changelog existente en el marco de trabajo**: `previo-sdd/versions/vX.Y/changelog.md` (formato: `# Versión vX.Y — fecha`, línea de recuento, secciones `## Nuevo` / `## Cambios` / `## Correcciones y ajustes` con bullets `**Título** — descripción`), generados por la skill `pv-internal-changelog` desde `previo-sdd/changes/closed/`. Están fuera de `/src` y no entran en el build actual — relevante para la pregunta abierta 1, opción (c).
- **Build**: `src/scripts/build.py` genera el fichero HTML único autocontenido; hoy solo incrusta imágenes/fuentes como data URI (por `url(...)` de CSS y `<img>/<link>/<source>` de `index.html`), no ficheros de texto arbitrarios como string JS. La opción (a) de la pregunta abierta 1 requeriría añadirle ese soporte; la opción (b) no toca `build.py` (se empaqueta como cualquier módulo ES más).
- **Seguridad (client hardening)**: si la modal renderiza markdown→HTML, debe pasar por `sanitizeHtml(markdownToHtml(...))` antes de asignar a `innerHTML` (patrón del Visor de documentos), no `innerHTML` directo. Si se muestra como texto plano (`textContent`), no aplica. El contenido del changelog es de autoría propia del proyecto, no entrada de usuario: riesgo bajo, pero conviene seguir el patrón por consistencia. A concretar en `pv-how` según la respuesta a la pregunta abierta 2.
- **Inconsistencia doc vs. código detectada durante el análisis**: `design/docs/architecture/06-persistence-build.md` e `INDEX.md` citan `src/scripts/pack.py` como script de versión oficial; el fichero se llama ahora `src/scripts/generate-version.py` (nuevo, aún sin commitear; su propio docstring todavía se refiere a "pack.py"). Ajena a este cambio; anotar para actualizar el nombre en la doc de arquitectura cuando se consolide el rename.
