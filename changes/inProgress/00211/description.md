- **Nombre**: Tooltip recortado por el contenedor
- **Código**: 00211
- **Tipo**: fix
- **Fecha creación**: 2026-08-15

## Descripción completa

El texto de ayuda que aparece al pasar el ratón por un icono de ayuda ("?"), o por un componente en Modo Juego que tiene identificación por tooltip, a veces no se lee entero: queda recortado por el borde del panel o ventana en el que está el elemento sobre el que se pasa el ratón.

Esto ocurre porque el tooltip se posiciona pegado a su propio icono/componente, y si ese icono está cerca del borde de un panel con desplazamiento propio (por ejemplo, un panel de propiedades estrecho en Modo Edición), el tooltip se corta en el borde de ese panel en vez de verse completo por encima.

Comportamiento esperado: el tooltip debe verse siempre completo, sin quedar recortado por ningún contenedor, sea cual sea la posición del icono/componente sobre el que aparece.

### Ejemplo reportado

Campo "Tooltip" del panel de propiedades de un componente: al pasar el ratón por el icono de ayuda junto a ese campo, el tooltip aparece pegado al borde izquierdo del panel y su texto queda cortado, ilegible en parte.

## Apuntes técnicos

- Dos implementaciones distintas de tooltip con el mismo problema de fondo:
  - `.help-icon__tooltip` (`ui/helpIcon.js`, `createHelpIcon`): icono de ayuda contextual, `position: absolute` respecto a `.help-icon` (`position: relative`), `z-index: 10`.
  - `.component-tooltip` (`ui/componentRenderer.js`, identificación de componente en Modo Juego cuando `identifyMode === 'tooltip'`): mismo mecanismo, `position: absolute` respecto al elemento raíz del componente.
- Causa raíz: al ser `position: absolute`, ambos quedan recortados por cualquier ancestro con `overflow: auto`/`overflow: hidden` en el camino (p. ej. `.edit-mode-panel`/`.component-panel__body`), aunque el propio elemento tenga `z-index` alto — el recorte por `overflow` ocurre antes de que el `z-index` entre en juego.
- El proyecto ya tiene un patrón documentado para este mismo problema en otros elementos: `.context-menu` y `.column-header-menu` usan `position: fixed` insertado en `document.body`, con la posición calculada por JS vía `getBoundingClientRect()` del elemento ancla y reajustada para no salirse de la ventana (`design/docs/style/03-modales-menus.md` §12.7/§12.8) — evita el recorte por `overflow` de sus contenedores. Mismo motivo aplicable aquí.
- Tabla de z-index de overlays fijos documentada en `design/docs/style/02-componentes-layout.md` (§"Z-index de overlays"): nivel más alto actual es `1050` (menús contextuales). Cualquier cambio de estrategia de posicionamiento del tooltip debe decidir su z-index respetando esa tabla, y es un cambio que toca esa documentación de estilo.
