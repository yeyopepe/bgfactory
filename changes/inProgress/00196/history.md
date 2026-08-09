# Historial de prompts — 00196

Información histórica del proceso de análisis, no información vigente. Recoge, tal cual y sin reformular, los prompts sucesivos con los que el usuario ha ido planteando y ampliando esta entrada — pueden ser incompletos o contradictorios entre sí, ya que reflejan cómo evolucionó la petición sesión a sesión, no el resultado final (eso vive en `description.md`).

**Uso exclusivo de `ms-new` y `ms-fix`.** Ninguna otra skill del framework (`ms-how`, `ms-do`, `ms-status`, etc.) debe leer este fichero ni tenerlo en cuenta: la fuente de la verdad sobre qué se pide es siempre `description.md`.

## 2026-08-09 — sesión inicial

añade un nuevo componente llamado "bloc de notas" que permita escribir texto con las siguientes características.

Características comunes en modo edición y juego:
- Redimensionable
- Permite escribir un título y un cuerpo
- Incorpora una pequeña barra con herramientas:
      - estilo del texto en el cuerpo: negrita, cursiva, subrayado (usa markdown para guardarlo)

## 2026-08-09 — ampliación 1

El resto estaba bien. Añade otra característica:
- el fondo de la barra superior (dónde está el título), debería tener un color de fondo cofigurable en cualquier modo y momento
- El color del título siempre será negro pero añade a la barra de herramientas dos cosas más:
    - Color del texto seleccionado
    - Color de fondo del texto seleccionado

## 2026-08-09 — ampliación 2

añade también en la parte derecha de la barra de título un icono para copiar todo el contenido de la nota al portapapeles (sin formato: titulo + cuerpo)
