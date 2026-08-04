## (a) Anotaciones funcionales

- Fuera de alcance: radio de esquina configurable (se usa un valor fijo, `8px`, mismo criterio que el redondeo de esquinas de carta en `core/cardProportions.js`), sustituir alguno de los tipos existentes, o cambiar el comportamiento de inserción por defecto (sigue creándose como `'circular'`).
- No ha hecho falta resolver ninguna duda adicional con el usuario: `description.md` ya deja el alcance cerrado (radio fijo, redimensionado libre como `'cuadrada'`, convive con los dos tipos existentes).

## (b) Solución técnica

1. **`src/ui/cardShapeModal.js`** — añadir una tercera entrada al array `SHAPE_TYPE_OPTIONS` (tras `'cuadrada'`, línea ~47):
   ```js
   {
     value: 'redondeada',
     label: 'Rectángulo redondeado',
     icon: '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="2"><rect x="2.5" y="2.5" width="13" height="13" rx="4"/></svg>',
   },
   ```
   Icono tomado del mockup visual `design_tipo-figura-rectangulo-redondeado.html`. No requiere ningún otro cambio en este fichero: el listener de click que fuerza lado igual ya comprueba `value === 'circular'` explícitamente, así que `'redondeada'` queda libremente redimensionable sin tocar nada, igual que `'cuadrada'`.

2. **`src/ui/componentRenderer.js`** (línea 319, función `paintShape`) — sustituir el ternario binario por un mapeo que cubra los tres tipos:
   ```js
   const SHAPE_BORDER_RADIUS = { circular: '50%', redondeada: '8px' };
   ...
   shapeEl.style.borderRadius = SHAPE_BORDER_RADIUS[shape.tipo] || '0';
   ```
   (o expresión equivalente en línea, sin extraer a módulo compartido — mismo estilo local que ya usa el fichero). `8px` reutiliza el mismo valor fijo que `core/cardProportions.js` usa para el redondeo de esquinas de la carta completa (línea ~54), tal como pide `description.md`.

3. **`src/ui/cardEditorModal.js`** (línea 735, preview en vivo del editor) — aplicar exactamente el mismo cambio que en el punto 2, para mantener editor y render final sincronizados (mismo mapeo `SHAPE_BORDER_RADIUS`, declarado localmente en este fichero ya que no comparten módulo).

4. No se requieren cambios en `onAddShape` (`cardEditorModal.js`, líneas ~440-455): una figura nueva se sigue creando con `tipo: 'circular'` por defecto; el usuario cambia a `'redondeada'` desde la ventana de edición, como ya hace hoy para `'cuadrada'`.

No hay ningún otro punto del código que discrimine por `shape.tipo === 'circular'` / `'cuadrada'` (verificado con búsqueda completa en `src/`): el único condicional de tipo, aparte del `borderRadius`, es el forzado a lado igual al pasar a `'circular'` en `cardShapeModal.js`, que no aplica a `'redondeada'`.

No aplican las secciones (c) ni (d): no se ha detectado ninguna incongruencia entre `ARCHITECTURE.md`/`STYLE_BIBLE.md` y el código en este punto (no hay documentación sobre el catálogo de tipos de figura del editor de cartas), y esta solución no modifica la arquitectura básica del proyecto ni el estilo visual documentado — solo añade una entrada más a un catálogo ya existente, reutilizando un valor de radio ya usado en otro punto del código.
