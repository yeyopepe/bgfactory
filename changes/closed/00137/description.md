- **Nombre**: Alinear a la derecha los botones de ayuda y expandir pantalla del editor de cartas
- **Código**: 00137
- **Tipo**: fix
- **Fecha creación**: 2026-08-05

## Prompt original del usuario

los botones de ayuda y de expandir pantalla en el editor de cartas deben estar alineados a la derecha

## Descripción completa

En la cabecera del editor de cartas, el botón para expandir/restaurar la pantalla y el icono de ayuda aparecen pegados justo a la derecha del título, en el lado izquierdo de la cabecera, dejando un hueco vacío grande a la derecha.

Se espera que ambos botones (ayuda y expandir pantalla) queden alineados contra el borde derecho de la cabecera, con el título a la izquierda y el hueco vacío entre ambos, en vez de entre los botones y el borde derecho.

## Apuntes técnicos

- Botones definidos en `src/ui/cardEditorModal.js`: cabecera del modal (`header`, líneas 243-247), botón de maximizar/restaurar (`maximizeBtn`, líneas 252-271, añadido al header en la línea 271) e icono de ayuda (línea 273, `createHelpIcon` de `src/ui/helpIcon.js`).
- Orden actual en el DOM: título → botón maximizar → icono de ayuda, todos hijos directos del mismo `header`.
- CSS relevante en `src/styles/main.css`:
  - Regla base `.modal__header` (líneas 298-301).
  - Override específico `.card-editor-modal .modal__header` (líneas 1246-1250): `display: flex; align-items: center; gap: 0.5rem;` — sin `justify-content`, por lo que el flujo por defecto (`flex-start`) deja todo pegado a la izquierda.
- La guía de estilo `design/docs/stylebible/STYLE_BIBLE.md`, sección 12.4.1 ("Botón maximizar/restaurar de modal", líneas 215-217), documenta el botón de maximizar como "colocado en `.modal__header`, entre el título y el `.help-icon` si lo hay", sin especificar alineación a la derecha. Este apartado debe actualizarse para reflejar la nueva convención de alineación a la derecha en la cabecera del modal (posible incongruencia a resolver junto con la implementación).
