# Plan: no abrir configuración al soltar un elemento arrastrado

## (a) Anotaciones funcionales

- Fuera de alcance: cualquier mejora al sistema de arrastre/paneo de la mesa infinita, cambio de cursor o estilos de selección de componentes, o soporte para reposicionar componentes individualmente (hoy no existe: lo que se arrastra es la cámara de toda la mesa, no el componente).
- No ha habido dudas de alcance que resolver con el usuario: el `description.md` ya deja claro el comportamiento esperado (abrir configuración solo con doble clic).

## (b) Solución técnica

Causa raíz: en [`src/ui/table.js`](../../../src/ui/table.js) la mesa infinita implementa el paneo (arrastre de la cámara) escuchando `mousedown`/`mousemove`/`mouseup` sobre el `viewport`. Cuando el usuario "arrastra" haciendo mousedown sobre un componente y mouseup en el mismo elemento (típico al terminar un arrastre corto), el navegador dispara igualmente un evento `click` nativo sobre ese elemento, aunque haya habido movimiento de por medio. En [`src/ui/componentRenderer.js`](../../../src/ui/componentRenderer.js) línea 26, el `textBox` escucha justo ese `click` para invocar `onSelect(component)`, que en [`src/modes/edit/editMode.js`](../../../src/modes/edit/editMode.js) abre la ventana de configuración (`openEditModalFor`). Por eso cualquier arrastre que empiece y termine sobre el elemento abre la configuración.

1. En `src/ui/componentRenderer.js`, cambiar el listener del `textBox` de `'click'` a `'dblclick'` (única línea a tocar: la que registra `textBox.addEventListener('click', () => onSelect(component))`), de forma que `onSelect` solo se dispare con doble clic explícito sobre el elemento, y no con el clic simple que resulta de un arrastre de la mesa.
2. Verificar manualmente en el navegador (modo edición): arrastrar la mesa empezando sobre un elemento no debe abrir la configuración; un doble clic sobre el elemento sí debe abrirla.

No se toca `src/modes/edit/editMode.js` ni `src/ui/table.js`: el comportamiento de paneo de la mesa es correcto y no es la causa del bug, solo el listener equivocado en `componentRenderer.js`.
