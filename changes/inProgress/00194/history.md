# Historial de prompts — 00194

Información histórica del proceso de análisis, no información vigente. Recoge, tal cual y sin reformular, los prompts sucesivos con los que el usuario ha ido planteando y ampliando esta entrada — pueden ser incompletos o contradictorios entre sí, ya que reflejan cómo evolucionó la petición sesión a sesión, no el resultado final (eso vive en `description.md`).

**Uso exclusivo de `ms-new` y `ms-fix`.** Ninguna otra skill del framework (`ms-how`, `ms-do`, `ms-status`, etc.) debe leer este fichero ni tenerlo en cuenta: la fuente de la verdad sobre qué se pide es siempre `description.md`.

## 2026-08-08 — migrado desde description.md

quiero que las copias puedan convertirse en elementos originales. Es decir: convertir copias en clones.
- en la pestaña Copias añade un botón "Convertir copias en originales" que convierta todas las copias de ese elemento en uno original, desvinculándolos para siempre. Requiere confirmación del usuario.
- añadir a las propiedades de cada elemento copia un botón "Convertir en original" para convertir esa copia en un elemento original. Requiere confirmación del usuario.
- cada vez que una copia se convierta en original, asígnale un id igual al elemento original que tenía añadiendo un sufijo numérico correcto y único; mismo mecanismo que tenemos ahora cuando sacamos clones de un elemento.
