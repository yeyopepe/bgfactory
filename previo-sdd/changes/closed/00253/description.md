- **Name**: Orden fijo de las secciones de la pestaña Apariencia
- **Code**: 00253
- **Type**: fast
- **Creation date**: 2026-09-04

## Full description

En el modal de alta/edición de un componente, la pestaña **Apariencia** agrupa varias secciones que configuran el aspecto del componente. Según el tipo de componente esas secciones aparecían en un orden distinto y poco predecible, porque cada tipo de componente construye su propio subconjunto de secciones.

El orden de las secciones de la pestaña Apariencia pasa a ser siempre, de arriba a abajo, este:

1. Estilo
2. Borde
3. Extrusión
4. Efecto

Un tipo de componente que no tenga alguna de esas secciones simplemente no la muestra (no deja hueco); las que sí tenga respetan ese orden relativo. El resto de secciones de la pestaña que no forman parte de esta lista (por ejemplo Tamaño, el fondo, o Forma en el mazo) mantienen la posición que ya tenían.

## Technical notes

- Fichero afectado: `src/ui/componentModal.js`, función `openComponentModal`.
- Las secciones de la pestaña "Apariencia" (`visualContent`) se añaden desde varios sitios: directamente (`sizeSection`, `extrusionSection`, `dadoStyleSection`) y desde las funciones `renderSpecificTab` / `renderBoardSpecificFields` / `renderTableroPersonalizadoSpecificFields` / `renderDadoSpecificFields` / rama `texto`, unas con `appendChild` y otras con `insertBefore(..., extrusionSection)`.
- La ordenación se resuelve en un único punto, justo después de `renderSpecificTab()`: se localizan los `<fieldset>` hijos directos de `visualContent` cuyo `<legend>` coincide (por su texto propio, ignorando checkbox de activación e icono de ayuda) con "Estilo" (`componentModal.styleLegend`), "Borde" (`common.border`), "Extrusión" (`componentModal.extrusionLegend` o `componentModal.borderLegend.extrusion`) o "Efecto" (`common.visual`), y se reubican en esos mismos huecos en el orden objetivo mediante marcadores de comentario. Las secciones sin `<legend>` reconocido (Tamaño, fondo sin título, Forma, etc.) no se tocan.

## Applied changes

- `src/ui/componentModal.js` (`openComponentModal`): añadido un bloque de reordenación justo después de la llamada a `renderSpecificTab()`. El bloque:
  - Define un `Map` texto-de-`<legend>` → rango deseado: `t('componentModal.styleLegend')`→0, `t('common.border')`→1, `t('componentModal.extrusionLegend')`→2, `t('componentModal.borderLegend.extrusion')`→2 (variante de "Extrusión" en el tipo `texto`), `t('common.visual')`→3.
  - `rank(section)` extrae solo los nodos de texto directos del `<legend>` (así ignora el checkbox de activación de "Borde" y el icono de ayuda "?" que "Extrusión" añade en `texto`) y devuelve su rango, o `-1` si no está gestionada.
  - Toma los `<fieldset>` hijos directos de `visualContent` con `rank !== -1`, inserta un comentario-marcador en el hueco actual de cada uno, ordena las secciones por `rank` y las reinserta en los marcadores, que luego elimina. Las demás secciones (Tamaño, fondo, Forma…) no se mueven.
- Sin cambios en interfaces, flujos, respuestas ni i18n. `node --check` sobre el fichero pasa.

