# Cómo compilar el entregable de este proyecto

Fichero propio de `ms-version` (no forma parte de `.claude/ms-context.json`): describe el procedimiento de shell/build concreto de este repo para generar el entregable jugable. Lo rellena `ms-version` la primera vez que se invoca y no existe todavía, preguntando al usuario; en invocaciones siguientes se lee y se sigue tal cual, sin volver a preguntar.

## Comando(s) a ejecutar

Desde la raíz del repo:

```
python src/scripts/build.py
```

## Fichero(s) generado(s)

`src/_output/versions/index-v{NNNN}.html`, un único HTML autocontenido (JS, CSS, imágenes y fuentes incrustados). `{NNNN}` es un contador automático e independiente del `XXXX` de `ms-version`: el script lee `CURRENT_VERSION` de `src/data/version.js`, la incrementa en 1, la guarda ahí mismo y nombra el fichero con ese nuevo valor. El fichero más reciente es siempre el que imprime el propio script en su salida ("Build generado en ...") tras la ejecución.

## Notas

- No requiere Node.js.
- El build modifica `src/data/version.js` (incrementa `CURRENT_VERSION`) como efecto secundario; ese cambio queda en el repo tras ejecutar el script.
