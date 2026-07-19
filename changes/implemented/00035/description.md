- **Nombre**: Etiqueta de identificación queda oculta en componentes pegados al borde superior de la mesa
- **Código**: 00035
- **Tipo**: fix

## Prompt original del usuario

sigue sin funcionar

(seguimiento del fix 00033 "Etiqueta de identificación no se ve en componentes de texto": tras corregir ese bug, se comprobó que el componente de texto de ejemplo seguía sin mostrar la etiqueta en modo edición, mientras que otros componentes de texto creados por el usuario sí la mostraban)

## Descripción completa

En modo edición, la etiqueta de identificación ("Tipo: id") de un componente se posiciona por encima de la esquina superior izquierda del propio componente. Cuando un componente está situado muy cerca del borde superior de la mesa (como el componente de texto de ejemplo con el que arranca la app, situado justo en el origen de la mesa), la etiqueta queda parcialmente o totalmente tapada detrás de la cabecera fija de la aplicación, aunque técnicamente se esté generando y mostrando — de ahí que pareciera "no funcionar" solo en ese componente en concreto, no en los creados por el usuario (que arrancan con algo de margen respecto al borde).

Comportamiento esperado: la etiqueta debe verse siempre completa, sin quedar oculta tras la cabecera ni tras ningún otro elemento fijo de la interfaz, sea cual sea la posición del componente en la mesa (incluido el borde superior).
