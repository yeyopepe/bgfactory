- **Nombre**: Sección "Comportamiento" — elegir boca arriba/abajo al revelar carta del mazo
- **Código**: 00210
- **Tipo**: change
- **Fecha creación**: 2026-08-14

## Descripción completa

En el modal de "Editar propiedades del componente", pestaña "Específicas" de un mazo, se reorganizan las secciones introducidas por el cambio 00207 y se añade un campo nuevo:

- La sección que antes se llamaba **"Disposición"** pasa a llamarse **"Forma"**, y contiene únicamente los campos "Forma" y "Orientación" (sin cambios de comportamiento).
- Se añade una nueva sección, **"Cartas reveladas"**, situada entre "Forma" e "Imagen". Agrupa los campos "Disposición carta revelada" y "Texto carta revelada" (que antes vivían en la sección "Disposición", sin cambios de comportamiento) junto con el campo nuevo **"Revelar carta"**.

**"Revelar carta"**: un desplegable con dos opciones, "Boca arriba" (por defecto) y "Boca abajo". Decide cómo queda mostrada la carta al sacarla del mazo — hoy siempre se muestra boca arriba (cara frontal); con "Boca abajo" queda mostrada boca abajo (cara trasera) en su lugar. Aplica siempre que se saca una carta del mazo, sea cual sea la vía usada (click directo sobre el mazo en modo juego, o "Sacar" desde la ventana "Ver contenido del mazo" en cualquiera de los dos modos) — mismo resultado en todos los casos.

Cambiar este campo no voltea retroactivamente las cartas que ya se hubieran sacado del mazo antes — solo afecta a las que se saquen a partir de ese momento. Un mazo guardado antes de este cambio se comporta como si tuviera "Boca arriba" configurado (comportamiento idéntico al actual).

Este campo solo es editable en modo edición, igual que el resto de la pestaña "Específicas", y se guarda como el resto de propiedades del mazo (mismo alcance de datos que hoy, sin distinción de usuario o sesión).

## Apuntes técnicos

- `core/deck.js` → `computeSacarCartaDeMazo(mazo, carta)` fija hoy siempre `cartaChanges: { x, y, properties: { caraActual: 'frontal' } }`. Debe leer la nueva property del mazo (candidata: `caraCartaRevelada`, valores `'frontal'|'trasera'`, default `'frontal'`) y usarla en vez del literal fijo `'frontal'`.
- Todos los puntos donde se saca una carta de un mazo pasan por la misma función `core/state.js` → `sacarCartaDeMazo(mazoId, cartaId)` (que a su vez usa `computeSacarCartaDeMazo`): `modes/play/playMode.js` (click directo sobre el mazo, y "Ver contenido..." del menú contextual), `modes/edit/editMode.js` y `ui/componentModal.js` (botón "Ver contenido del mazo" en propiedades). Un único cambio en `computeSacarCartaDeMazo` cubre todos los casos, confirmado explorando el código — sin incongruencias entre documentación y código.
- Ficheros con los defaults/tipos y el formulario: `ui/componentModal.js` — `DEFAULT_MAZO_PROPERTIES`, nueva lista de opciones (mismo patrón que `MAZO_DISPOSICIONES`/`MAZO_ORIENTACIONES`/`MAZO_FORMAS`), y `renderMazoSpecificFields` (renombrar el título de la sección `fieldset.modal__section` de "Disposición" a "Forma" — solo el `<legend>`, sin tocar Forma/Orientación —, mover los campos "Disposición carta revelada"/"Texto carta revelada" a una sección nueva "Cartas reveladas" junto con "Revelar carta", mismo patrón de sección que ya usa esta función desde el cambio 00207).
