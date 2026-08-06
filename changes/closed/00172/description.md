- **Nombre**: Pista visual permanente en cabeceras de columna clicables
- **Código**: 00172
- **Tipo**: fix
- **Fecha creación**: 2026-08-06

## Prompt original del usuario

Deberíamos añadir alguna pista visual de qué columnas pueden clicarse para filtrar y cuáles no, porque ahora, si no tienen ninguna ordenació o filtro aplicado, no se sabe

Mete en el mismo cambio un fix de este bug: aunque no haya ningún elemento en las listas, hay que mostrar la cabeceras de las columnas. Ahora, si filtramos y no hay resultados, desaparecen las cabeceras y no se puede hacer nada más a partir de ahí

## Descripción completa

Este fix agrupa dos problemas encontrados justo después de implementar el cambio 00165 (menú de ordenar/filtrar por columna en los paneles de modo edición: Componentes, Recursos, Grupos):

**1. Sin pista visual permanente de qué cabeceras son clicables.** Las cabeceras de columna que se pueden pulsar para ordenar/filtrar (todas menos "Acciones") no muestran ninguna pista visual permanente de que son interactivas. Hoy solo cambia el cursor al pasar el ratón por encima, y el único indicador que existe se muestra exclusivamente cuando esa columna ya tiene aplicado algún orden o filtro.

Como consecuencia, al abrir cualquiera de estos paneles sin haber aplicado todavía ningún orden ni filtro, no hay forma de distinguir de un vistazo qué cabeceras admiten el menú de ordenar/filtrar y cuáles no, sin pasar el ratón por cada una de ellas una por una.

Comportamiento esperado: cualquier cabecera de columna que admita el menú de ordenar/filtrar debe mostrar una pista visual permanente (visible siempre, tenga o no algo aplicado), distinta del indicador que ya existe para cuando hay un orden y/o un filtro activo — ese indicador de "activo" sigue funcionando igual que hasta ahora. Las columnas que no admiten el menú (como "Acciones") no muestran ninguna pista en ningún caso.

**Propuesta visual acordada**: junto al texto de cualquier cabecera interactiva se muestra un pequeño icono. En su estado normal (sin nada aplicado en esa columna) se ve en un tono apagado, para indicar "disponible pero no activo" — mismo lenguaje visual que ya usa el resto de la app para distinguir lo disponible de lo activo. En cuanto esa columna pasa a tener un orden y/o un filtro aplicado, el mismo icono cambia a un tono destacado, sustituyendo al indicador "apagado" en vez de mostrar los dos a la vez.

**2. Las cabeceras desaparecen cuando un filtro no deja ningún resultado, dejando sin salida.** Si al filtrar (por texto libre o por un filtro de columna) no queda ninguna fila que mostrar, hoy desaparece la tabla entera, incluidas sus cabeceras — solo queda visible el mensaje de "sin resultados". Como el menú de ordenar/filtrar cuelga precisamente de esas cabeceras, en ese estado ya no hay forma de reabrirlo para quitar el filtro que ha dejado la lista vacía: el único camino para salir de ese estado es a través del cuadro de texto libre (si lo hay) o recargando la página.

Comportamiento esperado: las cabeceras de columna deben seguir mostrándose siempre, tenga o no filas la tabla en ese momento — el mensaje de "sin resultados" sustituye solo al cuerpo de la tabla (las filas), nunca a la cabecera. Así, un filtro de columna que deja la lista vacía se puede seguir quitando desde el propio menú de esa cabecera, sin tener que recargar la página.

## Apuntes técnicos

- **Pista visual permanente**: cabeceras interactivas marcadas hoy con la clase `.column-header--interactive` (`ui/tableColumnMenu.js`, función `attachColumnMenu`; `src/styles/main.css`) — solo `cursor: pointer`, sin ningún otro estilo permanente. El indicador de "activo" ya existente (misma función, variable `isActive`, inserta `.column-header-menu__indicator` en `var(--accent-blue)` solo si `isActive`) debe ampliarse para insertar el mismo icono en `var(--text-muted)` cuando la columna está en `columnDefs` pero no está activa. Afecta a `STYLE_BIBLE.md` (nueva convención visual, junto a la entrada ya existente sobre `.column-header-menu__indicator` del cambio 00165).
- **Cabeceras que desaparecen en vacío**: las tres funciones `renderBody` (`ui/componentList.js`, `ui/resourceList.js`, `ui/groupList.js`) construyen la `<table>` (con su `<thead>`) DESPUÉS de comprobar `if (lista.length === 0) { ...; return; }` — el `return` corta antes de llegar a construir la cabecera, así que en vacío no se crea ninguna `<table>`. Hay que invertir el orden: construir siempre `<thead>` (con el menú de columna ya cableado, para poder seguir quitando un filtro desde ahí) y, solo si la lista está vacía, sustituir el `<tbody>` por el mensaje de "sin resultados" en vez de sustituir la tabla entera.
