## Idea
Arreglar la generación de versión (ms-version no funciona bien)

## Código
vfix1

## Notas
El usuario reporta que el proceso de generar la versión (skill `ms-version`, que fija la versión en `src/data/version.js` y ejecuta `python ./src/scripts/build.py`) no funciona bien. Pendiente de investigar qué falla concretamente antes de convertirlo en un fix real con `ms-fix`.
