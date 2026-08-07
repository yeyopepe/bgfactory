- **Nombre**: Renombrar tipo "Dado" a "Dado Configurable"
- **Código**: 00189
- **Tipo**: fast
- **Fecha creación**: 2026-08-07

## Prompt original del usuario

el elemento de tipo Dado cambia su nombre a Dado Configurable

## Descripción completa

El elemento de tipo "Dado" pasa a llamarse "Dado Configurable" en todos los sitios donde se muestra su nombre al usuario: el selector de alta de componente nuevo y la etiqueta identificativa que acompaña a cada componente en modo juego/edición (formato "Tipo: id"). El comportamiento del componente (lanzar el dado, configurar sus caras, redimensionado cuadrado, etc.) no cambia en absoluto — solo su nombre visible.

## Apuntes técnicos

- Etiquetas a actualizar: `src/ui/componentTypeModal.js:9` (`{ value: 'dado', label: 'Dado' }`) y `src/ui/componentRenderer.js:213` (`COMPONENT_TYPE_LABELS.dado = 'Dado'`).
- La clave interna del tipo (`'dado'`) no se toca — solo el texto de la etiqueta (`label`/valor del diccionario `COMPONENT_TYPE_LABELS`), ya que esa clave se usa en lógica interna (renderizado, `core/dice.js`, `resizeHandle.js`, estilos) que no debe verse afectada.
- No se han encontrado más apariciones del texto "Dado" como label de UI (funciones como `renderDadoSpecificFields`/`isDadoConfigValid` son identificadores internos de código, no texto visible).
- `design/docs/style/03-modales-menus.md` §12 menciona el formato `"<Tipo>: <id>"` con el ejemplo "Dado: 3fa8..." — es solo un ejemplo ilustrativo derivado de `COMPONENT_TYPE_LABELS`, no una constante propia; no requiere edición para que el comportamiento documentado siga siendo correcto.
