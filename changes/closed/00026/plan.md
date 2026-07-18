## (a) Anotaciones funcionales

Sin dudas de alcance que resolver con el usuario. Fuera de alcance: cualquier otro control o modal que no use la clase `.modal__field` (p. ej. estilos de botones, checkboxes u otros bloques), y cualquier rediseño más allá de igualar el estilo ya existente para `input`/`textarea` dentro de `.modal__field`.

El mockup `design_select-modal-configuracion.html` (comparativa antes/después) se ha usado solo como referencia visual del resultado esperado, no como fuente de la solución técnica.

## (b) Solución técnica

1. En `src/styles/main.css`, añadir el selector `select` al bloque de reglas que ya da estilo homogéneo a los controles de `.modal__field` (línea 293: `.modal__field input[type="text"], .modal__field input[type="number"], .modal__field input[type="color"], .modal__field textarea`), para que los `<select>` reciban el mismo `width: 100%`, `padding: 0.5rem`, `border: 1px solid #ddd`, `border-radius: 4px`, `font-family: inherit` y `font-size: 0.875rem` que el resto de campos.
2. Añadir `cursor: pointer` para `.modal__field select` (regla propia, igual que ya se hace para `input[type="color"]` en la regla siguiente), ya que es un control de elección y el resto de controles interactivos de la app usan `cursor: pointer` (sección 9 de la guía de estilo).
3. No se requiere ningún cambio en `src/ui/componentModal.js` ni `src/ui/boardPatternModal.js`: se ha verificado que los dos únicos `<select>` de la app (`bgTypeSelect` en `componentModal.js` y `shapeSelect` en `boardPatternModal.js`) ya están dentro de contenedores con clase `modal__field`, por lo que heredan el nuevo estilo automáticamente sin tocar JS.
