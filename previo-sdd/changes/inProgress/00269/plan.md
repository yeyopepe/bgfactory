- **Creation date**: 2026-09-14

## (a) Functional notes

**Out of scope:** no se toca el contenido de ninguna pestaña, su orden, ni ninguna otra interacción del panel de propiedades. No se modifica el id interno `specific` ni las claves i18n de ningún otro texto salvo `componentModal.tab.specific`. No se rediseña el sistema de iconos más allá de añadir las entradas nuevas que necesita este cambio.

**Doubts resolved with the user:** ninguna duda técnica adicional — el alcance funcional (icono + texto por pestaña, asociación concreta de icono por pestaña, renombrado solo de la etiqueta visible pero actualizando toda referencia textual que exista, y la necesidad de revisar el ancho del modal) ya quedó resuelto en `description.md`.

## (b) Technical solution

- [ ] **`src/ui/icons.js` — añadir 4 iconos nuevos al mapa `ICONS`.** Bajo un nuevo comentario `// Pestañas del panel de propiedades`, añadir (formato Lucide, mismo criterio que el resto del fichero: contenido interno del `<svg>` como string, sin `viewBox`/`stroke` propios que ya pone `iconSvg`/`iconEl`):
  - `'tab-general'`: reutilizar el path ya existente de `settings` (engranaje) — no crear una entrada nueva, referenciar directamente `settings` al construir el icono de esa pestaña (ver siguiente tarea).
  - `'tab-visual'` (pincel, Lucide `paintbrush`): `'<path d="M18.37 2.63 14 7l-1.59-1.59a2 2 0 0 0-2.82 0L8 7l9 9 1.59-1.59a2 2 0 0 0 0-2.82L17 10l4.37-4.37a2.12 2.12 0 1 0-3-3Z"/><path d="M9 8c-2 3-4 3.5-7 4l8 10c2-1 6-5 6-7"/><path d="M14.5 17.5 4.5 15"/>'`.
  - `'tab-specific'` (carta, Lucide `credit-card`, reutilizando el mismo path ya usado por `type-carta`): `'<rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>'` — igual que `'tab-general'`, valorar referenciar directamente el path de `type-carta` en vez de duplicarlo, para no tener el mismo SVG en dos claves distintas del mapa.
  - `'tab-interacciones'` (rayo, Lucide `zap`): `'<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>'`.
  - `'tab-copias'`: reutilizar el path ya existente de `clone` — no crear una entrada nueva, referenciar `clone` directamente.

  Para evitar duplicar el mismo string SVG bajo dos claves (`tab-general`/`settings`, `tab-specific`/`type-carta`, `tab-copias`/`clone`), la forma más simple es no crear esas 3 claves `tab-*` en el mapa `ICONS` y, en su lugar, pasar directamente el nombre ya existente (`settings`, `type-carta`, `clone`) al construir cada pestaña en la tarea siguiente. Solo `tab-visual` y `tab-interacciones` son claves realmente nuevas.

- [ ] **`src/ui/componentModal.js` (función `createTab`, líneas 310-322) — aceptar un icono y componerlo junto al texto.** Cambiar la firma a `createTab(name, label, iconName)` y, dentro, en vez de `tab.textContent = label`, construir el contenido como icono + texto:
  ```js
  function createTab(name, label, iconName) {
    const tab = document.createElement('button');
    tab.className = 'modal__tab';
    if (name === activeTab) tab.classList.add('active');
    tab.innerHTML = iconSvg(iconName, { size: ICON_SIZE.menu });
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
  - Confirmar que `iconSvg`/`ICON_SIZE` ya están importados en `componentModal.js` (si no lo están, añadir el import de `ui/icons.js`).

- [ ] **`src/ui/componentModal.js` — actualizar las 5 llamadas a `createTab` con el nombre de icono correspondiente:**
  - Línea 335: `createTab('general', t('componentModal.tab.general'), 'settings')`
  - Línea 340: `createTab('visual', t('componentModal.tab.visual'), 'tab-visual')`
  - Línea 853: `createTab('specific', t('componentModal.tab.specific'), 'type-carta')`
  - Línea 857: `createTab('interacciones', t('componentModal.tab.interacciones'), 'tab-interacciones')`
  - Línea 953: `createTab('copias', t('componentModal.tab.copias'), 'clone')`

- [ ] **`src/data/i18n.es.js` (línea 542) — renombrar la etiqueta de la pestaña.** Cambiar `'componentModal.tab.specific': 'Específicas',` por `'componentModal.tab.specific': 'Contenido',`.

- [ ] **`src/data/i18n.en.js` (línea 544) — mantener la etiqueta en inglés sin cambios.** `'componentModal.tab.specific': 'Specific',` ya es una traducción razonable de "Contenido" en este contexto (contenido específico del tipo de componente); no hace falta tocarla — el usuario no pidió un texto en inglés distinto de la traducción directa.

- [ ] **`src/styles/main.css` (reglas `.modal__tab`, líneas 678-697) — estilos para icono + texto dentro de la pestaña.** Cambiar `.modal__tab` a layout flex con espacio entre icono y texto, reutilizando tokens ya existentes (mismo criterio que `.component-panel__header-left`, `003-modales-menus.md` "Floating-panel header"):
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
  ```
  (`.modal__tab.active`/`.modal__tab:hover` no necesitan cambios — ya heredan el color vía `currentColor` del SVG, que hoy usa `stroke="currentColor"` en `iconSvg`.)

- [ ] **`src/styles/main.css` (`.component-editor-modal`, línea 661-665) — ampliar el mínimo del `clamp()` de ancho.** Con icono + `gap` añadidos a las 5 pestañas, el mínimo actual (`400px`) puede quedarse corto y hacer wrap del texto de las pestañas más largas ("Interacciones"). Cambiar:
  ```css
  .component-editor-modal {
    width: clamp(460px, 50vw, min(600px, 65vw));
    max-width: none;
    box-shadow: var(--shadow-3);
  }
  ```
  (mínimo `400px` → `460px`; el resto del `clamp()` no cambia). Verificar visualmente tras el cambio (tarea de verificación) que las 5 pestañas caben en una sola fila sin wrap a ese ancho mínimo, y ajustar el valor si `460px` no fuera suficiente.

- [ ] **`src/test/functional/tablero-personalizado.test.js` (línea 204-206) — dejar de depender del texto literal `'Específicas'`.** Sustituir la búsqueda por `textContent === 'Específicas'` por una que use la clave i18n (igual que ya hace `catalogo-propiedades.test.js` y `text-box-component.test.js` con `t('componentModal.tab.specific')`), y que localice el `<span>` de texto dentro de la pestaña en vez de todo el `textContent` del botón (que ahora también incluye el SVG):
  ```js
  const specificTabButton = [...modal.querySelectorAll('.modal__tab')].find(
    (btn) => btn.querySelector('span')?.textContent === t('componentModal.tab.specific'),
  );
  ```
  Ajustar el import de `t` en el fichero si no está ya importado (confirmar antes de tocar).

- [ ] **`src/test/functional/catalogo-propiedades.test.js` (líneas 193, 209) y cualquier otro test que compruebe texto de esta pestaña — revisar que siguen pasando.** Ya usan `t('componentModal.tab.specific')` en vez del literal, así que el renombrado del texto no debería requerir cambios ahí; solo confirmar tras ejecutar la suite (tarea de verificación) que ninguna aserción rota depende de la estructura interna del botón (`textContent` completo) tras envolver el label en un `<span>`.

- [ ] **`previo-sdd/design/docs/style/003-modales-menus.md` — renombrar "Específicas" a "Contenido" y documentar el patrón de iconos en pestañas.** Actualizar las menciones de la pestaña por su nombre nuevo (líneas 278, 279, 284 en la versión actual) y añadir, en la sección "Sections inside property tabs" (o una nueva subsección junto a "Floating-panel header: icon + title + count badge"), el patrón de icono + texto en `.modal__tab`: iconos de `ICON_SIZE.menu` (16px), un icono por pestaña (`settings`/Generales, `tab-visual`/Apariencia, `type-carta`/Contenido, `tab-interacciones`/Interacciones, `clone`/Copias), mismo criterio de reuso de icono ya documentado para "Copias" ("Tiene copias"/"Copia" indicators) y para las cabeceras de panel.

- [ ] **`previo-sdd/design/docs/architecture/002-component-model.md` (línea 43) — renombrar "Específicas" a "Contenido" en la referencia a `properties`.**

- [ ] **`previo-sdd/design/docs/architecture/003-component-types.md` (línea 7) — renombrar "Específicas" a "Contenido" en la introducción del catálogo de propiedades por tipo.**

- [ ] **`previo-sdd/design/docs/architecture/006-ui-layer.md` (líneas 109-110) — renombrar "Específicas" a "Contenido" en la descripción de las pestañas de `componentModal.js`.**

- [ ] **`previo-sdd/design/docs/features/002-alta-edicion-borrado-de-componentes-con-modal-de-tabs.md` — renombrar "Específicas" a "Contenido" en el texto y en el diagrama Mermaid** (líneas 15, 19, 30, 35, 46, 51 en la versión actual — el diagrama usa el nodo `Especificas` con la etiqueta visible `"Específicas"`; actualizar la etiqueta visible del nodo, el nombre del nodo en sí puede mantenerse por simplicidad si no aporta confusión, o renombrarse también a `Contenido` si es más claro — decisión libre de `pv-do` al aplicar el cambio, siempre que el diagrama quede coherente).

- [ ] **`previo-sdd/design/docs/features/014-interacciones-programadas-de-un-componente.md` — revisar y renombrar si menciona "Específicas" por nombre** (confirmar contenido exacto al implementar, no se ha extraído aquí el fragmento completo).

- [ ] **`previo-sdd/design/docs/features/023-componente-mazo.md` (línea 15) — renombrar "Específicas" a "Contenido" en la descripción de las secciones del Mazo.**

- [ ] **`previo-sdd/design/docs/features/040-catalogo-de-propiedades-de-componentes-grupos-y-etiquetas.md` — renombrar todas las menciones de "Específicas" a "Contenido"** (documento extenso, decenas de referencias: título de sección "Pestaña "Específicas"" (dos apariciones), nodo de diagrama Mermaid `T3[["Pestaña: Específicas"]]`, subgraph `SG_ESP`, y la columna de tabla que usa "Específicas" como nombre de pestaña en cada fila del catálogo de propiedades — sustituir el texto visible por "Contenido" en todos los casos, manteniendo el resto de la tabla/estructura intacta).

## (c) Architecture changes

`previo-sdd/design/docs/architecture/002-component-model.md`, `003-component-types.md` y `006-ui-layer.md`: actualizar el nombre de la pestaña "Específicas" → "Contenido" donde la citan (ver tareas de (b) arriba) — no hay ningún otro cambio arquitectónico: la estructura de datos, el modelo de componente y la organización de capas UI no se alteran, solo el nombre visible de una pestaña ya documentada.

## (d) Style changes

`previo-sdd/design/docs/style/003-modales-menus.md`: renombrar "Específicas" → "Contenido" en sus menciones, y documentar el nuevo patrón de icono + texto en `.modal__tab` (icono por pestaña, tamaño `ICON_SIZE.menu`, reuso de iconos ya existentes para Generales/Contenido/Copias, dos iconos nuevos para Apariencia/Interacciones) — ver tarea correspondiente en (b).

## (e) Verification

- [ ] Abrir el panel de propiedades de un componente de tipo "Carta" (o cualquier tipo) y comprobar que las 5 pestañas ("Generales", "Apariencia", "Contenido", "Interacciones", "Copias") muestran cada una su icono a la izquierda del texto, coherente con la asociación acordada.
- [ ] Comprobar que la pestaña antes llamada "Específicas" ahora se llama "Contenido" en español, en ambos casos (creando un componente nuevo y editando uno existente).
- [ ] Cambiar el idioma de la aplicación a inglés y comprobar que esa misma pestaña sigue mostrando "Specific" (sin cambios) y el resto de pestañas su texto en inglés habitual, todas con su icono.
- [ ] Comprobar visualmente, con el modal en su ancho mínimo (ventana estrecha), que las 5 pestañas siguen cabiendo en una sola fila, sin que ningún texto se corte ni las pestañas salten de línea.
- [ ] Comprobar que la pestaña activa se sigue resaltando igual que antes (fondo blanco, borde inferior azul) y que el icono no rompe ese resaltado.
- [ ] Ejecutar la suite de tests funcionales (`catalogo-propiedades.test.js`, `tablero-personalizado.test.js`, `text-box-component.test.js` y el resto de la suite) y comprobar que pasan todos, en particular los que interactúan con la pestaña "Específicas"/"Contenido" por su texto.

## (f) Risk analysis

*(se añade solo si el usuario pide el detalle del riesgo)*
