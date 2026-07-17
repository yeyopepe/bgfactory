## (a) Anotaciones funcionales

Fuera de alcance: no se añade ningún mecanismo de persistencia alternativo (ni localStorage bajo otra forma, ni backend, ni fichero). Tras el cambio, recargar la página siempre arranca con el componente de texto por defecto — comportamiento esperado y aceptado según `description.md`.

No hubo dudas técnicas adicionales que resolver con el usuario más allá de las ya recogidas en `description.md` (eliminar `exportToJsonFile`/`importFromJsonFile` junto con el resto del módulo, sin conectarlas a la UI).

## (b) Solución técnica

1. Eliminar el fichero `src/data/persistence.js` completo (incluye `saveToLocalStorage`, `loadFromLocalStorage`, `exportToJsonFile`, `importFromJsonFile`). No hay más consumidores en el código además de `src/main.js` (verificado por búsqueda en `src/`).
2. En `src/main.js`:
   - Quitar el import `import { loadFromLocalStorage, saveToLocalStorage } from './data/persistence.js';`.
   - Quitar la llamada a `saveToLocalStorage(getComponents())` dentro del listener `on('components:changed', ...)`, dejando el listener solo con `renderAll()`.
   - Quitar el bloque `const persisted = loadFromLocalStorage(); if (persisted?.components) { loadComponents(persisted.components); } else { ... }`, dejando siempre la creación del componente de texto por defecto (el bloque `else` actual) como único camino de arranque.
   - Como `loadComponents` deja de usarse en este fichero, quitarlo también del import de `./core/state.js` (mantener el resto: `MODES, getState, getComponents, addComponent`). Si `getComponents` deja de tener otros usos aparte del listener afectado, revisar en el propio archivo — se mantiene porque sigue usándose en `saveToLocalStorage` actualmente; tras quitar esa llamada, comprobar si `getComponents` queda sin uso y quitarlo del import en ese caso.
3. Actualizar el comentario de cabecera de `src/main.js` (línea 1-2), que menciona "carga el estado persistido", para que refleje el arranque siempre con el componente por defecto.

## (c) Cambios de arquitectura

`architectureDocPath` = `design/docs/ARCHITECTURE.md`. Tras implementar, actualizar:

- Línea 19: quitar la entrada `data/    → persistencia (localStorage + import/export JSON)` del listado de carpetas (o la carpeta `data/` entera del listado, si `src/data/version.js` es el único fichero restante ahí — comprobar contenido de `src/data/` tras el borrado y ajustar la descripción en consecuencia, p.ej. `data/    → datos de versión de la app`).
- Línea 42: quitar la mención "esto dispara tanto el refresco de la UI como el autoguardado en `localStorage`", dejando solo que `components:changed` dispara el refresco de la UI.
- Sección 6 "Persistencia" (líneas 82-85): eliminar la sección completa, ya que deja de existir persistencia en el proyecto.
