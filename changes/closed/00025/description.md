- **Nombre**: Tablero insertado no se pinta hasta editar sus propiedades
- **Código**: 00025
- **Tipo**: fix

## Prompt original del usuario

cuando inserto un tablero, este elemento ya tiene una configuración por defecto, pero no se pinta correctamente (el tablero aparece vacío). Cuando edito las propiedades y cambio alguna, entonces ya se refresca correctamente

## Descripción completa

Al insertar un tablero en el editor, el elemento se crea con una configuración por defecto (color, patrón o imagen ya establecidos), pero al aparecer en pantalla se muestra vacío, sin reflejar esa configuración por defecto.

Si a continuación el usuario abre las propiedades del tablero y cambia cualquiera de ellas, el tablero pasa a pintarse correctamente con la nueva configuración.

Se espera que, desde el momento en que se inserta el tablero, este se pinte ya correctamente según su configuración por defecto, sin necesidad de que el usuario tenga que editar ninguna propiedad primero.
