## (a) Anotaciones funcionales

- Fuera de alcance: cualquier otro cambio al texto del título o al mecanismo de versión (sigue leyendo `CURRENT_VERSION` de `src/data/version.js`, sin escribirlo — ver [00022](../00022/description.md) y la regla vigente de que solo `ms-version` fija la versión).
- No hay dudas de alcance pendientes: el `description.md` ya especifica el comportamiento esperado (marcador en el título, sustituido en build).

## (b) Solución técnica

Causa raíz: `src/scripts/build.py` (línea ~195, añadida en el cambio 00022) sustituye el `<title>...</title>` completo comparándolo con el texto literal "Errantes, el juego de mesa" duplicado desde `src/index.html`. Si el título de `index.html` cambia, deja de coincidir y la versión no se inyecta, sin aviso.

1. **`src/index.html`** — añadir un marcador reservado para la versión dentro del propio título, en vez de dejarlo fijo o vacío:
   ```html
   <title>Errantes, el juego de mesa {VERSION} (dev)</title>
   ```
   Mismo patrón ya usado en el proyecto para placeholders que se rellenan más tarde (p.ej. `<script type="application/json" id="initial-state"></script>` vacío hasta que se rellena en build/runtime).

2. **`src/scripts/build.py` (línea ~179)** — el reemplazo existente que quita el sufijo `(dev)` para producir el título del entregable también dependía de conocer el título completo; se ajusta para que solo actúe sobre el sufijo `(dev)`, sin necesitar el resto del texto:
   ```python
   html = html.replace(' (dev)</title>', '</title>')
   ```
   Esto es un ajuste necesario en la misma línea que ya había que tocar por el punto 1 (el título deja de coincidir con el texto literal previo al añadir el marcador); no cambia su comportamiento, solo deja de depender del texto base del título.

3. **`src/scripts/build.py` (línea ~195)** — sustituir el reemplazo del título completo por una búsqueda del marcador `{VERSION}` dentro del título ya existente, y sustituir únicamente esa parte:
   ```python
   if '{VERSION}' not in html:
       raise SystemExit(
           "src/index.html no tiene el marcador '{VERSION}' en el <title>. "
           "Añadelo antes de generar el entregable."
       )
   html = html.replace('{VERSION}', f'v.{version}')
   ```
   Con esto `build.py` ya no necesita conocer ni reescribir el texto base del título: solo localiza el marcador y lo sustituye, igual que se pidió. Se añade el mismo tipo de fallo explícito que ya existe para `CURRENT_VERSION` mal formado (punto de "Casos límite" de `description.md`), en vez de generar silenciosamente un título sin versión.

No hace falta tocar `src/main.js` ni `src/data/version.js`.
