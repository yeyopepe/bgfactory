## (a) Anotaciones funcionales

- Fuera de alcance: no se toca la sombra del efecto `.lifted` (`box-shadow: 6px 7px 9px 2px rgba(0,0,0,0.35)`), ni el momento en que se activa/desactiva, ni la transición de 150ms ya añadida en el cambio 00067. Modo Edición sigue sin verse afectado.
- Duda resuelta con el usuario: ¿qué nueva magnitud de desplazamiento? → Aproximadamente la mitad de la actual: de `translate(-4px, -9px)` a `translate(-2px, -4px)`.
- Duda resuelta con el usuario: ¿se reduce también la sombra? → No, se deja igual.

## (b) Solución técnica

1. **`src/styles/main.css`** (~línea 1541-1545, clase `.lifted`): cambiar `transform: translate(-4px, -9px);` por `transform: translate(-2px, -4px);`. No se toca `box-shadow` ni `transition` (ya correctos desde el cambio 00067).
2. No hace falta tocar `ui/componentRenderer.js`: `beginDragLift`/`endDragLift` solo añaden/quitan la clase `.lifted`, sin ningún valor numérico propio del desplazamiento.

## (d) Cambios en estilo

- **`STYLE_BIBLE.md`, sección 13, apartado "Efecto 'levantar' al arrastrar en Modo Juego"**: actualizar la cifra de desplazamiento documentada de `translate(-4px, -9px)` a `translate(-2px, -4px)`, dejando el resto del párrafo (sombra, transición añadida en el cambio 00067, alcance del efecto) sin cambios.
