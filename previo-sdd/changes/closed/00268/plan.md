- **Creation date**: 2026-09-14

## (a) Functional notes

**Out of scope:** no se toca ningún otro aspecto de los tres paneles (filtro de texto, columnas, redimensionado, arrastre del panel, menú de columnas) más allá de la propia cabecera. El botón de plegar/desplegar no cambia de comportamiento, solo de posición relativa (pasa a ir después de la nueva badge). No se añade traducción a otros idiomas más allá de los dos ya existentes (`es`, `en`).

**Doubts resolved with the user:** ninguna duda técnica adicional a las ya resueltas en `description.md` (icono por panel, título sin contador, orden badge+botón, mismo tratamiento en los tres paneles).

## (b) Technical solution

- [x] **`src/ui/icons.js` — añadir dos iconos nuevos.** En el objeto `ICONS`, añadir `'panel-componentes'` (rejilla 2x2, mismo estilo Lucide que `type-tablero-simple` pero sin las 4 celdas, solo 4 cuadrantes: reutilizar el trazado de una rejilla simple, p. ej. `<rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/>`) y `'panel-recursos'` (icono de imagen tipo Lucide `image`: `<rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>`). Ubicarlos en un nuevo bloque de comentario `// Cabeceras de paneles flotantes` junto a los existentes, siguiendo la misma convención (SVG 24x24, sin fijar color/stroke, ya que eso lo aplica `iconSvg`/`iconEl`). El icono de Etiquetas no se añade: se reutiliza el ya existente `tag`.
- [x] **`src/data/i18n.es.js` — quitar el contador embebido del título.** Cambiar `'componentList.title': 'Componentes ({count})'` → `'componentList.title': 'Componentes'`, `'resourceList.title': 'Recursos ({count})'` → `'resourceList.title': 'Recursos'`, `'tagList.title': 'Etiquetas ({count})'` → `'tagList.title': 'Etiquetas'` (líneas 87, 95, 102).
- [x] **`src/data/i18n.en.js` — mismo cambio en inglés.** `'componentList.title': 'Components ({count})'` → `'Components'`, `'resourceList.title': 'Resources ({count})'` → `'Resources'`, `'tagList.title': 'Tags ({count})'` → `'Tags'` (líneas 89, 97, 104).
- [x] **`src/ui/componentList.js` — reconstruir la cabecera.** En el bloque que crea `header` (hoy líneas ~497-510): tras crear `header`, añadir un contenedor `header-left` (`div`, clase `component-panel__header-left`) con el icono (`headerLeft.innerHTML = iconSvg('panel-componentes')` o insertarlo como nodo con `iconEl`) seguido del `<strong>` de título (ahora `t('componentList.title')`, sin pasar `{ count: ... }`). Añadir un contenedor `header-right` (`div`, clase `component-panel__header-right`) que contenga primero un `<span class="component-panel__count-badge">` con `textContent = String(components.length)`, y después el `toggleButton` ya existente (sin cambios en su lógica). `header.appendChild(headerLeft)` y `header.appendChild(headerRight)` en ese orden, sustituyendo los `appendChild(title)` / `appendChild(toggleButton)` sueltos actuales. El listener de arrastre del header (`header.addEventListener('mousedown', ...)`) no cambia: sigue comprobando `e.target === toggleButton` para no interferir con el arrastre; no hace falta excluir también el nuevo badge/icono porque no son interactivos.
- [x] **`src/ui/resourceList.js` — mismo patrón.** Igual que en `componentList.js`: `header-left` con `iconSvg('panel-recursos')` + `<strong>` con `t('resourceList.title')` (sin `count`); `header-right` con `<span class="resource-panel__count-badge">` (`textContent = String(resources.length)`) + el `toggleButton` existente.
- [x] **`src/ui/tagList.js` — mismo patrón.** `header-left` con `iconSvg('tag')` (icono ya existente, reutilizado) + `<strong>` con `t('tagList.title')` (sin `count`); `header-right` con `<span class="tag-panel__count-badge">` (`textContent = String(tags.length)`) + el `toggleButton` existente.
- [x] **`src/styles/main.css` — CSS de la nueva estructura en las tres cabeceras.** En cada uno de los tres bloques `.component-panel__header` / `.resource-panel__header` / `.tag-panel__header` (~líneas 2548, 2672, 3291), mantener las reglas actuales (`display: flex; justify-content: space-between; align-items: center; ...`) sin cambios — ya sirven para el nuevo layout de dos contenedores. Añadir, junto a cada bloque, las reglas nuevas (mismo valor para las tres, solo cambia el prefijo de clase `component-`/`resource-`/`tag-`):
  ```css
  .component-panel__header-left,
  .component-panel__header-right {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .component-panel__count-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 1.5rem;
    height: 1.5rem;
    padding: 0 0.4rem;
    border-radius: var(--radius-full);
    background: rgba(255, 255, 255, 0.18);
    color: var(--text-light);
    font-size: var(--text-sm);
    font-weight: var(--font-semibold);
    box-shadow: var(--shadow-badge);
  }
  ```
  (repetir con `.resource-panel__header-left`/`.resource-panel__header-right`/`.resource-panel__count-badge` y `.tag-panel__header-left`/`.tag-panel__header-right`/`.tag-panel__count-badge`). El icono de la izquierda usa el tamaño por defecto de `iconSvg` (`ICON_SIZE.toolbar`, 20px) — no hace falta una regla `.icon-frame` específica salvo que el resultado visual quede desproporcionado respecto al texto, a valorar en la verificación.

## (d) Style changes

- **`previo-sdd/design/docs/style/003-modales-menus.md`** (Iconografía): añadir una entrada breve documentando el nuevo patrón "cabecera de panel flotante con icono + título + badge de contador", listando `.component-panel__header-left/-right`, `.*-panel__count-badge` como convención reutilizable para cualquier futuro panel flotante similar, y registrar los dos iconos nuevos (`panel-componentes`, `panel-recursos`) en la tabla/lista de iconos si `pv-internal-doc-style`/`pv-do` determina que corresponde ahí.
- **`previo-sdd/design/docs/style/001-tokens-visual.md`**: no se añade ningún token nuevo — la badge reutiliza `--space-2`, `--radius-full`, `--text-light`, `--text-sm`, `--font-semibold`, `--shadow-badge` ya existentes. Sin cambios en este archivo salvo que `pv-do` considere útil anotar este nuevo uso de `--shadow-badge` (hasta ahora solo badges de esquina sobre componentes de mesa) junto a su entrada actual.

## (e) Verification

- [x] Abrir la aplicación en modo edición: el panel "Componentes" muestra, en la cabecera, el icono de rejilla seguido de "Componentes" en negrita a la izquierda, y a la derecha una badge redondeada con el número total de componentes seguida del botón ▾/▸ de plegar/desplegar.
- [x] El panel "Recursos" muestra el icono de imagen + "Recursos" a la izquierda, y badge con el número de recursos + botón de plegar/desplegar a la derecha.
- [x] El panel "Etiquetas" muestra el icono de etiqueta (`tag`) + "Etiquetas" a la izquierda, y badge con el número de etiquetas + botón de plegar/desplegar a la derecha.
- [x] Añadir/eliminar un componente, un recurso o una etiqueta actualiza el número mostrado en la badge correspondiente sin recargar la página (mismo comportamiento de refresco que ya tenía el contador embebido en el texto).
- [x] El botón de plegar/desplegar sigue funcionando igual que antes (colapsa/expande el cuerpo del panel) y el arrastre del panel por la cabecera (fuera del botón) sigue funcionando.
- [x] Cambiar el idioma de la aplicación (Español ↔ English) actualiza el texto del título de las tres cabeceras ("Componentes"/"Components", "Recursos"/"Resources", "Etiquetas"/"Tags") sin el número entre paréntesis en ningún idioma.
- [x] El mismo aspecto se comprueba también en modo juego, si los tres paneles están disponibles en ese modo (no lo están: los tres paneles solo se renderizan desde `modes/edit/editMode.js`, nunca desde el modo juego — verificación no aplicable).
