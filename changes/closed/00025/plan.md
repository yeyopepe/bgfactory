## (a) Anotaciones funcionales

Sin dudas de alcance pendientes: el usuario confirmó durante el análisis que el problema afecta únicamente a los tableros con patrón de casillas **cuadradas** — los de patrón **hexagonal** se pintan bien siempre. Esto acota la causa raíz a la parte de renderizado específica del patrón cuadrado.

Fuera de alcance: cualquier otro ajuste visual del componente "tablero" no relacionado con este bug (p.ej. el bisel del borde, el fondo de tipo imagen) no se toca.

## (b) Solución técnica

Causa raíz: la regla CSS `.board { background-repeat: no-repeat; }` en [`src/styles/main.css`](src/styles/main.css) (líneas 402-404) se aplica sin condición a todo componente de tipo `tablero`. El patrón de casillas cuadradas se pinta en [`src/ui/componentRenderer.js`](src/ui/componentRenderer.js) (función `renderComponentsOnTable`, rama `patronForma !== 'hexagonal'`) mediante dos `linear-gradient` puestos como `background-image` con un `background-size` del tamaño de una sola celda — para que la rejilla cubra todo el tablero necesita que el navegador repita (`tile`) ese fondo, que es el comportamiento por defecto (`background-repeat: repeat`). Al forzar `no-repeat` desde CSS, solo se pinta una única celda en la esquina superior izquierda y el resto del tablero queda en blanco (efecto "vacío").

El patrón hexagonal no usa `background-image` (dibuja un `<svg>` superpuesto con polígonos, ver `renderHexGrid`), por eso no le afecta esta regla y siempre se ve bien. El fondo de tipo imagen (`fondoTipo === 'imagen'`) tampoco se ve afectado visualmente porque usa `background-size: cover`, que cubre el contenedor entero independientemente de si repite o no.

1. En `src/styles/main.css`, eliminar la regla `.board { background-repeat: no-repeat; }` (líneas 402-404) — no es necesaria para ningún caso (el fondo de imagen no depende de ella, y el patrón cuadrado necesita el valor por defecto `repeat`) y es la causa del bug.

No hace falta tocar `componentRenderer.js`: una vez el CSS deja de forzar `no-repeat`, el `linear-gradient` ya tileado se pinta correctamente desde la primera inserción del tablero, sin necesidad de pasar por una edición de propiedades que hoy dispara un re-render completo y "tapa" el síntoma solo si de paso se cambia algo que reduce el patrón a una única celda visible.
