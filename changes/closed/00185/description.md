- **Nombre**: Color azul para el indicador de "tiene copias"
- **Código**: 00185
- **Tipo**: fix
- **Fecha creación**: 2026-08-07

## Prompt original del usuario

el nuevo icono de las cartas originales que tienen copia debe ser azul, en vez de rojo

## Descripción completa

El indicador de "tiene copias" (la píldora superpuesta en la esquina inferior izquierda de un componente original con copias vinculadas, introducida en el cambio 00183) se implementó con fondo rojo, igual que el indicador existente de "esto es una copia" que llevan las propias copias.

Esto está mal: ambos indicadores comparten el mismo color rojo, lo que dificulta distinguir de un vistazo si un componente es "una copia" o "tiene copias" — dos situaciones distintas que conviene diferenciar visualmente.

Se espera que el indicador de "tiene copias" pase a mostrarse en azul, mientras que el indicador de "esto es una copia" (que llevan las copias) se mantiene en rojo tal cual está hoy. El resto del comportamiento del indicador (icono, número de copias entre paréntesis, esquina, visibilidad solo en modo edición) no cambia.

## Apuntes técnicos

- Badge implementado en `src/ui/componentRenderer.js` (función `createHasCopiesBadge`) y `src/styles/main.css` (clase `.component-has-copies-badge`, actualmente `background: var(--error)`).
- Documentado en `design/docs/style/03-modales-menus.md` §12.3, apartado "Indicador de 'Tiene copias'" — el texto actual dice "mismo fondo `var(--error)` igual que el indicador de copia (mismo motivo: familia visual compartida)", que hay que reescribir para reflejar el nuevo color y quitar esa razón de "familia compartida" con `.component-copy-badge` (que sigue siendo rojo).
- Tokens de azul ya disponibles en `design/docs/style/01-tokens-visual.md`: `--accent-blue` (`#2c7dd8`, color de acción primario/interactivo) y `--accent-blue-dark` (`#123a66`, ya usado como fondo de `.component-id-label`).
- `design/docs/features/005-elementos-tipo-copia-vinculados-y-sincronizados-con-un-original.md` menciona actualmente "píldora roja" para el indicador de "tiene copias" — hay que actualizar esa descripción para que ya no diga "roja".
