- **Nombre**: Reseteo de la app al mover un elemento en modo juego
- **Código**: 00016
- **Tipo**: fix

## Prompt original del usuario

a veces me pasa que parece que la app se "resetea". Estoy haciendo algo con ella y el elemento que acabo de mover, vuelve a su posición anterio. o si estoy en el modo edición, me pasa automáticamente al modo juego como si se hubiera recargado

## Descripción completa

En la mesa infinita (tanto en modo juego como en modo edición), al mover un elemento marcado como movible fuera de la zona actualmente visible, la vista de la mesa (el desplazamiento/zoom al que el usuario la había llevado) se reinicia bruscamente a su posición y zoom por defecto. El elemento en sí sí se ha movido y guardado correctamente, pero como la cámara vuelve a su posición inicial, da la sensación de que la aplicación se ha "reseteado" o recargado por completo (el elemento parece "volver a su sitio" porque la vista entera ha saltado, no porque su posición guardada se haya perdido).

### Cómo reproducirlo

1. Desplazar/alejar la vista de la mesa (pan/zoom) desde su posición inicial.
2. Mover un elemento marcado como movible.
3. Al soltar, la vista de la mesa salta de vuelta a su posición y zoom iniciales, en vez de mantenerse donde el usuario la había dejado.

### Preguntas de alcance resueltas

- Pregunta: ¿cuándo ocurre el reseteo — tras inactividad, al volver a la pestaña, o de forma aleatoria?
  Respuesta: es reproducible siempre que se mueve un elemento movible (en cualquier modo) estando la vista de la mesa desplazada/con zoom respecto a su posición inicial.
- Pregunta (verificación con consola del navegador): ¿hay algún error o recarga real de página?
  Respuesta: no hay errores ni recarga real; lo que ocurre es que la vista de la mesa (pan/zoom) se reinicia a su estado inicial en cada repintado, dando una falsa sensación de reseteo/recarga.

### Comportamiento esperado

Al mover un elemento movible (o realizar cualquier otra acción que refresque la pantalla, como editar/añadir/eliminar un componente), la vista de la mesa (posición de desplazamiento y zoom) debe mantenerse tal como la había dejado el usuario, sin saltar a su posición inicial.
