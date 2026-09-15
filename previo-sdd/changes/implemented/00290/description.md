- **Name**: Fusionar la cabecera de modo edición en un único elemento
- **Code**: 00290
- **Type**: fix
- **Creation date**: 2026-09-15

## Full description

En modo edición, la cabecera de la aplicación debe verse como una única franja visual continua, con una sola trama de fondo (rayas diagonales), abarcando el título, el indicador de "Modo Edición" y los botones "Importar"/"Exportar". Actualmente el título y el indicador viven en un elemento, mientras que "Importar"/"Exportar" viven en un elemento hermano separado, justo debajo en el flujo normal de la página.

A pesar de varios intentos sucesivos de igualar visualmente ambos elementos (mismo color de fondo, misma trama, misma fase de la trama, sin sombra propia en el segundo), sigue viéndose una costura/línea divisoria entre ambas franjas en el navegador real. Un intento adicional de superponer el segundo elemento flotando sobre el primero (sin ocupar espacio propio) tampoco es viable: al dejar de ocupar espacio, sus botones quedan ocultos detrás del panel flotante "Componentes", que se posiciona por defecto en esa misma zona de la pantalla.

La solución debe ser estructural: los botones "Importar"/"Exportar" tienen que integrarse dentro del propio elemento del título (en su composición real, no solo visualmente), de modo que solo exista un único elemento con una trama de fondo — eliminando así la posibilidad de que aparezca una costura entre dos elementos distintos.

Debe mantenerse sin cambios:
- El indicador de "Modo Edición" bajo el título.
- El aspecto y comportamiento actuales de los botones "Importar"/"Exportar" (mismo estilo, mismo menú desplegable de "Exportar", mismo selector de fichero oculto de "Importar").
- Que en modo juego "Importar"/"Exportar" sigan viéndose donde están hoy, sin cambios (esa parte ya funciona correctamente).
- Que el panel flotante "Componentes" (y cualquier otro panel flotante) no quede tapado ni tenga que reposicionarse por este cambio.

## Technical notes

- El título y el indicador de modo se generan hoy en `src/ui/appTitle.js` (`renderAppTitle`, que pinta `h1#app-title` con la trama de fondo en modo edición vía la clase `app-title-bar--edit`).
- Los botones "Importar"/"Exportar" en modo edición se generan hoy en `src/ui/editModeToggle.js` (`renderEditToolbar`, que monta un `.edit-toolbar` dentro del contenedor `#edit-toolbar` de `index.html`, hermano de `h1` en el flujo normal).
- Intentos previos descartados hoy mismo, documentados en `previo-sdd/changes/implemented/00287/`, `00288/` y `00289/`: igualar color/trama, quitar sombra propia, fijar la fase de la trama con `background-attachment: fixed`. Ninguno elimina la costura real observada por el usuario en un navegador real (solo se detectaba en capturas de pantalla, no siempre fielmente).
- Un cuarto intento (sin documentar, revertido en esta misma sesión antes de escribir esta entrada): `position: fixed` en `.edit-toolbar`, igual que ya usa `#mode-switcher`. Falla porque el panel flotante "Componentes" (gestionado por `modes/edit/editMode.js`, posición por defecto cerca de la esquina superior derecha cuando `panelState.position` es `null`) queda por encima y tapa los botones.
- Antes de decidir la solución técnica, `pv-how` debe revisar en detalle: el layout interno de `h1` necesario para acomodar dos filas (título+indicador, y Importar/Exportar) sin salir del elemento; qué ocurre con `#edit-toolbar`/`renderEditToolbar` (eliminar, vaciar, o repropósito); y el impacto en los tests funcionales existentes que consultan `#edit-toolbar`/`.edit-toolbar` (`FT-039-02`, `FT-039-04`, `FT-039-08`, `FT-039-09`, `FT-039-10` en `src/test/functional/top-controls.test.js`) y los que consultan el indicador de modo (`FT-030-10` a `FT-030-13` en `src/test/functional/app-title.test.js`), que previsiblemente necesitarán actualizarse.
