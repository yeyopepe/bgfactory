- **Nombre**: Añadir sufijo " (demo)" a los recursos de prueba por defecto
- **Código**: fast-sufijo-demo-recursos-por-defecto_20260719
- **Tipo**: fast
- **Fecha**: 2026-07-19

## Prompt original del usuario

añade al nombre de los 3 recursos de prueba el sufijo " (demo)"

## Descripción completa

Los 3 recursos con los que arranca cualquier sesión totalmente nueva (un icono SVG y dos tipografías, sembrados en `data/defaultResources.js`) pasan a mostrar el sufijo " (demo)" en su nombre, para distinguirlos visualmente en la galería de Recursos de cualquier otro recurso que el usuario suba por su cuenta. Solo cambia el nombre mostrado; el fichero, tipo y demás datos de cada recurso no se tocan.

## Cambios aplicados

- `src/data/defaultResources.js`: se añade " (demo)" al campo `name` de los tres recursos de `DEFAULT_RESOURCES`:
  - `"icono_errante"` → `"icono_errante (demo)"`
  - `"Permanent Marker"` → `"Permanent Marker (demo)"`
  - `"Roboto"` → `"Roboto (demo)"`
