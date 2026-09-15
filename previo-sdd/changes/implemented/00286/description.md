- **[[[Name]]]**: Traducción incorrecta de la pestaña "Contenido" en inglés
- **[[[Code]]]**: 00286
- **[[[Type]]]**: fast
- **[[[Creation date]]]**: 2026-09-15

## [[[Full description]]]

En el panel de propiedades de los elementos, la pestaña que en español se llama "Contenido" no está correctamente traducida al inglés: se muestra como "Specific" en lugar de "Content".

Se corrige el texto de la traducción en inglés para que diga "Content", coincidiendo semánticamente con la versión en español.

## Technical notes

Clave de traducción `componentModal.tab.specific` en `src/data/i18n.en.js`, usada por `componentModal.js` para el título de la pestaña de propiedades específicas del elemento. Valor actual: `'Specific'`. Valor correcto: `'Content'` (coincide con `'Contenido'` en `src/data/i18n.es.js`).

## Applied changes

- `src/data/i18n.en.js`: clave `componentModal.tab.specific` cambiada de `'Specific'` a `'Content'`.

Verificación: `npm run test:all` ejecutado (402 tests, 400 OK). Los 2 fallos en `app-title.test.js` son preexistentes y no relacionados con este cambio (corresponden a trabajo en curso ajeno sobre edición del título de la app).
