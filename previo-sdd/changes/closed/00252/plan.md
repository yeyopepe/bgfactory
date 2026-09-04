- **Creation date**: 2026-09-04
- **Risk**: 1/10 — Minimal risk — local change, with a safety net (tests) or easily reversible

## (a) Functional notes

**Out of scope:** No se toca ninguna otra sección ni pestaña del modal. La sección "Extrusión" no cambia de nombre ni de contenido. Las secciones "Borde" y de fondo/patrón de los tableros, y la sección "Estilo" del dado, no se reordenan. Ningún tipo de componente distinto de Texto, Tablero simple y Tablero personalizado se ve afectado. No se modifica ninguna propiedad del modelo de componente ni la persistencia.

**Doubts resolved with the user:**
- Idioma inglés → pestaña `'Appearance'`, sección `'Effect'`.
- Alcance de "Efecto" → se renombra la clave i18n `common.visual` (afecta a las 3 secciones que la usan), no se crean claves nuevas.
- Reordenamiento → solo se adelanta la sección "Efecto", y solo en los tipos donde existe; el resto de secciones específicas del tipo se quedan donde están.

## (b) Technical solution

- [x] **`src/data/i18n.es.js` — renombrar los dos literales.** En `CATALOG_ES`: cambiar `'componentModal.tab.visual': 'Visuales'` → `'componentModal.tab.visual': 'Apariencia'` (~línea 548) y `'common.visual': 'Visual'` → `'common.visual': 'Efecto'` (~línea 33). No tocar `'componentModal.extrusionLegend'` ni `'componentModal.borderLegend.extrusion'`.
- [x] **`src/data/i18n.en.js` — renombrar los dos literales.** En `CATALOG_EN`: cambiar `'componentModal.tab.visual': 'Visual'` → `'componentModal.tab.visual': 'Appearance'` (~línea 550) y `'common.visual': 'Visual'` → `'common.visual': 'Effect'` (~línea 35).
- [x] **`src/ui/componentModal.js` — reordenar la sección "Efecto" antes de "Extrusión".** La sección `extrusionSection` se construye y se añade con `visualContent.appendChild(extrusionSection)` (~línea 709). Mantener esa referencia `extrusionSection` accesible en el ámbito donde se renderizan las secciones "Efecto" (ya lo está: es una `const` local de la función que crea el modal, visible desde `renderSpecificTab` y sus funciones internas). Sustituir los tres `appendChild` de las secciones "Efecto" por `insertBefore` respecto a `extrusionSection`:
  - Tipo `texto` (~línea 1143): `visualContent.appendChild(textoVisualSection)` → `visualContent.insertBefore(textoVisualSection, extrusionSection)`.
  - `renderBoardSpecificFields` / tipo `tableroSimple` (~línea 1219): `visualContainer.appendChild(visualSection)` → `visualContainer.insertBefore(visualSection, extrusionSection)`.
  - `renderTableroPersonalizadoSpecificFields` / tipo `tableroPersonalizado` (~línea 1667): `visualContainer.appendChild(visualSection)` → `visualContainer.insertBefore(visualSection, extrusionSection)`.

  `visualContainer` es siempre `visualContent` (se pasa como argumento desde `renderSpecificTab`), y `extrusionSection` ya está insertada en `visualContent` antes de que se ejecute `renderSpecificTab`, así que `insertBefore` es válido. Las demás secciones que esas funciones añaden después (`borderSection`, `bgSection`, botón de edición de diseño...) se dejan con `appendChild` tal cual: seguirán quedando tras "Extrusión".
- [x] **`previo-sdd/design/docs/architecture/006-ui-layer.md` — actualizar la descripción de `ui/componentModal.js`.** En el bloque que enumera las 4 pestañas: la pestaña `visual` pasa a mostrarse como "Apariencia" (no "Visuales"); en la descripción de esa pestaña, la sección "Visual" pasa a llamarse "Efecto" y su posición pasa a ser antes de "Extrusión" (en los tipos `tableroSimple`/`tableroPersonalizado`/`texto`). El identificador interno de pestaña sigue siendo `visual` y la clave i18n sigue siendo `componentModal.tab.*`.
- [x] **`previo-sdd/design/docs/features/040-catalogo-de-propiedades-de-componentes-grupos-y-etiquetas.md` — actualizar el catálogo.** Donde nombre la pestaña "Visuales" → "Apariencia"; donde nombre la sección "Visual" → "Efecto"; ajustar el orden de pantalla documentado para que "Efecto" figure antes de "Extrusión" en los tipos Texto, Tablero simple y Tablero personalizado.

## (c) Architecture changes

`previo-sdd/design/docs/architecture/006-ui-layer.md`: en la descripción del módulo `ui/componentModal.js`, actualizar el nombre visible de la pestaña (`"Visuales"` → `"Apariencia"`), el nombre de la sección (`"Visual"` → `"Efecto"`) y su posición relativa (pasa a ir antes de `"Extrusión"` en los tipos que la tienen). Detalle en la tarea correspondiente de la sección (b).

## (d) Style changes

`previo-sdd/design/docs/features/040-catalogo-de-propiedades-de-componentes-grupos-y-etiquetas.md`: aunque es un fichero de `featuresDocPathDir` (catálogo funcional), contiene el orden de pantalla y los nombres de pestaña/sección; actualizar los tres puntos (nombre de pestaña, nombre de sección, orden). No hay cambios reales de tokens ni de estilo visual: `styleBibleDocDir` no necesita cambios.

## (e) Verification

- [x] Abrir el modal de un componente de tipo **Texto** (doble clic sobre él en modo edición). La segunda pestaña se titula **"Apariencia"**. Dentro, el orden de secciones es: **Tamaño → Efecto → Borde y extrusión**. La sección de fuente/color de texto/color de fondo se titula **"Efecto"** y está antes de "Borde y extrusión". *(Verificado por inspección de código: `visualContent.appendChild(sizeSection)` → `insertBefore(textoVisualSection, extrusionSection)` → `extrusionSection` ya presente.)*
- [x] Abrir el modal de un componente de tipo **Tablero simple**. Pestaña "Apariencia": orden **Tamaño → Efecto (biselado / sombra) → Extrusión → Borde → Fondo**. La sección "Efecto" (biselado/sombra) aparece antes de "Extrusión". *(Verificado: `insertBefore(visualSection, extrusionSection)` seguido de `appendChild(borderSection)` y `appendChild(bgSection)`.)*
- [x] Abrir el modal de un componente de tipo **Tablero personalizado**. Pestaña "Apariencia": orden **Tamaño → Efecto (biselado / sombra) → Extrusión**, con "Efecto" antes de "Extrusión". *(Verificado: `insertBefore(visualSection, extrusionSection)`; el botón de edición de diseño va a `specificContent`.)*
- [x] Abrir el modal de un componente de tipo **Dado** y de tipo **Documento** / **Carta** / **Mazo**: la pestaña se titula "Apariencia"; no aparece ninguna sección "Efecto"; la sección "Extrusión" (y "Estilo" en el dado) queda en la misma posición que antes del cambio. *(Verificado: ninguno de estos tipos llama a `insertBefore` con una sección "Efecto"; `mazo` usa `appendChild(formaSection)` tras "Extrusión", igual que antes.)*
- [x] Cambiar el idioma de la aplicación a inglés (Configuración → idioma), reabrir el modal: la pestaña se titula **"Appearance"** y la sección **"Effect"**. *(Verificado: `i18n.en.js` → `componentModal.tab.visual: 'Appearance'`, `common.visual: 'Effect'`.)*
- [x] Los checkboxes "Biselado en el borde" y "Sombra" dentro de "Efecto" siguen funcionando (marcar/desmarcar y aceptar refleja el cambio en el componente al reabrir). *(Verificado: los `addEventListener('change', ...)` sobre `props.biselado`/`props.sombra` no se han tocado; solo cambió el contenedor donde se inserta el `fieldset`.)*
