# Análisis: scripts que aceleran las skills `.claude/skills/ms-*`

## Contexto

El framework `ms-*` (12 skills) ya sigue un patrón maduro: separar la mecánica de ficheros/parseo (determinista, gratis en tokens) en scripts Python, dejando al LLM solo el trabajo que requiere juicio (redactar, decidir, analizar causa raíz). Este patrón ya está aplicado en `ms-graph`, `ms-workflow` y `ms-status`. El objetivo de este análisis es detectar en qué otras skills se sigue haciendo "a mano" (por razonamiento del LLM) trabajo que es en realidad lógica determinista, y por tanto candidato a script — sin implementar nada todavía, solo el informe.

No se ha tocado ningún fichero de código del repo; esto es puramente analítico.

## Qué ya está scriptado (referencia)

| Skill | Script | Qué hace |
|---|---|---|
| `ms-workflow` | `scripts/next-change-number.py` | Escanea `{changesDir}/*` (menos `todo/`) y calcula el siguiente `xxxx` con padding. |
| `ms-workflow` | `scripts/move-change.py` | Mueve una carpeta `{xxxx}` entre estados, validando origen/destino. |
| `ms-implement` | `scripts/get-max-change-codes.py` | Devuelve el `xxxx` máximo por estado (`inProgress`/`implemented`/`closed`). |
| `ms-graph` | `scripts/ms_graph.py` (`extract`/`build`/`validate`) | Parsea imports/exports/llamadas y valida el `graph.json` contra `schema.json`. |
| `ms-status` | `scripts/collect_status.py` | Recorre `{changesDir}`, parsea `**Tipo**`/`## Idea`, calcula `subStatus`, agrega totales. |
| `ms-status` | `scripts/filter_status.py` | Igual que el anterior pero además rellena la plantilla y devuelve markdown ya listo. |

Todos comparten convención: viven en `scripts/` dentro de la skill, resuelven `repo_root()` por posición relativa, leen `.claude/ms-context.json` con override opcional por `--flag`, e imprimen **solo** el resultado (JSON o texto) por stdout para que el LLM lo parsee sin reprocesar nada.

## Skills sin script propio, y qué hacen a mano que podría scriptarse

**`ms-todo`** (paso 2) — genera un código alfanumérico corto (`[a-z0-9]`, 5 caracteres) que no colisione con las subcarpetas ya existentes en `{changesDir}/todo/`. Es exactamente el mismo tipo de problema que ya resuelve `next-change-number.py` para los códigos numéricos, pero aquí lo decide el LLM "a ojo" cada vez (generar random + comprobar colisión mentalmente). Candidato: `scripts/new-todo-code.py` — lista `{changesDir}/todo/*`, genera candidato aleatorio, comprueba colisión, imprime el código único por stdout.

**`ms-fast`** (paso 4) — construye el nombre de carpeta `fast-{título-kebab-case}_{yyyyMMdd}`, resolviendo colisión con sufijo `-2`, `-3`... si ya existe una del mismo día con título parecido. Slugificar (minúsculas, sin acentos, guiones) y la resolución de colisión es lógica pura de texto/fecha, hoy hecha "a mano" por el LLM. Candidato: `scripts/resolve-fast-folder.py --title "<nombre>"` — slugifica, añade fecha de hoy, comprueba colisión bajo `{changesDir}/implemented/`, imprime el nombre final de carpeta.

**`ms-version`** (paso 2, "verificar el resultado") — tras ejecutar `buildCommand`, hoy el LLM relee a mano `versionVariable` en `versionFilePath`, comprueba que `buildOutputPath` (con `{version}` sustituido) existe, y opcionalmente busca el número de versión dentro del HTML generado. Es una verificación puramente mecánica (regex + existencia de fichero + grep). Candidato: `scripts/verify-build.py` — lee `.claude/ms-context.json`, extrae la versión actual, resuelve la ruta de salida, comprueba existencia y que el string de versión aparece dentro; imprime un JSON `{version, outputPath, exists, versionFoundInOutput}` para que el LLM solo tenga que reportarlo, no calcularlo.

**`ms-init`** (paso 1 y 4) — comparar `.claude/ms-context.json` contra los campos obligatorios de `schema.json` (incluyendo la regla condicional: si `versioning: true`, exige 5 campos más) lo hace hoy el LLM leyendo el schema y comparando "a ojo". Lo mismo el merge sin pisar campos existentes del paso 4. Es validación de JSON Schema + merge de objetos, ambas deterministas. Candidato: `scripts/check-context.py` (imprime qué campos obligatorios faltan, aplicando ya la regla condicional de `versioning`) y opcionalmente `scripts/merge-context.py <patch.json>` para el merge del paso 4.

**`ms-status`** (paso 2, informe completo) — a diferencia del modo `<estado>` (ya delegado 100% a `filter_status.py`, que rellena la plantilla y no deja nada al LLM), el informe completo con `STATUS.template.md` sigue haciendo el LLM el mapeo de campos y el formateo de las tres listas de "en progreso". `collect_status.py` ya calcula todos los datos (`states`, `totalsByType`, `subStatus`) — solo falta que un script aplique también la plantilla completa, igual que ya hace `filter_status.py` para la filtrada. Candidato: extender `collect_status.py` (o añadir `scripts/render_status.py`) para que rellene `STATUS.template.md` completo y lo imprima ya listo, dejando al LLM sin trabajo de formateo en el caso general (solo en el modo `todo`, que es una lista simple, seguiría teniendo algo que redactar).

## Lo que NO merece script (y por qué)

- **`ms-close` / `ms-implement` / `ms-new`, "localizar entrada por `xxxx`"** — es un único `Path.is_dir()` sobre una carpeta conocida, o listar un puñado de subcarpetas de un solo estado. El coste de invocar un proceso Python es mayor que el de la propia comprobación; no hay parsing complejo que ahorre tokens. No es candidato real (a diferencia de lo que sugería el primer barrido).
- **`ms-fix`, `ms-tech-analysis`** — son skills de puro juicio (entender un bug, leer documentación y código para detectar incongruencias). No hay mecánica de ficheros determinista que extraer.
- **`ms-init`, comprobación de herramientas (paso 0)** — son comandos `--version` sueltos ejecutados directamente por el LLM vía Bash/PowerShell; envolverlos en un script Python no ahorra tokens (la salida ya es mínima) y añadiría una dependencia extra a un paso que corre antes de saber si Python está disponible.

## Resumen priorizado (por ahorro de tokens / frecuencia de uso)

1. **`ms-version` / `verify-build.py`** — se ejecuta cada vez que se corta versión; hoy implica releer un fichero HTML potencialmente grande para "verificar visualmente", que un grep determinista sustituye por completo.
2. **`ms-status` / render completo** — ya está resuelto el modo filtrado; cerrar el hueco del informe completo deja toda la skill sin lectura manual de `description.md`.
3. **`ms-init` / `check-context.py`** — se invoca en cada arranque de proyecto nuevo y cada vez que otra skill detecta configuración incompleta; hoy depende de que el LLM interprete bien la regla condicional del schema.
4. **`ms-todo` / `new-todo-code.py`** y **`ms-fast` / `resolve-fast-folder.py`** — menor frecuencia de uso, pero mismo patrón ya validado en `next-change-number.py`; bajo esfuerzo de implementación por analogía directa.

Esto es el informe solicitado; no se ha planificado ni realizado ninguna implementación de estos scripts.
