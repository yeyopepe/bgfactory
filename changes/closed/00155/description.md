- **Nombre**: Reorganización de la ventana "Configurar fondo — Color y patrón" en secciones
- **Código**: 00155
- **Tipo**: change
- **Fecha creación**: 2026-08-05

## Prompt original del usuario

Más cambios para los tableros simples:
- Las propiedades forma de casilla y las filas y columnas deben estar dentro de una sección llamada "Configuración". Esta debe ser la primera sección.
- Los cuadros de filas y columnas deben estar todos en la misma línea en lugar de 2 diferentes
- las demás propiedades relacionadas con el color, dentro de una sección llamada "Color". Esta debe ser la segunda sección.

## Descripción completa

Reorganización visual de la ventana "Configurar fondo — Color y patrón" del componente Tablero Simple (recién ampliada en el cambio 00153 con el campo "Color de fondo"). No cambia ningún dato ni comportamiento: solo la agrupación y el orden de los campos que ya existían.

Se añaden dos secciones visuales con título (mismo tipo de sección ya usado en otras partes de la app: un marco con título que agrupa campos relacionados, sin checkbox de activación — meramente informativa):

- **"Configuración"** (primera sección de la ventana): agrupa "Forma de casilla", "Filas" y "Columnas".
- **"Color"** (segunda sección, justo debajo): agrupa "Color de fondo", "Color del patrón" y "Grosor".

Además, los campos "Filas" y "Columnas" pasan a mostrarse en la misma fila (uno junto al otro) en vez de en dos filas separadas como hasta ahora.

Orden final de la ventana, de arriba a abajo: sección "Configuración" (Forma de casilla; Filas y Columnas en la misma fila), sección "Color" (Color de fondo; Color del patrón y Grosor en la misma fila), y el mismo footer "Cancelar"/"Aceptar" de siempre.

**Casos límite y convivencia**: no aplica ninguno nuevo — ningún campo cambia de nombre, de comportamiento ni de validación, solo su agrupación y disposición visual. No hay impacto en los datos ya guardados (los tableros existentes se comportan exactamente igual, solo cambia cómo se ven sus controles al abrir esta ventana). No hay restricción de rol/modo distinta de la que ya tenía la ventana.

**Pregunta de alcance resuelta con el usuario**: ¿las dos secciones nuevas deben llevar un checkbox de activar/desactivar toda la sección (como "Borde"), o ser meramente informativas (como "Fondo")? Respuesta: meramente informativas, sin checkbox — ninguno de estos campos tiene sentido "desactivado" en bloque.

Es un cambio exclusivamente visual, sin flujo ni lógica que representar con diagrama, y sin cambio de navegación (sigue siendo la misma ventana, sin pantallas ni transiciones nuevas) — se acompaña de una maqueta HTML de la ventana reorganizada.

## Apuntes técnicos

- Fichero afectado: `ui/boardPatternModal.js` (`openBoardPatternModal`). Actualmente los campos se añaden en este orden a `content`: "Color de fondo" (`bgColorField`, cambio 00153), "Color del patrón"+"Grosor" (`colorRow`, ya en fila), "Forma de casilla" (`shapeField`), "Filas" (`rowsField`), "Columnas" (`colsField`) — estos dos últimos en filas separadas.
- Patrón de sección a reutilizar: `fieldset.modal__section` con `legend.modal__section-title` (sin `--toggle`), documentado en `STYLE_BIBLE.md` sección 12.6 — mismo patrón ya usado para "Fondo" (`.modal__section--untitled`, sin legend) en las propiedades específicas de Tablero Simple, pero aquí sí con título en ambas secciones nuevas.
- Patrón de fila de campos relacionados (`display:flex; gap:0.5rem`, sub-divs con `flex:1`) ya usado en `colorRow` (Color del patrón/Grosor) — replicar igual para Filas/Columnas.
- No hay lógica ni validación que cambie: `MIN_CELLS`/`MAX_CELLS`, los listeners de cada input y el objeto `working` se mantienen igual, solo cambia la estructura del DOM que los contiene.
