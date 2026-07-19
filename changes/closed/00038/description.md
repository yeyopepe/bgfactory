- **Nombre**: Listas anidadas del parser Markdown no anidan con indentado de 2 espacios
- **Código**: 00038
- **Tipo**: fix

## Prompt original del usuario

Los indentados no funcionan.
Los checkbox tampoco (- [ ] y - [x])

## Descripción completa

En el componente "Visor de documentos" con formato Markdown, una lista con elementos anidados (un ítem de lista dentro de otro) no queda anidada cuando el contenido hijo está indentado con solo 2 espacios respecto al ítem padre — que es la forma más habitual de escribir listas anidadas a mano o con la mayoría de editores. En su lugar, el ítem "hijo" se muestra como un ítem más al mismo nivel que el padre, perdiendo la jerarquía.

Ejemplo que reproduce el problema (formato Markdown, en el campo "Contenido" del componente):

```
- Cartas
  - Eventos
  - Misiones personales
```

Resultado actual: los tres aparecen como una única lista plana, sin ningún nivel de anidación.
Resultado esperado: "Eventos" y "Misiones personales" aparecen como una sublista dentro del ítem "Cartas".

El comportamiento correcto esperado, confirmado por el usuario: el indentado del contenido hijo debe reconocerse como anidado con un mínimo de 2 espacios, o con 1 tabulador — no debe exigirse un mínimo de 4 espacios como ocurre hoy.

Este comportamiento afecta a cualquier profundidad de anidación (una sublista dentro de otra sublista), y tanto a listas sin ordenar como a listas numeradas.

## Apuntes técnicos

- El fix se limita al parser de listas de `src/core/markdown.js` (cambio 00037, función interna de análisis de listas). No afecta a ningún otro fichero: el contrato de `markdownToHtml(text)` no cambia.
- Fuera de alcance de este fix: la sintaxis de listas de tareas / casilla de verificación (`- [ ] texto`, `- [x] texto`) reportada en el mismo mensaje del usuario no es un bug de esta funcionalidad — es una sintaxis GFM extendida, explícitamente fuera de alcance ya en el análisis del cambio 00037 (que solo cubre la "sintaxis básica" de markdownguide.org, no las extensiones GFM). Se gestiona aparte como una posible ampliación de alcance nueva, no como parte de este fix.
