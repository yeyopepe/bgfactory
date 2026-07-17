## Nombre
Quitar el uso de localStorage del proyecto

## Código
00008

## Tipo
change

## Prompt original del usuario
Quitar el uso de localStorage del proyecto (idea apuntada en `changes/todo/ls9k2` como "Quitar el localStorage", con la nota: "Quitar el uso de localStorage del proyecto.").

## Descripción completa
Eliminar por completo la persistencia automática en localStorage del estado de la aplicación (los componentes colocados en la mesa).

Concretamente:
- Eliminar el fichero `src/data/persistence.js` entero, incluyendo `saveToLocalStorage`, `loadFromLocalStorage`, y también `exportToJsonFile`/`importFromJsonFile`.
- En `src/main.js`: quitar el listener que llama a `saveToLocalStorage` en el evento `components:changed`, y quitar la carga inicial vía `loadFromLocalStorage`. La app debe arrancar siempre creando el componente de texto por defecto ("Hola, esta es una mesa de juego infinita."), igual que hoy ocurre cuando no hay nada guardado en localStorage.

Preguntas de alcance resueltas con el usuario:

- **¿Qué hacer con `exportToJsonFile`/`importFromJsonFile`?** Estaban definidas en `persistence.js` pero no conectadas a ninguna UI (código muerto). Se decidió eliminarlas también, junto con el resto del módulo, en vez de dejarlas sueltas o conectarlas ahora a la interfaz.
- **Casos límite y estado resultante:** tras el cambio, recargar la página siempre pierde lo hecho en la sesión anterior y arranca con el componente por defecto — es la consecuencia esperada y aceptada de quitar el localStorage; no se pide ningún mecanismo de persistencia alternativo.
- **Alcance de los datos:** no hay usuarios/sesiones distintos en el proyecto; el estado vive solo en memoria del navegador mientras la pestaña esté abierta.
- **Quién puede usarlo:** no aplica, el proyecto no tiene roles.
- **Definición visual:** ninguna — es una eliminación de lógica interna, no se añade ni modifica ningún elemento de UI.
