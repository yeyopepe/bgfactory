# Navegación — Cambiar el idioma desde el selector del panel

Caso de uso: qué ofrece el selector de idioma dentro del panel de configuración y qué transición visual provoca elegir una opción. Responde a "¿qué opciones ofrece esta interacción y qué efecto tienen?", distinto del caso de uso de abrir/cerrar el panel (fichero `design_navigation_abrir-cerrar-panel-configuracion.md`).

```mermaid
stateDiagram-v2
    [*] --> PanelEnIdiomaActivo

    state "Panel abierto, toda la app en el idioma activo" as PanelEnIdiomaActivo
    state "Selector desplegado: opciones Espanol y English" as SelectorDesplegado
    state "Idioma aplicado al instante" as IdiomaAplicado

    PanelEnIdiomaActivo --> SelectorDesplegado : abrir el desplegable de idioma
    SelectorDesplegado --> PanelEnIdiomaActivo : elegir el idioma que ya esta activo
    SelectorDesplegado --> IdiomaAplicado : elegir el otro idioma
    IdiomaAplicado --> PanelEnIdiomaActivo : la app y el panel se repintan en el nuevo idioma
```

## Notas

- **Opciones del selector**: siempre ofrece **todos los idiomas disponibles** (en esta versión: «Español» y «English»), cada opción escrita en su propio idioma, independientemente de cuál sea el idioma activo.
- **Elegir el idioma que ya está activo**: no produce ningún cambio visible.
- **Elegir el otro idioma**: el cambio es inmediato y sin recargar. Se repinta todo el chrome de la aplicación y también la propia ventana de configuración (título, etiquetas, nota de ayuda, botón «Cerrar»), que **no se cierra**. El selector queda reflejando el nuevo idioma activo.
- La preferencia queda guardada en el navegador en el mismo momento del cambio; al reabrir la aplicación se arranca directamente en ese idioma.
- La información de versión del panel (p. ej. «BG Factory v.00246») no cambia con el idioma.
