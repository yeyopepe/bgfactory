## (a) Anotaciones funcionales

**Fuera de alcance:** cualquier otro ajuste del componente "Dado" (siluetas, colores, lanzamiento, redimensionado) — este fix se limita estrictamente al tamaño del texto del resultado.

**Dudas resueltas:** ninguna; el propio `description.md` ya deja claro que se trata de aumentar la proporción de tamaño de fuente respecto al tamaño del dado, sin cambiar ningún otro comportamiento.

## (b) Solución técnica

1. **`src/ui/componentRenderer.js`**, rama `'dado'` de `renderComponentsOnTable`: la línea `resultEl.style.fontSize = \`${size * 0.32}px\`;` calcula el tamaño de fuente del resultado como una proporción fija (`0.32`) del lado del dado (`size`). Es la única causa del texto pequeño reportado — se sube esa proporción a `0.45` (aumento notable, ~40%), manteniendo el resto de la lógica igual: sigue siendo relativa a `size`, así que se sigue ajustando automáticamente al redimensionar el dado, y no afecta a color, tipografía, centrado ni a ninguna otra propiedad del resultado.
