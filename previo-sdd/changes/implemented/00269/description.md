- **Name**: Iconos en las pestañas de propiedades de elemento y renombrado de "Específicas" a "Contenido"
- **Code**: 00269
- **Type**: change
- **Creation date**: 2026-09-14

## Full description

Se añade un icono a cada una de las pestañas del panel de propiedades de un elemento (el modal que se abre al editar un componente de la mesa), y se cambia el nombre de la pestaña "Específicas" por "Contenido".

Las pestañas afectadas, con el icono asignado a cada una, son:

- **Generales** → icono de engranaje/ajustes.
- **Apariencia** → icono de pincel/paleta.
- **Contenido** (antes "Específicas") → icono representativo de contenido.
- **Interacciones** → icono de rayo/conexión.
- **Copias** → icono de duplicado/clonado (el mismo que ya se usa en otras partes de la aplicación para indicar "clonar"/"copia").

Cada pestaña muestra el icono junto al texto (icono a la izquierda del texto), siguiendo el mismo patrón visual ya usado en las cabeceras de los paneles flotantes de Componentes, Recursos y Etiquetas (icono + título).

### Alcance del renombrado

El cambio de nombre de "Específicas" a "Contenido" es solo de la etiqueta visible de esa pestaña, en los dos idiomas soportados por la aplicación. No cambia qué contiene esa pestaña ni su posición entre las demás pestañas (sigue en el mismo orden: Generales, Apariencia, Contenido, Interacciones, Copias). Cualquier otro texto de la documentación del proyecto que nombre esa pestaña como "Específicas" se actualiza también para mantener la coherencia.

### Puntos confirmados con el usuario

- Los iconos van junto al texto de cada pestaña, no en sustitución del texto.
- La asociación de icono por pestaña (engranaje/Generales, pincel/Apariencia, contenido/Contenido, rayo/Interacciones, clonado/Copias) fue propuesta y aceptada por el usuario.
- El renombrado de "Específicas" a "Contenido" se aplica también a cualquier otra referencia textual existente a esa pestaña que haga falta actualizar, no solo a la etiqueta que ve el usuario en la propia pestaña.
- No hay cambio de comportamiento: ni el orden de las pestañas, ni su contenido, ni ninguna otra interacción se ven alterados por este cambio, que es puramente visual (icono) y de texto (nombre de una pestaña).
- Al añadir un icono a cada pestaña, la fila de las 5 pestañas ocupa más ancho horizontal que antes. El panel de propiedades debe seguir mostrando las 5 pestañas en una sola fila, sin que el texto se corte ni las pestañas salten de línea — si el ancho por defecto actual del panel se queda corto con los iconos añadidos, debe ampliarse lo necesario para que seguir viéndose correctamente.
- Cuando una pestaña está seleccionada (activa), además de la línea azul inferior que ya la resalta, su icono también se muestra en azul (`--accent-blue`). El texto de la pestaña activa no cambia de color (sigue en el tono oscuro actual, `--text-primary`) — solo el icono pasa a azul.

## Technical notes

- Las pestañas del panel de propiedades se crean mediante una función común (`createTab(name, label)` en `ui/componentModal.js`) que hoy solo admite texto; para añadir el icono habrá que extender esa función para aceptar también un icono, sin romper las llamadas existentes de las 5 pestañas (ids internos: `general`, `visual`, `specific`, `interacciones`, `copias`).
- El proyecto tiene un módulo central de iconos (`ui/icons.js`, familia Lucide, funciones `iconSvg`/`iconEl`, tamaños con nombre en `ICON_SIZE` — `ICON_SIZE.menu` = 16px es el tamaño usado en contextos similares como menús). Los iconos nuevos que hagan falta deben añadirse ahí, no dibujarse ad-hoc.
- El icono "Copias" puede reutilizar el icono `clone` ya existente en `ui/icons.js`; el resto de iconos probablemente no existen aún en el módulo y habrá que añadirlos.
- El texto de la pestaña "Específicas" está en `src/data/i18n.es.js` (`'componentModal.tab.specific': 'Específicas'`) y `src/data/i18n.en.js` (`'componentModal.tab.specific': 'Specific'`) — el id interno `specific` no cambia, solo el valor de esas claves.
- El estilo CSS de las pestañas (`.modal__tab` en `src/styles/main.css`) hoy es solo texto, sin ningún estilo previsto para un icono dentro de la pestaña; habrá que añadir las reglas necesarias.
- La documentación técnica de estilo del proyecto (`previo-sdd/design/docs/style/003-modales-menus.md`) menciona la pestaña "Específicas" por su nombre en varios puntos (p. ej. en la sección sobre organización de secciones dentro de las pestañas de propiedades) — deberá actualizarse junto con el resto de referencias, conforme a lo pedido por el usuario.
- Ancho del modal de propiedades: `.component-editor-modal` (`src/styles/main.css`) usa hoy `width: clamp(400px, 50vw, min(600px, 65vw))`. Con icono añadido a cada una de las 5 pestañas (`.modal__tab`, que pasaría a `display:flex` con `gap` entre icono y texto, ver mockup `design_pestanas-panel-propiedades-con-iconos.html`), la fila de pestañas (`.modal__tabs`) puede necesitar más ancho mínimo para no cortar texto ni hacer wrap — habrá que revisar si el `clamp()` actual (sobre todo su mínimo, 400px) sigue siendo suficiente y ajustarlo si no lo es.
