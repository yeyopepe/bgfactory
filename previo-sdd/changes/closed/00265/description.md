- **Name**: Falta de sombra al levantar componentes con extrusión activada (regresión de 00264)
- **Code**: 00265
- **Type**: fix
- **Creation date**: 2026-09-14

## Full description

Regresión introducida por el fix 00264 (que corrigió el marco/sombra cuadrado incorrecto de componentes con silueta no rectangular al "levantarse" en Modo Juego). Tras esa corrección, un componente con "extrusión" activada (el efecto de profundidad/relieve configurable en cualquier tipo, activo por defecto en el componente 'dado') dejó de mostrar cualquier sombra al levantarse: ya no aparece el marco cuadrado incorrecto (eso sigue corregido), pero tampoco aparece ninguna sombra de "levantado" en absoluto — el componente se ve completamente plano mientras se arrastra, en vez de mostrar el desplazamiento y la sombra más marcada que simulan que se despega de la mesa.

Comportamiento esperado: un componente con extrusión activada debe seguir mostrando la sombra de "levantado" al arrastrarlo (siguiendo su silueta real cuando corresponda, tal como ya corrige 00264), igual que un componente sin extrusión — la extrusión no debe anular ni impedir el efecto visual de "levantado".

## Technical notes

- Causa raíz: cuando un componente tiene `profundidad > 0` (efecto de extrusión, `core/component.js`), `ui/componentRenderer.js` fija su sombra de reposo directamente como **estilo inline** (`element.style.filter` o `element.style.boxShadow`, según el tipo — ver `buildExtrusionLayers`/`resolveExtrusionColor` y sus puntos de aplicación). Un estilo inline tiene siempre prioridad sobre cualquier regla de una hoja de estilos, sin importar su especificidad — así que ninguna regla `.lifted`/`.dice.lifted`/`.carta--hex.lifted` (añadida en 00264) podía cambiar `filter`/`box-shadow` mientras ese inline siguiera puesto, y el componente se quedaba visualmente igual que en reposo al levantarlo.
- El componente `'dado'` es el caso más representativo porque `createDefaultComponent('dado')` (`ui/componentModal.js`) fija `profundidad: 4` por defecto — cualquier dado recién creado reproduce el bug sin configuración adicional.
- Solución aplicada: `beginDragLift`/`endDragLift` (`ui/componentRenderer.js`) ahora retiran temporalmente el `style.filter`/`style.boxShadow` inline del elemento al añadir la clase `.lifted` (guardándolo en `dataset`), dejando que las reglas CSS del estado "levantado" tomen el control mientras dura el arrastre, y lo restauran tal cual al soltar (`endDragLift`). Solución genérica, no depende de conocer la extrusión de cada tipo concreto.
- Se añadió `src/test/functional/lift-shadow.test.js`, con un nuevo helper `loadRealStylesheet()` en `src/test/helpers.js` (el runner de tests no carga `styles/main.css` por defecto, así que sin este helper `getComputedStyle` no reflejaría ninguna regla CSS real).
