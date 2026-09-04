- **Name**: Añadir "Forma" al orden fijo de secciones de la pestaña Apariencia
- **Code**: 00255
- **Type**: change
- **Creation date**: 2026-09-04

## Full description

En el modal de alta/edición de un componente, la pestaña **Apariencia** agrupa las secciones que configuran el aspecto del componente. Ya existe un orden fijo para esas secciones (Estilo, Borde, Extrusión, Efecto). Este cambio amplía ese orden intercalando la sección **Forma**, de modo que el orden pasa a ser, de arriba a abajo:

1. Estilo
2. Forma
3. Borde
4. Extrusión
5. Efecto

Comportamiento esperado:

- Cuando un tipo de componente muestre varias de esas secciones en la pestaña Apariencia, aparecen siempre en ese orden relativo.
- Un tipo que no tenga alguna de esas secciones simplemente no la muestra (no deja hueco); las que sí tenga respetan el orden.
- El resto de secciones de la pestaña que no forman parte de esa lista (por ejemplo Tamaño) mantienen la posición que ya tenían.
- Hoy la sección "Estilo" solo la muestra el tipo Dado y la sección "Forma" solo la muestra el tipo Mazo, así que Estilo y Forma no coinciden en un mismo modal por ahora; aun así, su orden relativo queda definido para el futuro.
- La sección "Forma" contiene los campos "Forma" y "Orientación" (Orientación se oculta cuando la forma elegida es circular).

### Dudas de alcance resueltas con el usuario

- **Secciones "Cartas reveladas" e "Imagen" del Mazo**: durante el análisis se comprobó, y el usuario lo confirmó, que **no** están en la pestaña Apariencia sino en la pestaña **Específicas**. Se quedan en Específicas y no se tocan. La única sección del Mazo que está en la pestaña Apariencia es "Forma".
- **Ficha funcional "Alta/edición/borrado de componentes con modal de tabs"**: el usuario pide que, además del catálogo, se añada a esa ficha una frase que fije explícitamente el orden de secciones de la pestaña de aspecto (Estilo, Forma, Borde, Extrusión, Efecto).
- **Textos de interfaz**: no hacen falta rótulos nuevos; "Forma" ya existe como rótulo.

### Actualización de documentación incluida en el alcance de este cambio

Este cambio deja actualizada la documentación funcional afectada:

- **Ficha "Catálogo de propiedades de componentes, grupos y etiquetas"**: hoy documenta la sección "Forma" del Mazo (campos Forma y Orientación) dentro de la pestaña "Específicas". Debe recolocarse a la pestaña "Apariencia" de forma coherente en todas las representaciones de la ficha (la tabla de catálogo de elementos, la tabla de posición por componente, el diagrama de árbol de pestañas/secciones y las notas de lectura), y reflejar el nuevo orden de secciones de la pestaña Apariencia: Estilo, Forma, Borde, Extrusión, Efecto. Las secciones "Cartas reveladas" e "Imagen" del Mazo no se tocan (ya figuran correctamente en Específicas).
- **Ficha "Alta/edición/borrado de componentes con modal de tabs"**: añadir en la descripción de la pestaña de aspecto una frase que fije el orden de sus secciones: Estilo, Forma, Borde, Extrusión, Efecto.

## Technical notes

- Fichero de código: `src/ui/componentModal.js`, función `openComponentModal`.
- Ya existe (cambio 00253, en `implemented`) un bloque colocado justo después de la llamada a `renderSpecificTab()` que reordena los `<fieldset>` hijos directos del contenedor de la pestaña Apariencia (`visualContent`), identificándolos por el texto propio de su `<legend>` mediante un `Map` texto→rango: hoy `t('componentModal.styleLegend')` ("Estilo")→0, `t('common.border')` ("Borde")→1, `t('componentModal.extrusionLegend')` / `t('componentModal.borderLegend.extrusion')` ("Extrusión")→2, `t('common.visual')` ("Efecto")→3. La ampliación natural es añadir `t('componentModal.shapeLegend')` ("Forma")→1 y desplazar Borde→2, Extrusión→3, Efecto→4. No crear un segundo mecanismo de ordenación.
- La sección "Forma" del Mazo se añade a `visualContent` (pestaña Apariencia) en `renderMazoSpecificFields` mediante `visualContainer.appendChild(formaSection)`. En cambio `revealSection` ("Cartas reveladas") e `imagenSection` ("Imagen") se añaden a `container` (pestaña Específicas), no a Apariencia.
- **Inconsistencia doc-código detectada** (manda el código): la ficha de features "Catálogo de propiedades de componentes, grupos y etiquetas" ubica la sección "Forma" del Mazo en la pestaña "Específicas" cuando el código la pinta en "Apariencia". Este cambio la corrige como parte de su alcance.
- Hay trabajo en curso sin commitear en varias fichas de documentación (cambios 00251 y 00252) que reestructura esta zona del modal; al editar la documentación no descartar ni pisar esos cambios.
