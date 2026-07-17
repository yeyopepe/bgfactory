- **Nombre**: Renombrar tipo de componente "cuadro-texto" a "texto"
- **Código**: 00012
- **Tipo**: change

## Prompt original del usuario

ms-new cambia la denominación del tipo de los elementos de cuadro de texto por "texto" en lugar de "cuadro-texto"

## Descripción completa

Se cambia la denominación del tipo de componente "cuadro de texto": donde hoy se identifica internamente como "cuadro-texto", pasa a identificarse como "texto". Es un cambio puramente de nomenclatura, no de comportamiento: las mismas propiedades (contenido, tamaño de fuente, color de texto, color de fondo) y el mismo funcionamiento se mantienen igual, tanto en modo edición como en modo juego.

El único efecto visible para quien usa la aplicación es que, en el panel de listado de componentes del modo edición, la columna "Tipo" pasa de mostrar "cuadro-texto" a mostrar "texto" para estos elementos.

### Preguntas de alcance resueltas

- **¿Hay que migrar datos ya guardados con la denominación antigua?** No aplica: el guardado de estado (localStorage / fichero) es en sí mismo un cambio todavía no implementado, así que no existen hoy componentes persistidos con el valor antiguo que necesiten migrarse.
- **¿Convive con otros tipos de componente?** No: "cuadro de texto" es el único tipo de componente implementado hoy, así que no hay conflicto ni ambigüedad sobre a qué tipo aplica el cambio.
- **¿Cambia algo más en la interfaz aparte de ese texto en la columna "Tipo"?** No: no se añaden, quitan ni reordenan elementos visuales; ninguna otra etiqueta de la interfaz (nombres de campos, botones, textos fijos) menciona "cuadro de texto" o "cuadro-texto".
- **¿Afecta a quién puede usarlo?** No aplica, no hay roles ni restricciones de uso distintas por tipo de componente.

## Apuntes técnicos

- El literal `'cuadro-texto'` aparece hoy como valor del campo `type` en tres puntos de `src/`: la semilla de componente por defecto en `src/main.js` (línea ~39), la comparación de tipo en `src/ui/componentModal.js` (líneas 34 y 117, para decidir qué campos específicos mostrar en la modal) y la comparación de tipo en `src/ui/componentRenderer.js` (línea 18, para decidir cómo dibujar el componente en la mesa). Los tres deben actualizarse en conjunto a `'texto'` para no romper la detección de tipo.
- También hay menciones a `'cuadro-texto'` en `design/docs/ARCHITECTURE.md` (§4 "Tipos de componente implementados" y otras referencias en ese documento) que conviene actualizar para que la documentación técnica no quede desactualizada.
- No hay ningún fichero `design_*.html` para esta entrada: el cambio no introduce ni modifica elementos visuales, solo el texto de un valor de dato ya mostrado tal cual en una columna existente.
