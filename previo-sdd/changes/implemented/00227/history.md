# Prompt history — 00227

Historical information about the analysis process, not current information. Records, verbatim and without rephrasing, the successive prompts with which the user raised and expanded this entry — they can be incomplete or contradictory with each other, since they reflect how the request evolved session by session, not the final result (that lives in `description.md`).

**Exclusive use of `pv-new` and `pv-fix`.** No other skill in the framework (`pv-how`, `pv-do`, `pv-status`, etc.) should read this file or take it into account: the source of truth for what's being asked is always `description.md`.

## 2026-08-27 — initial session

en el editor de cartas y tableros:
Problema actual: al pulsar el botón para maximizar la ventana del editor, sus límites quedan por fuera de la ventana del navegador, y no se puede volver a pulsar el botón para reducir la ventana ni los botones de aceptar y cancelar.

Cambio:
- al pulsar el botón para maximizar la ventana del editor, utiliza como máximo el 90 % del tamaño de la ventana.
- siempre que la ventana del navegador cambia de tamaño, se ajusta la ventana del editor si está en modo maximizado.

Prueba:
- Al maximizar la ventana del editor de cartas o tablero, toda la ventana, queda dentro de los límites de la ventana del navegador, y se puede volver a pulsar el botón para reducir la ventana del editor o los botones cancelar y aceptar
