# errantes-board-game

Prototipo digital del juego de mesa Errantes.

## Desarrollo

El código fuente está en `/src`, organizado en capas (`core`, `modes`, `ui`, `data`). Para desarrollar y probar, abre `src/index.html` con un servidor estático local (p.ej. la extensión "Live Server" de VSCode) — no lo abras con doble clic, ya que usa módulos ES que no cargan bien vía `file://`.

## Generar el entregable

```powershell
./scripts/build.ps1
```

Genera un único fichero autocontenido en `src/_output/index.html`, que sí se puede abrir directamente con doble clic en cualquier navegador.

Ver el diseño técnico completo en [design/docs/design_technical.md](design/docs/design_technical.md).
