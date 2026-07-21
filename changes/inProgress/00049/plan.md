- **Nombre**: Bloqueo de proporción 1:1 al redimensionar con Shift
- **Código**: 00049
- **Tipo**: change

## (a) Anotaciones funcionales

Sin anotaciones de alcance nuevas: el `description.md` ya resolvió con el usuario los puntos de alcance (aplica solo a redimensionado de ambos ejes, evaluación en vivo por movimiento, sin feedback visual nuevo). No ha surgido ninguna duda técnica adicional durante el análisis que requiriera confirmación del usuario.

## (b) Solución técnica

El redimensionado de ambos ejes es un único punto compartido: `ui/resizeHandle.js` (`attachResizeHandle`), reutilizado con `axis: 'both'` por los 5 tipos de componente afectados (ficha, tablero, dado, caja de texto, visor de documento) vía `ui/componentRenderer.js`. Los paneles laterales (`ui/componentList.js`, `ui/resourceList.js`) usan `axis: 'x'` y no se tocan.

1. **`src/ui/resizeHandle.js` — forzar 1:1 en `computeSize(e)` cuando `axis === 'both'` y Shift está pulsado**:
   - El propio evento nativo `mousemove`/`mouseup` (`e.shiftKey`) ya refleja en vivo si Shift está pulsado en ese instante concreto — no hace falta ningún listener adicional de `keydown`/`keyup` para detectarlo ni ningún estado propio que lo recuerde entre movimientos: basta con leer `e.shiftKey` dentro de `computeSize(e)`, que ya se invoca en cada `mousemove` y en el `mouseup` final. Esto cubre directamente el requisito de reevaluar Shift en cada movimiento, incluyendo que se suelte o pulse a mitad de arrastre.
   - Cuando `axis === 'both' && e.shiftKey`: en vez de aplicar `deltaX` a `width` y `deltaY` a `height` de forma independiente, calcular un único delta dominante (el de mayor magnitud absoluta entre `deltaX` y `deltaY`) y aplicarlo por igual a `width` y `height` a partir de `startSize`, de forma que el resultado antes de `clamp()` sea siempre cuadrado (`width === height`).
   - Cuando `axis !== 'both'` (paneles, eje único) o Shift no está pulsado: mantener exactamente el cálculo actual (comportamiento libre, sin cambios).
   - `clamp()` se sigue aplicando después, igual que ahora, sin cambios en su firma ni en cómo lo usa cada caller.
2. **Ningún cambio en `ui/componentRenderer.js` ni en los callers de `attachResizeHandle`**: como `axis: 'both'` ya lo pasan los 5 tipos afectados, el comportamiento 1:1 con Shift queda cubierto automáticamente por el cambio en `resizeHandle.js`, sin tocar cada tipo por separado. (El caso de `'dado'`, que ya fuerza cuadrado siempre vía su propio `clamp`, queda inalterado: con o sin Shift el resultado ya era cuadrado.)
3. Verificación manual en navegador (`src/index.html` con servidor estático): redimensionar ficha/tablero/caja de texto/visor de documento sin Shift (libre, comportamiento actual) y con Shift pulsado (cuadrado en vivo), incluyendo soltar/pulsar Shift a mitad de arrastre; comprobar que el panel lateral de componentes/recursos no se ve afectado (sigue siendo solo-ancho).

## (c) Cambios de arquitectura

`design/docs/ARCHITECTURE.md`, sección 5, entrada de `ui/resizeHandle.js` (línea ~146): añadir que, cuando `axis === 'both'`, mantener pulsada la tecla Shift durante el arrastre fuerza un aspecto 1:1 (cuadrado), reevaluado en vivo en cada `mousemove`/`mouseup` vía `e.shiftKey` (sin listener de teclado propio), antes de aplicar `clamp()`.

También ajustar la entrada de `ui/componentRenderer.js` (línea ~147), donde describe el manejador de `'ficha'`/`'tablero'`/etc. como "ambos ejes, sin forzar proporción": ese inciso deja de ser exacto tal cual — sustituir por algo como "ambos ejes, libre salvo Shift pulsado (1:1, ver `ui/resizeHandle.js`)".
