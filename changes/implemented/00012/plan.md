## (a) Anotaciones funcionales

Sin dudas técnicas que resolver con el usuario: es un renombrado literal de un valor de dato, ya acotado por completo en `description.md`. Fuera de alcance: cualquier cambio de comportamiento, propiedades o migración de datos persistidos (no existen componentes persistidos hoy).

## (b) Solución técnica

1. `src/main.js` (línea 39): cambiar `type: 'cuadro-texto'` por `type: 'texto'` en la semilla del componente por defecto.
2. `src/ui/componentModal.js`:
   - línea 34: `createComponent({ type: 'cuadro-texto' })` → `createComponent({ type: 'texto' })`.
   - línea 117: `if (workingComponent.type === 'cuadro-texto')` → `if (workingComponent.type === 'texto')`.
3. `src/ui/componentRenderer.js` (línea 18): `if (component.type === 'cuadro-texto')` → `if (component.type === 'texto')`.
4. Ningún otro cambio de código: `MIN_TEXT_BOX_WIDTH`/`MIN_TEXT_BOX_HEIGHT`, la clase CSS `text-box` y demás nombres internos no forman parte de la denominación del tipo (son detalles de implementación, no el valor de `type`), así que no se tocan.

## (c) Cambios de arquitectura

En `design/docs/ARCHITECTURE.md`:

- Línea 51 (modelo de datos): `type: string, // libre, p.ej. "carta", "token", "tablero", "cuadro-texto"` → sustituir `"cuadro-texto"` por `"texto"`.
- Línea 68 (§4 "Tipos de componente implementados"): `**'cuadro-texto'**: primer tipo concreto...` → `**'texto'**: primer tipo concreto...` (mismo listado de propiedades).
- Línea 81 (descripción de `ui/componentModal.js`): sustituir la referencia a `'cuadro-texto'` por `'texto'`.
- Línea 41 (§3, descripción de `playMode.js`): sustituir `los componentes "cuadro-texto"` por `los componentes "texto"`.
- Línea 80 (descripción de `ui/componentRenderer.js`): sustituir `(de momento solo 'cuadro-texto')` por `(de momento solo 'texto')`.
