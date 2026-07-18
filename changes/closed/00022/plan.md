## (a) Anotaciones funcionales

- Fuera de alcance: cualquier cambio al mecanismo de generación/incremento de la versión (sigue siendo responsabilidad exclusiva de `ms-version`, ver `description.md`).
- Dudas de alcance ya resueltas en `description.md` (con el usuario, durante `ms-new`): formato del número con punto (`v.XXXX`), no se toca `src/data/version.js` salvo lectura, y la fuente de la versión sigue siendo la misma de hoy.
- Ampliación de alcance decidida durante la planificación: además de añadir la versión, se renombra el texto base del título de "Errantes" a "Errantes, el juego de mesa" (tanto en desarrollo como en el entregable generado).

## (b) Solución técnica

1. **`src/index.html`** — renombrar el título de desarrollo: `<title>Errantes (dev)</title>` → `<title>Errantes, el juego de mesa (dev)</title>`.
2. **`src/scripts/build.py` (línea ~179)** — actualizar el reemplazo existente del título para el nuevo texto base:
   ```python
   html = html.replace('<title>Errantes, el juego de mesa (dev)</title>', '<title>Errantes, el juego de mesa</title>')
   ```
3. **`src/scripts/build.py`** — inyectar la versión en el `<title>` del HTML generado, justo después de resolver `version` (línea ~193, tras el `version_match`), y antes de escribir el fichero de salida (línea ~195 en adelante):
   ```python
   html = html.replace('<title>Errantes, el juego de mesa</title>', f'<title>Errantes, el juego de mesa v.{version}</title>')
   ```
   Esto reutiliza el mismo `version` ya leído de `src/data/version.js` para nombrar el fichero de salida (`index-v{version}.html`) — no se añade ninguna lectura ni escritura adicional de `version.js`, y se mantiene el `raise SystemExit` existente si `CURRENT_VERSION` no tiene el formato esperado (la nueva línea nunca se alcanza en ese caso, porque el `raise` ocurre antes).
   - El título del entregable pasa de `<title>Errantes, el juego de mesa</title>` a, por ejemplo, `<title>Errantes, el juego de mesa v.0018</title>`.

No hace falta tocar `src/main.js` ni `src/data/version.js`: la versión ya se lee correctamente hoy en `build.py`, solo se añade dónde se usa ese valor ya calculado.
