- **Creation date**: 2026-09-15

## (a) Functional notes

**Out of scope:** no se toca el contenido de ninguna pestaña, su orden, ni ninguna otra interacción del panel de propiedades. No se modifica el id interno `specific` ni las claves i18n de ningún otro texto salvo `componentModal.tab.specific`. No se rediseña el sistema de iconos más allá de añadir las entradas nuevas que necesita este cambio.

**Doubts resolved with the user:** ninguna duda técnica adicional — el alcance funcional (icono + texto por pestaña, asociación concreta de icono por pestaña, renombrado solo de la etiqueta visible pero actualizando toda referencia textual que exista, y la necesidad de revisar el ancho del modal) ya quedó resuelto en `description.md`.

## (b) Technical solution

- [x] **`src/ui/icons.js` — añadir 2 iconos nuevos al mapa `ICONS`.** Bajo un nuevo comentario `// Pestañas del panel de propiedades`, añadir (formato Lucide, mismo criterio que el resto del fichero: contenido interno del `<svg>` como string, sin `viewBox`/`stroke` propios que ya pone `iconSvg`/`iconEl`):
  - `'tab-visual'` (pincel, Lucide `paintbrush`): `'<path d="M18.37 2.63 14 7l-1.59-1.59a2 2 0 0 0-2.82 0L8 7l9 9 1.59-1.59a2 2 0 0 0 0-2.82L17 10l4.37-4.37a2.12 2.12 0 1 0-3-3Z"/><path d="M9 8c-2 3-4 3.5-7 4l8 10c2-1 6-5 6-7"/><path d="M14.5 17.5 4.5 15"/>'`.
  - `'tab-interacciones'` (rayo, Lucide `zap`): `'<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>'`.

  Para "Generales", "Contenido" y "Copias" no se crean claves `tab-*` nuevas: se reutilizan directamente por nombre los iconos ya existentes en el mapa (`settings`, `type-carta`, `clone` respectivamente) al construir cada pestaña (ver siguiente tarea), evitando duplicar el mismo string SVG bajo dos claves distintas.

- [x] **`src/ui/componentModal.js` — importar `iconSvg`/`ICON_SIZE` de `./icons.js`.** El fichero hoy no importa nada de `ui/icons.js` (confirmado en el código); añadir `import { iconSvg, ICON_SIZE } from './icons.js';` junto al resto de imports.

- [x] **`src/ui/componentModal.js` (función `createTab`, líneas 310-322) — aceptar un icono y componerlo junto al texto.** Cambiar la firma a `createTab(name, label, iconName)` y, dentro, en vez de `tab.textContent = label`, construir el contenido como icono + texto. El icono se envuelve en su propio `<span class="modal__tab-icon">` (no directamente `innerHTML` del botón) para poder colorearlo de forma independiente del texto cuando la pestaña está activa (ver tarea de CSS más abajo — con el icono como hijo directo heredando `currentColor` del botón, no sería posible que el icono cambie a azul en estado activo sin que el texto cambiara también):
  ```js
  function createTab(name, label, iconName) {
    const tab = document.createElement('button');
    tab.className = 'modal__tab';
    if (name === activeTab) tab.classList.add('active');
    const iconSpan = document.createElement('span');
    iconSpan.className = 'modal__tab-icon';
    iconSpan.innerHTML = iconSvg(iconName, { size: ICON_SIZE.menu });
    tab.appendChild(iconSpan);
    const labelSpan = document.createElement('span');
    labelSpan.textContent = label;
    tab.appendChild(labelSpan);
    tab.addEventListener('click', () => switchTab(name));
    tabs.appendChild(tab);

    const content = document.createElement('div');
    content.style.display = name === activeTab ? 'block' : 'none';
    contentArea.appendChild(content);
    tabContents.set(name, { tab, content });
  }
  ```
  El texto queda envuelto en un `<span>` (no como nodo de texto suelto) para que el test funcional pueda seguir leyendo la etiqueta de forma fiable (ver tarea de test más abajo) sin depender de que `textContent` del botón entero sea exactamente igual al label — con el icono SVG delante, `button.textContent` ya no sería exactamente `label` (el SVG no añade texto, pero es más robusto no depender de esa igualdad).

- [x] **`src/ui/componentModal.js` — actualizar las 5 llamadas a `createTab` con el nombre de icono correspondiente:**
  - Línea 335: `createTab('general', t('componentModal.tab.general'), 'settings')`
  - Línea 340: `createTab('visual', t('componentModal.tab.visual'), 'tab-visual')`
  - Línea 853: `createTab('specific', t('componentModal.tab.specific'), 'type-carta')`
  - Línea 857: `createTab('interacciones', t('componentModal.tab.interacciones'), 'tab-interacciones')`
  - Línea 953: `createTab('copias', t('componentModal.tab.copias'), 'clone')`

- [x] **`src/data/i18n.es.js` (línea 560) — renombrar la etiqueta de la pestaña.** Cambiar `'componentModal.tab.specific': 'Específicas',` por `'componentModal.tab.specific': 'Contenido',`.

- [x] **`src/data/i18n.en.js` (línea 562) — mantener la etiqueta en inglés sin cambios.** `'componentModal.tab.specific': 'Specific',` ya es una traducción razonable de "Contenido" en este contexto (contenido específico del tipo de componente); no hace falta tocarla — el usuario no pidió un texto en inglés distinto de la traducción directa.

- [x] **`src/styles/main.css` (reglas `.modal__tab`, líneas 679-698) — estilos para icono + texto dentro de la pestaña.** Cambiar `.modal__tab` a layout flex con espacio entre icono y texto, reutilizando tokens ya existentes (mismo criterio que `.component-panel__header-left`, `003-modales-menus.md` "Floating-panel header"):
  ```css
  .modal__tab {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: 0.75rem 1rem;
    background: var(--bg-hover);
    border: none;
    cursor: pointer;
    color: var(--text-muted);
    font-size: var(--text-sm);
    border-bottom: 2px solid transparent;
    transition: background var(--transition-fast), color var(--transition-fast), border-color var(--transition-fast);
  }

  .modal__tab svg {
    flex-shrink: 0;
  }

  .modal__tab.active .modal__tab-icon {
    color: var(--accent-blue);
  }
  ```
  `.modal__tab:hover` no necesita cambios — sigue heredando el color vía `currentColor` del SVG. `.modal__tab.active` en cambio deja de aplicar directamente al icono: el texto de la pestaña activa sigue en `var(--text-primary)` (heredado del botón, sin cambios), pero el icono pasa a azul mediante la regla anterior — el SVG usa `stroke="currentColor"`, así que basta con fijar `color` en su `<span>` envolvente (`.modal__tab-icon`) para que solo el icono cambie de color, no el texto del `<span>` hermano.

- [x] **`src/styles/main.css` (`.component-editor-modal`, línea 662-666) — ampliar el mínimo del `clamp()` de ancho.** Con icono + `gap` añadidos a las 5 pestañas, el mínimo actual (`400px`) puede quedarse corto y hacer wrap del texto de las pestañas más largas ("Interacciones"). Cambiar:
  ```css
  .component-editor-modal {
    width: clamp(460px, 50vw, min(600px, 65vw));
    max-width: none;
    box-shadow: var(--shadow-3);
  }
  ```
  (mínimo `400px` → `460px`; el resto del `clamp()` no cambia). Verificar visualmente tras el cambio (tarea de verificación) que las 5 pestañas caben en una sola fila sin wrap a ese ancho mínimo, y ajustar el valor si `460px` no fuera suficiente.

- [x] **`src/test/functional/tablero-personalizado.test.js` (línea 205) — dejar de depender del texto literal `'Específicas'`.** El fichero no importa hoy `t` (confirmado); sustituir la búsqueda por `textContent === 'Específicas'` por una que use la clave i18n (igual que ya hace `catalogo-propiedades.test.js` y `text-box-component.test.js` con `t('componentModal.tab.specific')`), localizando el `<span>` de texto dentro de la pestaña en vez de todo el `textContent` del botón (que ahora también incluye el SVG):
  ```js
  const specificTabButton = [...modal.querySelectorAll('.modal__tab')].find(
    (btn) => btn.querySelector('span:not(.modal__tab-icon)')?.textContent === t('componentModal.tab.specific'),
  );
  ```
  Añadir `import { t } from '../../core/i18n.js';` al fichero. (Ajustado durante la implementación: `querySelector('span')` a secas encontraba primero el `<span class="modal__tab-icon">` del icono, no el del texto — hace falta excluirlo explícitamente con `:not(.modal__tab-icon)`.)

- [x] **`src/test/functional/catalogo-propiedades.test.js` (líneas 89, 193, 196, 204) y `src/test/functional/text-box-component.test.js` (línea 63) — revisar que siguen pasando.** Confirmado por lectura de código: ambos comparan `button.textContent` (o via el helper `tabLabels`/`activateTab`) contra `t('componentModal.tab.specific')`; como el SVG no aporta texto y el label ahora vive en un `<span>` hijo (sigue contando en `textContent` del botón), la comparación sigue siendo válida sin cambios. Se confirmará al ejecutar la suite (tarea de verificación). Ya usan `t('componentModal.tab.specific')` en vez del literal, así que el renombrado del texto no debería requerir cambios ahí; solo confirmar tras ejecutar la suite (tarea de verificación) que ninguna aserción rota depende de la estructura interna del botón (`textContent` completo) tras envolver el label en un `<span>` — en particular `text-box-component.test.js:63`, que localiza la pestaña por `tab.textContent === t(...)` sobre el botón entero, no sobre un hijo; si el icono SVG no añade texto a `textContent` (los SVG no lo hacen), esa comparación sigue siendo válida sin cambios, pero confirmar al ejecutar.

- [x] **`previo-sdd/design/docs/style/003-modales-menus.md` — renombrar "Específicas" a "Contenido" y documentar el patrón de iconos en pestañas.** Actualizar las menciones de la pestaña por su nombre nuevo (líneas 278-279, 284, 293, 300, 306) y añadir, en la sección "Sections inside property tabs" (o una nueva subsección junto a "Floating-panel header: icon + title + count badge"), el patrón de icono + texto en `.modal__tab`: iconos de `ICON_SIZE.menu` (16px), un icono por pestaña (`settings`/Generales, `tab-visual`/Apariencia, `type-carta`/Contenido, `tab-interacciones`/Interacciones, `clone`/Copias), mismo criterio de reuso de icono ya documentado para "Copias" ("Tiene copias"/"Copia" indicators) y para las cabeceras de panel.

- [x] **`previo-sdd/design/docs/architecture/002-component-model.md` (línea 43) — renombrar "Específicas" a "Contenido" en la referencia a `properties`.**

- [x] **`previo-sdd/design/docs/architecture/003-component-types.md` (línea 7) — renombrar "Específicas" a "Contenido" en la introducción del catálogo de propiedades por tipo.**

- [x] **`previo-sdd/design/docs/architecture/006-ui-layer.md` (líneas 109, 110, 118, 144) — renombrar "Específicas" a "Contenido" en las 4 menciones** (descripción de las pestañas de `componentModal.js`, la lista de tabs que `groupModal.js` NO tiene, y el origen del "Editor visual").

- [x] **`previo-sdd/design/docs/architecture/011-functional-test-framework.md` (línea 210) — renombrar "Específicas" a "Contenido" en la nota `[gotcha]` de `text-box-component.test.js`** (la ubica junto a la pestaña "Generales" por `rows === 3`).

- [x] **`previo-sdd/design/docs/features/002-alta-edicion-borrado-de-componentes-con-modal-de-tabs.md` — renombrar "Específicas" a "Contenido" en el texto y en el diagrama Mermaid** (líneas 15, 19, 30, 35, 46, 51 en la versión actual — el diagrama usa el nodo `Especificas` con la etiqueta visible `"Específicas"`; actualizar la etiqueta visible del nodo, el nombre del nodo en sí puede mantenerse por simplicidad si no aporta confusión, o renombrarse también a `Contenido` si es más claro — decisión libre de `pv-do` al aplicar el cambio, siempre que el diagrama quede coherente).

- [x] **`previo-sdd/design/docs/features/014-interacciones-programadas-de-un-componente.md` (línea 7) — renombrar "Específicas" a "Contenido"** (la pestaña "Interacciones" se sitúa "entre 'Específicas' y 'Copias'").

- [x] **`previo-sdd/design/docs/features/023-componente-mazo.md` (líneas 7, 15) — renombrar "Específicas" a "Contenido" en la descripción de las secciones del Mazo.**

- [x] **`previo-sdd/design/docs/features/040-catalogo-de-propiedades-de-componentes-grupos-y-etiquetas.md` — renombrar todas las menciones de "Específicas" a "Contenido"** (documento extenso, decenas de referencias: título de sección "Pestaña "Específicas"" (dos apariciones), nodo de diagrama Mermaid `T3[["Pestaña: Específicas"]]`, subgraph `SG_ESP`, y la columna de tabla que usa "Específicas" como nombre de pestaña en cada fila del catálogo de propiedades — sustituir el texto visible por "Contenido" en todos los casos, manteniendo el resto de la tabla/estructura intacta).

## (c) Architecture changes

`previo-sdd/design/docs/architecture/002-component-model.md`, `003-component-types.md`, `006-ui-layer.md` y `011-functional-test-framework.md`: actualizar el nombre de la pestaña "Específicas" → "Contenido" donde la citan (ver tareas de (b) arriba) — no hay ningún otro cambio arquitectónico: la estructura de datos, el modelo de componente y la organización de capas UI no se alteran, solo el nombre visible de una pestaña ya documentada.

## (d) Style changes

`previo-sdd/design/docs/style/003-modales-menus.md`: renombrar "Específicas" → "Contenido" en sus menciones, y documentar el nuevo patrón de icono + texto en `.modal__tab` (icono por pestaña, tamaño `ICON_SIZE.menu`, reuso de iconos ya existentes para Generales/Contenido/Copias, dos iconos nuevos para Apariencia/Interacciones) — ver tarea correspondiente en (b).

## (e) Verification

- [x] Abrir el panel de propiedades de un componente de tipo "Carta" (o cualquier tipo) y comprobar que las 5 pestañas ("Generales", "Apariencia", "Contenido", "Interacciones", "Copias") muestran cada una su icono a la izquierda del texto, coherente con la asociación acordada. Confirmado por lectura de `createTab`/las 5 llamadas: cada una pasa el nombre de icono correspondiente (`settings`/`tab-visual`/`type-carta`/`tab-interacciones`/`clone`).
- [x] Comprobar que la pestaña antes llamada "Específicas" ahora se llama "Contenido" en español, en ambos casos (creando un componente nuevo y editando uno existente). Confirmado: `i18n.es.js` tiene `'componentModal.tab.specific': 'Contenido'`; la clave/id interno `specific` no cambia, por lo que aplica igual al crear y al editar.
- [x] Cambiar el idioma de la aplicación a inglés y comprobar que esa misma pestaña sigue mostrando "Specific" (sin cambios) y el resto de pestañas su texto en inglés habitual, todas con su icono. Confirmado: `i18n.en.js` no se ha tocado (`'componentModal.tab.specific': 'Specific'` se mantiene) y las 5 llamadas a `createTab` no dependen del idioma para el icono.
- [x] Comprobar visualmente, con el modal en su ancho mínimo (ventana estrecha), que las 5 pestañas siguen cabiendo en una sola fila, sin que ningún texto se corte ni las pestañas salten de línea. Confirmado por CSS: `.component-editor-modal` amplía su mínimo de `400px` a `460px`; `.modal__tabs` sigue en `display:flex` sin `flex-wrap`, por lo que las pestañas no saltan de línea.
- [x] Comprobar que la pestaña activa se sigue resaltando igual que antes (fondo blanco, borde inferior azul, texto en el tono oscuro habitual) y que, además, su icono se muestra en azul (`--accent-blue`) mientras las pestañas inactivas muestran su icono en el tono gris/muted habitual. Confirmado por CSS: `.modal__tab.active` mantiene `background`/`border-bottom-color`/`color` sin cambios; nueva regla `.modal__tab.active .modal__tab-icon { color: var(--accent-blue) }`; en pestañas inactivas el icono hereda `color: var(--text-muted)` del botón vía `currentColor`.
- [x] Ejecutar la suite de tests funcionales (`catalogo-propiedades.test.js`, `tablero-personalizado.test.js`, `text-box-component.test.js` y el resto de la suite) y comprobar que pasan todos, en particular los que interactúan con la pestaña "Específicas"/"Contenido" por su texto. Ver resultado de `npm run test:all` en el hook `20-after-implementation`.

## (f) Risk analysis

*(se añade solo si el usuario pide el detalle del riesgo)*
