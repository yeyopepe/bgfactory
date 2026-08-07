- **Fecha creación**: 2026-08-07

## (a) Anotaciones funcionales

**Fuera de alcance:** ningún otro comportamiento se toca. La carta suelta en la mesa, `'tableroPersonalizado'` y las miniaturas de "Ver contenido del mazo" (`ui/mazoContentModal.js`) siguen respetando el giro configurado con normalidad — la solución no modifica la firma compartida de `paintCartaFace`/`applyImageAdjustStyle`, solo lo que se le pasa desde la rama `'mazo'`.

**Dudas resueltas con el usuario:** ninguna pregunta abierta — `description.md` ya deja resueltas con el usuario las dos dudas de alcance (qué giro se ignora exactamente, y que la corrección se limita a la caja del mazo en ambos modos).

## (b) Solución técnica

1. **`src/ui/componentRenderer.js` (rama `component.type === 'mazo'`, ~línea 1675-1681) — pasar a `paintCartaFace` una copia del dorso con `rotation` forzado a `0`.** Justo antes de la llamada a `paintCartaFace(mazoContent, cartaArriba.properties?.caraTrasera, renderScale, width, height)`, construir una variable local con una copia superficial de `cartaArriba.properties?.caraTrasera` que fuerce `ajusteImagen.rotation` a `0`, y pasar esa copia en vez del objeto original:

   ```js
   const caraTrasera = cartaArriba.properties?.caraTrasera;
   const mazoCaraTrasera = caraTrasera
     ? { ...caraTrasera, ajusteImagen: { ...caraTrasera.ajusteImagen, rotation: 0 } }
     : caraTrasera;
   paintCartaFace(mazoContent, mazoCaraTrasera, renderScale, width, height);
   ```

   Es una copia superficial: `ajusteImagen` se clona aparte porque es el único campo anidado que hay que alterar; el resto de campos de `cara` (figuras, cuadros de texto, `fondoTipo`, `colorFondo`, etc.) se mantienen por referencia sin cambios, así que sus propios giros individuales (figuras/texto) se siguen pintando con normalidad — solo se ignora el giro de la imagen de fondo del dorso, tal como pide la descripción. No se muta `cartaArriba.properties.caraTrasera` original en ningún momento (evita afectar a la carta suelta en la mesa, que reutiliza ese mismo objeto).
   - Caso "mazo vacío": la rama `else` (`renderMazoEmptyPlaceholder`) no se toca, sigue sin cambios.
   - Caso "dorso sin imagen configurada": si `caraTrasera` es `undefined`/`null`, la expresión ternaria lo deja pasar tal cual (no hay nada que clonar); si `caraTrasera.ajusteImagen` es `undefined`, `{ ...undefined, rotation: 0 }` da `{ rotation: 0 }`, que `applyImageAdjustStyle` interpreta igual que el resto de campos por defecto (`zoom: 100, posX: 50, posY: 50`) — sin diferencia visual respecto a hoy, porque sin imagen de fondo (`fondoTipo === 'color'` o sin `imagenResourceId`) ese `ajusteImagen` ni siquiera se usa (ver `paintCartaFace`, línea ~296-311).

Ninguna otra tarea: es el único punto de la rama `'mazo'` que arma los datos para pintar la caja del mazo.

## (e) Verificación

1. Configura una carta con dorso (`caraTrasera`) que tenga una imagen de fondo con un giro (90°, 180° o 270°) en su `ajusteImagen.rotation`. Coloca esa carta como primera de un mazo, en Modo Edición y en Modo Juego: la caja del mazo debe mostrar la imagen de fondo del dorso sin girar (orientación 0°), en ambos modos.
2. Saca esa misma carta del mazo a la mesa (queda suelta, mostrando su dorso con normalidad): debe seguir viéndose girada según el `ajusteImagen.rotation` configurado, sin cambios respecto al comportamiento actual.
3. Si esa cara del dorso tiene además alguna figura o cuadro de texto con su propio giro individual configurado, esos elementos deben seguir viéndose girados con normalidad también dentro de la caja del mazo (solo se ignora el giro de la imagen de fondo, no el de figuras/texto).
4. Abre "Ver contenido del mazo" para ese mazo: las miniaturas siguen mostrando la cara frontal de cada carta (no el dorso), sin cambios.
5. Prueba un mazo vacío: sigue mostrando la imagen por defecto de siempre, sin cambios.
6. Prueba un mazo cuya primera carta tenga el dorso con fondo de color liso (sin imagen): la caja del mazo se ve igual que antes de este cambio (fondo de color, sin ningún giro que ignorar).
