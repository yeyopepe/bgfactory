- **Name**: Quitar negrita al título del conjunto pre-definido en el modal de selección de componentes
- **Code**: 00285
- **Type**: fast
- **Creation date**: 2026-09-15

## Full description

En la ventana de selección de componentes, el título del conjunto pre-definido (la baraja francesa) se muestra en negrita y con un peso visual excesivo. Se ajusta para que se muestre con peso normal (sin negrita), manteniendo el resto de su estilo (color y tamaño) igual que antes.

## Technical notes

Regla CSS `.component-type-modal__preset-title` en `src/styles/main.css`: se cambia `font-weight: 700;` por `font-weight: 400;`.

## Applied changes

- `src/styles/main.css`: en la regla `.component-type-modal__preset-title`, cambiado `font-weight: 700;` por `font-weight: 400;` (quita la negrita del título del preset "baraja francesa" en el modal de selección de componentes).
