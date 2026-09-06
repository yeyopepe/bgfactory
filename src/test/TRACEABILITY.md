<!-- GENERADO AUTOMÁTICAMENTE por `npm test`. No editar a mano: cualquier cambio se sobrescribe. -->

# Trazabilidad funcionalidad ↔ tests

Relaciona cada funcionalidad de `design/docs/features/` con los tests funcionales que
la cubren. "principal" = el test toma su código de esta funcionalidad; "secundaria" =
el test la ejercita de forma incidental. Generado por `npm test`.

| Funcionalidad (design/docs/features/) | Tests |
|---|---|
| 001 — Mesa infinita con navegación pan/zoom | — |
| 002 — Alta/edición/borrado de componentes con modal de tabs | FT-002-01, FT-002-02, FT-002-03, FT-002-04, FT-002-05, FT-002-06, FT-002-07, FT-002-08, FT-002-09, FT-002-10, FT-002-11, FT-002-12 |
| 003 — Panel flotante de componentes, con selección, resaltado, arrastre y redimensionado | — |
| 004 — Ordenación y filtrado desde la cabecera de columna | — |
| 005 — Elementos tipo Copia, vinculados y sincronizados con un original | FT-005-01, FT-005-02, FT-005-03, FT-005-04, FT-005-05, FT-005-06, FT-005-07, FT-005-08, FT-005-09 |
| 006 — Panel flotante de recursos, con filtro de texto | — |
| 007 — Edición de un recurso Imagen, con vista previa ampliada de zoom y pan | — |
| 008 — Etiquetas, organización de elementos por nombre | — |
| 009 — Subida múltiple y por carpeta de recursos | — |
| 010 — Conversión automática a WebP al subir imágenes | — |
| 011 — Búsqueda de imagen en el modal "Elegir imagen" | — |
| 012 — Orden de apilado en la mesa | — |
| 013 — Subir al mover/interactuar | — |
| 014 — Interacciones programadas de un componente | — |
| 015 — Posición independiente, arrastre y redimensionado de componentes | — |
| 016 — Componente oculto en modo juego | FT-016-01, FT-016-02, FT-016-04, FT-016-05, FT-016-06 |
| 017 — Componente "cuadro de texto" | — |
| 018 — Componente "tablero simple" | — |
| 019 — Componente "tablero personalizado" | — |
| 020 — Componente "dado" | — |
| 021 — Componente "Visor de documentos" | — |
| 022 — Componente "carta" | FT-022-01, FT-022-02, FT-022-03, FT-022-04, FT-022-05, FT-022-06, FT-022-07, FT-022-08, FT-005-01 (secundaria), FT-005-02 (secundaria), FT-005-03 (secundaria), FT-005-04 (secundaria), FT-005-05 (secundaria), FT-005-06 (secundaria), FT-005-07 (secundaria), FT-005-08 (secundaria), FT-005-09 (secundaria) |
| 023 — Componente "mazo" | — |
| 024 — Migración de fichas antiguas a Carta/Ficha | — |
| 025 — Identificación de componentes al pasar el ratón | — |
| 026 — Menú contextual de componente en modo juego | FT-026-01, FT-026-02, FT-026-03, FT-026-04, FT-026-05, FT-026-06, FT-026-07, FT-026-08, FT-026-09, FT-026-10, FT-026-11, FT-026-12, FT-026-13, FT-026-14, FT-026-15, FT-026-16, FT-026-17 |
| 027 — Menú contextual de elemento en modo edición | — |
| 028 — Atajos de teclado en modo edición | — |
| 029 — Autoguardado en el navegador | FT-029-01, FT-029-02, FT-029-03, FT-029-04, FT-029-05, FT-029-06, FT-029-07, FT-029-08, FT-029-09 |
| 030 — Título de cabecera editable | — |
| 031 — Guardar a fichero | — |
| 032 — Exportar/importar componentes en JSON, con selección | FT-032-01, FT-032-02, FT-032-03, FT-032-04, FT-032-05, FT-032-06, FT-032-07, FT-032-08, FT-032-09, FT-032-10, FT-032-11 |
| 033 — Modal de error común a toda la app | — |
| 034 — Agrupación de elementos: agrupar y desagrupar | — |
| 035 — Título de componente | — |
| 036 — Contenido de ejemplo al arrancar una partida nueva | FT-036-01, FT-036-02, FT-036-03, FT-036-04, FT-036-05 |
| 037 — Indicador de versión y enlace al repositorio | — |
| 038 — Aplicación multi-idioma y panel de configuración | — |
| 039 — Barra de controles superior: modos, importar y exportar | FT-039-01, FT-039-02, FT-039-03, FT-039-04, FT-039-05, FT-039-06, FT-039-07 |
| 040 — Catálogo de propiedades de componentes, grupos y etiquetas | — |

## Anomalías

### Tests que declaran una funcionalidad inexistente (hacen fallar la batería)

_Ninguna._

### Funcionalidades sin ningún test (solo informativo)

| Funcionalidad |
|---|
| 001 — Mesa infinita con navegación pan/zoom |
| 003 — Panel flotante de componentes, con selección, resaltado, arrastre y redimensionado |
| 004 — Ordenación y filtrado desde la cabecera de columna |
| 006 — Panel flotante de recursos, con filtro de texto |
| 007 — Edición de un recurso Imagen, con vista previa ampliada de zoom y pan |
| 008 — Etiquetas, organización de elementos por nombre |
| 009 — Subida múltiple y por carpeta de recursos |
| 010 — Conversión automática a WebP al subir imágenes |
| 011 — Búsqueda de imagen en el modal "Elegir imagen" |
| 012 — Orden de apilado en la mesa |
| 013 — Subir al mover/interactuar |
| 014 — Interacciones programadas de un componente |
| 015 — Posición independiente, arrastre y redimensionado de componentes |
| 017 — Componente "cuadro de texto" |
| 018 — Componente "tablero simple" |
| 019 — Componente "tablero personalizado" |
| 020 — Componente "dado" |
| 021 — Componente "Visor de documentos" |
| 023 — Componente "mazo" |
| 024 — Migración de fichas antiguas a Carta/Ficha |
| 025 — Identificación de componentes al pasar el ratón |
| 027 — Menú contextual de elemento en modo edición |
| 028 — Atajos de teclado en modo edición |
| 030 — Título de cabecera editable |
| 031 — Guardar a fichero |
| 033 — Modal de error común a toda la app |
| 034 — Agrupación de elementos: agrupar y desagrupar |
| 035 — Título de componente |
| 037 — Indicador de versión y enlace al repositorio |
| 038 — Aplicación multi-idioma y panel de configuración |
| 040 — Catálogo de propiedades de componentes, grupos y etiquetas |
