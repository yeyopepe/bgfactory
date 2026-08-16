#!/usr/bin/env python3
"""Menú interactivo del framework ms-*, para uso directo desde terminal.

Este fichero lo genera/actualiza la skill ms-init en la raíz del repo — no
lo edites a mano, tus cambios se perderían la próxima vez que se
re-inicialice el framework (ficha maestra en
.claude/skills/ms-init/assets/ms.py).

Pensado para un usuario avanzado que quiere consultar o cerrar cambios del
framework ms-* sin pasar por Claude Code ni tener que recordar nombres de
scripts, rutas o parámetros: ejecuta este fichero y elige una opción del
menú.

La mayoría de las opciones son de solo lectura y delegan en los scripts de
la skill ms-status. La única que modifica algo es "Cerrar una entrada
implementada": mueve la carpeta de changes/implemented/{xxxx} a
changes/closed/{xxxx} (delegando en move-change.py de ms-internal-workflow,
que no toca el contenido de ningún fichero, solo la carpeta), y siempre
pide confirmación explícita antes de mover nada.

Uso:
  python3 ms.py
"""

import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
STATUS_SCRIPTS = ROOT / ".claude" / "skills" / "ms-status" / "scripts"
WORKFLOW_SCRIPTS = ROOT / ".claude" / "skills" / "ms-internal-workflow" / "scripts"
CHANGES_DIR = ROOT / "changes"
CONTEXT_PATH = ROOT / ".claude" / "ms-context.json"

NOMBRE_RE = re.compile(r"\*\*Nombre\*\*\s*[:—-]\s*(.+)")

RING_ART = r"""
       ::.   ..  ..                   
    --   ...:::::::::::.              
  .*- ... ....:::::-------:           
 .**:.::.::-=:=+++---:-=====-:        
 +**-::.       :=+**+++----==*+-      
=+*#+.               =*+++=:=+**+-    
++*##*:                 -**++=+*#*=.  
#=**##*=                   +##=-=*#+. 
=+=+**##+-                  .##*-+*#= 
 *+++***##+-                  +#+=***:
 .#*++*******=:                **=**+.
   ***+*********+-.             *##=. 
    -***+++*######**+-:..     ..-...: 
      -+==+=++#####****++==--------:  
        .****++*+****+#*****+++--:    
           .*%%%#+%##+*=+***=-:-      
                :*##%%%%%#++:         
"""

RING_INSCRIPTION = (
    "Un script para gobernarlos a todos.\n"
    "Un script para encontrarlos, un script para invocarlos a todos\n"
    "y ejecutarlos en la terminal."
)


def run_script(script: Path, *args: str) -> None:
    subprocess.run([sys.executable, str(script), *args], cwd=ROOT)


def show_general_status() -> None:
    run_script(STATUS_SCRIPTS / "render_status.py")


def show_todo_ideas() -> None:
    run_script(STATUS_SCRIPTS / "list_todo.py")


def list_states() -> list[str]:
    if not CHANGES_DIR.is_dir():
        return []
    return sorted(p.name for p in CHANGES_DIR.iterdir() if p.is_dir())


def show_filtered_status() -> None:
    states = list_states()
    if not states:
        print(f"No hay carpetas de estado en {CHANGES_DIR}.")
        return

    print("\nEstados disponibles:")
    for i, state in enumerate(states, start=1):
        print(f"  {i}. {state}")

    choice = input("Elige un estado (número, o vacío para cancelar): ").strip()
    if not choice:
        return

    try:
        state = states[int(choice) - 1]
    except (ValueError, IndexError):
        print("Opción no válida.")
        return

    run_script(STATUS_SCRIPTS / "filter_status.py", state)


def list_implemented_entries() -> list[tuple[str, str]]:
    implemented_dir = CHANGES_DIR / "implemented"
    if not implemented_dir.is_dir():
        return []

    entries = []
    for entry_dir in sorted(p for p in implemented_dir.iterdir() if p.is_dir()):
        nombre = "(sin nombre)"
        description_path = entry_dir / "description.md"
        if description_path.is_file():
            match = NOMBRE_RE.search(description_path.read_text(encoding="utf-8"))
            if match:
                nombre = match.group(1).splitlines()[0].strip().strip("` ")
        entries.append((entry_dir.name, nombre))
    return entries


def close_entry() -> None:
    entries = list_implemented_entries()
    if not entries:
        print("No hay ninguna entrada en changes/implemented/ pendiente de cerrar.")
        return

    print("\nEntradas implementadas, pendientes de cerrar:")
    for i, (code, nombre) in enumerate(entries, start=1):
        print(f"  {i}. {code} — {nombre}")

    choice = input("Elige una entrada a cerrar (número, o vacío para cancelar): ").strip()
    if not choice:
        return

    try:
        code, nombre = entries[int(choice) - 1]
    except (ValueError, IndexError):
        print("Opción no válida.")
        return

    confirm = input(f"¿Confirmas mover '{code} — {nombre}' a changes/closed/? (s/N): ").strip().lower()
    if confirm not in ("s", "si", "sí"):
        print("Cancelado.")
        return

    run_script(
        WORKFLOW_SCRIPTS / "move-change.py",
        "--xxxx", code,
        "--from", "implemented",
        "--to", "closed",
    )


MENU: list[tuple[str, "callable"]] = [
    ("Estado general del proyecto", show_general_status),
    ("Listado filtrado por estado (todo, inProgress, implemented...)", show_filtered_status),
    ("Ideas en todo/", show_todo_ideas),
    ("Cerrar una entrada implementada (mover a changes/closed/)", close_entry),
]


def main() -> None:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")

    if not CONTEXT_PATH.is_file():
        print("Este proyecto no tiene el framework ms-* inicializado.")
        print("Ejecuta primero /ms-init desde Claude Code.")
        return

    print(RING_ART)
    print(RING_INSCRIPTION)

    exit_index = len(MENU) + 1

    while True:
        print("\n=== ms-* — menú ===")
        for i, (label, _) in enumerate(MENU, start=1):
            print(f"  {i}. {label}")
        print(f"  {exit_index}. Salir")

        choice = input("Elige una opción: ").strip()
        if choice == "":
            continue

        try:
            index = int(choice)
        except ValueError:
            print("Opción no válida.")
            continue

        if index == exit_index:
            break

        try:
            _, action = MENU[index - 1]
        except IndexError:
            print("Opción no válida.")
            continue

        print()
        action()
        input("\nPulsa Enter para volver al menú...")


if __name__ == "__main__":
    main()
