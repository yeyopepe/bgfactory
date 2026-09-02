# Idea: 8rjvr

## Idea
Script `build_obf.py` (variante completa ofuscada)

## Code
8rjvr

## Creation date
2026-09-02

## Notes

Idea democionada desde el cambio/fix `00197` (originalmente de tipo `change`) el 2026-09-02 por haber sido despriorizada. Se conserva todo el material acumulado.

### Descripción funcional completa (volcado literal del `## Full description` del cambio 00197)

**Origen:** esta entrada nace de dividir el cambio 00080 ("Botón 'Publicar' y script `build_obf.py`") en dos cambios independientes, tras detectarse en la implementación que el análisis conjunto era más complejo de lo esperado. Esta mitad cubre únicamente `build_obf.py`; la otra mitad (botón "Publicar" dentro de la app) vive en el cambio 00198. `build.py` no cambia: sigue generando el entregable base sin ofuscar (mesa + edición).

Script Python, ejecutado a mano desde terminal — mismo criterio de uso que `build.py` hoy. Ejecuta `build.py`, toma el HTML que genera y escribe una copia ofuscada del mismo con el sufijo `_obf`.

- Se guarda en la misma carpeta que ya usa `build.py` (`src/_output/versions/`), junto al fichero sin ofuscar del que parte.
- Nombre: mismo nombre base que genera `build.py` (`index-v{NNNN}.html`) con el sufijo `_obf` añadido antes de la extensión → `index-v{NNNN}_obf.html`.
- Ofusca con el mecanismo ya existente en el repositorio (`src/scripts/obfuscate_bundle.js`, apoyado en el vendor `src/scripts/vendor/javascript-obfuscator.browser.js`), sin cambios en sus ajustes.
- Si `build.py` o el ofuscador fallan, se detiene con un error claro, sin generar un entregable a medias.

Quién puede usarlo: quien desarrolla el proyecto, desde terminal — no es funcionalidad para el jugador final, sin relación con el botón "Publicar" del cambio 00198 (variantes distintas: completa vs. solo mesa).

Sin componente visual: es una herramienta de generación de fichero desde terminal, no añade ni cambia ninguna pantalla ni elemento de interfaz de la app.

### Material conservado

- `original-change-description.md` — la entrada de workflow original completa (incluye la sección `## Technical notes` con el análisis técnico ya hecho: reutilización literal de `obfuscate_bundle.js` como subproceso, que `.claude/ms-context.json` no necesita campo alguno para este script, y la nota de contexto sobre la previsible desaparición de la skill `pv-version` y el principio de mantener la lógica autocontenida en Python; más las "Notas técnicas del plan anterior" volcadas del cambio 00080 con la advertencia de que la referencia a reutilizar el marcado `EDIT-ONLY-START`/`EDIT-ONLY-END` puede ser un apunte impreciso — `build_obf.py` ofusca el entregable completo sin recortar nada).
- `original-change-history.md` — el historial de prompts / conversación del cambio.

No había `plan.md`: el cambio estaba en fase de documentación inicial (pendiente de `pv-how`).
