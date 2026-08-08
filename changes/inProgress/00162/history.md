# Historial de prompts — 00162

Información histórica del proceso de análisis, no información vigente. Recoge, tal cual y sin reformular, los prompts sucesivos con los que el usuario ha ido planteando y ampliando esta entrada — pueden ser incompletos o contradictorios entre sí, ya que reflejan cómo evolucionó la petición sesión a sesión, no el resultado final (eso vive en `description.md`).

**Uso exclusivo de `ms-new` y `ms-fix`.** Ninguna otra skill del framework (`ms-how`, `ms-do`, `ms-status`, etc.) debe leer este fichero ni tenerlo en cuenta: la fuente de la verdad sobre qué se pide es siempre `description.md`.

## 2026-08-06 — migrado desde description.md

Crear un nuevo elemento tipo "Meeple" con las siguientes características:
- Forma rectangular base
- Capacidad de redimensionar
- Acepta un recurso de imagen como contenido (zoom y ajuste de posición)
- Si la imagen tiene fondo transparente, la forma del meeple también aplica transparencia (respetando los píxeles transparentes de la imagen)

Este elemento combina la funcionalidad de forma redimensionable con la capacidad de llevar contenido visual (imagen), similar a cómo funcionarían las figuras geométricas mejoradas y tableros personalizados.

(Idea apuntada previamente en `todo/x7jyb` y convertida en este cambio, refinada en conversación con el usuario antes de documentarla.)
