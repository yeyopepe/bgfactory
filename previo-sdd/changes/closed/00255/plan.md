- **Creation date**: 2026-09-04
- **Risk**: 1/10 — Riesgo mínimo: cambio local, sin red de seguridad (tests) pero trivialmente reversible

## (a) Functional notes

**Out of scope:**

- No se toca qué secciones tiene cada tipo de componente en la pestaña Apariencia, ni el contenido de ninguna sección, ni la pestaña "Específicas".
- Las secciones "Cartas reveladas" e "Imagen" del Mazo se quedan en la pestaña "Específicas" (ya están correctamente ahí en código y en la ficha 040); no se recolocan.
- No se reescribe por completo la documentación desactualizada por el cambio 00253 (la frase de `architecture/006-ui-layer.md` y `style/003-modales-menus.md` que describe el orden de "Efecto" vía `insertBefore(section, extrusionSection)` — mecanismo ya sustituido en 00253 por el bloque de reordenación por `<legend>`). Solo se actualiza la parte de esas frases que afecta al **orden de secciones** de la pestaña Apariencia (para reflejar Estilo → Forma → Borde → Extrusión → Efecto), no todo el resto de detalle de implementación de 00252/00253.
- No hacen falta claves i18n nuevas: `componentModal.shapeLegend` ("Forma" / "Shape") ya existe.

**Doubts resolved with the user:**

- ¿"Cartas reveladas" e "Imagen" del Mazo están en Apariencia? → No: el usuario confirmó (y se verificó en código) que están en "Específicas". Solo "Forma" del Mazo está en la pestaña Apariencia.
- ¿Se amplía también la ficha 002 con el orden explícito de secciones? → Sí: añadir a la ficha 002 una frase que fije el orden Estilo → Forma → Borde → Extrusión → Efecto.

## (b) Technical solution

- [x] **`src/ui/componentModal.js` — añadir "Forma" al `Map` de rangos del bloque de reordenación de la pestaña Apariencia.** En `openComponentModal`, en el bloque colocado tras `renderSpecificTab()` (introducido por el cambio 00253), la constante `rankByLegend` es hoy:
  ```js
  const rankByLegend = new Map([
    [t('componentModal.styleLegend'), 0],
    [t('common.border'), 1],
    [t('componentModal.extrusionLegend'), 2],
    [t('componentModal.borderLegend.extrusion'), 2],
    [t('common.visual'), 3],
  ]);
  ```
  Cambiarla a:
  ```js
  const rankByLegend = new Map([
    [t('componentModal.styleLegend'), 0],
    [t('componentModal.shapeLegend'), 1],
    [t('common.border'), 2],
    [t('componentModal.extrusionLegend'), 3],
    [t('componentModal.borderLegend.extrusion'), 3],
    [t('common.visual'), 4],
  ]);
  ```
  Es decir: "Forma" (`componentModal.shapeLegend`) entra con rango 1, y "Borde"/"Extrusión"/"Efecto" bajan a 2/3/4. No hay que tocar `rank()`, `managed`, el mecanismo de marcadores de comentario ni el `sort` — siguen valiendo tal cual.
- [x] **`src/ui/componentModal.js` — actualizar el comentario del bloque.** El comentario que precede al bloque enumera hoy "Estilo, Borde, Extrusión, Efecto" (dos veces: la línea de cabecera y la mención a "el resto de secciones (Tamaño, fondo, Forma…)"). Ajustarlo para que el orden que cita sea "Estilo, Forma, Borde, Extrusión, Efecto" y quitar "Forma" de la lista de "secciones que se mantienen en su sitio" (ahora sí la gestiona la regla); dejar ahí "Tamaño, fondo, Cartas reveladas, Imagen…" como ejemplos de secciones no gestionadas.
- [x] **`previo-sdd/design/docs/features/040-catalogo-de-propiedades-de-componentes-grupos-y-etiquetas.md` — recolocar la sección "Forma" del Mazo de "Específicas" a "Apariencia" y reflejar el nuevo orden.** Cambios concretos:
  - **Diagrama Mermaid de árbol** (bloque ```mermaid al principio): en `subgraph SG_VIS [Apariencia]`, la lista de secciones bajo `T2` pasa a incluir "Forma" entre "Estilo" y "Borde" — nuevo orden de nodos: `V_S2 {{"Sección: Estilo (solo dado)"}}` → nodo nuevo `V_S_FORMA {{"Sección: Forma (solo mazo)"}}` con hijos `["Forma"]` y `["Orientación"]` → `V_S5 {{"Sección: Borde ..."}}` → `V_S4 {{"Sección: Extrusión"}}` → `V_S3 {{"Sección: Efecto ..."}}`. En `subgraph SG_ESP`, quitar de la línea del mazo (`E_MA["mazo: Forma, Cartas reveladas, Imagen, Ver contenido del mazo"]`) la palabra "Forma" y eliminar el nodo `E_MA --> E_MA1["Forma: Forma, Orientación"]` (dejando `E_MA2` "Cartas reveladas" y `E_MA3` "Imagen").
  - **Tabla A → "## Pestaña "Apariencia""**: insertar las filas de la sección "Forma" (sección + campos "Forma" y "Orientación") en su nueva posición del orden (tras "Estilo", antes de "Efecto"/"Extrusión"/"Borde" según corresponda a la numeración `Pos.`). "Aparece en" = Mazo; "Visible cuando…" = tipo = Mazo; notas técnicas: i18n `componentModal.shapeLegend` (sección), `componentModal.shapeLabel` / propiedad `properties.forma` (campo Forma), `componentModal.orientationLabel` / propiedad `properties.orientacion`, "Orientación se oculta si la forma es circular". Renumerar `Pos.` de esa tabla para dejar el orden real: Tamaño → Estilo → Forma → Efecto → Extrusión → Borde (el orden vertical de la *columna* refleja "si todas estuvieran presentes"; la sección "Forma" del grupo ordenado va tras "Estilo").
  - **Tabla A → "### Mazo" (dentro de "## Pestaña "Específicas"")**: eliminar las filas 1–3 actuales ("Forma" sección, "Forma" campo, "Orientación") y renumerar el resto del bloque del mazo (Cartas reveladas pasa a ser la sección 1, etc.). Actualizar el `> Nota` de esa subsección si menciona "Forma".
  - **Nota bajo la tabla de la pestaña Apariencia** (el `> Nota:` que hoy dice "las secciones "Estilo" (dado), "Efecto" (texto y tableros) y "Borde" (tableros)…"): añadir "Forma" (mazo) a la enumeración y dejar constancia del orden del grupo: Estilo → Forma → Borde → Extrusión → Efecto.
  - **Tabla B → "## Pestaña "Apariencia""**: añadir las filas de la sección "Forma" (🔽 Forma *(sección — mazo)* y sus campos Forma/Orientación) con la posición correspondiente en la columna "Mazo" y "—" en el resto de tipos. Ajustar el texto introductorio de esa subsección (hoy: "Tamaño (posiciones 1–4) … La sección "Efecto" va antes de "Extrusión"; la sección "Borde" … va después") para mencionar también "Forma".
  - **Tabla B → "## Pestaña "Específicas""**: eliminar el bloque `🔽 Forma *(sección)*` / `Forma` / `Orientación` de la columna Mazo y renumerar las posiciones del resto del bloque "— Mazo —" (Cartas reveladas pasa a posición 1, Disposición a 2, etc.; recalcular los huecos que hoy documenta la nota "las posiciones 6 y 10 las ocupan…").
  - **"## Notas de lectura"** (al final de la Tabla B): revisar la frase "Cuando un tipo no tiene ninguna fila específica en una sección, esa sección simplemente no se pinta y las siguientes suben." — sigue valiendo; solo revisar que ningún ejemplo cite "Forma" como de Específicas.
- [x] **`previo-sdd/design/docs/features/002-alta-edicion-borrado-de-componentes-con-modal-de-tabs.md` — fijar el orden de secciones de la pestaña de aspecto.** En el bloque **"Pestaña "Visuales""** (líneas ~11–15), añadir una frase que fije explícitamente el orden de sus secciones: "Las secciones de esta pestaña se muestran siempre en este orden, de arriba a abajo: **Estilo** (solo Dado), **Forma** (solo Mazo), **Borde** (tableros), **Extrusión** (todos) y **Efecto** (Cuadro de texto y tableros); "Tamaño" va siempre la primera, antes de ese grupo. Un tipo que no tenga alguna de esas secciones simplemente no la muestra." Mantener el resto del texto de esa sección tal cual. No tocar otras partes de la ficha (hay trabajo sin commitear de 00251/00252).
- [x] **`src/ui/componentModal.js` — verificación de sintaxis.** Tras los cambios, `node --check src/ui/componentModal.js` debe pasar sin error.

## (c) Architecture changes

`previo-sdd/design/docs/architecture/006-ui-layer.md` — en la entrada de **`ui/componentModal.js`**, viñeta `"Apariencia"` (hoy atribuida a "00252"): la frase **"Section order"** describe el mecanismo `visualContent.insertBefore(section, extrusionSection)` y el orden "Efecto antes de Extrusión; Borde después de Extrusión". Actualizar esa frase para reflejar:
- que el orden de secciones de la pestaña es **Estilo → Forma → Borde → Extrusión → Efecto** (grupo ordenado; "Tamaño" primero, fuera del grupo), aplicado por el bloque de reordenación por texto de `<legend>` que corre tras `renderSpecificTab()` (introducido en 00253 y ampliado en 00255 con "Forma"), no ya por `insertBefore` disperso;
- que la sección **"Forma"** (`'mazo'`: `properties.forma`/`orientacion`) se pinta en la pestaña "Apariencia" (vía `renderMazoSpecificFields`'s `visualContainer.appendChild`), mientras que "Cartas reveladas" e "Imagen" del mazo se pintan en "Específicas".
Mantener el resto de la viñeta. (Nota: esta frase ya venía parcialmente desactualizada por 00253; 00255 la corrige solo en lo relativo al orden de secciones y a la ubicación de "Forma", que es lo que este cambio toca.)

## (d) Style changes

`previo-sdd/design/docs/style/003-modales-menus.md` — sección **"Uses of the pattern"** (líneas ~225–231):
- En las viñetas de `ui/componentModal.js` para `'tableroSimple'`/`'tableroPersonalizado'`/`'texto'`, la posición de "Efecto" se describe como "after "Tamaño", before "Extrusión"" con `insertBefore`. Ajustar para referirse al orden de grupo **Estilo → Forma → Borde → Extrusión → Efecto** de la pestaña "Apariencia" (sin reescribir todo el detalle de 00252).
- En la viñeta de `ui/componentModal.js` para `'mazo'` (línea ~231), precisar que la sección **"Forma"** vive en la pestaña **"Apariencia"** (dentro de ese orden de grupo), mientras que "Cartas reveladas" e "Imagen" viven en la pestaña **"Específicas"**.

## (e) Verification

- [x] Abrir el modal de edición de un componente de tipo **Mazo**, pestaña "Apariencia": la sección "Forma" (con los campos Forma y Orientación) aparece **después** de "Tamaño" y **antes** de "Extrusión". La pestaña "Específicas" del mismo Mazo sigue mostrando "Cartas reveladas" e "Imagen" (y "Ver contenido del mazo"), sin "Forma". — Verificado por inspección: en `visualContent` el Mazo tiene `sizeSection` (legend "Tamaño", rank -1), `extrusionSection` (rank 3) y `formaSection` (`formaSectionLegend.textContent = t('componentModal.shapeLegend')` → "Forma", rank 1); `managed` = [extrusion, forma], `sorted` por rank = [forma, extrusion] → Forma antes de Extrusión. `revealSection`/`imagenSection` se añaden a `container` (Específicas), no a `visualContent`.
- [x] Abrir el modal de un **Tablero simple**, pestaña "Apariencia": el orden real del grupo es Tamaño → **Borde → Extrusión → Efecto** (los tipos sin "Estilo"/"Forma" no dejan hueco). — Verificado por inspección: `managed` = [visualSection/"Efecto" (rank 4), extrusionSection (rank 3), borderSection ("Borde", rank 2)]; `sorted` = [Borde, Extrusión, Efecto]. `bgSection` (sin `<legend>`, rank -1) se queda en su sitio. (La redacción original de este check en el plan citaba mal el orden como "Efecto → Borde → Extrusión"; el orden correcto e implementado es Borde → Extrusión → Efecto, coherente con Estilo → Forma → Borde → Extrusión → Efecto.)
- [x] Abrir el modal de un **Dado**, pestaña "Apariencia": "Estilo" sigue apareciendo tras "Tamaño" y antes de "Extrusión"; no aparece "Forma". — Verificado por inspección: `managed` = [dadoStyleSection ("Estilo", rank 0), extrusionSection (rank 3)]; `sorted` = [Estilo, Extrusión].
- [x] Abrir el modal de un **Cuadro de texto** y de un **Visor de documentos**: no hay regresión. — Verificado por inspección: Texto → `managed` = [textoVisualSection ("Efecto", rank 4), extrusionSection ("Extrusión" por filtro de nodos de texto del `<legend>`, rank 3)] → `sorted` = [Extrusión, Efecto], sin cambio respecto al orden previo. Documento → solo `sizeSection` y `extrusionSection` en `visualContent`; `managed.length === 1` → `if (managed.length > 1)` es falso → no se reordena nada (no-op).
- [x] `node --check src/ui/componentModal.js` pasa sin error. — Ejecutado: "SYNTAX OK".
- [x] La ficha 040 ya no ubica la sección "Forma" del Mazo en la pestaña "Específicas" en ninguna de sus representaciones (diagrama de árbol, Tabla A, Tabla B, notas); y refleja el orden Estilo → Forma → Borde → Extrusión → Efecto en la pestaña "Apariencia". — Verificado: `subgraph SG_ESP` del diagrama, bloque "### Mazo" de Tabla A y bloque "— Mazo —" de Tabla B "Específicas" ya no listan "Forma"; el diagrama `SG_VIS`, Tabla A "Pestaña Apariencia" (con nota de orden) y Tabla B "Pestaña Apariencia" reflejan el nuevo orden.
- [x] La ficha 002 incluye, en la descripción de la pestaña de aspecto, la frase que fija el orden de secciones Estilo → Forma → Borde → Extrusión → Efecto. — Verificado: párrafo añadido tras la viñeta de "Controles visuales específicos por tipo".
