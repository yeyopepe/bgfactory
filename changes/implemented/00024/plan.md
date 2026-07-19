## (a) Anotaciones funcionales

**Fuera de alcance:**
- Cambiar el mecanismo de guardado/exportación completo (`Guardar`, `buildExportHtml`/`downloadHtml`) — se reutiliza tal cual para el JSON, no se toca.
- Cualquier fusión/merge inteligente de componentes al importar — siempre es reemplazo completo, ya confirmado.
- Sustituir toasts de éxito/confirmación por el modal de error — solo migran los toasts que hoy comunican un error.

**Dudas resueltas con el usuario durante esta sesión:**
- P: ¿el JSON exportado incluye solo los componentes o también los recursos (imágenes/tipografías) que referencian? R: incluye también los recursos usados por los componentes exportados, para que las referencias (`component.image`, `properties.imagenResourceId`, etc.) no queden rotas al importar en otro navegador/versión.
- P (verificación de orden, paso 0.1): el código 00024 se creó antes que cambios ya cerrados hasta 00028. Se ha revisado el estado actual de `src/main.js`, `src/modes/edit/editMode.js`, `src/ui/editModeToggle.js`, `src/ui/toast.js`, `src/core/fileExport.js`, `src/core/persistence.js`, `src/core/state.js` y `src/ui/helpIcon.js`: nada de lo documentado en `description.md` ha sido implementado ni modificado por cambios posteriores, sigue vigente tal cual.

## (b) Solución técnica

1. **Crear `src/ui/errorModal.js`** con `showErrorModal(title, message, detail)`:
   - Reutiliza el patrón de `src/ui/helpIcon.js` (`openHelpModal`): overlay `.modal-overlay` + `.modal`, cierre con botón "Cerrar" o clic fuera.
   - Cabecera (`.modal__header`) con icono de alerta (círculo rojo con "!", usando `var(--error)`) + `title` (p.ej. "Error" o un título más específico si se pasa).
   - Cuerpo (`.modal__content`) con `message`; si se pasa `detail` (texto técnico, p.ej. el error de parseo JSON), se muestra debajo en un bloque monoespaciado como en `design_modal-error-importacion.html`.
   - Footer (`.modal__footer`) con botón "Cerrar" (clase `btn-cancel`).
   - Añadir en `src/styles/main.css` las clases necesarias para el icono de alerta de la cabecera (reutilizando `var(--error)`), siguiendo el mismo formato que las reglas `.modal*` ya existentes.

2. **Migrar los 3 usos de error existentes de `showToast` a `showErrorModal`:**
   - `src/main.js:89` — `showToast('No se ha podido recuperar el estado guardado.')` → `showErrorModal('Error', 'No se ha podido recuperar el estado guardado.')`.
   - `src/modes/edit/editMode.js:81` — `showToast('Formato de fichero no soportado.')` → `showErrorModal('Error', 'Formato de fichero no soportado.')`.
   - `src/modes/edit/editMode.js:95` — `showToast('El recurso "${resource.name}" está en uso y no se puede eliminar.')` → `showErrorModal('Error', 'El recurso "${resource.name}" está en uso y no se puede eliminar.')`.
   - Actualizar los imports de `showToast` a `showErrorModal` en esos dos ficheros (`editModeToggle.js` no se toca: su único uso, `showToast('Guardado como...')`, es confirmación de éxito, no error).

3. **Añadir validación de importación de componentes en `src/core/persistence.js`:**
   - Nueva función `parseImportedComponents(raw)` (variante de `parseState` sin la condición `parsed.version !== CURRENT_VERSION`): valida que sea JSON parseable, que tenga `components` como array y, si vienen, `resources` como array. Si algo falla, devuelve `{ error: true, detail }` con el mensaje de error concreto (mensaje de la excepción de `JSON.parse`, o descripción de qué falta).
   - Exportar también una función `buildComponentsExport(components, resources)` que arme el objeto a exportar: `{ version: CURRENT_VERSION, components, resources: recursos usados por esos componentes }`. Para calcular los recursos usados, filtrar `getResources()` por los ids referenciados en `components` (mismo criterio que `isResourceInUse` de `src/core/resource.js`: `component.image` o valores de `component.properties`).

4. **Añadir botones "Exportar" e "Importar" en `src/ui/editModeToggle.js`**, junto a "Guardar" en `renderEditToolbar`:
   - **Exportar**: `prompt('Exportar', 'errantes-componentes.json')` (mismo patrón que `saveAs`/"Guardar"); si se confirma, construye el JSON con `buildComponentsExport(getComponents(), getResources())` y lo descarga con un helper análogo a `downloadHtml` pero con `type: 'application/json'` (añadir `downloadJson(filename, data)` en `src/core/fileExport.js`, reutilizando el mismo patrón `Blob` + `<a download>`).
   - **Importar**: crea un `<input type="file" accept=".json">` oculto, dispara el diálogo al pulsar el botón. Al seleccionar fichero: leer con `FileReader`, pasar el contenido a `parseImportedComponents`.
     - Si `error`, mostrar `showErrorModal('No se ha podido importar el fichero', 'El fichero seleccionado no contiene un listado de componentes válido.', detail)`, sin tocar el estado actual.
     - Si válido, pedir confirmación con `confirm('Se reemplazarán todos los componentes actuales por los del fichero importado. ¿Continuar?')` (mismo patrón nativo que las eliminaciones ya existentes en `componentList.js`/`componentModal.js`/`editMode.js`).
       - Si se cancela, no se aplica ningún cambio.
       - Si se confirma: reemplazar componentes con `loadComponents(importedComponents)` (`src/core/state.js`, ya dispara `components:changed` → autoguardado); si el JSON traía `resources`, añadir los que no existan ya en `getResources()` (por `id`) vía `addResource`, sin tocar los recursos existentes que no vengan en el import.

## (d) Cambios en estilo

Añadir en `design/docs/stylebible/STYLE_BIBLE.md` una sección nueva (siguiendo el formato de la sección 12 "Icono de ayuda (tooltip / modal)") que documente el patrón de **modal de error**, para que cualquier error futuro en la app lo reutilice en vez de crear un tratamiento visual propio:
- Reutiliza el mismo patrón `.modal-overlay`/`.modal` ya documentado (no un patrón nuevo), con botón "Cerrar" (`.btn-cancel`) y `z-index: 1000`.
- Diferencia respecto al modal informativo genérico: cabecera con icono circular de alerta ("!") en `var(--error)` junto al título.
- Es el único punto de la app para comunicar errores: cualquier error nuevo (no solo los de importación/exportación) debe usar `ui/errorModal.js` (`showErrorModal`) en vez de `showToast` u otro aviso ad-hoc — `showToast` queda reservado a confirmaciones/avisos de éxito, no de error.
