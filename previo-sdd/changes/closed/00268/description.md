- **Name**: Cabecera unificada con icono, título y badge de contador en los paneles de Componentes, Recursos y Etiquetas
- **Code**: 00268
- **Type**: change
- **Creation date**: 2026-09-14

## Full description

Las cabeceras de los tres paneles flotantes de la aplicación — **Componentes**, **Recursos** y **Etiquetas** — cambian su aspecto visual, de forma idéntica en los tres.

Hoy las tres comparten el mismo patrón: un único texto en negrita con el número de elementos incluido dentro del propio texto (por ejemplo, "Componentes (55)") y, a su derecha, el botón de plegar/desplegar el panel. No llevan ningún icono.

El nuevo aspecto es:

- A la izquierda: un icono representativo del panel, seguido del título en negrita mostrando solo la palabra ("Componentes", "Recursos" o "Etiquetas"), sin el número.
- A la derecha: una badge redondeada con el número de elementos del panel, y a continuación el botón de plegar/desplegar que ya existe hoy, en ese orden. El botón de plegar/desplegar no cambia su comportamiento.

Este tratamiento se aplica exactamente igual en los tres paneles, tanto en modo edición como en modo juego (los tres paneles existen en ambos modos), sin restricción por rol (la aplicación no distingue perfiles de usuario). Es un cambio puramente visual: no introduce navegación nueva, no añade estados nuevos, no afecta a qué datos se guardan ni a cómo.

### Dudas de alcance resueltas

- **Icono de cada panel**: se añaden iconos nuevos representativos — uno de tipo rejilla/cuadrícula para Componentes y uno de tipo imagen/carpeta de recursos para Recursos; Etiquetas reutiliza el icono de etiqueta que el proyecto ya tiene definido para otros usos.
- **Texto del título**: pasa a mostrar solo la palabra, sin el número entre paréntesis que lleva hoy.
- **Posición del botón de plegar/desplegar**: se mantiene a la derecha, después de la nueva badge de número (badge y luego botón, en ese orden), sin eliminarlo ni cambiar su función.
- **Alcance**: el mismo patrón se aplica sin excepciones a los tres paneles; lo único que varía entre ellos es el icono y la palabra del título.

## Technical notes

- Los tres paneles están implementados de forma paralela y casi idéntica en `src/ui/componentList.js`, `src/ui/resourceList.js` y `src/ui/tagList.js`. Cada uno construye su cabecera igual: un `div` con clase `*-panel__header`, un `<strong>` con el texto `t('*.title', { count })` y un botón de plegar/desplegar — no hay un componente de cabecera compartido, por lo que el cambio debe aplicarse por separado en los tres archivos.
- CSS de cada cabecera: `.component-panel__header` (main.css ~línea 2548), `.resource-panel__header` (~línea 2672), `.tag-panel__header` (~línea 3291) — mismas reglas en los tres bloques hoy.
- Claves i18n a modificar (quitar el parámetro `{count}`): `componentList.title`, `resourceList.title`, `tagList.title`, definidas por idioma en `src/data/i18n.*.js` (ver `i18n.es.js` líneas 87, 95, 102).
- Iconos: `src/ui/icons.js` ya expone `iconSvg()`/`iconEl()` y un icono `tag` reutilizable para Etiquetas. No existe hoy ningún icono de tipo rejilla/grid ni de imagen/carpeta — habrá que añadirlos a ese módulo siguiendo la convención Lucide ya usada (SVG 24x24, stroke-width 2, currentColor) — ver también `previo-sdd/design/docs/style/003-modales-menus.md` (Iconografía), la referencia normativa de este módulo.
- Precedente de badge redondeada ya existente en el proyecto (aunque con otro propósito): `.component-lock-badge`, `.component-hidden-badge`, `.component-copy-badge` en `main.css` (~líneas 3108-3199), que usan el token `--shadow-badge`. Puede servir de referencia de estilo para la nueva badge de contador.
- No se detectó relación con ningún otro cambio en curso en `previo-sdd/changes/inProgress/` (00086, 00192, 00195, 00196, 00199, 00231, 00236, 00261): ninguno toca estas cabeceras ni sus archivos.
