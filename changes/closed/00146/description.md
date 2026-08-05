- **Nombre**: Reordenar sección Generales del panel de propiedades
- **Código**: 00146
- **Tipo**: change
- **Fecha creación**: 2026-08-05

## Prompt original del usuario

vamos a reordenar un poco la sección General de las propiedades de los elementos. Debe seguir este orden:
- Id del componente, sin cambios.
- Nueva Sección General: dentro debe estar el control de bloqueo, oculto, mostrar tooltip y  subir al mover/interactuar
- Sección tamaño
A partir de aquí, sin cambios.

## Descripción completa

En el panel de propiedades de un componente (pestaña "Generales"), los controles se reordenan visualmente sin cambiar su comportamiento ni sus valores.

Orden actual:
1. ID del componente.
2. Sección "Tamaño" (alto, ancho, mantener proporción).
3. Cuatro controles sueltos, sin agrupar bajo ningún título: Bloqueado, Oculto, Mostrar tooltip, Subir al mover/interactuar.
4. Sección "Grupos".

Nuevo orden:
1. ID del componente — sin cambios.
2. Nueva sección "General": agrupa visualmente, bajo un título propio, los cuatro controles que antes iban sueltos — Bloqueado, Oculto, Mostrar tooltip y Subir al mover/interactuar — manteniendo entre ellos el mismo orden que tienen hoy. Ninguno de los cuatro cambia de comportamiento, opciones, texto ni icono de ayuda; solo pasan a estar agrupados visualmente bajo un título común, con el mismo estilo de agrupación que ya usan las secciones "Tamaño" y "Grupos".
3. Sección "Tamaño" — sin cambios en su contenido (alto, ancho, mantener proporción), simplemente pasa a mostrarse después de la nueva sección "General" en vez de antes.
4. A partir de aquí, sin cambios: sección "Grupos" y cualquier otro contenido de la pestaña que venga después.

### Puntos de alcance confirmados con el usuario

- El orden interno de los cuatro controles agrupados en "General" no cambia respecto al actual.
- La nueva sección "General" debe verse consistente con el resto de secciones agrupadas del panel (mismo estilo de agrupación visual que "Tamaño" y "Grupos").
- El contenido de cada control (opciones, textos, ayudas) no se modifica, solo su agrupación y posición.
- Es un cambio puramente visual dentro de esta pestaña del panel de propiedades: no afecta a otras pestañas del panel, a cómo se dibujan los componentes en el tablero, a los datos que se guardan de cada componente, ni a ningún otro panel o ventana del proyecto.

## Apuntes técnicos

- El panel vive en `ui/componentModal.js`, pestaña `general` (función que construye el modal de edición/creación de componente).
- La sección "Tamaño" ya sigue el patrón de agrupación a reutilizar: `fieldset` con clase `modal__section` + `legend` con clase `modal__section-title`. La sección "Grupos", más abajo en el mismo fichero, sigue el mismo patrón.
- Los cuatro controles a agrupar están hoy como `div.modal__field`/`modal__field--checkbox` sueltos, en este orden y con esta implementación (aprox. líneas 353-438 de `ui/componentModal.js` en el momento de este análisis): `moveField` (Bloqueado, `<select>` con opciones `ninguno`/`juego`/`todos`), `hiddenField` (Oculto, checkbox), `tooltipField` (Mostrar tooltip, checkbox), `upOnMoveField` (Subir al mover/interactuar, checkbox). Cada uno lleva su propio icono de ayuda (`createHelpIcon`) con el texto explicativo actual, que no cambia.
- No se ha detectado ninguna incongruencia entre la documentación técnica (`ARCHITECTURE.md`, `STYLE_BIBLE.md`) y el código real de este panel.
