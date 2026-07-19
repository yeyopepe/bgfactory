## (a) Anotaciones funcionales

- Fuera de alcance: no se toca nada del comportamiento ya correcto de tablero/dado, ni ningún otro aspecto del componente de texto (contenido, tamaño de fuente, colores) — el fix se limita exclusivamente a que la etiqueta vuelva a ser visible.
- No hubo dudas que resolver con el usuario: la causa raíz es clara y de alcance mínimo (ver más abajo).

## (b) Solución técnica

1. **`src/ui/componentRenderer.js`, rama `component.type === 'texto'` de `renderComponentsOnTable`**: causa raíz — la etiqueta de identificación se añade como hijo de `textBox` (`textBox.appendChild(createIdentifierLabel(component))`) **antes** de la línea `textBox.textContent = component.properties.contenido || '';`, que sustituye todo el contenido del elemento (incluida la etiqueta recién añadida) por el texto plano del componente. Por eso la etiqueta nunca llega a verse en ningún componente de tipo texto (no solo el de ejemplo), mientras que "tablero" y "dado" no tienen este problema porque no reasignan `textContent` en ningún punto de su renderizado.
   - Corrección mínima: mover la línea `textBox.textContent = component.properties.contenido || '';` para que se ejecute **antes** de las dos líneas que fijan `identifyMode` (tooltip/label), en vez de después. Así el texto se fija primero y la etiqueta (o el `title`, que no depende del contenido) se añade después sin ser borrada.
