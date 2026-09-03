- **Name**: Completar la traducción de textos que el multi-idioma dejó sin traducir
- **Code**: 00245
- **Type**: fix
- **Creation date**: 2026-09-03

## Full description

Tras implementar la aplicación multi-idioma (cambio 00244), varios textos de la interfaz siguen apareciendo siempre en español y no cambian al seleccionar inglés en el panel de configuración. Se ven en español dentro de una interfaz que por lo demás está en inglés.

Textos afectados detectados (a partir de capturas del usuario y una revisión del resto de la interfaz):

- **Cabeceras de las tablas** de los tres paneles flotantes de modo edición: en el panel de Componentes («Orden», «Id», «Tipo», «Copia», «Acciones»), en el de Recursos («Nombre», «Usos», «Tipo», «Acciones») y en el de Etiquetas («Nombre», «Elementos», «Acciones»).
- **Pestañas del modal de propiedades de un componente**: «Generales», «Visuales», «Específicas», «Copias»; y el título del propio modal («Editar propiedades del componente» / «Crear componente»).
- **Títulos de sección** dentro de varios modales: «Borde», «Extrusión».
- **Contenidos de menús desplegables y de acciones**: el menú «+ Añadir recurso» («Subir fichero», «Subir varios ficheros», «Subir carpeta» y su nota aclaratoria), el menú «Añadir elemento» del editor visual («Imagen de fondo…», «Color de fondo…», «Cuadro de texto», «Figura geométrica»), y el desplegable de asignar etiqueta del menú contextual («Elegir etiqueta…» / «Sin etiquetas»).
- **Textos de ayuda contextual** (el icono «?» que abre una explicación) en el modal de componente, el de copia, el de grupo y el de título de componente.
- **Botones de zoom** en el editor de un recurso de imagen: «Ampliar», «Reducir», «Restablecer vista».
- **Títulos de sub-ventanas**: «Elegir imagen», «Diseñar carta», «Diseñar tablero personalizado».
- **Botón de maximizar/restaurar** del editor visual: «Maximizar» / «Restaurar tamaño».
- **Informe de importación** (el que aparece al terminar una importación con referencias arregladas automáticamente): sus cabeceras de columna («Componente afectado», «Error», «Solución», «Elemento erróneo/faltante»), los textos de tipo de error («Recurso no incluido», «Etiqueta no incluida», «Nombre de etiqueta duplicado») y los textos de solución.
- **Mensajes de error al convertir fichas antiguas** durante una importación.
- **Mensaje de fichero no válido** al fallar la lectura de un fichero de importación («El fichero no contiene un listado de componentes válido»).
- **Valores puntuales mostrados como texto**: «Sí»/«No» (columna y modal de copias), «Grupo» (tipo mostrado para una fila de grupo), «Por defecto» (nombre de tipografía cuando no hay ninguna elegida), «Carta revelada» (texto por defecto de la zona de revelado de un mazo), y los nombres de tipo de componente que se muestran al identificar un elemento («Texto», «Tablero simple», «Documento», etc.).
- **Tooltip del botón «Pegar estilo»** cuando no hay estilo copiado.
- **Título del modal de etiqueta** («Nueva etiqueta» / «Etiqueta: …») y el del modal de reemplazo de recurso duplicado.

### Comportamiento esperado

Todos esos textos deben mostrarse en el **idioma activo**, igual que el resto de la interfaz, y cambiar al instante cuando el usuario cambia el idioma en el panel de configuración. Es completar la cobertura de traducción que el cambio 00244 dejó incompleta; **no cambia ningún comportamiento** de la aplicación.

## Technical notes

- **Causa raíz**: literales de UI en español que quedaron sin pasar por la función `t()` de `src/core/i18n.js` al implementar el cambio 00244. No es un fallo del sistema i18n (que funciona), solo cobertura incompleta.
- **Ficheros con literales pendientes** (~20):
  - `src/ui/componentList.js` — `headLabels` (línea ~148); `type: 'Grupo'` (línea ~68); `getValue` `'Sí'`/`'No'` de la columna `copia` (línea ~24).
  - `src/ui/resourceList.js` — `headLabels` (línea ~73); `addItem('Subir fichero')` / `'Subir varios ficheros'` / `'Subir carpeta'` + nota (líneas ~197-199).
  - `src/ui/tagList.js` — `headLabels` (línea ~64).
  - `src/ui/componentModal.js` — `header` `'Editar propiedades del componente'`/`'Crear componente'` (línea ~283); `createTab(...)` con `'Generales'`/`'Visuales'`/`'Específicas'`/`'Copias'` (líneas ~333/338/939/943); `createTextNode('Extrusión')` (~665), `createTextNode('Borde')` (~1226); `textoCartaRevelada` default `'Carta revelada'` (~163); `fontCurrentName` `'Por defecto'` (~1489); `title` `'Diseñar tablero personalizado'` (~1674) / `'Diseñar carta'` (~1727) / `'Elegir imagen'` (~2080); `pasteStyleBtn.title` `'Pegar estilo (nada copiado)'` (~1807); textos de `createHelpIcon({ text })`.
  - `src/ui/cardShapeModal.js` — `createTextNode('Borde')` (~341); `title` `'Elegir imagen'` (~276).
  - `src/ui/cardTextBoxModal.js` — `createTextNode('Borde')` (~302); `fontCurrentName` `'Por defecto'` (~60).
  - `src/ui/componentRenderer.js` — mapa de nombres de tipo (`{ texto: 'Texto', tableroSimple: 'Tablero simple', dado: 'Dado Configurable', documento: 'Documento', carta: 'Carta/Ficha', mazo: 'Mazo' }`, ~línea 259); `textoCartaRevelada` fallback `'Carta revelada'` (~540). Ya importa `t`.
  - `src/ui/contextMenu.js` — `placeholder` `'Sin etiquetas'`/`'Elegir etiqueta…'` (~61).
  - `src/ui/elementSelectionModal.js` — `title` `'Componentes'`/`'Recursos'`/`'Etiquetas'` de los bloques del checklist (líneas ~23-25).
  - `src/ui/importReportModal.js` — `ERROR_LABELS` (mapa de módulo, líneas ~7-11); cabeceras de columna literales (línea ~34).
  - `src/ui/resourceModal.js` — `createZoomButton('Ampliar')` / `'Reducir'` / `'Restablecer vista'` (líneas ~127-129).
  - `src/ui/resourceReplaceConfirmModal.js` — `header` `'Recurso duplicado'`/`'Recursos duplicados'` (~16).
  - `src/ui/tagModal.js` — `header` `` `Etiqueta: ${tag.name}` `` / `'Nueva etiqueta'` (~20).
  - `src/ui/visualEditorModal.js` — `addItem('Imagen de fondo…')` / `'Color de fondo…'` / `'Cuadro de texto'` / `'Figura geométrica'` (líneas ~210-213); `label` `'Maximizar'`/`'Restaurar tamaño'` (~419); `label` `'Diseño'` (~745); `title` `'Elegir imagen'` (~1024).
  - `src/ui/componentCopiesModal.js` — `text` `'Sí'`/`'No'` (~78).
  - `src/ui/componentTitleModal.js`, `src/ui/copyComponentModal.js`, `src/ui/groupModal.js` — textos de `createHelpIcon({ text })`.
  - `src/modes/edit/editMode.js` — `type: 'Grupo'` (~línea 418).
  - `src/core/importMerge.js` — `solucion: '...'` (líneas ~222/239/261/272).
  - `src/core/fichaMigration.js` — `errors.push('...')` (líneas ~35/46/65).
  - `src/core/persistence.js` — `detail: 'El fichero no contiene un listado de componentes válido.'` (línea ~78).
- **Patrón a seguir**: idéntico al de 00244 — `import { t } from '../core/i18n.js'` (ruta relativa según la capa), sustituir el literal por `t('clave')`, y añadir la clave a `src/data/i18n.es.js` (texto español actual) y `src/data/i18n.en.js` (traducción), con prefijos de dominio coherentes con las claves ya existentes.
- `headLabels` es un objeto literal dentro de la función de render de cada panel, se re-crea en cada render → un `t()` directo vale (sigue el idioma activo en cada repintado por `language:changed`).
- **Mapas de módulo a nivel de fichero** (`ERROR_LABELS` en `importReportModal.js`, el mapa de nombres de tipo en `componentRenderer.js`): o se convierten a getters (como `MAZO_*` en `componentModal.js`), o se resuelven con `t()` en el punto de consumo.
- Los textos de `createHelpIcon` se asignan con `content.textContent` en `ui/helpIcon.js` (texto plano), sin riesgo de inyección.
- `src/core/importMerge.js`, `src/core/fichaMigration.js`, `src/core/persistence.js`: importar `t` desde `./i18n.js` (mismo directorio `core/`). Sin ciclo — `i18n.js` solo importa `eventBus.js`, `appTitle.js` y los dos catálogos (datos puros); importarlo desde otros `core/` ya se hace (`textSort.js`, `resource.js`, `cardProportions.js`, `interactions.js`, `styleClipboard.js`).
- Documentación: los ficheros de features 038 y 039 y los de estilo **no** necesitan cambio de contenido (describen el comportamiento, no la lista exacta de textos); este fix solo completa la cobertura de traducción.
- Sin cambio de comportamiento, sin cambio de firmas públicas, sin tocar el objeto de estado, la persistencia (`bgfactory:state`) ni el formato de export/import JSON.
- **Seguridad** (client hardening): cubierto — texto por `textContent`/`createTextNode`, catálogos son datos del proyecto, sin entrada de usuario concatenada en claves.
