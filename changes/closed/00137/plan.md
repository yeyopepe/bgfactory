- **Fecha creación**: 2026-08-05

## (a) Anotaciones funcionales

- Fuera de alcance: no se cambia el orden entre el botón de maximizar/restaurar y el icono de ayuda (se mantiene maximizar → ayuda, de izquierda a derecha), ni ningún otro aspecto visual de ambos controles (icono, tamaño, colores, comportamiento). Solo cambia su posición horizontal dentro de la cabecera.
- El usuario confirmó la maqueta `design_card_editor_header.html`: título a la izquierda, hueco vacío en medio, ambos botones pegados al borde derecho de la cabecera.

## (b) Solución técnica

1. En `src/styles/main.css`, dentro de la regla `.card-editor-modal .modal__header` (líneas 1246-1250), no se toca nada — el `display: flex; align-items: center; gap: 0.5rem;` ya es correcto como base.
2. Añadir `margin-left: auto;` a la regla `.card-editor-modal__maximize-btn` (líneas 1255-1268). Al ser el primer elemento tras el título dentro del flex row de la cabecera, un `margin-left: auto` en ese botón absorbe todo el espacio disponible antes de él, empujando tanto al propio botón como al `.help-icon` que le sigue (unido por el `gap` existente) hasta el borde derecho de la cabecera — sin necesidad de envolver ambos botones en un contenedor nuevo ni tocar el marcado de `src/ui/cardEditorModal.js`.
3. No se requiere ningún cambio en `src/ui/cardEditorModal.js` ni en `src/ui/helpIcon.js`: el orden y la estructura del DOM ya son los correctos, solo cambia la regla CSS del botón de maximizar.

Este patrón (`margin-left: auto` sobre el primer elemento de un grupo de acciones para empujarlo al borde derecho de una fila flex) ya tiene precedente en el proyecto (`.element-selection-group__item-hint`, `src/styles/main.css:546`), así que no introduce una técnica nueva.

## (d) Cambios en estilo

Actualizar `design/docs/stylebible/STYLE_BIBLE.md`, sección **12.4.1 "Botón maximizar/restaurar de modal"** (líneas 215-217): la frase actual dice que el botón va "colocado en `.modal__header`, entre el título y el `.help-icon` si lo hay", sin mencionar alineación. Añadir que, además de esa posición relativa (entre título y `.help-icon`), el botón lleva `margin-left: auto` para quedar junto con el resto de acciones de la cabecera pegado al borde derecho, dejando el título solo a la izquierda — y que cualquier modal futura que reutilice este patrón debe mantener también esa alineación a la derecha.
