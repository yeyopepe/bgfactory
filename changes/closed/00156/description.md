- **Nombre**: Nuevo tipo de fondo "Color" en Tablero Simple
- **Código**: 00156
- **Tipo**: change
- **Fecha creación**: 2026-08-05

## Prompt original del usuario

en los tableros simples añade un nuevo tipo de fondo: color. Se elije un color y se pinta el fondo del tablero con ese color

## Descripción completa

En el componente "Tablero Simple" se añade un tercer tipo de fondo: "Color" (junto a los dos ya existentes, "Color y patrón" e "Imagen"). Con este tipo, el tablero se pinta enteramente de un único color liso elegido por el usuario, sin patrón ni cuadrícula.

**Comportamiento**

- El desplegable "Fondo" de las propiedades específicas de Tablero Simple pasa a tener tres opciones: "Color y patrón", "Imagen" y "Color" (nueva).
- Al elegir "Color", el botón "Configurar fondo" abre una ventana propia, "Configurar fondo — Color", con un único campo: el color a pintar (selector de color + checkbox "Transparente") — mismo criterio de ventana dedicada que ya usan los otros dos tipos ("Configurar fondo — Imagen", "Configurar fondo — Color y patrón"), en vez de mostrar el campo directamente en la lista principal de propiedades.
- El color de este nuevo tipo es independiente del "Color de fondo" que ya existe dentro de "Color y patrón" (cambio 00153): cada tipo de fondo guarda su propia configuración por separado, igual que ya ocurre entre "Imagen" y "Color y patrón" hoy — cambiar de tipo de fondo no pierde ni mezcla la configuración de los demás tipos.
- El borde del tablero (color/grosor/activo, cambio 00153) no se ve afectado por este cambio: sigue funcionando igual sea cual sea el tipo de fondo elegido.

**Casos límite y compatibilidad**

- Tableros nuevos: si se elige "Color" sin haber configurado nunca ese campo, por defecto se pinta blanco opaco (mismo criterio ya usado para el resto de valores por defecto de color de esta app).
- Tableros ya guardados: no se ven afectados — ninguno tenía el tipo "Color" antes de este cambio, así que ninguno cambia de aspecto.
- Alternar entre los tres tipos de fondo conserva la configuración de cada uno por separado (no se pierde al volver a cambiar de tipo).

**Alcance**: exclusivo del componente "Tablero Simple" — no afecta a "Tablero Personalizado", que tiene su propio sistema de fondo.

**Datos**: la nueva propiedad se guarda como el resto de propiedades del componente, se persiste y exporta igual, sin implicación multiusuario.

**Preguntas de alcance resueltas con el usuario**

- ¿La configuración de "Color" abre ventana propia (como los otros dos tipos) o campo directo en la lista de propiedades? → Ventana propia "Configurar fondo — Color", consistente con "Imagen" y "Color y patrón".
- ¿El color de este tipo comparte valor con el "Color de fondo" de "Color y patrón"? → No, cada uno independiente.

## Apuntes técnicos

- Ventana de referencia para el patrón "ventana de configuración dedicada por tipo de fondo": `ui/boardImageModal.js` (`openBoardImageModal`, para "Imagen") y `ui/boardPatternModal.js` (`openBoardPatternModal`, para "Color y patrón", recién reorganizada en secciones por el cambio 00155). La nueva ventana "Configurar fondo — Color" debería seguir la misma estructura general (overlay/modal/header/content/footer, sin tabs) que ambas.
- El desplegable de tipo de fondo y el botón "Configurar fondo" viven en `ui/componentModal.js`, función `renderBoardSpecificFields` (rama `configureBtn` click handler, que hoy decide entre `openBoardImageModal`/`openBoardPatternModal` según `props.fondoTipo`).
- El renderizado final del fondo del tablero está en `ui/componentRenderer.js`, rama `component.type === 'tableroSimple'`, bloque `if (fondoTipo === 'imagen') {...} else {...}` (el `else` hoy asume siempre "Color y patrón"; con el tercer tipo, ese `else` debe distinguir entre "colorPatron" y "color").
- Patrón "color + checkbox Transparente" ya usado en tres sitios de la app (propiedades de `carta`, `ui/cardTextBoxModal.js`/`ui/cardShapeModal.js`, y el "Color de fondo" añadido a `ui/boardPatternModal.js` en el cambio 00153) — reutilizable tal cual para el único campo de esta nueva ventana.
