- **Fecha creación**: 2026-08-06

## (a) Anotaciones funcionales

**Fuera de alcance:** ningún otro filtro o criterio de ordenación de estas tres ventanas se toca (filtros/ordenación por columna, `columnFilters`, `columnSort` siguen igual). Tampoco se persiste ni se cambia el alcance de `filterText` (sigue siendo estado transitorio de módulo, no guardado).

**Dudas resueltas con el usuario:**
- ¿Cuándo se ve el botón? Siempre visible junto al input, no solo cuando hay texto.
- ¿Qué hace al pulsarlo? Vacía el input y quita el filtro aplicado en el mismo acto (mismo `filterText` gobierna ambas cosas).
- ¿Mismo comportamiento en las tres ventanas? Sí, sin diferencias entre Componentes/Recursos/Grupos.

## (b) Solución técnica

Las tres ventanas (`ui/componentList.js`, `ui/resourceList.js`, `ui/groupList.js`) repiten hoy la misma estructura de filtro de forma independiente (una `filterBar` con un único `<input type="text">`, cableado a su propio `filterText` de módulo). Se sigue ese mismo patrón de duplicación deliberada entre los tres ficheros (ya usado así en el proyecto — ver el comentario de `group-panel__filter` en `main.css`), añadiendo en cada uno el botón de limpiar con el mismo marcado, misma clase CSS por bloque y mismo comportamiento.

Botón "icono-solo" siguiendo el patrón de `STYLE_BIBLE.md` sección 9 (SVG con `stroke="currentColor"`, `title`/`aria-label` como etiqueta accesible, sin texto visible): una X simple (dos trazos cruzados).

1. **`src/ui/componentList.js` — insertar el botón junto al input de filtro.** En el bloque `if (components.length > 0) { ... }` (donde se crea `filterBar`/`filterInput`, en torno a la línea 351), tras `filterBar.appendChild(filterInput);`:
   - Crear el botón:
     ```js
     const clearBtn = document.createElement('button');
     clearBtn.type = 'button';
     clearBtn.className = 'component-panel__filter-clear';
     clearBtn.title = 'Limpiar búsqueda';
     clearBtn.setAttribute('aria-label', 'Limpiar búsqueda');
     clearBtn.innerHTML = `
       <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
         <path d="M6 6l12 12" stroke-linecap="round"/>
         <path d="M18 6L6 18" stroke-linecap="round"/>
       </svg>
     `;
     const updateClearBtnState = () => {
       clearBtn.classList.toggle('is-empty', filterInput.value === '');
     };
     clearBtn.addEventListener('click', () => {
       if (filterText === '') return;
       filterText = '';
       filterInput.value = '';
       rerenderBody();
       updateClearBtnState();
     });
     filterBar.appendChild(clearBtn);
     updateClearBtnState();
     ```
   - Añadir esa misma llamada `updateClearBtnState()` dentro del listener `input` ya existente de `filterInput` (justo después de `filterText = filterInput.value;`), para que el aspecto "vacío" se actualice también al escribir/borrar a mano, no solo al pulsar el botón.
2. **`src/ui/resourceList.js` — mismo cambio.** Igual que la tarea 1, en el bloque `if (resources.length > 0) { ... }` (en torno a la línea 337): clase `resource-panel__filter-clear`, mismo SVG, mismo cableado sobre su propio `filterText`/`filterInput`/`rerenderBody`.
3. **`src/ui/groupList.js` — mismo cambio.** Igual que la tarea 1, en el bloque `if (groups.length > 0) { ... }` (en torno a la línea 263): clase `group-panel__filter-clear`, mismo SVG, mismo cableado sobre su propio `filterText`/`filterInput`/`rerenderBody`.
4. **`src/styles/main.css` — estilos del botón, uno por cada bloque `__filter` ya existente.** Para cada uno de los tres bloques (`.component-panel__filter` en torno a la línea 1910, `.resource-panel__filter` en torno a la línea 2000, `.group-panel__filter` en torno a la línea 2537):
   - Añadir `display: flex; align-items: center; gap: 0.4rem;` a la regla `.xxx-panel__filter` ya existente (para que el input y el botón queden en fila).
   - Añadir, junto a la regla `input[type="text"]` de ese mismo bloque, `flex: 1;` (para que el input siga ocupando el espacio disponible y el botón quede a su lado sin ensancharse).
   - Añadir las reglas nuevas del botón (mismo bloque de estilos en los tres, con el nombre de clase de cada ventana):
     ```css
     .component-panel__filter-clear {
       flex-shrink: 0;
       width: 1.75rem;
       height: 1.75rem;
       display: inline-flex;
       align-items: center;
       justify-content: center;
       padding: 0;
       background: none;
       border: 1px solid var(--border-neutral);
       border-radius: var(--radius-sm);
       color: var(--text-muted);
       cursor: pointer;
       transition: background var(--transition-fast), color var(--transition-fast), border-color var(--transition-fast), opacity var(--transition-fast);
     }

     .component-panel__filter-clear svg {
       width: 14px;
       height: 14px;
     }

     .component-panel__filter-clear:hover {
       background: var(--bg-hover);
       color: var(--text-primary);
     }

     .component-panel__filter-clear.is-empty {
       opacity: 0.5;
       cursor: default;
     }
     ```
   - En el bloque de `.group-panel__filter` (el último de los tres, tal y como ya hace el comentario existente sobre ese bloque), añadir un comentario equivalente indicando que estas reglas replican las de `.component-panel__filter-clear`/`.resource-panel__filter-clear`, en vez de repetir la explicación completa.

## (d) Cambios en estilo

`STYLE_BIBLE.md` no necesita ninguna sección nueva: el botón sigue al pie de la letra el patrón "botón icono-solo" ya documentado en la sección 9 (SVG `stroke="currentColor"`, `title`/`aria-label`, sin texto visible) y usa únicamente variables ya existentes (`--border-neutral`, `--radius-sm`, `--text-muted`, `--bg-hover`, `--text-primary`, `--transition-fast`). No se detectó ninguna incongruencia entre `STYLE_BIBLE.md` y el código durante el análisis técnico.

## (e) Verificación

1. Abrir el modo edición y comprobar que, en las tres ventanas (Componentes, Recursos y Grupos), aparece el botón "×" junto al campo de filtro, siempre visible incluso con el campo vacío (con aspecto atenuado, `opacity: 0.5`, mientras esté vacío).
2. En cualquiera de las tres ventanas, escribir texto en el filtro (la lista se reduce como ya ocurría antes de este cambio) y comprobar que el botón deja de verse atenuado.
3. Pulsar el botón con texto escrito: el campo queda vacío y la lista vuelve a mostrar todos los elementos sin filtrar, en la misma ventana.
4. Pulsar el botón con el campo ya vacío: no pasa nada (ni error en consola, ni cambios visibles).
5. Repetir los pasos 1-4 en las otras dos ventanas para confirmar que el comportamiento es idéntico en las tres.
6. Comprobar que el resto de funcionalidad de filtro/ordenación por columna (menú de cabecera, `columnFilters`/`columnSort`) sigue funcionando igual que antes de este cambio.
