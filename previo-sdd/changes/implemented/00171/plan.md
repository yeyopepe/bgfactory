- **Creation date**: 2026-08-20
- **Risk**: 2/10 — Riesgo mínimo

## (a) Functional notes

**Out of scope:** la implementación real de "Exportar recursos" (.zip) y "Exportar hoja de producción" (.csv) — solo se representan como filas visibles y desactivadas en el desplegable, sin `onClick` ni lógica alguna. El flujo de "Exportar juego (.json)" (`openExportFlow`, `ui/exportSelectionModal.js`) no cambia de comportamiento, solo el punto desde el que se invoca. El título editable (`h1#app-title`, `ui/appTitle.js`) no forma parte de este cambio.

**Doubts resolved with the user:** ¿se elimina solo el botón "Guardar" o también su lógica interna? → Se elimina también `saveAs()` y, al comprobarse que `buildExportHtml`/`downloadHtml` (`src/core/fileExport.js`) no tienen ningún otro uso en el proyecto, se eliminan igualmente para no dejar código muerto. ¿El badge "soon" pedido por el usuario se traduce como "Próximamente"? → Sí, confirmado con el usuario, coherente con que el resto de la interfaz está en español.

## (b) Technical solution

- [x] **`src/core/fileExport.js` — Eliminar `buildExportHtml` y `downloadHtml`.** Ambas funciones (líneas 6-21) solo las usa `saveAs()` en `editModeToggle.js`, que se elimina en esta misma tarea de conjunto. Se confirma que no hay otros usos en el proyecto. `downloadJson` (líneas 23-31) se mantiene, la sigue usando `openExportFlow`.
- [x] **`src/ui/editModeToggle.js` — Eliminar la función `saveAs(filename)`** (líneas 22-26) y su único punto de entrada, el botón "Guardar" dentro de `renderEditToolbar` (líneas 177-184). Eliminar también el import de `buildExportHtml`/`downloadHtml` de `../core/fileExport.js` (línea 6), quedando solo lo que siga usándose de ese módulo (ninguno, tras esta tarea — eliminar el `import` completo).
- [x] **`src/ui/editModeToggle.js` — Crear `createExportMenu()`.** Nueva función en este mismo fichero (junto a `createFitButton`), siguiendo el patrón ya existente de `createAddMenu` en `src/ui/resourceList.js:159-221` (wrap + botón + menú absoluto bajo el botón + toggle con `hidden` + cierre por click-fuera), añadiendo también cierre por tecla ESC (que `createAddMenu` no tiene):
  - `wrap` (`div.export-menu-wrap`, `position: relative` vía CSS) contiene el botón "Exportar" (icono + texto + chevron) y el menú (`div.export-menu`, `hidden` por defecto, `position: absolute` bajo el botón vía CSS).
  - Al hacer click en el botón: si el menú está oculto, se muestra y se registran `mousedown` (`document`, cierra si el click es fuera de `wrap`) y `keydown` (`document`, cierra si `e.key === 'Escape'`); si está visible, se cierra por el mismo camino de cierre que click-fuera/ESC.
  - Fila "Exportar juego (.json)": al hacer click, cierra el menú (quita ambos listeners) y llama a `openExportFlow()` (ya existente, sin cambios).
  - Dos filas adicionales, separadas por un separador visual: "Exportar recursos (.zip)" y "Exportar hoja de producción (.csv)", ambas sin `onClick`/sin listener de click, con clase `export-menu__item--soon` y una etiqueta `Próximamente` junto al texto (mismo patrón visual de deshabilitado que `.context-menu__item--disabled`: opacidad reducida, `cursor: not-allowed`, sin hover de fondo).
  - Diagrama del comportamiento:
    ```mermaid
    flowchart TD
        A(("Click en botón Exportar")) --> B{"¿Menú visible?"}
        B -->|No| C["Mostrar menú (quitar hidden)"]
        C --> D["Registrar listener mousedown en document"]
        D --> E["Registrar listener keydown en document"]
        E --> F["Menú abierto"]
        B -->|Sí| G["Cerrar menú"]

        F --> H{"Interacción del usuario"}
        H -->|"mousedown fuera de wrap"| G
        H -->|"keydown = Escape"| G
        H -->|"click en 'Exportar juego (.json)'"| I["Cerrar menú"]
        H -->|"click en 'Exportar recursos (.zip)'"| F
        H -->|"click en 'Exportar hoja de producción (.csv)'"| F

        G --> J["Quitar listener mousedown"]
        J --> K["Quitar listener keydown"]
        K --> L(("Menú cerrado"))

        I --> M["Quitar listener mousedown"]
        M --> N["Quitar listener keydown"]
        N --> O["Llamar a openExportFlow()"]
        O --> L
    ```
- [x] **`src/ui/editModeToggle.js` — Actualizar `renderEditToolbar`.** Sustituir el botón plano "Exportar" (líneas 186-189) por `toolbar.appendChild(createExportMenu())`. Reorganizar el resto de `toolbar` en 3 grupos separados visualmente (`div.toolbar-group` + `div.toolbar-divider` entre ellos, ver mockup `design_toolbar_normal.html`): (1) "Salir del modo edición"; (2) "Importar" (ya no incluye "Guardar"); (3) el nuevo desplegable "Exportar". "Ajustar zoom" (`createFitButton`) se mantiene fuera de estos 3 grupos, al final de la barra, separado por un divisor más amplio.
- [x] **`src/ui/editModeToggle.js` — Añadir icono a cada botón de texto.** "Salir del modo edición" e "Importar" pasan a mostrar icono + texto (hoy son solo texto), usando el mismo lenguaje SVG ya empleado en `createFitButton` (`stroke="currentColor"`, `stroke-width="2"`, envuelto en `span.icon-frame`). Iconos de referencia visual en el mockup: flecha de salida para "Salir del modo edición", flecha hacia arriba con bandeja para "Importar", flecha hacia arriba con bandeja (variante export) y chevron para "Exportar".
- [x] **`src/styles/main.css` — Estilos de los nuevos grupos y divisores.** Añadir `.toolbar-group` (`display: flex; align-items: center; gap: 0.5rem`) y `.toolbar-divider` (línea vertical sutil, `width: 1px; height: 1.5rem; background: rgba(255,255,255,0.2)`) junto a las reglas ya existentes de `.edit-toolbar`/`.edit-toolbar button` (líneas 147-181), reutilizando los tokens ya usados ahí (`--bg-toolbar`, `--text-light`, `--radius-sm`, `--shadow-1`, `--transition-fast`).
- [x] **`src/styles/main.css` — Estilos del desplegable `.export-menu`.** Nuevas reglas: `.export-menu-wrap { position: relative }`, `.export-menu { position: absolute; top: calc(100% + 0.5rem); right: 0; background: var(--bg-toolbar); ... ; box-shadow: var(--shadow-2); border-radius: var(--radius-sm) }` (fondo oscuro coherente con la toolbar, no el fondo claro de `.context-menu`), `.export-menu__item` (fila interactiva, hover `rgba(255,255,255,0.1)` o `var(--accent-blue)`), `.export-menu__separator` (línea horizontal sutil), `.export-menu__item--soon` (`opacity: 0.5; cursor: not-allowed`, sin hover — mismo criterio que `.context-menu__item--disabled`, `main.css` ~línea 2488, pero adaptado a fondo oscuro) y `.export-menu__soon-tag` (texto pequeño, `color: var(--text-muted)` o equivalente sobre fondo oscuro).

## (e) Verification

- [x] En Modo Edición, la barra superior muestra 3 bloques separados por un divisor: "Salir del modo edición" | "Importar" | "Exportar" (desplegable), y "Ajustar zoom" al final, independiente. No hay ningún botón "Guardar" en ningún sitio.
- [x] "Salir del modo edición" e "Importar" muestran icono + texto y siguen funcionando exactamente igual que antes.
- [x] Al hacer click en "Exportar", se abre un desplegable junto al botón con 3 filas: "Exportar juego (.json)" (activa), y "Exportar recursos (.zip)" / "Exportar hoja de producción (.csv)" (atenuadas, con etiqueta "Próximamente", sin reacción al click).
- [x] Click en "Exportar juego (.json)" cierra el desplegable y abre la ventana de selección de exportación existente (`openExportSelectionModal`), con el mismo comportamiento que tenía el botón "Exportar" anterior.
- [x] El desplegable se cierra al hacer click fuera de él, y también al pulsar ESC.
- [x] No queda ninguna referencia a `saveAs`, `buildExportHtml` ni `downloadHtml` en el código (`grep` no encuentra resultados fuera de este `plan.md`).
- [x] El resto de funcionalidades del modo edición (mesa, componentes, recursos) no se ve afectado — no hay regresiones visuales fuera de la propia barra.
