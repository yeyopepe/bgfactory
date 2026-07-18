- **Nombre**: Homogeneizar estilo de los desplegables en ventanas de configuración
- **Código**: 00026
- **Tipo**: fix

## Prompt original del usuario

Los desplegables en la ventana de configuración no tienen un estilo coherente con el resto (cuadros de texto, etiquetas, etc). son demasiado pequeños, por ejemplo. Homogeniza el estilo de este tipo de controles

## Descripción completa

En las ventanas de configuración (por ejemplo, la que permite editar las propiedades de un tablero), los controles desplegables (los que permiten elegir una opción entre varias, como el tipo de fondo) no comparten el mismo estilo visual que el resto de controles del formulario: cuadros de texto, campos numéricos, selectores de color y etiquetas.

Concretamente, los desplegables aparecen con el aspecto por defecto del navegador — se ven notablemente más pequeños, con un padding, borde y tipografía distintos a los del resto de campos del mismo formulario.

Se espera que estos desplegables tengan un tamaño, padding, borde, radio de esquina y tipografía coherentes con los demás controles de la misma ventana de configuración, de forma que todo el formulario se vea visualmente homogéneo.

## Apuntes técnicos

- El estilo homogéneo de los campos de estas ventanas de configuración se define en `src/styles/main.css`, en el bloque de reglas para `.modal__field input[type="text"]`, `.modal__field input[type="number"]`, `.modal__field input[type="color"]` y `.modal__field textarea` (alrededor de la línea 293). La regla no incluye el selector `select`, por lo que los `<select>` quedan sin este estilo aplicado.
- Ejemplo de `<select>` afectado: `bgTypeSelect` en `src/ui/componentModal.js` (línea ~319), dentro de un contenedor con clase `modal__field`.
