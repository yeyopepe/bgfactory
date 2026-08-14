- **Nombre**: Separación entre la sección "Imagen" del mazo y "Ver contenido del mazo"
- **Código**: 00209
- **Tipo**: fast
- **Fecha creación**: 2026-08-14

## Descripción completa

En la pestaña "Específicas" del modal de propiedades de un mazo, el botón "Ver contenido del mazo" (debajo de la sección "Imagen", fuera de cualquier sección) queda pegado al borde inferior de esa sección, sin separación visual — se percibe como si se solaparan. Pasa a haber la misma separación vertical que entre el resto de bloques de la pestaña.

## Apuntes técnicos

`fieldset.modal__section` (`src/styles/main.css`) usa `margin: 1rem -0.75rem 0` — sin margen inferior, solo aporta separación por arriba de la propia sección. El botón "Ver contenido del mazo" vive en `contentField` (`div.modal__field`, `src/ui/componentModal.js` → `renderMazoSpecificFields`), que solo tiene `margin-bottom` (regla genérica `.modal__field`), no `margin-top` — de ahí la falta de separación tras la sección "Imagen" (introducida por el cambio 00207).

## Cambios aplicados

- `src/ui/componentModal.js` (`renderMazoSpecificFields`): `contentField.style.marginTop = '1rem'` — mismo valor que el margen superior que ya usan las secciones (`fieldset.modal__section`), aplicado solo a este campo concreto (no se toca la regla CSS compartida `fieldset.modal__section`, que usan otras modales sin este problema).
