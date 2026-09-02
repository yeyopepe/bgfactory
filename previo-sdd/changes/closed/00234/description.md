- **Name**: Icono por tipo en la lista de "Añadir componente"
- **Code**: 00234
- **Type**: change
- **Creation date**: 2026-09-02

## Full description

En modo edición, al pulsar "+ Añadir componente" se abre la ventana "Añadir componente", que muestra la lista de tipos de componente que se pueden crear (Cuadro de texto, Tablero simple, Tablero personalizado, Dado Configurable, Visor de documentos, Carta/Ficha y Mazo). Hoy cada fila de esa lista muestra solo un selector redondo y el nombre del tipo en texto.

Este cambio añade a cada fila de esa lista un pequeño icono representativo del tipo de componente, situado entre el selector y el nombre. El icono es puramente ilustrativo: ayuda a identificar cada tipo de un vistazo sin tener que leer, pero no cambia en nada el funcionamiento de la ventana (seleccionar un tipo, aceptar o cancelar siguen igual).

Detalles de comportamiento acordados:

- Hay un icono distinto por cada uno de los siete tipos disponibles, elegido para que evoque visualmente ese tipo (por ejemplo: líneas de texto para "Cuadro de texto", una cuadrícula para "Tablero simple", un dado con puntos para "Dado Configurable", una hoja para "Visor de documentos", una carta para "Carta/Ficha", varias cartas apiladas para "Mazo").
- El icono se ve en gris cuando la fila está en reposo y pasa a color de acento (azul) cuando el cursor está encima de la fila o cuando ese tipo está seleccionado, igual que ya ocurre hoy con el resaltado del borde de la fila.
- El icono es solo visual; no es un botón ni un elemento sobre el que se pueda hacer clic de forma independiente (hacer clic en él equivale a hacer clic en la fila, como con el texto).
- La lista sigue mostrando siempre los mismos siete tipos fijos, en el mismo orden. No cambian los estados de la ventana, ni lo que se guarda, ni quién puede usarla (sigue estando disponible solo en modo edición).
- El cambio afecta únicamente a esta ventana de alta de componente: no toca el panel de componentes ya creados, ni los menús contextuales, ni cómo se dibujan los componentes en la mesa.

## Technical notes

- Lista de tipos: `COMPONENT_TYPES` en `src/ui/componentTypeModal.js`. Cada fila se construye en el bucle de `openComponentTypeModal` como `<label class="component-type-modal__item">` con un `<input type="radio">` y un `<span>` de texto. El icono se inserta entre ambos (orden: radio, icono, texto).
- Formato del icono: SVG inline hardcodeado en el propio módulo, estilo lineal (`viewBox="0 0 24 24"`, `fill="none"`, `stroke="currentColor"`), mismo patrón ya usado en `src/ui/editModeToggle.js` y `src/ui/componentList.js`. Sin librería de iconos ni assets nuevos en `src/img`. Marcar el SVG como decorativo (`aria-hidden`).
- Estilo: nueva clase BEM `.component-type-modal__icon` en `src/styles/main.css`, junto a las reglas existentes `.component-type-modal__list` / `.component-type-modal__item` (~línea 1527). Color en reposo `var(--text-muted)`; en `.component-type-modal__item:hover .component-type-modal__icon` y para el item con el radio marcado, `var(--accent-blue)` (coherente con el `:hover` actual del item). Tamaño ~20–24px. Sin tokens de color ni patrones visuales nuevos.
- Sin inconsistencias documentación/código detectadas. Checklist de seguridad: categoría "Client hardening" cubierta — los SVG son constantes del módulo, sin contenido de usuario.
