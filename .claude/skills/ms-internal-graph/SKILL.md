---
name: ms-internal-graph
description: Genera (o regenera) un fichero graph.json con el grafo de dependencias del código del proyecto (ficheros, símbolos exportados y relaciones entre ellos) para servir como contexto reducido de arquitectura. Trigger: /ms-internal-graph [rutaBase] [rutaGraphJson], o cuando el usuario pide generar/actualizar el grafo de contexto del proyecto.
argument-hint: "[rutaBase] [rutaGraphJson] (opcionales)"
model: claude-sonnet-5
effort: medium
metadata:
  version: 2.0.1
  uses: []
---

# ms-internal-graph

Explora el código fuente de un proyecto y escribe un `graph.json` con un grafo de dependencias reducido (ficheros, símbolos que exportan, y las relaciones entre ellos) pensado como contexto de arquitectura fácil de cargar por otras skills o conversaciones, sin tener que releer todo el código cada vez.

No depende del framework `ms-*` para funcionar (puede usarse en cualquier proyecto pasando las rutas como argumentos), pero si `.claude/ms-context.json` existe en este repo, lo aprovecha para rellenar los valores por defecto — en particular, el `graph.json` que genera es justo lo que `framework.docs.tech.projectGraphPath` de ese fichero está pensado para apuntar, y que `ms-implement` ya lee automáticamente como contexto si existe.

No usa el motor de la skill `graphify` (tree-sitter + subagentes LLM, esquema pesado). En vez de eso, la parte estructural (recorrer ficheros, resolver imports, localizar funciones/clases exportadas y sus llamadas) la hace de forma determinista y gratis en tokens el script [`scripts/ms_graph.py`](scripts/ms_graph.py) (Python estándar, sin dependencias externas). Tu trabajo es solo la parte que el script no puede hacer: leer cada fichero y escribir una frase de `purpose` por nodo. Esto reduce mucho la salida que tienes que generar tú mismo — nunca escribes a mano el JSON de nodes/edges, solo un mapa plano `{id: "propósito en una frase"}`.

## 0. Comprobar Python y resolver rutas

1. Comprueba que hay un intérprete de Python 3 disponible (`python3 --version` o, si falla, `python --version`). Si ninguno funciona, dile al usuario que esta skill necesita Python 3 instalado y detente aquí.
2. **`rutaBase`** (carpeta raíz del código a recorrer) y **`rutaGraphJson`** (fichero de salida): si el usuario los pasa como argumentos, úsalos tal cual.
3. Para lo que falte, si `.claude/ms-context.json` existe en la raíz del repo, léelo y usa `framework.sourcecodeDir` como `rutaBase` por defecto y `framework.docs.tech.projectGraphPath` como `rutaGraphJson` por defecto. El esquema de ese fichero está en [`../ms-init/schema.json`](../ms-init/schema.json) si necesitas consultarlo.
4. Si sigue faltando alguna de las dos rutas (no hay `ms-context.json`, o no tiene el campo correspondiente, y tampoco se pasó como argumento), pregúntala directamente al usuario en texto libre.

## 1. Extraer la estructura (script)

Elige un directorio de trabajo temporal (tu scratchpad de sesión si tienes
uno, o cualquier carpeta temporal escribible) y ejecuta:

```
python3 .claude/skills/ms-internal-graph/scripts/ms_graph.py extract \
  --base <rutaBase> \
  --out <tmp>/graph.skeleton.json \
  --exclude "<carpetas a excluir además de node_modules/.git/dist/build/out/coverage>"
```

Pasa en `--exclude` las carpetas propias del proyecto que no son código fuente a grafar: la carpeta que contiene `rutaGraphJson` (para no incluir el grafo de una ejecución anterior como si fuera código), y si `.claude/ms-context.json` existe, también la carpeta de `framework.changesDir` y la carpeta contenedora de `framework.buildOutputPath` si están configurados.

El script recorre `rutaBase`, parsea imports/exports con regex + conteo de llaves (sin tree-sitter), y escribe un *skeleton*: los mismos `nodes` y `edges` que llevará el `graph.json` final, pero sin el campo `purpose` (las llamadas que no pueda resolver con confianza a un símbolo conocido las omite, igual que harías tú a mano). Imprime además la lista completa de ids que necesitan `purpose` — esa lista es tu lista de tareas para el paso 2, no hace falta que releas el skeleton para saber qué falta.

Si el proyecto no es JS/TS (el script solo entiende sintaxis de módulos ES: `import`/`export`, `.js/.mjs/.cjs/.jsx/.ts/.tsx`), pásale `--ext` con las extensiones que correspondan; si el parseo estructural de ese lenguaje no tiene sentido con este script, sáltate este paso y construye tú mismo el skeleton a mano con la forma de [`schema.json`](schema.json) (mismos `nodes`/`edges`, sin `purpose`), y continúa igual en el paso 2.

## 2. Escribir los `purpose`

1. Si `.claude/ms-context.json` tiene `framework.docs.tech.architectureDocPath` y ese fichero existe, léelo primero como contexto general de arquitectura (capas, dirección de dependencias) — ayuda a escribir descripciones coherentes con lo ya documentado.
2. Para cada fichero que aparezca en la lista de ids del paso 1 (basta con leer el fichero una vez aunque tenga varios símbolos exportados), léelo y escribe:
   - Una frase de `purpose` para el nodo `"file"` (su responsabilidad).
   - Una frase de `purpose` para cada nodo `"function"`/`"class"` de ese fichero que aparezca en la lista (qué hace ese símbolo concretamente).
3. Reúne todo en un único objeto plano `{id: "purpose"}` con una entrada por cada id de la lista — este es el único JSON grande que produces tú; escríbelo en `<tmp>/purposes.json`.

No inventes nodos ni edges nuevos aquí ni cambies los que trajo el skeleton — tu única aportación en este paso son los textos de `purpose`.

## 3. Construir y validar el `graph.json` (script)

```
python3 .claude/skills/ms-internal-graph/scripts/ms_graph.py build \
  --skeleton <tmp>/graph.skeleton.json \
  --purposes <tmp>/purposes.json \
  --out <rutaGraphJson>
```

`build` fusiona tus `purpose` en el skeleton, valida el resultado contra [`schema.json`](schema.json) (ids únicos, sin edges colgantes, tipos y relaciones válidos, ningún campo obligatorio vacío) y **solo si pasa** escribe `<rutaGraphJson>`, sobrescribiendo cualquier contenido previo — `ms-internal-graph` siempre regenera el grafo entero, no actualiza de forma incremental.

- Si falla porque falta algún `purpose` (te lista los ids exactos), vuelve al paso 2 solo para esos ids y repite este paso.
- Si el skeleton lo construiste tú a mano en el paso 1 (proyecto no JS/TS), puedes en su lugar ejecutar `python3 .claude/skills/ms-internal-graph/scripts/ms_graph.py validate --graph <rutaGraphJson>` después de escribir tú mismo el `graph.json` completo, para comprobarlo igualmente antes de confirmar al usuario.

## 4. Confirmar al usuario

Indica la ruta escrita y el resumen que imprime `build` (número de ficheros, número de nodos función/clase, número de edges por tipo). Si `rutaGraphJson` coincide con `framework.docs.tech.projectGraphPath` de `.claude/ms-context.json`, recuerda al usuario que `ms-implement` ya lo carga automáticamente como contexto en sus próximas ejecuciones, sin necesidad de ningún paso adicional.
