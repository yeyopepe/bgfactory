- **Name**: Script `build_obf.py` (variante completa ofuscada)
- **Code**: 00197
- **Type**: change
- **Creation date**: 2026-08-18

## Full description

**Origen:** esta entrada nace de dividir el cambio 00080 ("Botón 'Publicar' y script `build_obf.py`") en dos cambios independientes, tras detectarse en la implementación que el análisis conjunto era más complejo de lo esperado. Esta mitad cubre únicamente `build_obf.py`; la otra mitad (botón "Publicar" dentro de la app) vive en el cambio 00198. `build.py` no cambia: sigue generando el entregable base sin ofuscar (mesa + edición).

Script Python, ejecutado a mano desde terminal — mismo criterio de uso que `build.py` hoy. Ejecuta `build.py`, toma el HTML que genera y escribe una copia ofuscada del mismo con el sufijo `_obf`.

- Se guarda en la misma carpeta que ya usa `build.py` (`src/_output/versions/`), junto al fichero sin ofuscar del que parte.
- Nombre: mismo nombre base que genera `build.py` (`index-v{NNNN}.html`) con el sufijo `_obf` añadido antes de la extensión → `index-v{NNNN}_obf.html`.
- Ofusca con el mecanismo ya existente en el repositorio (`src/scripts/obfuscate_bundle.js`, apoyado en el vendor `src/scripts/vendor/javascript-obfuscator.browser.js`), sin cambios en sus ajustes.
- Si `build.py` o el ofuscador fallan, se detiene con un error claro, sin generar un entregable a medias.

Quién puede usarlo: quien desarrolla el proyecto, desde terminal — no es funcionalidad para el jugador final, sin relación con el botón "Publicar" del cambio 00198 (variantes distintas: completa vs. solo mesa).

Sin componente visual: es una herramienta de generación de fichero desde terminal, no añade ni cambia ninguna pantalla ni elemento de interfaz de la app.

## Technical notes

- El script `build.py` empaqueta el entregable recorriendo el grafo de imports ES estático a partir de `src/main.js` (funciones `visit_module`/`IMPORT_PATTERN`); no hay ningún tipo de eliminación de código muerto más allá de esa alcanzabilidad.
- `build_obf.py` puede reutilizar literalmente `obfuscate_bundle.js` (ejecutar `build.py` como subproceso, extraer el bloque `<script>` del HTML resultante con una regex, pasarlo por `obfuscate_bundle.js`, reinsertar el bundle ofuscado y escribir `index-v{NNNN}_obf.html`).
- `.claude/ms-context.json` no necesita ningún campo para `build_obf.py`: no forma parte del proceso de versión del framework (`framework.versioning`/`buildCommand`/`buildOutputPath` siguen apuntando solo a `build.py`).
- Nota de contexto para el futuro (no bloquea esta implementación): el usuario prevé que la skill `pv-version` desaparecerá más adelante, y que cualquier lógica que hoy dependa de esa skill debería vivir directamente en los scripts de build. Ya es así hoy: `pv-version` es un wrapper fino que solo ejecuta `buildCommand` (`python ./src/scripts/build.py`) y verifica el resultado — toda la lógica real vive en `build.py`. `build_obf.py` debe seguir el mismo principio: autocontenido en Python, sin depender de ninguna skill para su lógica.

## Notas técnicas del plan anterior (cambio 00080, pendiente de repetir el análisis)

> Volcado literal de la única mención a `build_obf.py` que llegó a hacer el `plan.md` ya descartado del cambio 00080 (que en realidad solo desarrolló la solución técnica del botón "Publicar", ver cambio 00198). Se guarda solo como punto de partida para cuando se repita el análisis desde cero — no es un plan vigente ni se ha verificado contra el código real.

> "Fuera de alcance: el script `build_obf.py` (variante completa ofuscada) no se implementa en este plan — es la otra mitad, independiente, del mismo cambio 00080. Este `plan.md` cubre únicamente el botón "Publicar" (variante de solo mesa ofuscada). Cuando se aborde `build_obf.py` conviene un `plan.md` propio, reutilizando el mecanismo de marcado `EDIT-ONLY-START`/`EDIT-ONLY-END` y el fichero `obfuscate_bundle.js` ya existentes (ver Apuntes técnicos de `description.md`)."

Nota: la referencia a reutilizar el marcado `EDIT-ONLY-START`/`EDIT-ONLY-END` no encaja obviamente con lo que describe este cambio (`build_obf.py` ofusca el entregable **completo**, mesa + edición, sin recortar nada) — puede ser un apunte impreciso del análisis anterior. Revisar con cuidado al repetir el análisis en vez de asumirlo como válido.
