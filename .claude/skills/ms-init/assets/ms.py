#!/usr/bin/env python3
"""Menú interactivo del framework ms-*, para uso directo desde terminal.

Este fichero lo genera/actualiza la skill ms-init en la raíz del repo — no
lo edites a mano, tus cambios se perderían la próxima vez que se
re-inicialice el framework (ficha maestra en
.claude/skills/ms-init/assets/ms.py).

Pensado para un usuario avanzado que quiere consultar el estado del
framework ms-* sin pasar por Claude Code ni tener que recordar nombres de
scripts, rutas o parámetros: ejecuta este fichero y elige una opción del
menú.

Todas las opciones son de solo lectura (ninguna modifica nada en changes/)
y delegan en los scripts de la skill ms-status, que hacen todo el trabajo
real -- este menú solo pregunta qué se quiere ver y lo invoca.

Uso:
  python3 ms.py
"""

import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
STATUS_SCRIPTS = ROOT / ".claude" / "skills" / "ms-status" / "scripts"
CHANGES_DIR = ROOT / "changes"
CONTEXT_PATH = ROOT / ".claude" / "ms-context.json"

RING_ART = r"""
              _.-'''''''''-._
           ,-'                '-,
         ,'                      ',
        /        .---------.      \
       /       ,'           ',     \
      |       /     .---.     \     |
      |      |     ( ONE )     |    |
      |       \     `---'     /     |
       \       '.           ,'     /
        \        '---------'      /
         ',                      ,'
           '-,                ,-'
              '-._________.-'
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


MENU: list[tuple[str, "callable"]] = [
    ("Estado general del proyecto", show_general_status),
    ("Listado filtrado por estado (todo, inProgress, implemented...)", show_filtered_status),
    ("Ideas en todo/", show_todo_ideas),
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

    while True:
        print("\n=== ms-* — menú ===")
        for i, (label, _) in enumerate(MENU, start=1):
            print(f"  {i}. {label}")
        print("  0. Salir")

        choice = input("Elige una opción: ").strip()
        if choice == "0":
            break
        if choice == "":
            continue

        try:
            _, action = MENU[int(choice) - 1]
        except (ValueError, IndexError):
            print("Opción no válida.")
            continue

        print()
        action()
        input("\nPulsa Enter para volver al menú...")


if __name__ == "__main__":
    main()
